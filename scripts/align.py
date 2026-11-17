"""Step 2, from a file: use a voiceover you made yourself (in ElevenLabs' website, or recorded) instead of the API.

python <skill>/scripts/align.py <slug> <voiceover file> [--keep-raw]
Reads  the voiceover (any format ffmpeg reads: mp3, wav, m4a...) and the script in src/episodes/<slug>/episode.json
Writes public/<slug>/voice_raw.mp3, out/<slug>/words_raw.json and out/<slug>/voice_meta.json, exactly as voice.py's
       API call would, then runs voice.py to tighten the pauses (so voice.wav and words.json follow, and `gaps`
       retuning works as usual). voice.py sees the take as current and does not call the API.
Word times come from offline alignment: pocketsphinx forced alignment (pip install pocketsphinx) when it holds,
else espeak-ng (apt/brew install espeak-ng) reads the script word by word as a reference and dynamic time warping over
MFCCs maps it onto the take. The voiceover must read the script word for word; numbers as words, the way episode.json spells them.
Costs 0 credits here; the credits the take used show on the ElevenLabs usage page, so ask the person for them.
"""
import hashlib, json, os, re, shutil, subprocess, sys, tempfile

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wi import load_episode, log_cost, norm, out_dir, pub_dir, save_json  # noqa: E402

slug, src = sys.argv[1], sys.argv[2]
ep = load_episode(slug)

# The same signature voice.py computes, so it treats this take as the current one.
V = {'id': 'TX3LPaxmHKxFdv7VOQHJ', 'model': 'eleven_multilingual_v2', 'settings': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True}}
V.update(ep.get('voice', {}))
text = ' '.join(b['text'].strip() for b in ep['script'])
sig = hashlib.sha1(json.dumps([text, V], sort_keys=True).encode()).hexdigest()[:12]

raw_mp3 = pub_dir(slug) / 'voice_raw.mp3'
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], check=True, capture_output=True).stdout
if os.path.abspath(src) != os.path.abspath(raw_mp3):  # re-running on the stored take keeps it as it is
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '44100', '-b:a', '192k', str(raw_mp3)], check=True)
dur = len(pcm) / 2 / 16000

# The script's words, with the punctuation after each (voice.py's pause rules read it).
tokens = []
for m in re.finditer(r"[\w'’]+|[^\w\s'’]+", text):
    s = m.group(0)
    if re.match(r"[\w'’]", s):
        tokens.append({'w': s, 'p': ''})
    elif tokens:
        tokens[-1]['p'] += s

# First choice: pocketsphinx forced alignment (pip install pocketsphinx; its English model ships in the package),
# exact on a human or ElevenLabs voice. It can fail on a whole take (one bad frame and there's no path), so the
# fallback is a reference read with known word times by espeak-ng, warped onto the take.
spoken, method = None, ''
try:
    from pocketsphinx import Decoder
    dec = Decoder(samprate=16000, bestpath=False, loglevel='FATAL')
    # words the dictionary lacks get a pronunciation built from known parts: creak + s, micro + sleep
    import pocketsphinx
    cmu = {}
    for line in open(os.path.join(os.path.dirname(pocketsphinx.__file__), 'model', 'en-us', 'cmudict-en-us.dict')):
        k, _, ph = line.strip().partition(' ')
        cmu.setdefault(k, ph)
    def guess(w):
        if w in cmu:
            return cmu[w]
        if w.endswith('s') and w[:-1] in cmu:
            return cmu[w[:-1]] + (' Z' if cmu[w[:-1]].split()[-1] not in ('P', 'T', 'K', 'F', 'TH') else ' S')
        for i in range(2, len(w) - 1):
            a, b = guess(w[:i]), guess(w[i:])
            if a and b:
                return a + ' ' + b
        return None
    for w in set(norm(t['w']) for t in tokens):
        if w not in cmu:
            ph = guess(w)
            if ph:
                dec.add_word(w, ph, False)
    dec.set_align_text(' '.join(norm(t['w']) for t in tokens))
    dec.start_utt()
    dec.process_raw(pcm, full_utt=True)
    dec.end_utt()
    seg = [(x.start_frame / 100, (x.end_frame + 1) / 100) for x in (dec.seg() or []) if not x.word.startswith(('<', '['))]
    if len(seg) == len(tokens):
        spoken, method = seg, 'pocketsphinx forced alignment'
except ImportError:
    pass
except Exception as err:  # an alignment error is not fatal: the fallback follows
    print(f'pocketsphinx could not align the take ({err}); trying the espeak-ng reference')

