# INNOVA – Bảo tàng Cách mạng Công nghiệp

A browser-based 3D virtual museum about the four Industrial Revolutions, made by a school group.
Live site: https://innova-museum.vercel.app — full plan and status: [PLAN.md](PLAN.md).

## Run it locally

```
npm install
npm run dev      # opens at http://localhost:5173
npm run build    # check for errors before every commit
```

## Style guide (M6)

**Mood.** A grand, luxurious museum. The central rotunda is a Victorian dome hall that sets the
scene; each era room has its own atmosphere, from historical (CMCN 1) to futuristic (CMCN 4).
Impressive but light: glow comes from emissive (self-lit) materials and a bloom effect, not from
many real lights.

**Font.** Be Vietnam Pro (full Vietnamese support), bundled in `public/fonts`, used for the
interface and for all text painted onto 3D signs and boards (`src/world/fonts.ts`).
Weights: 700 titles, 600 summaries and buttons, 400 body text.

**Colours** (`src/world/style.ts`):

| Use | Colour |
|---|---|
| Gold trim, sign borders | `#c9a25a` |
| Dark wood (frames, wainscot, plinths) | `#4a3423` |
| Panel paper / ink | `#f2ece0` / `#2b2620` |
| Interface accent (buttons, crosshair) | `#c98a3c` |
| Room accents | Rotunda gold `#c9a25a`, Sảnh giới thiệu amber `#c98a3c`, CMCN 1 copper `#b5763a`, CMCN 2 steel `#8f9aa6`, CMCN 3 beige `#d9c7a0`, CMCN 4 cyan `#3fd0e0`, Phòng trò chơi pink `#e05a8a` |

**Signs.** Dark board, thin gold border, cream text. Grand era portals: title "CMCN n" plus the
full name. Plain start/end doors: the room name only.

**Text boards.** Cream paper in a dark wooden frame, readable while walking past (title, summary,
text, source). Pressing E (or clicking) zooms the board into a large on-screen card with a short
scale-and-fade animation; closing plays it in reverse.

**Exhibits.** Each era room has four corner exhibits: a round plinth with a glowing ring, the
prototype on top, and a text board beside it. Placeholders use the room's accent colour.

**Performance rules.** Pixel ratio at most 1.5; one shadow-casting light, shadows drawn once;
a fixed number of lights (only their brightness changes); rooms behind closed doors are not drawn;
textures 1024 px or smaller.

## Credits

Every font, texture, image and model is listed with its author and licence in
[src/content/credits.ts](src/content/credits.ts).
