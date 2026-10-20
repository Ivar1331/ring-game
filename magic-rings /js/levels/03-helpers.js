/* Puzzle: Our Helpers. Each row: [id, picture, helper, tool, workplace, job]. Text values are [English, Hindi, Odia]. */
addLevel({
  key: "helpers", color: "#A9D8FF", emoji: "🛠️",
  name: L("Our Helpers", "हमारे सहायक", "ଆମ ସହାୟକ"),
  tagline: L("Who works where, with what?", "कौन कहाँ, किससे काम करता है?", "କିଏ କେଉଁଠି, କଣ ଦେଇ କାମ କରନ୍ତି?"),
  rings: [
    { name: L("Picture", "चित्र", "ଚିତ୍ର"), icon: true },
    { name: L("Helper", "सहायक", "ସହାୟକ") },
    { name: L("Tool", "औज़ार", "ଉପକରଣ") },
    { name: L("Workplace", "काम की जगह", "କାମ ଜାଗା") },
    { name: L("Job", "काम", "କାମ") },
  ],
  priority: [1, 3, 2, 0, 4],
  items: [
    ["doctor", "🩺", ["Doctor", "डॉक्टर", "ଡାକ୍ତର"], ["Thermometer", "थर्मामीटर", "ଥର୍ମୋମିଟର"], ["Hospital", "अस्पताल", "ଡାକ୍ତରଖାନା"], ["Treats sick people", "बीमारों का इलाज करते हैं", "ରୋଗୀଙ୍କ ଚିକିତ୍ସା କରନ୍ତି"]],
    ["teacher", "📚", ["Teacher", "शिक्षक", "ଶିକ୍ଷକ"], ["Chalk", "चॉक", "ଚକ୍"], ["School", "स्कूल", "ବିଦ୍ୟାଳୟ"], ["Teaches children", "बच्चों को पढ़ाते हैं", "ପିଲାଙ୍କୁ ପଢ଼ାନ୍ତି"]],
    ["farmer", "🌾", ["Farmer", "किसान", "କୃଷକ"], ["Plough", "हल", "ଲଙ୍ଗଳ"], ["Field", "खेत", "କ୍ଷେତ"], ["Grows our food", "अनाज उगाते हैं", "ଖାଦ୍ୟ ଚାଷ କରନ୍ତି"]],
    ["chef", "🍳", ["Chef", "रसोइया", "ରୋଷେୟା"], ["Ladle", "करछी", "ଡାଲିଚାମଚ"], ["Kitchen", "रसोई", "ରୋଷେଇଘର"], ["Cooks tasty food", "खाना पकाते हैं", "ଖାଦ୍ୟ ରାନ୍ଧନ୍ତି"]],
    ["tailor", "🧵", ["Tailor", "दर्ज़ी", "ଦରଜି"], ["Sewing machine", "सिलाई मशीन", "ସିଲେଇ ମେସିନ"], ["Tailor shop", "दर्ज़ी की दुकान", "ଦରଜି ଦୋକାନ"], ["Stitches clothes", "कपड़े सिलते हैं", "ଲୁଗା ସିଲାନ୍ତି"]],
    ["fire", "🚒", ["Firefighter", "दमकलकर्मी", "ଅଗ୍ନିଶମ କର୍ମୀ"], ["Water hose", "पानी का पाइप", "ପାଣି ପାଇପ"], ["Fire station", "फ़ायर स्टेशन", "ଅଗ୍ନିଶମ କେନ୍ଦ୍ର"], ["Puts out fires", "आग बुझाते हैं", "ନିଆଁ ଲିଭାନ୍ତି"]],
    ["police", "👮", ["Police officer", "पुलिस", "ପୋଲିସ"], ["Whistle", "सीटी", "ହୁଇସିଲ"], ["Police station", "थाना", "ଥାନା"], ["Keeps us safe", "हमारी रक्षा करते हैं", "ଆମକୁ ସୁରକ୍ଷା ଦିଅନ୍ତି"]],
    ["post", "📮", ["Postman", "डाकिया", "ଡାକପିଅନ"], ["Mail bag", "डाक का थैला", "ଡାକ ବ୍ୟାଗ"], ["Post office", "डाकघर", "ଡାକଘର"], ["Delivers letters", "चिट्ठियाँ पहुँचाते हैं", "ଚିଠି ପହଞ୍ଚାନ୍ତି"]],
    ["carpenter", "🔨", ["Carpenter", "बढ़ई", "ବଢ଼େଇ"], ["Saw", "आरी", "କରତ"], ["Workshop", "कारख़ाना", "କାର୍ଯ୍ୟଶାଳା"], ["Makes furniture", "फ़र्नीचर बनाते हैं", "ଆସବାବପତ୍ର ତିଆରି କରନ୍ତି"]],
    ["dentist", "🦷", ["Dentist", "दंत चिकित्सक", "ଦନ୍ତ ଚିକିତ୍ସକ"], ["Tooth mirror", "दाँत का शीशा", "ଦାନ୍ତ ଦର୍ପଣ"], ["Clinic", "क्लिनिक", "କ୍ଲିନିକ"], ["Looks after teeth", "दाँतों की देखभाल", "ଦାନ୍ତର ଯତ୍ନ ନିଅନ୍ତି"]],
  ],
});