if spoken is None:
    if not shutil.which('espeak-ng'):
        raise SystemExit('Could not align: pip install pocketsphinx, or install espeak-ng (apt/brew) for the fallback')
    method = 'espeak-ng reference + DTW (check the cue words)'
    # A reference read with known word times: espeak-ng says each word on its own, joined with short gaps. Then dynamic
    # time warping over MFCCs maps the reference onto the take (the method of the aeneas aligner), and each word's
    # reference times are carried across the warping path.
    FPS = 100


    def mfcc(sig):
        sig = np.append(sig[0], sig[1:] - 0.97 * sig[:-1])
        n, hop = 400, 16000 // FPS
        if len(sig) < n:
            sig = np.pad(sig, (0, n - len(sig)))
        idx = np.arange(n)[None, :] + hop * np.arange(1 + (len(sig) - n) // hop)[:, None]
        spec = np.abs(np.fft.rfft(sig[idx] * np.hamming(n), 512)) ** 2
        mel = lambda f: 2595 * np.log10(1 + f / 700)
        pts = 700 * (10 ** (np.linspace(mel(60), mel(7600), 28) / 2595) - 1)
        bins = np.floor(513 * pts / 16000).astype(int)
        fb = np.zeros((26, 257))
        for m in range(1, 27):
            l, c, r = bins[m - 1], bins[m], bins[m + 1]
            fb[m - 1, l:c] = (np.arange(l, c) - l) / max(1, c - l)
            fb[m - 1, c:r] = (r - np.arange(c, r)) / max(1, r - c)
        e = np.log(spec @ fb.T + 1e-10)
        dct = np.cos(np.pi / 26 * (np.arange(26)[None, :] + 0.5) * np.arange(1, 13)[:, None])
        c = e @ dct.T
        return (c - c.mean(0)) / (c.std(0) + 1e-8)


    def say(word, tmp):
        f = os.path.join(tmp, 'w.wav')
        subprocess.run(['espeak-ng', '-v', 'en-gb', '-s', '170', '-w', f, word], check=True, capture_output=True)
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], check=True, capture_output=True).stdout
        y = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
        on = np.where(np.abs(y) > 0.02)[0]
        return y[on[0]:on[-1] + 1] if len(on) else y


    ref, ref_times, t = [], [], 0
    with tempfile.TemporaryDirectory() as tmp:
        for tok in tokens:
            y = say(tok['w'], tmp)
            ref.append(y)
            ref_times.append((t, t + len(y)))
            t += len(y)
            gap = int(16000 * (0.35 if re.search(r'[.?!:;]', tok['p']) else 0.12 if tok['p'] else 0.04))
            ref.append(np.zeros(gap, np.float32))
            t += gap
    R = mfcc(np.concatenate(ref))
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    T = mfcc(x)

    # DTW, at half resolution for speed, with the cost matrix in chunks.
    step = 2
    Rs, Ts = R[::step], T[::step]
    D = np.sqrt(((Rs[:, None, :] - Ts[None, :, :]) ** 2).sum(-1))
    acc = np.full((len(Rs) + 1, len(Ts) + 1), np.inf)
    acc[0, 0] = 0
    for i in range(1, len(Rs) + 1):
        row, prev = acc[i], acc[i - 1]
        diag_up = np.minimum(prev[:-1], prev[1:])
        best = D[i - 1] + diag_up  # from (i-1, j-1) or (i-1, j)
        for j in range(1, len(Ts) + 1):  # left moves need the running row
            v = best[j - 1]
            lv = row[j - 1] + D[i - 1, j - 1]
            row[j] = v if v < lv else lv
    i, j, path = len(Rs), len(Ts), []
    while i > 0 and j > 0:
        path.append((i - 1, j - 1))
        k = np.argmin([acc[i - 1, j - 1], acc[i - 1, j], acc[i, j - 1]])
        i, j = (i - 1, j - 1) if k == 0 else (i - 1, j) if k == 1 else (i, j - 1)
    path = np.array(path[::-1])
    r2t = np.zeros(len(Rs))
    for ri in range(len(Rs)):
        r2t[ri] = path[path[:, 0] == ri, 1].mean()


    def warp(sample, end=False):
        ri = min(len(Rs) - 1, int(sample / 16000 * FPS / step))
        cols = path[path[:, 0] == ri, 1]
        return (cols.max() if end else cols.min()) * step / FPS


    spoken = [(warp(a), warp(b, end=True)) for a, b in ref_times]
    for k in range(1, len(spoken)):  # keep the words in order and apart
        a, b = spoken[k]
        spoken[k] = (max(a, spoken[k - 1][1] - 0.02), max(b, a + 0.04))
# Snap each word's edges to the audio's energy: the aligner can pad a word into the silence around it.
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
hop = 160  # 10 ms
rms = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, mode='same'))[::hop]
floor = max(0.01 * rms.max(), np.percentile(rms, 10) * 3)
words = []
for t, (s, e) in zip(tokens, spoken):
    a, b = int(s * 100), min(int(e * 100), len(rms) - 1)
    while a < b - 3 and rms[a] < floor:
        a += 1
    while b > a + 3 and rms[b] < floor:
        b -= 1
    words.append({'w': t['w'], 's': round(a / 100, 3), 'e': round(min(dur, (b + 1) / 100), 3), 'p': t['p']})

save_json(out_dir(slug) / 'words_raw.json', words)
save_json(out_dir(slug) / 'voice_meta.json', {'sig': sig, 'chars': len(text), 'source': os.path.basename(src)})
print(f'Aligned {len(words)} words in {dur:.2f} s from {os.path.basename(src)}, by {method}')
log_cost(slug, 'voice', 0, f'voiced outside the scripts from {os.path.basename(src)}; its credits are on the ElevenLabs usage page')

subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voice.py'), slug], check=True)
