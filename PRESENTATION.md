# INOVAT: presentation guide (3-4 minutes)

## The one idea to leave with the audience

INOVAT turns the four Industrial Revolutions into a place you can walk through: you learn by
exploring a museum, not by reading a slideshow, and you prove it by repairing a time machine.

## Running order (about 3 min 40 s)

| Time | Part | Who | What happens |
|---|---|---|---|
| 0:00-0:30 | **Trailer** | (play) | Open with the 30-second trailer, lights low, sound up. No introduction before it: let it make the first impression. |
| 0:30-0:55 | **The problem and our answer** | Speaker 1 | History of industry is usually a list of dates. We wanted students to *walk through* it: four rooms, one per revolution, each built in its era's look (brass and steam, enamel and electricity, green screens, holograms). |
| 0:55-1:55 | **Live tour** | Speaker 2 drives, Speaker 3 narrates | Start in the rotunda, walk into CMCN 1, open one exhibit (the Watt engine: turnable 3D model, text, picture, sources). Jump with the map to CMCN 4 and show the AI exhibit. Switch the language once (Vietnamese to English). |
| 1:55-2:40 | **The Time Machine game** | Speaker 4 | Open the console in the Game Room, play one or two cards of a core (the growing town or Who am I?). Point out: questions come only from what is in the rooms, and a wrong answer sends you back to the right room. |
| 2:40-3:10 | **How it is built** | Speaker 1 | Runs in any browser, no install, on computers and phones; adjusts its graphics to the machine; every fact has a source, every model and picture is credited. Built with React and three.js. |
| 3:10-3:40 | **Close** | Speaker 5 | Who did what (the team board), what we learned, and the link / QR code to try it. End on the trailer's closing card. |

## Slides (keep them few: the museum is the show)

1. Title: INOVAT, the trailer's closing card (screenshot) and the team.
2. "Why": one sentence plus one screenshot of a room.
3. Four eras: one screenshot per room, side by side.
4. The game: a screenshot of the workshop and one core.
5. Under the hood: four icons or short lines (browser, phone, sources, auto graphics).
6. Try it: the link `inovat-museum.vercel.app` and a QR code (any free QR generator).

## Practical tips

- **Rehearse the live tour with a timer.** It is the riskiest part; know the exact path and
  which exhibit you open. Use `?devmode` on the presentation laptop so every room is open.
- **Have a backup:** if the venue's computer or network fails, play a screen recording of the
  live tour instead (record it once with Win+Alt+R).
- Load the site once before the presentation so its files are cached (it then starts in
  seconds), set graphics to High, and press F11 for full screen.
- Plug the laptop into power: on battery, it may lower the graphics on its own.
- One person drives, another talks: walking and explaining at once is hard.
- Speak to the audience, not to the screen; let the room on screen do the showing.

## Recording the trailer

1. On the normal site (`https://inovat-museum.vercel.app`), set the language and the graphics
   level (gear on the title screen; turn Automatic off and choose High or Ultra). Both are
   remembered. Then open `https://inovat-museum.vercel.app/?trailer` and wait for loading.
2. Press F11 for full screen.
3. Start the recorder: Win+Alt+R (Xbox Game Bar, records the browser and its sound), or OBS.
4. Click once: the trailer plays (31.6 s with its own music; the closing title then stays and
   the music rings out until 36 s). Space pauses and resumes it.
   Press **R** at any time to play it again from the start after a 3-2-1 countdown on black.
   Record the second take: by then every room and the ending film have been drawn once, so
   it plays most smoothly.
5. Stop the recorder; trim the start and end in the Photos app or CapCut.
6. For the English version, switch the language on the normal site first, then repeat.

## Screenshots for the slides

Open `?trailer`, press F11, click to play, and press **Space** to hold the picture at any
moment; take a full-size screenshot with **Win+Shift+S**, then Space again to go on.
`?trailer&from=16` starts at second 16 (any second works), to reach a shot quickly or to
re-record one part. Good moments: the rotunda dome (5 s), each era's headline exhibit (8, 10.5,
13, 16 s), the Rocket's board (18 s), the montage (19.2-21.6 s), the gears (22 s), the Time
Machine (core I 22.4-24.3 s, core IV 24.3-26.2 s), the ending film's city and neurons (28-31.5 s), the closing title (33 s).

For the phone version, play normally (`?devmode` opens everything) and use the phone's own
screenshot buttons.

## Trailer soundtrack

`public/sounds/music/trailer.ogg` (and `.m4a`), made with DiffRhythm and loudness-matched to
the other music. Its landmarks (swell 3.2 s, build from 6.4 s, peak 25.2 s, calm 27.2 s, final
hit 31.6 s) are written at the top of `src/world/trailer-script.ts`; the cuts sit on them.
