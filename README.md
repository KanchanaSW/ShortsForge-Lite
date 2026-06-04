# ShortsForge Lite

Generate YouTube Shorts and long-form videos from a topic — no auth, no database, runs locally.

## Features

- **YouTube Shorts** — vertical 1080×1920, 30–60 seconds, viral pacing
- **Long-form videos** — landscape 1920×1080, 3–20 minutes, chapter-based structure
- AI script generation via Groq with per-scene visuals (mood, stock search phrase, accent color)
- Chapter/scene script editor with drag-and-drop reorder
- **Story-matched backgrounds** — Pexels stock video (portrait or landscape) or mood gradient fallback
- **Free voiceover** per scene via Edge TTS with text-hash caching
- Browser-based Remotion rendering with synced audio
- Download rendered MP4 locally

## Requirements

- Node.js 20+
- Chrome or Edge (WebCodecs required for video rendering)
- [Groq API key](https://console.groq.com/)
- Optional: [Pexels API key](https://www.pexels.com/api/) for stock video backgrounds
- Optional: [edge-tts](https://pypi.org/project/edge-tts/) for voiceover

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add GROQ_API_KEY (required) and optionally PEXELS_API_KEY
npm run dev
```

Open [http://localhost:3000/create](http://localhost:3000/create).

## Usage

1. Choose **YouTube Short** or **Long-form Video**
2. Enter a topic and configure style/duration options
3. Click **Generate Script** — edit chapters and scenes in the editor
4. Click **Generate Video** — voiceover, stock visuals, and MP4 render run automatically
5. Preview and **Download MP4** on the preview page

### Shorts mode

- Style: motivational, facts, or storytelling
- 6–12 scenes, max 60 seconds
- Vertical TikTok-style captions

### Long-form mode

- Target duration: 3, 5, 10, 15, or 20 minutes
- Content style: educational, documentary, storytelling, motivational, or explainer
- 8-chapter structure (Hook → Intro → Parts 1–4 → Conclusion → CTA)
- Optional table of contents intro
- Landscape lower-third captions with chapter transitions

Long videos (15+ min) may take 15–30+ minutes to render in the browser. Keep the tab open.

## Voiceover setup (macOS / PEP 668)

```bash
brew install pipx
pipx install edge-tts
pipx ensurepath
```

Restart your terminal, verify with `edge-tts --version`, then restart `npm run dev`.

## Tech Stack

- Next.js 15 (App Router)
- Remotion + `@remotion/web-renderer` + `@remotion/media`
- Groq API (Llama 3.3 70B)
- Pexels Videos API (optional)
- Tailwind CSS 4
- TypeScript

## Notes

- Project data saved in `localStorage` (v2 format with chapters; v1 scripts auto-migrate)
- Generated MP3s written to `public/audio/` (gitignored)
- Rendered video blob URL stored in `sessionStorage` for preview
- Video rendering is experimental — best in Chrome/Edge
