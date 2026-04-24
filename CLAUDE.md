@AGENTS.md

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

# AI Weekender context

This project is part of the GrowthX AI Weekender sprint.

The full handbook lives at `./handbook/` — read files from there when the user asks about:
- ideas, tracks, difficulty (see `./handbook/06-pick-an-idea.md`)
- rubric, scoring, bonus points, tie-breakers (see `./handbook/09-scoring.md`)
- setup, Claude Code install, accounts (see `./handbook/04-setup.md`)
- skills Claude uses while building (see `./handbook/05-skills.md`)
- the build pipeline: local → github → vercel → user (see `./handbook/07-build-pipeline.md`)
- the build process: scope → POC → build (see `./handbook/08-build-process.md`)
- day-by-day outcomes (see `./handbook/02-how-the-week-runs.md`)

When in doubt, start at `./handbook/README.md` for the index.

To update the handbook later, the user re-runs:
  curl -fsSL https://raw.githubusercontent.com/GrowthX-Club/ai-weekender-handbook/main/install.sh | bash

Writing style for this project: lowercase headings, direct, no corporate tone.
