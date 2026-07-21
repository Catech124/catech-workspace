---
name: watch
description: Watch a video (URL or local path). Downloads with yt-dlp (ON WINDOWS), extracts auto-scaled frames with ffmpeg, pulls the transcript from captions (or local Parakeet TDT transcription fallback), and hands the result to Claude so it can answer questions about what's in the video.
argument-hint: "<video-url-or-path> [question]"
allowed-tools: Bash, Read, AskUserQuestion
homepage: https://github.com/bradautomates/claude-video
repository: https://github.com/bradautomates/claude-video
author: bradautomates
license: MIT
user-invocable: true
---

# /watch — Claude watches a video

> ⚠️ **Entorno híbrido Windows/Linux (WSL):** Este sistema ejecuta Linux (WSL) pero `yt-dlp` y el modelo Parakeet están solo en Windows. Usa siempre las rutas completas de `/mnt/c/Users/catec/...` para accederlos.
> - **`yt-dlp`** → `/mnt/c/Users/catec/.stacher/yt-dlp.exe` (Windows)
> - **`ffmpeg` / `ffprobe`** → Instalados en Linux (WSL) ✅
> - **Transcripción local** → Modelo Parakeet TDT en `C:\Users\catec\AppData\Roaming\com.pais.handy\models\parakeet-tdt-0.6b-v2-int8\` (Windows)
> - **Script de transcripción** → `C:\Users\catec\transcribe_parakeet.py` (Windows, ruta hardcodeada en el script)

You don't have a video input; this skill gives you one. A Python script downloads the video, extracts frames as JPEGs, gets a timestamped transcript (native captions first, then local Parakeet TDT transcription as fallback), and prints frame paths. You then `Read` each frame path to see the images and combine them with the transcript to answer the user.

## Step 0 — Setup preflight (runs every `/watch` invocation, silent on success)

**Python interpreter:** every `python3 ...` command in this skill is for macOS/Linux. On **Windows**, substitute `python` — the `python3` command on Windows is the Microsoft Store stub and will not run the script.

### ⚡ Entorno actual: WSL (Linux) con recursos en Windows

Este skill se ejecuta desde Linux (WSL), pero aprovecha binarios y modelos instalados en Windows:

| Recurso | Ruta |
|---------|------|
| **`yt-dlp`** | `/mnt/c/Users/catec/.stacher/yt-dlp.exe` (Windows) |
| **`ffmpeg` / `ffprobe`** | Instalados en Linux (WSL) ✅ |
| **Modelo Parakeet TDT** | `C:\Users\catec\AppData\Roaming\com.pais.handy\models\parakeet-tdt-0.6b-v2-int8\` (Windows) |
| **Script transcripción** | `C:\Users\catec\transcribe_parakeet.py` (Windows) — ruta hardcodeada |

Usa siempre la ruta completa de Windows (`/mnt/c/Users/catec/...`) para invocar `yt-dlp`. **No** intentes buscar `yt-dlp` en el PATH de Linux — no está allí.

#### Preflight check personalizado para este entorno

No uses `setup.py --check` — está diseñado para macOS y fallará en WSL (no encuentra yt-dlp en PATH).

En su lugar, verifica manualmente:

```bash
# 1. Verificar ffmpeg (instalado en Linux)
ffmpeg -version >/dev/null 2>&1 && echo "ffmpeg: OK" || echo "ffmpeg: FALTA"

