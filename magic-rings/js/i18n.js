/* =====================================================================
   Magic Rings with Tolo — all words in English, Hindi and Odia.
   Puzzle content lives in js/levels/*.js (one file per puzzle).
   ===================================================================== */
"use strict";

// Link shown on the home screen. Change the address if your map game lives somewhere else.
const OTHER_GAMES = [
  { emoji: "🗺️", url: "https://indianmapgame.netlify.app", name: { en: "Discover India map game", hi: "भारत की खोज – नक्शा खेल", or: "ଭାରତ ଆବିଷ୍କାର – ମାନଚିତ୍ର ଖେଳ" } },
];

const L = (en, hi, or) => ({ en, hi, or });

// Puzzles register themselves here. The order of the <script> tags in index.html is the order in the game.
const LEVELS = [];
function addLevel(def) {
  const R = def.rings.length;
  def.items = def.items.map((row) => ({
    id: row[0],
    values: def.rings.map((ring, j) => {
      const v = row[1 + j];
      return ring.icon ? v : L(v[0], v[1], v[2]);
    }),
  }));
  def.priority = def.priority || def.rings.map((_, i) => i);
  if (def.items.some((it) => it.values.length !== R)) console.warn("Puzzle", def.key, "has a row with the wrong number of rings");
  LEVELS.push(def);
}

// How each difficulty is built
const DIFFICULTIES = [
  { key: "easy",   rings: 3, slices: 4, colourClues: true,  hints: 3, color: "#B8E39A", emoji: "🌱" },
  { key: "medium", rings: 4, slices: 6, colourClues: false, hints: 2, color: "#FFD45C", emoji: "🌻" },
  { key: "hard",   rings: 5, slices: 8, colourClues: false, ringOnly: true, hints: 2, color: "#FF9F8A", emoji: "🔥" },
];

