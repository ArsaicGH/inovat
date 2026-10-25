# CLAUDE.md: standing rules for this project

Project: browser-based 3D virtual museum about the four Industrial Revolutions (Bảo tàng Cách mạng Công nghiệp). The full plan is in `PLAN.md`. Read it at the start of every session and continue from the status at its end.

## Who I am working with
- A school group of complete beginners in web development.
- We talk in **English**. The finished website is **100% Vietnamese**.

## How to work with us
- Explain every unfamiliar term and every command **before** running it, in plain language.
- Work on **one milestone at a time** (see `PLAN.md`). Do not build ahead. Stop at the end of each milestone, say how to test it, and wait for my review.
- When the milestone's acceptance criteria are met, tick them in `PLAN.md` and update the status line at the end of that file.
- Keep code simple and readable. Prefer plain, reliable solutions over clever ones. Add short comments that explain *why*.
- If something fails, explain what the error message means before fixing it.

## Technical rules
- Stack: React, TypeScript, Vite, Three.js, React Three Fiber, drei, Zustand. Do not add other dependencies without asking first and explaining why.
- No backend, database, login, paid API, AI model or API key in the product. Everything runs in the visitor's browser.
- Keep lightweight 3D assets: models about 2 MB or less each, textures 1024 px or less, about 30 MB total.
- Cap the renderer pixel ratio at 1.5. Use at most one shadow-casting light.
- Folder layout is in `PLAN.md` section 3. Keep the 3D layer (`src/world/`), the interface (`src/ui/`) and the text (`src/content/`) separate.
- File names: lowercase, hyphens, no spaces, no Vietnamese diacritics.
- Read movement keys by physical key position (`event.code`), so Unikey and EVKey do not break controls.
- Run `npm run build` before every commit.

## Content rules
- All visible website text is Vietnamese and lives in `src/content/`, never hard-coded in components.
- **Never invent historical facts, dates, names or sources.** Every exhibit and quiz question needs a real source that I provided or that you looked up and cited. If unsure, write `[CẦN KIỂM TRA]` and tell me.
- Every image and 3D model must be listed in `src/content/credits.ts` with author and licence.

## Git rules
- Do not commit or push unless I ask. When I do, use a short descriptive message.
- Never commit `node_modules` or any secrets.
- The GitHub repository is public (Vercel's free plan does not allow teammates on private repos).
