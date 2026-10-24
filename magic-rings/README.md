# Tolo's Magic Rings 🌻

A 3D drag-and-drop ring puzzle for kids, in **English, हिन्दी and ଓଡ଼ିଆ**, made for **KiddyMaitri**.
It's the second game after *Discover India* and uses the same look, Tolo the Sunflower, sounds and celebrations.

## How it plays

- The board is a set of **circles inside circles**, cut into **slices** like a pizza. Each ring holds one kind of thing (for example Country, Capital, Money).
- At the start every slice matches, for example **India · New Delhi · Rupee**. Tolo lights up the slices one by one so you can remember them.
- Then every card **flies off on its own** and lands in a new slice.
- **Pick up any card and drag it** to the slice where it belongs (or tap the card, then tap the slice). The card already there swaps places with it. Cards stay in their own ring.
- The **inside ring is the guide** and never moves. A card that is right **turns gold, gets a tick and stays put**. A full ring gets a big celebration.
- **Beat the clock:** every puzzle has a time limit (more cards, more time). A countdown ring runs round the board and the last 10 seconds tick and flash red. When time runs out an alarm clock rings, the board rattles and the end menu shows the right answers.
- **Score:** 100 points for every card in the right place, plus 10 points for every second left when you solve it, minus 50 for each hint. Stars come from how much time is left. Best scores are saved for every puzzle and difficulty.
- **End menu:** Play again, Beat your score (play again with your best as the target), Next puzzle, Try a harder level, pick a different puzzle, or go Home.
- All puzzles are open from the start.
- **Hint** (bulb button or `H`) puts one card in the right place for you. It costs 2 moves.
- Card words **bend along the curve** of their ring (and turn round on the bottom half so they always read left to right). Hindi and Odia letters stay properly joined.
- Touch any slice and the bar under the board shows its full names, which helps on small phones.
- **3D board:** the board is a thick disc that leans towards the mouse, or with the phone's tilt sensor (iPhone asks for permission after the first tap). While a card is held, its side of the board dips as if the card had weight. Cards flip over in 3D while the puzzle mixes, and the whole board flips round when you win.
- **3D background:** low-poly shapes (mini magic boards, gems, planets, stars and sunflowers) float towards you in an endless fly-through. Near shapes slide more than far ones as you look around, and tapping empty background bumps the nearby shapes away. On slow phones the background thins itself out so the game stays smooth. Everything holds still for players who turn on "reduce motion".
- **Playful background:** words, animal pictures and flags float around, each on its own path. Grab one and throw it so it bounces off the others, or drop it on Tolo and she reads it out loud. The pieces fade back while a puzzle is being played.

### Difficulty

| | Rings | Slices | Extra |
|---|---|---|---|
| 🌱 Easy | 3 | 4 | Cards are coloured by answer, so matching colours helps |
| 🌻 Medium | 4 | 6 | No colour clues |
| 🔥 Hard | 5 | 8 | Cards don't turn gold one by one: a ring only locks when every card in it is right. |

### Puzzles

1. 🌍 **Countries**: flag, country, capital, money, famous place
2. 🐾 **Animals**: picture, animal, sound, baby, home
3. 🛠️ **Our Helpers**: picture, helper, tool, workplace, job
4. 🗺️ **Indian States**: state, dance, capital, handloom, temple (the same words as the map game)
5. 🪐 **Planets**: place from the Sun, planet, colour, famous for, length of a year

Each game picks a random set of items, so every play is different. 
**Keys:** `←` `→` pick a slice · `↑` `↓` pick a ring · `Enter` pick up / drop a card · `H` hint · `R` new mix · `M` sound · `L` language · `?` rules · `Esc` home. On the home screen: `←` `→` browse puzzles, `Enter` play, `1`–`5` jump to a puzzle.

---

## Step 1: Open it in VS Code

