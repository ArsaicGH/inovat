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
4. Click once: the trailer plays (30 s, then the closing card stays). Space pauses and resumes it.
5. Stop the recorder; trim the start and end in the Photos app or CapCut.
6. For the English version, switch the language on the normal site first, then repeat.

## Screenshots for the slides

The trailer doubles as a photo tour. Open `?trailer`, press F11, click to play, and press
**Space** to hold the picture at any moment, take a full-size screenshot with **Win+Shift+S**,
then Space again to go on. Its nine shots give one picture for each part of the talk:

| Shot | Shows | Use it for |
|---|---|---|
| 1 | The rotunda and its dome | Title slide, "why" slide |
| 2-5 | CMCN 1 to 4, each in its own look | The four-eras slide |
| 6 | The Rocket turning on its plinth | "21 inventions in 3D" |
| 7 | A text board up close | Sources and bilingual text |
| 8 | The Game Room console | The game slide |
| 9 | Back in the rotunda | Closing slide |
| Card | INOVAT and the address | Title or final slide |

For the game itself and the phone version, play normally (`?devmode` opens everything) and take
screenshots of the workshop, one core, the map and an enlarged board. On a phone, use its own
screenshot buttons.
