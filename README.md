# Clipboard Box

A tiny, fast clipboard scratchpad. Type or paste text, then Save it to a Convex backend. Query pulls the latest saved text back into the box. The input smartly auto-focuses when you start typing (without breaking copy combos).

Demo: https://clipboard-box.vercel.app/

## Features
- Auto-focus on typing keys even if the textarea isn't focused
- Respects browser shortcuts (won't steal focus on modifier key combos)
- Save and retrieve the latest text via Convex
- Minimal, responsive UI built with Tailwind CSS and Preact

## Custom textarea behavior

The textarea has custom auto-focus behavior to improve UX. Below are the design decisions and their rationale:

| Behavior | Rationale |
|----------|-----------|
| **Auto-focus on character/Backspace/Delete keys** | Allows users to start typing immediately without clicking the textarea first |
| **Escape blurs the textarea** | Standard web behavior — pressing Escape unfocuses the active element |
| **Text-editing shortcuts auto-focus (Ctrl/Cmd + V, A, Z, Y)** | Reduces friction — users pressing Ctrl+A likely want to select textarea content, Ctrl+V to paste into it, etc. This deviates from web standards for improved UX |
| **Other modifier keys (Ctrl/Cmd/Alt) are ignored** | Prevents stealing focus from browser shortcuts like Ctrl+L (URL bar), Ctrl+T (new tab), Ctrl+F (find), etc. |
| **Space key is ignored** | Preserves native page scrolling behavior (Space scrolls the page when no element is focused) |
| **Tab key is ignored** | Allows natural keyboard navigation between focusable elements |
| **Arrow/F-keys/Enter are ignored** | These have specific browser or accessibility functions that shouldn't be intercepted |

## Keyboard shortcuts
- Ctrl/Cmd+V: Paste
- Ctrl/Cmd+A: Select All
- Backspace/Delete: Delete character or selected text
- Ctrl/Cmd+Backspace: Delete previous word (or selection)
- Ctrl/Cmd+Delete: Delete next word (or selection)
- Ctrl/Cmd+Z: Undo
- Ctrl/Cmd+Y: Redo

## Tech stack
- Preact + Vite
- Effect v4 beta for application modules and tests
- Tailwind CSS v4
- Convex 1.x (queries/mutations, React client)

## Requirements
- Bun 1.3+
- Convex CLI (installed automatically via dev dependency; invoked with `bun run dev:backend`)

## Quick start

1) Install deps
```bash
bun install
```

2) Start Convex in one terminal and copy the printed Client URL
```bash
bun run dev:backend
# Look for a line like: Client URL: https://<your-dev>.convex.cloud
```

3) Create `.env.local` at the project root with that URL
```bash
echo "VITE_CONVEX_URL=<paste Client URL here>" > .env.local
```

4) Start the frontend in another terminal
```bash
bun run dev:frontend
# Open the URL that Vite prints (usually http://localhost:5173)
```

Alternatively, after creating `.env.local`, you can run both in one command:
```bash
bun run dev
```

## Available scripts
```bash
bun run dev           # run frontend and Convex dev in parallel
bun run dev:frontend  # run Vite dev server
bun run dev:backend   # run Convex dev
bun run build         # production build (frontend)
bun run preview       # preview production build locally
bun run typecheck     # Effect-aware TypeScript check
bun run test          # Effect/Vitest test suite
```

## How it works
- Data model: a single `text` table with a fixed `slug: "only"` and `value: string` indexed by `by_slug`.
- API:
  - `text.save({ value: string })` — upserts the single row
  - `text.get({}) -> string` — returns the latest saved value (empty string if none)
- Architecture:
  - `src/modules/clipboard-workspace` is the deep Effect module for persistence, password activation, copy, and length normalization.
  - `src/modules/editor-focus` is the independent Effect module for global keydown autofocus rules.
  - `src/features/clipboard-box` is the thin UI shell that wires those modules to Preact and Convex.

## Deployment
Frontend can be deployed to any static host (e.g., Vercel, Netlify). Backend uses Convex.

1) Create a Convex deployment
```bash
npx convex deploy
# Follow the prompts; note the Production Client URL
```

2) Configure your host/env
- Set `VITE_CONVEX_URL` to the Production Client URL in your hosting provider’s environment variables.
- Rebuild/redeploy the frontend.

## Notes
- This app intentionally persists a single shared text value. Multi-user isolation or versioning is out of scope by design.