const UI = {
  en: {
    langName: "English", title: "Magic Rings", heroA: "Tolo's", heroB: "Magic Rings",
    heroSub: "Pick up the cards. Put what belongs together in the same slice.",
    chooseLevel: "Choose a puzzle", difficulty: "How hard?", easy: "Easy", medium: "Medium", hard: "Hard",
    diffInfo: "{r} rings · {s} slices", diffEasy: "Colour clues help you", diffMedium: "No colour clues", diffHard: "No gold help until a whole ring is right!",
    play: "Play", locked: "Locked", level: "Puzzle {n}", starsOf: "{a} of {b} stars",
    moves: "Moves", time: "Time", locks: "Placed", hints: "Hints",
    inRow: "{n} in a row!", notYet: "Not there yet. Try another slice!", ringDone: "{ring} ring done!", alreadyRight: "That card is already right!", tapPlace: "Now tap the slice where this card goes.", placed: "Placed",
    toloSays: "Tolo says",
    homeHello: "Hi! I'm Tolo. Drag the magic cards and put everything that belongs together in the same slice!",
    pickLevel: "Pick a puzzle and how hard you want it. Then press Play!",
    unlockFirst: "Finish {name} first to unlock this puzzle!",
    teacher: "Teacher mode: every puzzle is unlocked!",
    rules: [
      "Welcome to Magic Rings! Every ring holds one kind of thing, like countries, capitals or money.",
      "Watch closely! At the start, every slice matches, like India, New Delhi and Rupee. Then the rings get mixed up!",
      "Pick up any card and drag it to the slice where it belongs. The card that was there swaps places with it. You can also tap a card, then tap a slice.",
      "The inside ring is your guide and never moves. A card that is right turns gold and stays put! Make every slice match to win.",
    ],
    rulesHard: "On Hard, cards don't turn gold one by one. A ring only locks when every card in it is right. Think carefully!",
    rulesHead: "Tolo's rules {a} of {b}", next: "Next", letsGo: "Let's go", skip: "Skip",
    memorise: "Remember what goes together! Each slice is one match.",
    ready: "I'm ready!", mixing: "Mixing the rings…",
    go: "Now drag each card back to the slice where it belongs!",
    lockedRing: "{ring} ring locked!", moreToGo: "{n} more to go!", lastOne: "Just one more ring!",
    tapSwap: "Now tap another card in the same ring to swap them.",
    swapped: "Swapped!", lockedAlready: "That ring is already locked. Try another one!",
    guideRing: "This is the guide ring. It stays still. Move the other cards to match it!",
    hintUsed: "Here's a little help!", noHints: "No hints left. You can do it!",
    praise: ["Awesome!", "Great job!", "Super!", "Brilliant!", "Fantastic!", "Click! Locked!", "Wow!", "Well done!"],
    complete: "Puzzle solved!",
    doneMsg: { 3: "Ring master! Hardly any extra moves.", 2: "Great spinning! Try fewer moves for 3 stars.", 1: "You did it! Play again to earn more stars." },
    matched: "What you matched", replay: "Play again", home: "Home", nextLevel: "Next puzzle", tryHarder: "Try {d}", allDone: "All done",
    tipHome: "Home", tipHint: "Hint (H)", tipSound: "Sound {s} (M)", tipRestart: "New mix (R)", tipHelp: "How to play (?)", tipLang: "Language (L)", 
    on: "on", off: "off",
    keys: "Keys: ← → pick a slice · ↑ ↓ pick a ring · Enter pick up / drop · H hint · L language",
    moreGames: "More games", language: "Language", close: "Close",
    ringsTitle: "The rings", inside: "inside", outside: "outside", guide: "guide",
    prev: "Previous puzzle", nextPuzzle: "Next puzzle",
    best: "Best", ringN: "Ring {n}",
    ringsAre: "The rings in this puzzle, from inside to outside: {list}.",
    slice: "Slice", tapRead: "Touch a slice to read it here",
  },
  hi: {
    langName: "हिन्दी", title: "जादुई चक्र", heroA: "टोलो के", heroB: "जादुई चक्र",
    heroSub: "कार्ड उठाओ। जो साथ जाते हैं, उन्हें एक ही हिस्से में रखो।",
    chooseLevel: "पहेली चुनो", difficulty: "कितना कठिन?", easy: "आसान", medium: "मध्यम", hard: "कठिन",
    diffInfo: "{r} चक्र · {s} हिस्से", diffEasy: "रंग मदद करेंगे", diffMedium: "रंगों की मदद नहीं", diffHard: "पूरा चक्र सही होने तक कोई सुनहरी मदद नहीं!",
    play: "खेलो", locked: "बंद", level: "पहेली {n}", starsOf: "{b} में से {a} सितारे",
    moves: "चालें", time: "समय", locks: "सही", hints: "संकेत",
    inRow: "लगातार {n}!", notYet: "अभी नहीं। दूसरा हिस्सा आज़माओ!", ringDone: "{ring} चक्र पूरा!", alreadyRight: "यह कार्ड पहले से सही है!", tapPlace: "अब वह हिस्सा टैप करो जहाँ यह कार्ड जाएगा।", placed: "सही",
    toloSays: "टोलो कहती है",
    homeHello: "नमस्ते! मैं टोलो हूँ। जादुई कार्ड खींचो और जो चीज़ें साथ जाती हैं, उन्हें एक ही हिस्से में रखो!",
    pickLevel: "एक पहेली और कठिनाई चुनो। फिर खेलो दबाओ!",
    unlockFirst: "यह पहेली खोलने के लिए पहले {name} पूरी करो!",
    teacher: "शिक्षक मोड: सारी पहेलियाँ खुल गईं!",
    rules: [
      "जादुई चक्र में स्वागत है! हर चक्र में एक तरह की चीज़ें हैं, जैसे देश, राजधानी या पैसा।",
      "ध्यान से देखो! शुरू में हर हिस्सा सही मिला होता है, जैसे भारत, नई दिल्ली और रुपया। फिर चक्र मिल-जुल जाते हैं!",
      "कोई भी कार्ड उठाओ और उसे सही हिस्से में खींचकर छोड़ो। वहाँ का कार्ड उसकी जगह चला जाएगा। तुम कार्ड टैप करके फिर हिस्सा टैप भी कर सकते हो।",
      "अंदर वाला चक्र तुम्हारा गाइड है, यह कभी नहीं हिलता। सही कार्ड सुनहरा हो जाता है और वहीं रुक जाता है! हर हिस्सा मिलाओ और जीतो।",
    ],
    rulesHard: "कठिन में कार्ड एक-एक करके सुनहरे नहीं होते। चक्र तभी बंद होता है जब उसका हर कार्ड सही हो। ध्यान से सोचो!",
    rulesHead: "टोलो के नियम {a}/{b}", next: "आगे", letsGo: "चलो!", skip: "छोड़ो",
    memorise: "याद रखो क्या किसके साथ है! हर हिस्सा एक जोड़ी है।",
    ready: "मैं तैयार हूँ!", mixing: "चक्र मिलाए जा रहे हैं…",
    go: "अब हर कार्ड को उसके सही हिस्से में खींचो!",
    lockedRing: "{ring} चक्र बंद!", moreToGo: "बस {n} और!", lastOne: "बस एक चक्र और!",
    tapSwap: "अब उसी चक्र का दूसरा कार्ड टैप करो और बदलो।",
    swapped: "बदल गया!", lockedAlready: "यह चक्र पहले से बंद है। दूसरा आज़माओ!",
    guideRing: "यह गाइड चक्र है। यह नहीं हिलता। बाकी कार्ड इससे मिलाओ!",
    hintUsed: "यह लो थोड़ी मदद!", noHints: "संकेत ख़त्म। तुम कर सकते हो!",
    praise: ["शाबाश!", "बहुत बढ़िया!", "कमाल है!", "शानदार!", "वाह!", "क्लिक! बंद!", "बहुत ख़ूब!", "ज़बरदस्त!"],
    complete: "पहेली हल!",
    doneMsg: { 3: "चक्रों के उस्ताद! बहुत कम चालें।", 2: "बढ़िया! 3 सितारों के लिए कम चालें चलो।", 1: "तुमने कर दिखाया! और सितारों के लिए फिर खेलो।" },
    matched: "तुमने क्या मिलाया", replay: "फिर खेलो", home: "होम", nextLevel: "अगली पहेली", tryHarder: "{d} आज़माओ", allDone: "सब पूरा",
    tipHome: "होम", tipHint: "संकेत (H)", tipSound: "आवाज़ {s} (M)", tipRestart: "नया मिश्रण (R)", tipHelp: "कैसे खेलें (?)", tipLang: "भाषा (L)", 
    on: "चालू", off: "बंद",
    keys: "कुंजियाँ: ← → हिस्सा चुनो · ↑ ↓ चक्र चुनो · Enter उठाओ / रखो · H संकेत · L भाषा",
    moreGames: "और खेल", language: "भाषा", close: "बंद करो",
    ringsTitle: "चक्र", inside: "अंदर", outside: "बाहर", guide: "गाइड",
    prev: "पिछली पहेली", nextPuzzle: "अगली पहेली",
    best: "सबसे अच्छा", ringN: "चक्र {n}",
    ringsAre: "इस पहेली के चक्र, अंदर से बाहर: {list}।",
    slice: "हिस्सा", tapRead: "किसी हिस्से को छूकर यहाँ पढ़ो",
  },
  or: {
    langName: "ଓଡ଼ିଆ", title: "ଯାଦୁ ଚକ୍ର", heroA: "ଟୋଲୋଙ୍କ", heroB: "ଯାଦୁ ଚକ୍ର",
    heroSub: "କାର୍ଡ ଉଠାଅ। ଯାହା ଏକାଠି ଯାଏ, ତାକୁ ଗୋଟିଏ ଭାଗରେ ରଖ।",
    chooseLevel: "ପ୍ରହେଳିକା ବାଛ", difficulty: "କେତେ କଠିନ?", easy: "ସହଜ", medium: "ମଧ୍ୟମ", hard: "କଠିନ",
    diffInfo: "{r}ଟି ଚକ୍ର · {s}ଟି ଭାଗ", diffEasy: "ରଙ୍ଗ ସାହାଯ୍ୟ କରିବ", diffMedium: "ରଙ୍ଗ ସାହାଯ୍ୟ ନାହିଁ", diffHard: "ପୂରା ଚକ୍ର ଠିକ୍ ନହେବା ଯାଏ ସୁନେଲି ସାହାଯ୍ୟ ନାହିଁ!",
    play: "ଖେଳ", locked: "ବନ୍ଦ", level: "ପ୍ରହେଳିକା {n}", starsOf: "{b}ରୁ {a} ତାରା",
    moves: "ଚାଲ", time: "ସମୟ", locks: "ଠିକ୍", hints: "ସଙ୍କେତ",
    inRow: "ଲଗାତାର {n}!", notYet: "ଏଠି ନୁହେଁ। ଅନ୍ୟ ଭାଗ ଦେଖ!", ringDone: "{ring} ଚକ୍ର ସମ୍ପୂର୍ଣ୍ଣ!", alreadyRight: "ଏହି କାର୍ଡ ଆଗରୁ ଠିକ୍ ଅଛି!", tapPlace: "ଏବେ ସେହି ଭାଗ ଟ୍ୟାପ୍ କର ଯେଉଁଠି ଏହି କାର୍ଡ ଯିବ।", placed: "ଠିକ୍",
    toloSays: "ଟୋଲୋ କହୁଛି",
    homeHello: "ନମସ୍କାର! ମୁଁ ଟୋଲୋ। ଯାଦୁ କାର୍ଡ ଟାଣ ଏବଂ ଯାହା ଏକାଠି ଯାଏ ତାକୁ ଗୋଟିଏ ଭାଗରେ ରଖ!",
    pickLevel: "ଗୋଟିଏ ପ୍ରହେଳିକା ଓ କଠିନତା ବାଛ। ତାପରେ ଖେଳ ଦବାଅ!",
    unlockFirst: "ଏହା ଖୋଲିବାକୁ ପ୍ରଥମେ {name} ସାର!",
    teacher: "ଶିକ୍ଷକ ମୋଡ୍: ସବୁ ପ୍ରହେଳିକା ଖୋଲିଗଲା!",
    rules: [
      "ଯାଦୁ ଚକ୍ରକୁ ସ୍ୱାଗତ! ପ୍ରତ୍ୟେକ ଚକ୍ରରେ ଗୋଟିଏ ପ୍ରକାରର ଜିନିଷ ଅଛି, ଯେପରି ଦେଶ, ରାଜଧାନୀ ବା ଟଙ୍କା।",
      "ଧ୍ୟାନ ଦେଇ ଦେଖ! ଆରମ୍ଭରେ ପ୍ରତ୍ୟେକ ଭାଗ ଠିକ୍ ମିଳିଥାଏ, ଯେପରି ଭାରତ, ନୂଆଦିଲ୍ଲୀ ଓ ଟଙ୍କା। ତାପରେ ଚକ୍ରଗୁଡ଼ିକ ମିଶିଯାଏ!",
      "ଯେକୌଣସି କାର୍ଡ ଉଠାଇ ଠିକ୍ ଭାଗକୁ ଟାଣି ଛାଡ଼। ସେଠାରେ ଥିବା କାର୍ଡ ତା ଜାଗାକୁ ଚାଲିଯିବ। କାର୍ଡ ଟ୍ୟାପ୍ କରି ତାପରେ ଭାଗ ଟ୍ୟାପ୍ ମଧ୍ୟ କରିପାରିବ।",
      "ଭିତର ଚକ୍ର ତୁମର ଗାଇଡ୍, ଏହା କେବେ ହଲେ ନାହିଁ। ଠିକ୍ କାର୍ଡ ସୁନେଲି ହୋଇ ସେଇଠି ରହେ! ପ୍ରତ୍ୟେକ ଭାଗ ମିଳାଇ ଜିତ।",
    ],
    rulesHard: "କଠିନରେ କାର୍ଡ ଗୋଟି ଗୋଟି ହୋଇ ସୁନେଲି ହୁଏ ନାହିଁ। ଚକ୍ରର ସବୁ କାର୍ଡ ଠିକ୍ ହେଲେ ହିଁ ଚକ୍ର ବନ୍ଦ ହୁଏ। ଭଲ କରି ଭାବ!",
    rulesHead: "ଟୋଲୋଙ୍କ ନିୟମ {a}/{b}", next: "ଆଗକୁ", letsGo: "ଚାଲ!", skip: "ଛାଡ଼",
    memorise: "ମନେରଖ କଣ କାହା ସହ ଯାଏ! ପ୍ରତ୍ୟେକ ଭାଗ ଗୋଟିଏ ଯୋଡ଼ି।",
    ready: "ମୁଁ ପ୍ରସ୍ତୁତ!", mixing: "ଚକ୍ର ମିଶାଯାଉଛି…",
    go: "ଏବେ ପ୍ରତ୍ୟେକ କାର୍ଡକୁ ତାର ଠିକ୍ ଭାଗକୁ ଟାଣ!",
    lockedRing: "{ring} ଚକ୍ର ବନ୍ଦ!", moreToGo: "ଆଉ {n}ଟି!", lastOne: "ଆଉ ଗୋଟିଏ ଚକ୍ର!",
    tapSwap: "ଏବେ ସେହି ଚକ୍ରର ଅନ୍ୟ କାର୍ଡ ଟ୍ୟାପ୍ କରି ବଦଳାଅ।",
    swapped: "ବଦଳିଗଲା!", lockedAlready: "ଏହି ଚକ୍ର ଆଗରୁ ବନ୍ଦ। ଅନ୍ୟଟି ଚେଷ୍ଟା କର!",
    guideRing: "ଏହା ଗାଇଡ୍ ଚକ୍ର। ଏହା ହଲେ ନାହିଁ। ଅନ୍ୟ କାର୍ଡ ଏହା ସହ ମିଳାଅ!",
    hintUsed: "ଏହି ନିଅ ଟିକିଏ ସାହାଯ୍ୟ!", noHints: "ସଙ୍କେତ ସରିଗଲା। ତୁମେ ପାରିବ!",
    praise: ["ସାବାସ୍!", "ବହୁତ ଭଲ!", "ଚମତ୍କାର!", "ଅତି ସୁନ୍ଦର!", "ବାଃ!", "କ୍ଲିକ୍! ବନ୍ଦ!", "ଖୁବ୍ ଭଲ!", "ଦାରୁଣ!"],
    complete: "ପ୍ରହେଳିକା ସମାଧାନ!",
    doneMsg: { 3: "ଚକ୍ର ଓସ୍ତାଦ! ବହୁତ କମ୍ ଚାଲ।", 2: "ବହୁତ ଭଲ! 3ଟି ତାରା ପାଇଁ କମ୍ ଚାଲ ଚାଲ।", 1: "ତୁମେ କରିଦେଲ! ଅଧିକ ତାରା ପାଇଁ ପୁଣି ଖେଳ।" },
    matched: "ତୁମେ କଣ ମିଳାଇଲ", replay: "ପୁଣି ଖେଳ", home: "ମୂଳପୃଷ୍ଠା", nextLevel: "ପରବର୍ତ୍ତୀ ପ୍ରହେଳିକା", tryHarder: "{d} ଚେଷ୍ଟା କର", allDone: "ସବୁ ସରିଲା",
    tipHome: "ମୂଳପୃଷ୍ଠା", tipHint: "ସଙ୍କେତ (H)", tipSound: "ଶବ୍ଦ {s} (M)", tipRestart: "ନୂଆ ମିଶ୍ରଣ (R)", tipHelp: "କିପରି ଖେଳିବ (?)", tipLang: "ଭାଷା (L)", 
    on: "ଚାଲୁ", off: "ବନ୍ଦ",
    keys: "ଚାବି: ← → ଭାଗ ବାଛ · ↑ ↓ ଚକ୍ର ବାଛ · Enter ଉଠାଅ / ରଖ · H ସଙ୍କେତ · L ଭାଷା",
    moreGames: "ଆଉ ଖେଳ", language: "ଭାଷା", close: "ବନ୍ଦ କର",
    ringsTitle: "ଚକ୍ର", inside: "ଭିତର", outside: "ବାହାର", guide: "ଗାଇଡ୍",
    prev: "ପୂର୍ବ ପ୍ରହେଳିକା", nextPuzzle: "ପରବର୍ତ୍ତୀ ପ୍ରହେଳିକା",
    best: "ସର୍ବୋତ୍ତମ", ringN: "ଚକ୍ର {n}",
    ringsAre: "ଏହି ପ୍ରହେଳିକାର ଚକ୍ର, ଭିତରୁ ବାହାରକୁ: {list}।",
    slice: "ଭାଗ", tapRead: "ଗୋଟିଏ ଭାଗ ଛୁଇଁ ଏଠାରେ ପଢ଼",
  },
};
