# ShortsForge Lite

Generate YouTube Shorts videos from a topic — no auth, no database, runs locally.

## Features

- Enter a topic and optional style (motivational, facts, storytelling)
- AI script generation via Groq
- Editable scene-by-scene script editor
- Browser-based Remotion rendering (1080×1920 vertical MP4)
- Download rendered video locally

## Requirements

- Node.js 20+
- Chrome or Edge (WebCodecs required for video rendering)
- [Groq API key](https://console.groq.com/)

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add your GROQ_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000/create](http://localhost:3000/create).

## Usage

1. Enter a topic and click **Generate Script**
2. Edit scenes, title, and durations
3. Click **Render Video** (keep tab open — rendering runs in-browser)
4. Preview and **Download MP4** on the preview page

## Tech Stack

- Next.js 15 (App Router)
- Remotion + `@remotion/web-renderer`
- Groq API (Llama 3.3 70B)
- Tailwind CSS 4
- TypeScript

## Notes

- Script and topic are saved in `localStorage`
- Rendered video blob URL is stored in `sessionStorage` for preview
- Video rendering is experimental (`@remotion/web-renderer`) — best in Chrome/Edge