# 2. Verificar yt-dlp (en Windows)
test -f /mnt/c/Users/catec/.stacher/yt-dlp.exe && echo "yt-dlp: OK" || echo "yt-dlp: FALTA"
```

Si todo está OK, procede al Step 1 sin comentario.

> **Nota:** Este skill NO necesita API keys externas. La transcripción local con Parakeet TDT es 100% offline.

**Structured mode (optional):** `python3 "${CLAUDE_SKILL_DIR}/scripts/setup.py" --json` emits `{status, first_run, missing_binaries, whisper_backend, has_api_key, config_file, platform}` where `status` is one of `ready | needs_install | needs_key | needs_install_and_key`. Use this when you need to branch on specifics (e.g. "is this the user's very first run?" → `first_run: true`).

Within a single session, you can skip Step 0 on follow-up `/watch` calls — once `--check` returned 0, nothing about the environment changes between turns.

## When to use

- User pastes a video URL (YouTube, Vimeo, X, TikTok, Twitch clip, most yt-dlp-supported sites) and asks about it.
- User points at a local video file (`.mp4`, `.mov`, `.mkv`, `.webm`, etc.) and asks about it.
- User types `/watch <url-or-path> [question]`.

## Recommended limits

- **Best accuracy: videos under 10 minutes.** Frame coverage scales inversely with duration.
- **Hard caps: 100 frames total and 2 fps.** Token cost grows with frame count, so the script targets a frame budget by duration (and never exceeds 2 fps even when the budget would imply more):
  - ≤30s → ~1-2 fps (up to 30 frames)
  - 30s-1min → ~40 frames
  - 1-3min → ~60 frames
  - 3-10min → ~80 frames
  - \>10min → 100 frames, sparsely spaced (warning printed)
- If the user hands you a long video, consider asking whether they want a specific section before burning tokens on a sparse scan.

## How to invoke

**Step 1 — parse the user input.** Separate the video source (URL or path) from any question the user asked. Example: `/watch https://youtu.be/abc what language is this in?` → source = `https://youtu.be/abc`, question = `what language is this in?`. **Step 2 — run the watch script.** Pass the source verbatim. Do not shell-escape it yourself beyond normal quoting:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/watch.py" "<source>"
```

⚠️ **Importante:** El script `watch.py` intentará llamar `yt-dlp` como comando global, pero yt-dlp solo está en Windows. Si el script falla porque no encuentra `yt-dlp` en el PATH, invócalo directamente desde Windows:

```bash
/mnt/c/Users/catec/.stacher/yt-dlp.exe "<source>"
```

Luego continúa con el resto del pipeline (frames, transcripción) usando las herramientas de Linux.

Optional flags:
- `--subtitles-only` — download subtitles ONLY (no video download, no frame extraction). Fast and lightweight — perfect when you only need the transcript.
- `--start T` / `--end T` — focus on a section. Accepts `SS`, `MM:SS`, or `HH:MM:SS`. When either is set, fps auto-scales denser (see "Focusing on a section" below).
- `--max-frames N` — lower the cap for tighter token budget (e.g. `--max-frames 40`)
- `--resolution W` — change frame width in px (default 512; bump to 1024 only if the user needs to read on-screen text)
- `--fps F` — override auto-fps (clamped to 2 fps max)
- `--out-dir DIR` — keep working files somewhere specific (default: an auto-generated tmp dir)
- `--whisper groq|openai` — force a specific Whisper backend (default: prefer Groq if both keys exist)
- `--no-whisper` — disable the Whisper fallback entirely (frames-only if no captions)

### Focusing on a section (higher frame rate)

When the user asks about a specific moment — "what happens at the 2 minute mark?", "zoom into 0:45 to 1:00", "the first 10 seconds" — pass `--start` and/or `--end`. The script switches to focused-mode budgets, which are denser than full-video budgets (still capped at 2 fps):

- ≤5s → 2 fps (up to 10 frames)
- 5-15s → 2 fps (up to 30 frames)
- 15-30s → ~2 fps (up to 60 frames)
- 30-60s → ~1.3 fps (up to 80 frames)
- 60-180s → ~0.6 fps (100 frames, capped)

Focused mode is the right call for:
- Any moment/range the user names explicitly ("around 2:30", "the intro", "the last 30 seconds").
- Any video longer than ~10 minutes where the user's question is about a specific part — running focused on the relevant section is far more useful than a sparse scan of the whole thing.
- Re-runs after a full scan didn't have enough detail in some region.

Transcript is auto-filtered to the same range. Frame timestamps are absolute (real video timeline, not offset-from-start).

Examples:
```bash
# Last 10 seconds of a 1 minute video
python3 "${CLAUDE_SKILL_DIR}/scripts/watch.py" video.mp4 --start 50 --end 60

# Zoom into 2:15 → 2:45 at 3 fps (90 frames)
python3 "${CLAUDE_SKILL_DIR}/scripts/watch.py" "$URL" --start 2:15 --end 2:45 --fps 3

