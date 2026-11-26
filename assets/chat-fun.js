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

  function reply(text) {
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
      return { parts: ["*squeak* *squeeeak* *twist* *twist*...", "ta-da! for you: " + fresh("balloon", BALLOONS) + ". " + pick(BALLOON_TAGS)], kind: kind };
    }
    if (kind === "fact") return { parts: ["fun fact: " + fresh("fact", FACTS)], kind: kind };
    if (kind === "coffee") return { parts: [fresh("coffee", COFFEE)], kind: kind };
    return { parts: [fresh("hibachi", HIBACHI)], kind: kind };
  }

  function chips(used, n) {
    used = used || [];
    var left = CHIPS.filter(function (c) { return used.indexOf(c.label) < 0; });
    if (left.length < (n || 3)) left = CHIPS.slice();
    var out = [];
    while (out.length < (n || 3) && left.length) out.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
    return out;
  }

  window.VJFun = { reply: reply, chips: chips };
})();
