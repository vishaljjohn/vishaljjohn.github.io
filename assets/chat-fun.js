/* =========================================================================
   Vishal John — instant "fun" replies for the chat bots (homepage video call
   and the site-wide chat widget). Answers right away, even if the AI is down.
   window.VJFun.reply(text) -> null, or { parts: ["setup", "punchline"], kind: "joke" }
   window.VJFun.chips(used) -> a few suggestion chips the visitor hasn't tried yet
   Everything stated as fact here is true and on the site; the rest is clearly a bit.
   ========================================================================= */
(function () {
  "use strict";
  if (window.VJFun) return;

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  // don't repeat the last few picks from a list
  var recent = {};
  function fresh(name, list) {
    var seen = recent[name] || (recent[name] = []);
    var left = list.filter(function (x, i) { return seen.indexOf(i) < 0; });
    if (!left.length) { seen.length = 0; left = list; }
    var item = pick(left);
    seen.push(list.indexOf(item)); if (seen.length > Math.min(6, list.length - 1)) seen.shift();
    return item;
  }

  var JOKES = [
    ["why did the doctor carry a red pen?", "in case she needed to draw blood."],
    ["what do you call a surgeon with eight arms?", "a doctopus."],
    ["what do you call doctors who work at google?", "google docs."],
    ["why did the pillow go to the doctor?", "it was feeling all stuffed up."],
    ["why did the cookie go to the doctor?", "it was feeling crummy."],
    ["why did the banana go to the doctor?", "it wasn't peeling well."],
    ["what did the doctor say to the patient who thought he was a deck of cards?", "i'll deal with you later."],
    ["what's a skeleton's least favorite room?", "the living room."],
    ["why didn't the skeleton go to the party?", "he had no body to go with."],
    ["why can't you trust atoms?", "they make up everything. (my biochem professors hated this one.)"],
    ["what do you call a sad cup of coffee?", "depresso. (future menu item at my coffee shop.)"],
    ["what do you call a fake noodle?", "an impasta."],
    ["why are frogs so happy?", "they eat whatever bugs them."],
    ["how do you know a med student is studying?", "they've been staring at the same flashcard for 40 minutes and calling it \"active recall.\""],
    ["what's a med student's favorite kind of music?", "anything with a good beat. sinus rhythm preferred."],
    ["why did the white blood cell bring a shield?", "it heard the germs were coming. (that's basically the plot of my kids' book.)"],
    ["what do you call a balloon animal that can't stop talking?", "a gas bag. it's me. i'm the balloon animal."],
    ["knock knock.\nwho's there?\nhipaa.\nhipaa who?", "sorry, i can't share that information."]
  ];

  var BALLOONS = [
    "a wiener dog", "a giraffe with a slightly concerning neck", "a monkey on a palm tree", "a swan (it took four tries)",
    "a sword, for your quests", "a flower, because you deserve nice things", "a stethoscope (my specialty)",
    "a poodle with an attitude", "a little bumblebee", "a teddy bear", "a dinosaur that is definitely a dog with a tail"
  ];
  var BALLOON_TAGS = [
    "it's a little lopsided, but so is my sleep schedule.",
    "no animals were harmed. one balloon was dramatically popped.",
    "i've twisted these for kids at health fairs, so you're in good hands.",
    "tip jar optional. compliments mandatory."
  ];

  var FACTS = [
    "i co-wrote a kids' book called \"The Brave Little Immune Team,\" where your immune cells are tiny heroes. ages 4-8, but i won't tell if you read it.",
    "i speak English and Malayalam.",
    "in 2018 i built wooden furniture in Ishinomaki, Japan, to help a community rebuild after the 2011 tsunami.",
    "the climbing program i help with, Rock Cancer, has been featured on NBC Nightly News.",
    "i've grown tiny brain organoids in a lab to study how brain cancer spreads. normal hobby.",
    "i've been cooking since i was a kid, making meals for my sister and me while our parents were at work.",
    "if i couldn't do medicine, i'd 100% be a hibachi chef. cooking for people AND making them laugh? peak career.",
    "i dream of opening a coffee shop someday. the menu is already more planned than my residency applications.",
    "i built a free board-style practice test simulator for med students. it runs right in your browser.",
    "i've contributed to 6 published papers, mostly on finding brain tumor DNA in fluids like spinal fluid and blood.",
    "i made a page for Owensboro, KY that checks the weather forecast to show if the White Flag warming shelter is likely open tonight."
  ];

  var COFFEE = [
    "my official order is \"whatever keeps a third-year med student upright.\" when i open my coffee shop, the signature drink is called the 4 a.m. pre-round. it's just espresso. it's always just espresso.",
    "coffee is my love language. the coffee shop dream is real: cozy chairs, good music, and zero pagers allowed.",
    "i don't have a coffee problem. i have a coffee solution. (the coffee shop of my dreams will have a balloon animal tip jar.)"
  ];

  var HIBACHI = [
    "if medicine didn't work out, i'd 100% be a hibachi chef. flip a shrimp into your mouth AND make you laugh? that's the dream. the onion volcano is basically a patient education tool.",
    "hibachi chefs and doctors have a lot in common: sharp tools, steady hands, and a crowd watching. only one of them gets to throw shrimp, though."
  ];

  var SURPRISES = ["joke", "balloon", "fact", "fact", "joke"];

  // chips: label shown, text sent
  var CHIPS = [
    { label: "tell me a joke", q: "tell me a joke" },
    { label: "make me a balloon animal", q: "make me a balloon animal" },
    { label: "fun fact about you", q: "tell me a fun fact about you" },
    { label: "your kids' book?", q: "tell me about your kids' book" },
    { label: "what have you built?", q: "what coding projects have you built?" },
    { label: "coffee shop dream", q: "tell me about your coffee shop dream" },
    { label: "your research", q: "what research have you done?" },
    { label: "surprise me", q: "surprise me" },
    { label: "how do i reach you?", q: "how can i contact you?" }
  ];

  // same wording as the Worker; checked before anything else, never joked about
  var CRISIS_RE = /\b(kill(ing)? my ?self|suicid\w*|end (it all|my life)|hurt(ing)? my ?self|self[- ]?harm|cut(ting)? my ?self|want to die|wanna die|don'?t want to (live|be alive)|no reason to live|overdos\w*)\b/i;
  var EMERGENCY_RE = /\b(chest pain|heart attack|can'?t breathe|cannot breathe|trouble breathing|having a stroke|stroke symptoms|seizure|passed out|unconscious|bleeding (a lot|heavily|badly)|anaphyla\w*|choking)\b/i;

  function reply(text) {
    var raw = String(text || "");
    if (CRISIS_RE.test(raw)) return { parts: ["i'm really glad you said something, and i'm sorry you're going through this. please call or text 988 (the Suicide & Crisis Lifeline) right now; they're free, private, and there 24/7. if you're in immediate danger, call 911. you matter, and you don't have to handle this alone."], kind: "safety" };
    if (EMERGENCY_RE.test(raw)) return { parts: ["i'm a med student, not your doctor, so i can't give medical advice, but that could be serious. please call 911 (or your local emergency number) right now."], kind: "safety" };
    var t = " " + String(text || "").toLowerCase().replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ") + " ";
    var kind = null;
    if (/\b(joke|pun|make me laugh|something funny|be funny|knock knock|dad joke)\b/.test(t)) kind = "joke";
    else if (/\bballoon (animal|dog|giraffe|sword|flower)s?\b|\b(make|twist|blow) me (a|an|some) balloon|balloon animal/.test(t) && /\b(make|twist|blow|can you|give me|want|show)\b/.test(t)) kind = "balloon";
    else if (/\b(fun|random|cool|interesting|weird) fact\b|\bsomething (interesting|fun|cool) about you\b/.test(t)) kind = "fact";
    else if (/\bsurprise me\b|\bi'?m bored\b|\bentertain me\b/.test(t)) kind = pick(SURPRISES);
    else if (/\bcoffee (order|shop|dream)\b|\bfavorite coffee\b|\bhow do you take your coffee\b/.test(t)) kind = "coffee";
    else if (/\bhibachi\b/.test(t)) kind = "hibachi";
    if (!kind) return null;
    if (kind === "joke") { var j = fresh("joke", JOKES); return { parts: [j[0], j[1]], kind: kind }; }
    if (kind === "balloon") {
      return { parts: ["*squeak* *squeeeak* *twist* *twist*...", "ta-da! one balloon masterpiece for you: " + fresh("balloon", BALLOONS) + ". " + pick(BALLOON_TAGS)], kind: kind };
    }
    if (kind === "fact") return { parts: ["fun fact: " + fresh("fact", FACTS)], kind: kind };
    if (kind === "coffee") return { parts: [fresh("coffee", COFFEE)], kind: kind };
    return { parts: [fresh("hibachi", HIBACHI)], kind: kind };
  }

  // follow-up questions that fit what was just said (or the page the visitor is on)
  var TOPICS = [
    { re: /brave little immune|kids' book|children's book|childrensbook|neel/, chips: [
      { label: "where can i buy it?", q: "where can i buy your kids' book?" },
      { label: "why write a kids' book?", q: "why did you write a children's book about the immune system?" } ] },
    { re: /balloon/, chips: [
      { label: "make me one!", q: "make me a balloon animal" },
      { label: "where do you twist them?", q: "where have you made balloon animals for people?" } ] },
    { re: /koschmann|glioma|tumor dna|organoid|research|publication|paper|lab\b|koschmannlab|ddpcr/, chips: [
      { label: "your publications?", q: "what papers have you published?" },
      { label: "the organoid project?", q: "tell me about your brain organoid project" },
      { label: "explain it like i'm 5", q: "explain your brain tumor research like i'm 5" } ] },
    { re: /coffee/, chips: [
      { label: "coffee shop dream", q: "tell me about your coffee shop dream" } ] },
    { re: /cook|thai|khao soi|curry|hibachi|recipe/, chips: [
      { label: "what's in your cookbook?", q: "what recipes are in your cookbook?" },
      { label: "hibachi chef?", q: "would you really be a hibachi chef?" } ] },
    { re: /anki|simulator|coding|uworld|block-sim|codingprojects|extension/, chips: [
      { label: "what's AnkiMedRef?", q: "what is AnkiMedRef?" },
      { label: "the test simulator?", q: "what is your test simulator?" },
      { label: "anki face control?", q: "what is anki face control?" } ] },
    { re: /rock cancer|climb|rockcancer|belay/, chips: [
      { label: "what's Rock Cancer?", q: "what is rock cancer?" },
      { label: "how can i help?", q: "how can i get involved with rock cancer?" } ] },
    { re: /white flag|owensboro|shelter|whiteflag/, chips: [
      { label: "how does the page work?", q: "how does your white flag page work?" } ] },
    { re: /biodesign|atriflow|wearable|device/, chips: [
      { label: "what's ATriFlow?", q: "what is the atriflow device?" } ] },
    { re: /mircore|teach|high school|sequenc/, chips: [
      { label: "what's miRcore?", q: "what is miRcore?" } ] },
    { re: /japan|ishinomaki|tsunami/, chips: [
      { label: "the Japan trip?", q: "what did you do in ishinomaki, japan?" } ] },
    { re: /contact|email|reach|guestbook|note/, chips: [
      { label: "leave a note", q: "can i leave you a note?" } ] }
  ];

  function pickN(list, used, n, out) {
    var left = list.filter(function (c) { return used.indexOf(c.label) < 0 && !out.some(function (o) { return o.label === c.label; }); });
    while (out.length < n && left.length) out.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
  }

  function related(text) {
    var rel = [], ctx = String(text || "").toLowerCase();
    if (ctx) TOPICS.forEach(function (t) { if (t.re.test(ctx)) rel = rel.concat(t.chips); });
    return rel;
  }
  // reply: the last answer; page: the page path. Chips about the answer come first,
  // then chips about the page, then fun ones.
  function chips(used, n, reply, page) {
    used = used || []; n = n || 3;
    var out = [];
    pickN(related(reply), used, Math.min(2, n), out);
    if (!out.length) pickN(related(page), used, Math.min(2, n), out);
    pickN(CHIPS, used, n, out);
    if (out.length < n) pickN(CHIPS, [], n, out);   // everything tried: start over
    return out;
  }

  // a greeting that fits the page
  var PAGE_GREETS = [
    { re: /childrensbook/, text: "hey! you found my kids' book. ask me anything about it. spoiler: the immune cells win." },
    { re: /balloonanimals/, text: "welcome to the balloon zone. ask me anything, or say \"make me a balloon animal\" and i'll twist you one." },
    { re: /cookbook/, text: "hungry? ask me about any recipe here, or my backup career as a hibachi chef." },
    { re: /codingprojects/, text: "hi! ask me about any of these tools. yes, i built them between flashcards." },
    { re: /publications|koschmannlab/, text: "hi! ask me about my research. i promise to explain it without too many acronyms." },
    { re: /rockcancer/, text: "hey! ask me anything about Rock Cancer, the free climbing program i help with." },
    { re: /bluegrassbiodesign/, text: "hi! ask me about Bluegrass Biodesign and the device my team is working on." },
    { re: /guestbook/, text: "hi! leaving a note? ask me anything while you think of something nice to say." },
    { re: /contact/, text: "hi! the form above reaches the real me. in the meantime, ask me anything." }
  ];
  function greet(path) {
    path = String(path || "");
    for (var i = 0; i < PAGE_GREETS.length; i++) if (PAGE_GREETS[i].re.test(path)) return PAGE_GREETS[i].text;
    return null;
  }

  window.VJFun = { reply: reply, chips: chips, greet: greet };
})();
