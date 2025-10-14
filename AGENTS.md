# Agent Guide

- Work directly on `main`. Create a feature branch only if a fast-forward merge isn’t possible.
- After each issue is completed:
  1) commit with a descriptive message referencing the issue number (e.g., `feat(ui): layout grid (#4)`);
  2) run `npm run build` locally or rely on Netlify (don’t depend on the agent env for npm installs);
  3) push to `main` so Netlify auto-deploys;
  4) leave a short status comment on the issue and move to the next.

- Do **not** look for or require other project meta files. If `AGENTS.md` is present, use it; otherwise proceed.

- Tech stack: Vite + React + TypeScript. Target: iPhone 14 viewport, single-screen terminal-style UI.

- Order of work: Issues #4 → #14 (since #1–#3 are handled).