1. Unzip `magic-rings.zip`. You get a folder called `magic-rings`. Keep it **next to** your `discover-india` folder, not inside it.
2. In VS Code choose **File → Open Folder…** and pick `magic-rings`.
3. Right-click `index.html` and choose **Open with Live Server** (install the Live Server extension if VS Code asks).

> Double-clicking `index.html` won't load the fonts properly. Always use Live Server, or the real website.

## Step 2: Put it on GitHub (a new repository)

This is a separate game, so give it its own repository.

1. On github.com click **New repository**, name it `magic-rings`, keep it **Public**, and **don't** tick "Add a README". Click **Create repository**.
2. In VS Code open **Terminal → New Terminal** (inside the `magic-rings` folder) and run, replacing `YOUR-NAME`:
   ```powershell
   git init
   git add -A
   git commit -m "Magic Rings game"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/magic-rings.git
   git push -u origin main
   ```

## Step 3: Put it online with Netlify

1. On app.netlify.com choose **Add new site → Import an existing project → GitHub**, then pick `magic-rings`.
2. Leave **Build command** empty and **Publish directory** empty (or `.`), then click **Deploy**.
3. Under **Site configuration → Change site name** pick something like `tolo-magic-rings`. The game is live at `https://tolo-magic-rings.netlify.app`.
4. From now on, every `git push` updates the site by itself.

## Step 4: Link the two games

- The Magic Rings home screen already links to the map game. To change that link, edit `OTHER_GAMES` at the top of `js/i18n.js`.
- On kiddymaitri, add a button for each game, or embed it:
  ```html
  <iframe src="https://tolo-magic-rings.netlify.app" style="width:100%;height:85vh;min-height:620px;border:0;border-radius:24px" title="Tolo's Magic Rings"></iframe>
  ```

---

## Adding or changing puzzles

Each puzzle is one file in `js/levels/`. A row looks like this:

```js
["in", "flag:in", ["India", "भारत", "ଭାରତ"], ["New Delhi", "नई दिल्ली", "ନୂଆଦିଲ୍ଲୀ"], ["Rupee", "रुपया", "ଟଙ୍କା"], ["Taj Mahal", "ताज महल", "ତାଜମହଲ"]],
```

- The first item is a short id. Then comes one value per ring, from the **inside ring to the outside ring**.
- A picture ring (`icon: true`) takes one value: an emoji like `"🐶"`, a number like `"num:3"`, or a flag `"flag:in"`. The available flags are in, jp, fr, ru, cn, br, us, gb, th and mx.
- Every other ring takes `[English, Hindi, Odia]`.
- Inside one ring, every answer must be different. You can't have two "Euro"s, because then two slices would both be right.
- `priority` decides which rings Easy (first 3) and Medium (first 4) use.
- Give a puzzle at least 8 rows so Hard can use 8 slices. More rows mean more variety, because each game picks a random set.

**New puzzle:** copy a file in `js/levels/`, change `key`, `color`, `emoji`, names and rows, then add a `<script src="js/levels/…">` line in `index.html` next to the others.

**After every change, run:**
```powershell
node tools/check-levels.js
```
It checks the three languages, repeated answers, ring counts and flags. Then commit and push.

> Please have a native Hindi speaker and a native Odia speaker read `js/i18n.js` and `js/levels/` once before launch.

## Project files

```
magic-rings/
├── index.html            the page
├── css/base.css          shared look (same as Discover India): buttons, Tolo, modals, dock
├── css/style.css         this game's layout, moving background, carousel, board
├── js/i18n.js            all interface words in 3 languages + difficulty settings
├── js/levels/            one file per puzzle
├── js/game.js            the game engine (cards, drag and drop, sounds, celebrations)
├── assets/fonts/         Baloo 2 + Baloo Bhaina 2 (SIL Open Font License)
├── tools/check-levels.js checks every puzzle
└── netlify.toml          makes phones always load the newest version
```

**Fine-tuning** (in `js/i18n.js`, `DIFFICULTIES`): number of rings and slices, colour clues on or off, whether cards turn gold one by one (`ringOnly`), and how many hints each level gets.
