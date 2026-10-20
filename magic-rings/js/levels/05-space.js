/* Puzzle: Planets. Each row: [id, order from the Sun, planet, colour, famous for, one year lasts]. Text values are [English, Hindi, Odia]. */
addLevel({
  key: "space", color: "#C6CCFF", emoji: "🪐",
  name: L("Planets", "ग्रह", "ଗ୍ରହ"),
  tagline: L("Our solar system", "हमारा सौर मंडल", "ଆମ ସୌରଜଗତ"),
  rings: [
    { name: L("Place from the Sun", "सूर्य से क्रम", "ସୂର୍ଯ୍ୟଠାରୁ କ୍ରମ"), icon: true },
    { name: L("Planet", "ग्रह", "ଗ୍ରହ") },
    { name: L("Colour", "रंग", "ରଙ୍ଗ") },
    { name: L("Famous for", "पहचान", "ପରିଚୟ") },
    { name: L("One year lasts", "एक साल", "ଏକ ବର୍ଷ") },
  ],
  priority: [1, 0, 3, 2, 4],
  items: [
    ["mercury", "num:1", ["Mercury", "बुध", "ବୁଧ"], ["Grey", "धूसर", "ଧୂସର"], ["Smallest planet", "सबसे छोटा ग्रह", "ସବୁଠୁ ଛୋଟ ଗ୍ରହ"], ["88 days", "88 दिन", "88 ଦିନ"]],
    ["venus", "num:2", ["Venus", "शुक्र", "ଶୁକ୍ର"], ["Pale yellow", "हल्का पीला", "ହାଲୁକା ହଳଦିଆ"], ["Hottest planet", "सबसे गर्म ग्रह", "ସବୁଠୁ ଗରମ ଗ୍ରହ"], ["225 days", "225 दिन", "225 ଦିନ"]],
    ["earth", "num:3", ["Earth", "पृथ्वी", "ପୃଥିବୀ"], ["Blue and green", "नीला और हरा", "ନୀଳ ଓ ସବୁଜ"], ["Our home", "हमारा घर", "ଆମ ଘର"], ["365 days", "365 दिन", "365 ଦିନ"]],
    ["mars", "num:4", ["Mars", "मंगल", "ମଙ୍ଗଳ"], ["Red", "लाल", "ଲାଲ"], ["Red dust storms", "लाल धूल भरी आँधी", "ଲାଲ ଧୂଳି ଝଡ଼"], ["687 days", "687 दिन", "687 ଦିନ"]],
    ["jupiter", "num:5", ["Jupiter", "बृहस्पति", "ବୃହସ୍ପତି"], ["Orange stripes", "नारंगी धारियाँ", "କମଳା ଧାଡ଼ି"], ["Biggest planet", "सबसे बड़ा ग्रह", "ସବୁଠୁ ବଡ଼ ଗ୍ରହ"], ["12 years", "12 साल", "12 ବର୍ଷ"]],
    ["saturn", "num:6", ["Saturn", "शनि", "ଶନି"], ["Golden", "सुनहरा", "ସୁନେଲି"], ["Beautiful rings", "सुंदर छल्ले", "ସୁନ୍ଦର ବଳୟ"], ["29 years", "29 साल", "29 ବର୍ଷ"]],
    ["uranus", "num:7", ["Uranus", "अरुण", "ଅରୁଣ"], ["Light blue", "हल्का नीला", "ହାଲୁକା ନୀଳ"], ["Spins on its side", "करवट लेकर घूमता है", "କଡ଼ ମାଡ଼ି ଘୂରେ"], ["84 years", "84 साल", "84 ବର୍ଷ"]],
    ["neptune", "num:8", ["Neptune", "वरुण", "ବରୁଣ"], ["Deep blue", "गहरा नीला", "ଗାଢ଼ ନୀଳ"], ["Strongest winds", "सबसे तेज़ हवाएँ", "ସବୁଠୁ ପ୍ରବଳ ପବନ"], ["165 years", "165 साल", "165 ବର୍ଷ"]],
  ],
});
