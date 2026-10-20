/* Puzzle: Indian States. Each row: [id, ring values inner → outer]. Each ring value is [English, Hindi, Odia].
   Names come from the Discover India map game, so both games use the same words. */
addLevel({
  key: "states", color: "#FFC08A", emoji: "🗺️",
  name: L("Indian States", "भारत के राज्य", "ଭାରତର ରାଜ୍ୟ"),
  tagline: L("States, dances, capitals and more", "राज्य, नृत्य, राजधानी और बहुत कुछ", "ରାଜ୍ୟ, ନୃତ୍ୟ, ରାଜଧାନୀ ଓ ଆହୁରି"),
  rings: [
    { name: L("State", "राज्य", "ରାଜ୍ୟ") },
    { name: L("Dance", "नृत्य", "ନୃତ୍ୟ") },
    { name: L("Capital", "राजधानी", "ରାଜଧାନୀ") },
    { name: L("Handloom", "हथकरघा", "ହସ୍ତତନ୍ତ") },
    { name: L("Temple", "मंदिर", "ମନ୍ଦିର") },
  ],
  // which rings to use first on Easy (3), Medium (4), Hard (5): numbers are positions in "rings" above
  priority: [0, 2, 1, 3, 4],
  items: [
    ["OD", ["Odisha","ओडिशा","ଓଡ଼ିଶା"], ["Odissi","ओडिसी","ଓଡ଼ିଶୀ"], ["Bhubaneswar","भुवनेश्वर","ଭୁବନେଶ୍ୱର"], ["Sambalpuri Saree","संबलपुरी साड़ी","ସମ୍ବଲପୁରୀ ଶାଢ଼ୀ"], ["Jagannath Temple","जगन्नाथ मंदिर","ଜଗନ୍ନାଥ ମନ୍ଦିର"]],
    ["KL", ["Kerala","केरल","କେରଳ"], ["Kathakali","कथकली","କଥାକଳି"], ["Thiruvananthapuram","तिरुवनंतपुरम","ତିରୁବନନ୍ତପୁରମ"], ["Kasavu","कसावु","କସାଭୁ"], ["Padmanabhaswamy Temple","पद्मनाभस्वामी मंदिर","ପଦ୍ମନାଭସ୍ୱାମୀ ମନ୍ଦିର"]],
    ["GJ", ["Gujarat","गुजरात","ଗୁଜରାଟ"], ["Garba","गरबा","ଗରବା"], ["Gandhinagar","गांधीनगर","ଗାନ୍ଧୀନଗର"], ["Patola","पटोला","ପାଟୋଳା"], ["Somnath Temple","सोमनाथ मंदिर","ସୋମନାଥ ମନ୍ଦିର"]],
    ["PB", ["Punjab","पंजाब","ପଞ୍ଜାବ"], ["Bhangra","भांगड़ा","ଭାଙ୍ଗଡ଼ା"], ["Chandigarh","चंडीगढ़","ଚଣ୍ଡିଗଡ଼"], ["Phulkari","फुलकारी","ଫୁଲକାରୀ"], ["Durgiana Temple","दुर्गियाना मंदिर","ଦୁର୍ଗିଆନା ମନ୍ଦିର"]],
    ["AS", ["Assam","असम","ଆସାମ"], ["Bihu","बिहू","ବିହୁ"], ["Dispur","दिसपुर","ଦିସପୁର"], ["Muga Silk","मूगा रेशम","ମୁଗା ରେଶମ"], ["Kamakhya Temple","कामाख्या मंदिर","କାମାଖ୍ୟା ମନ୍ଦିର"]],
    ["TN", ["Tamil Nadu","तमिलनाडु","ତାମିଲନାଡୁ"], ["Bharatanatyam","भरतनाट्यम","ଭରତନାଟ୍ୟମ"], ["Chennai","चेन्नई","ଚେନ୍ନାଇ"], ["Kanchipuram Silk","कांचीपुरम सिल्क","କାଞ୍ଚିପୁରମ ରେଶମ"], ["Brihadeeswarar Temple","बृहदीश्वर मंदिर","ବୃହଦୀଶ୍ୱର ମନ୍ଦିର"]],
    ["UP", ["Uttar Pradesh","उत्तर प्रदेश","ଉତ୍ତର ପ୍ରଦେଶ"], ["Kathak","कथक","କଥକ"], ["Lucknow","लखनऊ","ଲକ୍ଷ୍ନୌ"], ["Banarasi Saree","बनारसी साड़ी","ବନାରସୀ ଶାଢ଼ୀ"], ["Kashi Vishwanath Temple","काशी विश्वनाथ मंदिर","କାଶୀ ବିଶ୍ୱନାଥ ମନ୍ଦିର"]],
    ["WB", ["West Bengal","पश्चिम बंगाल","ପଶ୍ଚିମବଙ୍ଗ"], ["Purulia Chhau","पुरुलिया छऊ","ପୁରୁଲିଆ ଛଉ"], ["Kolkata","कोलकाता","କୋଲକାତା"], ["Baluchari","बालूचरी","ବାଲୁଚରୀ"], ["Dakshineswar Kali Temple","दक्षिणेश्वर काली मंदिर","ଦକ୍ଷିଣେଶ୍ୱର କାଳୀ ମନ୍ଦିର"]],
    ["MH", ["Maharashtra","महाराष्ट्र","ମହାରାଷ୍ଟ୍ର"], ["Lavani","लावणी","ଲାବଣୀ"], ["Mumbai","मुंबई","ମୁମ୍ବାଇ"], ["Paithani","पैठणी","ପୈଠଣୀ"], ["Kailasa Temple","कैलाश मंदिर","କୈଳାସ ମନ୍ଦିର"]],
    ["KA", ["Karnataka","कर्नाटक","କର୍ଣ୍ଣାଟକ"], ["Yakshagana","यक्षगान","ଯକ୍ଷଗାନ"], ["Bengaluru","बेंगलुरु","ବେଙ୍ଗାଲୁରୁ"], ["Mysore Silk","मैसूर सिल्क","ମହୀଶୂର ରେଶମ"], ["Virupaksha Temple","विरुपाक्ष मंदिर","ବିରୁପାକ୍ଷ ମନ୍ଦିର"]],
    ["RJ", ["Rajasthan","राजस्थान","ରାଜସ୍ଥାନ"], ["Ghoomar","घूमर","ଘୁମର"], ["Jaipur","जयपुर","ଜୟପୁର"], ["Kota Doria","कोटा डोरिया","କୋଟା ଡୋରିଆ"], ["Dilwara Temples","दिलवाड़ा मंदिर","ଦିଲୱାଡ଼ା ମନ୍ଦିର"]],
    ["MN", ["Manipur","मणिपुर","ମଣିପୁର"], ["Manipuri Raas","मणिपुरी रास","ମଣିପୁରୀ ରାସ"], ["Imphal","इंफाल","ଇମ୍ଫାଲ"], ["Phanek","फनेक","ଫନେକ"], ["Shree Govindajee Temple","श्री गोविंदजी मंदिर","ଶ୍ରୀ ଗୋବିନ୍ଦଜୀ ମନ୍ଦିର"]],
  ],
});
