---
name: transcribe-audio
description: Transcribe video/audio files using NVIDIA Parakeet TDT 0.6B v2 (INT8) ONNX model with word-level timestamps. Extracts audio from video (MP4, MKV, etc.) via ffmpeg, transcribes with Parakeet, outputs JSON with per-word timestamps. Can correct against known lyrics. Fallback to OpenAI Whisper.
---

# Transcribe Video/Audio with Word-Level Timestamps

Transcribe any video (MP4, MKV, AVI) or audio (WAV, MP3, FLAC) file using NVIDIA Parakeet TDT 0.6B v2 and get exact timestamps for every word. Can also correct the transcription against known lyrics.

## Prerequisites

- Python 3 with packages: `onnxruntime`, `scipy`, `numpy`
- **ffmpeg** (for extracting audio from video files)
- Parakeet TDT 0.6B v2 model (INT8) installed by Handy at:
  `C:\Users\<user>\AppData\Roaming\com.pais.handy\models\parakeet-tdt-0.6b-v2-int8\`
  Contains: `encoder-model.int8.onnx` (652 MB), `decoder_joint-model.int8.onnx` (9 MB), `nemo128.onnx`, `vocab.txt`, `config.json`
- OR: Whisper installed (fallback)

## Pipeline Steps

### 1. Check Prerequisites

Verify Parakeet model files exist:
```bash
ls "C:\Users\<user>\AppData\Roaming\com.pais.handy\models\parakeet-tdt-0.6b-v2-int8\"
```

Check Python deps:
```bash
python -c "import onnxruntime; import scipy.signal; import numpy; print('OK')"
```

Check ffmpeg:
```bash
ffmpeg -version
```

### 2. Extract Audio from Video (if needed)

If input is a video file (MP4, MKV, AVI, MOV, etc.), extract audio to 16kHz mono WAV:
```bash
ffmpeg -i input_video.mp4 -ac 1 -ar 16000 -sample_fmt s16 -acodec pcm_s16le output_audio.wav
```

If input is already audio (MP3, FLAC, etc.), convert to WAV:
```bash
ffmpeg -i input_audio.mp3 -ac 1 -ar 16000 -sample_fmt s16 output_audio.wav
```

### 3. Transcribe with Parakeet

#### a) Audio Loading (in Python)
- Read WAV file with `wave` module
- Support 16-bit, 24-bit, and 32-bit sample widths
- Convert multi-channel to mono (average channels)
- **Resample to 16kHz** using `scipy.signal.resample` if needed (Parakeet expects 16kHz input)

#### b) Model Loading
Load 3 ONNX models using `onnxruntime.InferenceSession`:
- **nemo128.onnx** — Preprocessor: raw audio → 128-dim mel features
  - Inputs: `waveforms` (float32 [1, N]), `waveforms_lens` (int64 [1])
  - Outputs: `features`, `features_lens`
- **encoder-model.int8.onnx** — FastConformer encoder
  - Inputs: `audio_signal`, `length`
  - Outputs: `outputs` (encoder_out [1, C, T]), `encoded_lengths`
  - Permute output to [1, T, C]
- **decoder_joint-model.int8.onnx** — Combined decoder + joiner (TDT transducer)
  - Inputs: `encoder_outputs` (float32), `targets` (int32), `target_length` (int32), `input_states_1` (float32), `input_states_2` (float32)
  - Outputs: `outputs` (logits float32), `output_states_1`, `output_states_2`

#### c) Vocabulary
Load `vocab.txt` (format: `<token> <index>` per line). Find `<blk>` token (blank index).
- 1025 tokens total
- `<blk>` at index 1024

#### d) Decoding Loop (Greedy Search Transducer)
```
SUBSAMPLING_FACTOR = 8     # 8x temporal subsampling
WINDOW_SIZE = 0.01          # 10ms per STFT frame
MAX_TOKENS_PER_STEP = 10    # max non-blank tokens per step
```

Each encoder frame = `0.01 * 8 = 0.08s` (80ms)

Algorithm:
1. Initialize decoder states (`input_states_1`, `input_states_2`) as zeros
2. For each time step `t` (0 to encodings_len):
   - Get `encoder_step = encodings[t, :]` (shape [channels])
   - Reshape to `[1, channels, 1]` (batch=1, time=1, features=1)
   - Run decoder_joint with current token and states
   - Argmax over logits → predicted token
   - If token ≠ blank: emit token, save `t`, update decoder state, increment counter
   - If token == blank OR counter ≥ MAX_TOKENS_PER_STEP: advance `t += 1`, reset counter
3. Convert frame indices to seconds: `time = 0.01 * 8 * frame_idx`

#### e) Word Grouping
Group consecutive BPE tokens into words. Tokens starting with `▁` (U+2581, SentencePiece word boundary) mark word starts.
- Each word: `start` = timestamp of first token, `end` = timestamp of last token

### 4. Output Format

#### JSON:
```json
{
  "text": "full transcription text",
  "duration_seconds": 135.8,
  "words": [
    {"word": "Sweetness", "start": 14.00, "end": 15.36},
    {"word": "I", "start": 16.88, "end": 16.88}
  ]
}
```

#### TXT:
```
WORD                           START      END
─────────────────────────────────────────────
Sweetness                      14.00s    15.36s
I                             16.88s    16.88s
```

### 5. Correct Against Known Lyrics (Optional)

If user provides known lyrics:
1. Parse official lyrics into lines
2. Map each line to a time range from Parakeet transcription
3. Assign each word a proportional timestamp within its line
4. Output corrected JSON + TXT with `_corrected` suffix

### 6. Verification (Smoke Test)

After transcription, verify:
- [ ] Output file exists and is non-empty
- [ ] Word count > 0
- [ ] First word has a reasonable start time (~14s for a song that starts at 0s+intro)
- [ ] Last word's end time ≤ audio duration

## Fallback: OpenAI Whisper

If Parakeet is unavailable, install and use Whisper:
```bash
pip install openai-whisper
whisper input.wav --model medium --language en --word_timestamps True --output_dir ./
```

Whisper outputs per-word timestamps in JSON and SRT formats.

## Script Location

The reference implementation script is at:
`C:\Users\<user>\transcribe_parakeet.py`

Key functions:
- `read_wav(path)` → (samples, sample_rate) — handles 16/24/32-bit, resamples to 16kHz
- `load_vocab(vocab_path)` → (vocab_list, blank_idx) — parses `<token> <index>` format
- `load_models(model_dir)` → (preprocessor, encoder, decoder_joint) ONNX sessions
- `transcribe(samples, ...)` → JSON output with word timestamps
- `group_tokens_into_words(tokens, timestamps, vocab)` → word list with start/end

## Tips

- Input MUST be resampled to **16kHz** before Parakeet processing
- decoder_joint combines decoder + joiner (NOT standard sherpa-onnx separate format)
- Uses greedy search (argmax) — no beam search
- Handles up to ~24 minutes of audio in one pass
- Output files saved to same directory as input with `_timestamps` suffix
- To save to a custom directory: `python script.py input.wav --output ./my_folder/`
