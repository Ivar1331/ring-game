/* Puzzle: Countries of the World.
   Each row: [id, ring 1, ring 2, ...] going from the inside ring to the outside ring.
   An icon ring holds one value ("flag:in", an emoji or a number). Every other ring value is [English, Hindi, Odia].
   Each value must be different from the others in the same ring. */
addLevel({
  key: "countries", color: "#FFD45C", emoji: "🌍",
  name: L("Countries", "देश", "ଦେଶ"),
  tagline: L("Flags, capitals and money", "झंडे, राजधानी और पैसा", "ପତାକା, ରାଜଧାନୀ ଓ ଟଙ୍କା"),
  rings: [
    { name: L("Flag", "झंडा", "ପତାକା"), icon: true },
    { name: L("Country", "देश", "ଦେଶ") },
    { name: L("Capital", "राजधानी", "ରାଜଧାନୀ") },
    { name: L("Money", "मुद्रा", "ମୁଦ୍ରା") },
    { name: L("Famous place", "प्रसिद्ध स्थान", "ପ୍ରସିଦ୍ଧ ସ୍ଥାନ") },
  ],
  // Easy uses the first 3 of these rings, Medium 4, Hard all 5 (numbers are positions in "rings")
  priority: [1, 2, 3, 0, 4],
  items: [
    ["in", "flag:in", ["India", "भारत", "ଭାରତ"], ["New Delhi", "नई दिल्ली", "ନୂଆଦିଲ୍ଲୀ"], ["Rupee", "रुपया", "ଟଙ୍କା"], ["Taj Mahal", "ताज महल", "ତାଜମହଲ"]],
    ["jp", "flag:jp", ["Japan", "जापान", "ଜାପାନ"], ["Tokyo", "टोक्यो", "ଟୋକିଓ"], ["Yen", "येन", "ୟେନ"], ["Mount Fuji", "फ़ूजी पर्वत", "ଫୁଜି ପର୍ବତ"]],
    ["fr", "flag:fr", ["France", "फ़्रांस", "ଫ୍ରାନ୍ସ"], ["Paris", "पेरिस", "ପ୍ୟାରିସ"], ["Euro", "यूरो", "ୟୁରୋ"], ["Eiffel Tower", "एफ़िल टॉवर", "ଆଇଫେଲ ଟାୱାର"]],
    ["ru", "flag:ru", ["Russia", "रूस", "ରୁଷିଆ"], ["Moscow", "मॉस्को", "ମସ୍କୋ"], ["Ruble", "रूबल", "ରୁବଲ"], ["Red Square", "रेड स्क्वायर", "ରେଡ୍ ସ୍କୋୟାର"]],
    ["cn", "flag:cn", ["China", "चीन", "ଚୀନ"], ["Beijing", "बीजिंग", "ବେଜିଂ"], ["Yuan", "युआन", "ୟୁଆନ"], ["Great Wall", "चीन की दीवार", "ଚୀନ ପ୍ରାଚୀର"]],
    ["br", "flag:br", ["Brazil", "ब्राज़ील", "ବ୍ରାଜିଲ"], ["Brasília", "ब्रासीलिया", "ବ୍ରାସିଲିଆ"], ["Real", "रियाल", "ରିଆଲ"], ["Christ the Redeemer", "क्राइस्ट द रिडीमर", "କ୍ରାଇଷ୍ଟ ଦି ରିଡିମର"]],
    ["us", "flag:us", ["USA", "अमेरिका", "ଆମେରିକା"], ["Washington, D.C.", "वॉशिंगटन डी.सी.", "ୱାଶିଂଟନ ଡି.ସି."], ["Dollar", "डॉलर", "ଡଲାର"], ["Statue of Liberty", "स्टैच्यू ऑफ़ लिबर्टी", "ଷ୍ଟାଚ୍ୟୁ ଅଫ୍ ଲିବର୍ଟି"]],
    ["gb", "flag:gb", ["United Kingdom", "ब्रिटेन", "ବ୍ରିଟେନ"], ["London", "लंदन", "ଲଣ୍ଡନ"], ["Pound", "पाउंड", "ପାଉଣ୍ଡ"], ["Big Ben", "बिग बेन", "ବିଗ୍ ବେନ୍"]],
    ["th", "flag:th", ["Thailand", "थाईलैंड", "ଥାଇଲାଣ୍ଡ"], ["Bangkok", "बैंकॉक", "ବ୍ୟାଙ୍କକ"], ["Baht", "बाट", "ବାହଟ୍"], ["Grand Palace", "ग्रैंड पैलेस", "ଗ୍ରାଣ୍ଡ ପ୍ୟାଲେସ"]],
    ["mx", "flag:mx", ["Mexico", "मेक्सिको", "ମେକ୍ସିକୋ"], ["Mexico City", "मेक्सिको सिटी", "ମେକ୍ସିକୋ ସିଟି"], ["Peso", "पेसो", "ପେସୋ"], ["Chichén Itzá", "चिचेन इट्ज़ा", "ଚିଚେନ ଇଟଜା"]],
  ],
});
