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
4. Click once: the trailer plays (30 s; the closing title then stays). Space pauses and resumes it.
5. Stop the recorder; trim the start and end in the Photos app or CapCut.
6. For the English version, switch the language on the normal site first, then repeat.

## Screenshots for the slides

Open `?trailer`, press F11, click to play, and press **Space** to hold the picture at any
moment; take a full-size screenshot with **Win+Shift+S**, then Space again to go on.
`?trailer&from=16` starts at second 16 (any second works), to reach a shot quickly or to
re-record one part. Good moments: the rotunda dome (5 s), each era's headline exhibit (8, 10.5,
13, 15 s), the montage (16-22.8 s), the gears and the game window (23-25 s), the ending film's
city and neurons (26-28.8 s), the closing title (31 s).

For the phone version, play normally (`?devmode` opens everything) and use the phone's own
screenshot buttons.

## Trailer soundtrack brief (for an AI music generator)

Every cut in the trailer falls on a beat of 150 BPM (one beat = 0.4 s), so a track made to this
brief lands on the picture. Paste the prompt below; if the generator has a length setting, ask
for 36 seconds. When you have the file, send it to Claude to put into the trailer.

```
Instrumental cinematic trailer music, no vocals, no choir words, 36 seconds, 150 BPM, 4/4,
D minor resolving to D major at the end. Orchestral-hybrid: strings, low brass, piano,
celesta / music box, taiko and metallic percussion, subtle analog synth pulses. Mood: wonder,
history, invention, rising momentum, luxurious and epic, like a museum or prestige film trailer.
Exact structure (timestamps must be precise; every section change on a beat):
0:00-0:01.6  Near silence: one low sustained note and a faint reversed shimmer swelling into 0:01.6.
0:01.6-0:06.4  Wonder: warm sustained strings and soft piano, slow, no drums; gentle swell peaking at 0:04.2.
0:06.4  First accent (soft metallic hit). A steady ticking clock pulse starts on quarter notes (150 BPM) and continues.
0:06.4-0:16.0  Four rising stages of 2.4 s each, with a light accent on each start (0:06.4, 0:08.8, 0:11.2, 0:13.6):
   0:06.4 steam age - mechanical, anvil-like metal percussion, low cellos;
   0:08.8 electricity - brighter string ostinato, add tension;
   0:11.2 computers - a clean synth arpeggio joins;
   0:13.6 artificial intelligence - shimmering synth pad, everything building; riser into 0:16.0.
0:16.0  DROP: full driving rhythm (taiko, toms, staccato strings, low brass stabs) at 150 BPM, an accent on every beat - the montage. Keep it relentless and exciting until 0:22.8.
0:22.8-0:25.6  Clockwork: a celesta / music-box motif over the drive, ticking intensifies, big tension riser and whoosh building to 0:25.6.
0:25.6  HUGE IMPACT (portal opening): cinematic boom and bright cymbal swell, then the main theme at its fullest and most soaring - heroic brass and strings - through 0:28.8.
0:28.8-0:30.0  Sudden cut to complete silence (a breath), at most a faint reverse swell in the last 0.4 s.
0:30.0  Final massive hit: deep orchestral "braam" with a bright golden shimmer, resolving to D major, ringing out and fading slowly until 0:36.0.
```
