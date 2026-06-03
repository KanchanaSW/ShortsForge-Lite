# ShortsForge Lite

Generate YouTube Shorts videos from a topic — no auth, no database, runs locally.

## Features

- Enter a topic and optional style (motivational, facts, storytelling)
- AI script generation via Groq with **per-scene visuals** (mood, stock search phrase, accent color)
- Editable scene-by-scene script editor including visual metadata
- **Story-matched backgrounds** — each scene uses its own mood gradient or optional Pexels stock video
- **Free voiceover** per scene via Edge TTS (`edge-tts` CLI)
- Browser-based Remotion rendering (1080×1920 vertical MP4) with synced audio
- Download rendered video locally

## Requirements

- Node.js 20+
- Chrome or Edge (WebCodecs required for video rendering)
- [Groq API key](https://console.groq.com/)
- Optional: [Pexels API key](https://www.pexels.com/api/) for stock video backgrounds
- Optional: [edge-tts](https://pypi.org/project/edge-tts/) for voiceover (see **Voiceover setup** below)

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add GROQ_API_KEY (required) and optionally PEXELS_API_KEY
npm run dev
```

Open [http://localhost:3000/create](http://localhost:3000/create).

## Usage

1. Enter a topic and click **Generate Script**
2. Edit scenes, title, mood, visual search phrases, and accent colors
3. Click **Generate Video** — voiceover, stock visuals (if configured), and MP4 render run automatically
4. Preview and **Download MP4** on the preview page

Without `edge-tts`, you can still render **silent** video. A browser-only voice preview is available when the CLI is missing.

## Voiceover setup (macOS / PEP 668)

Homebrew Python often rejects `pip install edge-tts` with **externally-managed-environment**. Use one of these instead:

### Recommended: pipx

```bash
brew install pipx
pipx install edge-tts
pipx ensurepath
```

Close and reopen your terminal (or run `source ~/.zshrc`), then verify:

```bash
edge-tts --version
```

Restart `npm run dev` so Next.js picks up the updated PATH.

### Alternative: project virtualenv

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install edge-tts
edge-tts --version
```

The app also checks `.venv/bin/edge-tts` automatically. Run `npm run dev` from the project root.

### Custom binary path

If `edge-tts` is installed elsewhere, set in `.env.local`:

```bash
EDGE_TTS_PATH=/full/path/to/edge-tts
```

## Story-matched visuals

Each scene includes:

- **mood** — drives animated gradient motion when no stock video is available
- **visualQuery** — 2–5 word phrase sent to Pexels when `PEXELS_API_KEY` is set
- **accentColor** — hex color harmonizing with the scene mood

If `PEXELS_API_KEY` is missing or a fetch fails for a scene, that scene falls back to a mood-based gradient automatically. Rendering is never blocked by missing stock video.

## Tech Stack

- Next.js 15 (App Router)
- Remotion + `@remotion/web-renderer` + `@remotion/media`
- Groq API (Llama 3.3 70B)
- Pexels Videos API (optional)
- Tailwind CSS 4
- TypeScript

## Notes

- Script and topic are saved in `localStorage` (visual fields included; `videoUrl` and audio fields are not persisted)
- Generated MP3s are written to `public/audio/` (gitignored)
- Rendered video blob URL is stored in `sessionStorage` for preview
- Video rendering is experimental (`@remotion/web-renderer`) — best in Chrome/Edge
- Stock video uses `<Video>` from `@remotion/media`; if a clip fails to load, the scene uses gradient fallback