# From 1h12m to the end of the video
python3 "${CLAUDE_SKILL_DIR}/scripts/watch.py" "$URL" --start 1:12:00
```

**Step 3 — Read every frame path the script lists.** The Read tool renders JPEGs directly as images for you. Read all frames in a single message (parallel tool calls) so you see them together. The frames are in chronological order with a `t=MM:SS` timestamp so you can align them to the transcript.

**Step 4 — answer the user.** You now have two streams of evidence:
- **Frames** — what's on screen at each timestamp
- **Transcript** — what's said at each timestamp. The report's header shows the source (`captions` = yt-dlp pulled native subs; `parakeet` = transcribed locally by Parakeet TDT).

If the user asked a specific question, answer it directly citing timestamps. If they didn't ask anything, summarize what happens in the video — structure, key moments, notable visuals, spoken content.

**Step 5 — clean up.** The script prints a working directory at the end. If the user isn't going to ask follow-ups about this video, delete it with `rm -rf <dir>`. If they might, leave it in place.

## Transcription

The script gets a timestamped transcript in one of two ways:

1. **Native captions (free, preferred).** yt-dlp pulls manual or auto-generated subtitles from the source platform if available.
2. **Local Parakeet TDT transcription (fallback, requiere aprobación del usuario).** Si no hay subtítulos nativos y el usuario autorizó la instalación de dependencias, se puede transcribir localmente con NVIDIA Parakeet TDT 0.6B v2.

   El script de transcripción está en **Windows** con la ruta del modelo **hardcodeada** (`C:\Users\catec\AppData\Roaming\com.pais.handy\models\parakeet-tdt-0.6b-v2-int8\`). Para ejecutarlo:

   ```bash
   # 1. Extraer audio del video (en Linux)
   ffmpeg -i <video_path> -ac 1 -ar 16000 -sample_fmt s16 -acodec pcm_s16le /tmp/audio.wav
   
   # 2. Copiar audio a Windows
   cp /tmp/audio.wav /mnt/c/Users/catec/
   
   # 3. Encontrar python.exe en Windows (la ruta exacta varía según la instalación)
   #    Busca con: ls /mnt/c/Users/catec/AppData/Local/Programs/Python/Python*/python.exe
   #    O pregúntale al usuario dónde tiene Python en Windows
   /mnt/c/Users/catec/AppData/Local/Programs/Python/Python*/python.exe \
     C:\Users\catec\transcribe_parakeet.py C:\Users\catec\audio.wav
   ```

   > ⚠️ **Dependencias (pendientes de aprobación del usuario):** El script necesita `onnxruntime`, `scipy` y `numpy`. En Windows ya están instalados. Para ejecutarlo desde Linux (WSL), pídele permiso al usuario para hacer `pip install onnxruntime scipy numpy` (~30 MB).

   El modelo Parakeet TDT es 100% local — no requiere API keys. Produce JSON con timestamps por palabra.

## Failure modes and handling

- **Setup preflight failed** → run `python3 "${CLAUDE_SKILL_DIR}/scripts/setup.py"` (auto-installs ffmpeg/yt-dlp via brew on macOS, scaffolds the `.env`). For API key, ask the user via `AskUserQuestion` and write it to `~/.config/watch/.env`.
- **No transcript available** → captions missing AND (no Whisper key OR Whisper API failed). Script prints a hint pointing to setup. Proceed frames-only and tell the user.
- **Long video warning printed** → acknowledge it in your answer. Offer to re-run focused on a specific section via `--start`/`--end` rather than a sparse full-video scan.
- **Download fails** → yt-dlp's error goes to stderr. If it's a login-required or region-locked video, tell the user plainly; do not keep retrying.
- **yt-dlp not found** → No está en Linux. Usa la ruta de Windows: `/mnt/c/Users/catec/.stacher/yt-dlp.exe`. Si el script `watch.py` falla, invoca yt-dlp manualmente con esa ruta.
- **Transcription fails** → si el modelo Parakeet no puede cargarse (falta `onnxruntime` o el modelo), instala las dependencias con `pip install onnxruntime scipy numpy`. Si el problema persiste, informa al usuario que no hay transcripción disponible y procede solo con frames.

## Token efficiency

This skill burns tokens primarily on frames. Order of magnitude:
- 80 frames at 512px wide is roughly 50-80k image tokens depending on aspect ratio.
- The transcript is cheap (a few thousand tokens at most for a 10-minute video).
- Bumping `--resolution` to 1024 roughly quadruples the image tokens per frame. Only do it when necessary.

If you already watched a video this session and the user asks a follow-up, do **not** re-run the script — you already have the frames and transcript in context. Just answer from what you have.

## Security & Permissions

**What this skill does:**
- Runs `yt-dlp` (desde Windows: `/mnt/c/Users/catec/.stacher/yt-dlp.exe`) to download the video and pull native captions when the source supports them (public data; the request goes directly to whatever host the URL points at)
- Runs `ffmpeg` / `ffprobe` locally (Linux/WSL) to extract frames as JPEGs and, when transcription is needed, a mono 16 kHz audio clip
- Runs the Parakeet TDT transcription model (local, on Windows via `/mnt/c/Users/catec/transcribe_parakeet.py`) for audio-to-text when no native captions are available — no data leaves your machine
- Writes the downloaded video, frames, audio, and an intermediate transcript to a working directory under the system temp dir (or `--out-dir` if specified) so Claude can `Read` them
- Reads / creates `~/.config/watch/.env` (mode `0600`) to store configuration

**What this skill does NOT do:**
- Does not upload the video or audio to any external API — all processing is local (yt-dlp downloads from the source, Parakeet transcribes locally)
- Does not access any platform account (no login, no session cookies, no posting)
- Does not send API keys to external services — no Groq, no OpenAI Whisper API
- Does not log, cache, or write API keys to stdout, stderr, or output files
- Does not persist anything outside the working directory and `~/.config/watch/.env` — clean up the working directory when you're done (Step 5)

**Bundled scripts:** `scripts/watch.py` (entry point), `scripts/download.py` (yt-dlp wrapper), `scripts/frames.py` (ffmpeg frame extraction), `scripts/transcribe.py` (caption selection)

**External scripts (Windows):** `/mnt/c/Users/catec/transcribe_parakeet.py` (local Parakeet TDT transcription)

**Review scripts before first use to verify behavior.
