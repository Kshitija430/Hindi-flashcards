import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const ALL_CARDS = [
  // NUMBERS — with Devanagari numerals
  { id:1,front:"One (1)",back:"एक (१)",tl:"Ek",pron:"ehk — rhymes with 'check'",cat:"Numbers",hint:"Starts with the same sound as 'egg' — just one egg!",trick:"Klingt wie 'Eck' (Ecke) — eine Ecke = eins.",example:{hi:"एक सेब दो।",en:"Give one apple.",tl:"Ek seb do."} },
  { id:2,front:"Two (2)",back:"दो (२)",tl:"Do",pron:"doe — like a female deer",cat:"Numbers",hint:"Sounds like 'dough' — split the dough in half.",trick:"Klingt wie 'doh' — Do-ppel = zwei.",example:{hi:"दो केले लाओ।",en:"Bring two bananas.",tl:"Do kele lao."} },
  { id:3,front:"Three (3)",back:"तीन (३)",tl:"Teen",pron:"teen — like English 'teen'",cat:"Numbers",hint:"Think of the number in 'thir-___'.",trick:"'Tee in' drei Tassen — Teen = drei.",example:{hi:"तीन दिन बाद।",en:"After three days.",tl:"Teen din baad."} },
  { id:4,front:"Four (4)",back:"चार (४)",tl:"Chaar",pron:"chaar — 'ch' + rhymes with 'car'",cat:"Numbers",hint:"Rhymes with 'car' but starts with 'ch'. A ___ has four wheels.",trick:"Char hat 4 Buchstaben — Chaar = vier.",example:{hi:"चार लोग आए।",en:"Four people came.",tl:"Chaar log aaye."} },
  { id:5,front:"Five (5)",back:"पाँच (५)",tl:"Paanch",pron:"paanch — nasal 'n', like 'punch'",cat:"Numbers",hint:"Sounds like 'punch' — count the five fingers in your fist.",trick:"Klingt wie 'Punsch' — fünf Zutaten!",example:{hi:"पाँच मिनट रुको।",en:"Wait five minutes.",tl:"Paanch minute ruko."} },
  { id:6,front:"Six (6)",back:"छह (६)",tl:"Chhah",pron:"cheh — aspirated 'ch'",cat:"Numbers",hint:"A breathy 'ch' sound — like blowing air. Rhymes with 'the'.",trick:"Klingt wie 'Schach' — sechs Figuren-Typen.",example:{hi:"छह बजे आओ।",en:"Come at six o'clock.",tl:"Chhah baje aao."} },
  { id:7,front:"Seven (7)",back:"सात (७)",tl:"Saat",pron:"saat — rhymes with 'hot' + 's'",cat:"Numbers",hint:"German speakers: this word exists in your language too! (Seeds)",trick:"Wie 'Saat' (Samen) — gleiches Wort!",example:{hi:"सात दिन एक हफ़्ता।",en:"Seven days make a week.",tl:"Saat din ek hafta."} },
  { id:8,front:"Eight (8)",back:"आठ (८)",tl:"Aath",pron:"aath — like 'art' but with 'th'",cat:"Numbers",hint:"Almost identical to the German word for this number — just softer!",trick:"Klingt wie 'Acht' ohne 'ch'!",example:{hi:"आठ बजे नाश्ता।",en:"Breakfast at eight.",tl:"Aath baje naashta."} },
  { id:9,front:"Nine (9)",back:"नौ (९)",tl:"Nau",pron:"now — like English 'now'",cat:"Numbers",hint:"Sounds exactly like an English word meaning 'at this moment'.",trick:"'Nau' klingt wie 'neu'!",example:{hi:"नौ लोग हैं।",en:"There are nine people.",tl:"Nau log hain."} },
  { id:10,front:"Ten (10)",back:"दस (१०)",tl:"Das",pron:"thus — without the 'th'",cat:"Numbers",hint:"This word is also a German article! Think '___' ist zehn.",trick:"'Das' ist auch deutsch!",example:{hi:"दस मिनट और।",en:"Ten more minutes.",tl:"Das minute aur."} },

  // FAMILY & PEOPLE
  { id:11,front:"Father",back:"पिता",tl:"Pitaa",pron:"pi-TAA",cat:"Family & People",hint:"Think of a flat bread that starts with the same letters.",trick:"'Pita'-Brot — Vater bringt Pita mit.",example:{hi:"मेरे पिता अंदर हैं।",en:"My father is inside.",tl:"Mere pitaa andar hain."} },
  { id:12,front:"Sister",back:"बहन",tl:"Behen",pron:"beh-HEN — soft 'h'",cat:"Family & People",hint:"Sounds like a farm bird — but with 'b' at the start.",trick:"'Behen' — Schwester bahnt den Weg.",example:{hi:"मेरी बहन जवान है।",en:"My sister is young.",tl:"Meri behen javaan hai."} },
  { id:13,front:"Relative",back:"रिश्तेदार",tl:"Rishtedaar",pron:"rish-tay-DAAR",cat:"Family & People",hint:"'Rishta' means relationship. Add '-daar' (keeper) to it.",trick:"Verwandte reichen die Hand.",example:{hi:"मेरे रिश्तेदार हैम्बर्ग में हैं।",en:"My relatives are in Hamburg.",tl:"Mere rishtedaar Hamburg mein hain."} },
  { id:14,front:"Neighbour",back:"पड़ोसी",tl:"Padosi",pron:"pa-ROH-see",cat:"Family & People",hint:"Sounds like 'paradise' — the person next door.",trick:"'Paradiso' nebenan.",example:{hi:"हमारे पड़ोसी अच्छे हैं।",en:"Our neighbours are nice.",tl:"Hamare padosi acche hain."} },
  { id:15,front:"Guest",back:"मेहमान",tl:"Mehmaan",pron:"meh-MAAN",cat:"Family & People",hint:"'More' + 'man' — more people visiting!",trick:"'Mehr Mann' kommt zu Besuch!",example:{hi:"मेहमान आ रहे हैं।",en:"Guests are coming.",tl:"Mehmaan aa rahe hain."} },
  { id:16,front:"Man",back:"आदमी",tl:"Aadmi",pron:"AAD-mee",cat:"Family & People",hint:"Think of the first man in many traditions — starts with 'A'.",trick:"Wie 'Adam' + i.",example:{hi:"वह एक अच्छा आदमी है।",en:"He is a good man.",tl:"Woh ek accha aadmi hai."} },
  { id:17,front:"Anybody",back:"कोई भी",tl:"Koi bhi",pron:"KOY bhee",cat:"Family & People",hint:"First word sounds like a colorful fish. Second word = 'also'.",trick:"'Koi' (Fisch) — jeder Koi.",example:{hi:"कोई भी आ सकता है।",en:"Anybody can come.",tl:"Koi bhi aa sakta hai."} },
  { id:109,front:"Customer",back:"ग्राहक",tl:"Graahak",pron:"GRAA-hak",cat:"Family & People",hint:"Starts with 'graa' — they grab at deals!",trick:"Kunde hackt nach Angeboten!",example:{hi:"ग्राहक हमेशा सही है।",en:"The customer is always right.",tl:"Graahak hamesha sahi hai."} },
  { id:120,front:"Person",back:"व्यक्ति / इंसान",tl:"Vyakti / Insaan",pron:"VYUK-ti / in-SAAN",cat:"Family & People",hint:"'Insaan' sounds like 'in-sane' — every person is a little unique!",trick:"'Insaan' — klingt wie 'in sane' — jeder Mensch ist einzigartig!",example:{hi:"हर इंसान अलग है।",en:"Every person is different.",tl:"Har insaan alag hai."} },
  { id:121,front:"Partner",back:"साथी",tl:"Saathi",pron:"SAA-thee",cat:"Family & People",hint:"Related to 'saath' (with) — someone who is WITH you.",trick:"'Saathi' — von 'Saath' (mit) — der Mit-Mensch!",example:{hi:"मेरा साथी ठीक है।",en:"My partner is fine.",tl:"Mera saathi theek hai."} },

  // BODY PARTS
  { id:18,front:"Hand",back:"हाथ",tl:"Haath",pron:"haath — like 'heart' with 'th'",cat:"Body Parts",hint:"Sounds like you're reaching for your 'heart' — but it's your ___.",trick:"'Haath' wie 'hat' — Hand hat fünf Finger.",example:{hi:"हाथ साफ़ करो।",en:"Clean your hands.",tl:"Haath saaf karo."} },
  { id:19,front:"Head",back:"सिर",tl:"Sir",pron:"sir — like English 'sir'",cat:"Body Parts",hint:"How you address a man of authority — he leads with his ___.",trick:"'Sir' — Krone auf dem Kopf!",example:{hi:"मेरा सिर दुखता है।",en:"My head hurts.",tl:"Mera sir dukhta hai."} },
  { id:20,front:"Ear",back:"कान",tl:"Kaan",pron:"kaan — like 'con' with long 'aa'",cat:"Body Parts",hint:"Sounds like a boat (Kahn) — shaped like one too!",trick:"'Kahn' — Ohr hat die Form eines Kahns!",example:{hi:"कान से सुनो।",en:"Listen with your ears.",tl:"Kaan se suno."} },
  { id:98,front:"Foot",back:"पैर",tl:"Pair",pron:"pair — like English 'pair'",cat:"Body Parts",hint:"Exactly like an English word meaning 'two of something' — you have a ___ of them!",trick:"'Paar' — ein Paar Füße!",example:{hi:"पैर मत हिलाओ।",en:"Don't shake your foot.",tl:"Pair mat hilao."} },
  { id:122,front:"Tongue",back:"जीभ",tl:"Jeebh",pron:"JEEBH — soft 'bh'",cat:"Body Parts",hint:"Starts with 'jee' — your ___ helps you say 'ji' (yes, sir)!",trick:"'Jeebh' — klingt wie 'Jiep' — die Zunge fährt wie ein Jeep!",example:{hi:"जीभ मत दिखाओ।",en:"Don't show your tongue.",tl:"Jeebh mat dikhao."} },

  // NATURE & WEATHER
  { id:21,front:"Rain",back:"बारिश",tl:"Baarish",pron:"BAA-rish",cat:"Nature & Weather",hint:"Starts with 'baa' like a sheep — sheep get caught in the ___!",trick:"'Baarish' — barsch wenn es regnet.",example:{hi:"बारिश हो रही है।",en:"It is raining.",tl:"Baarish ho rahi hai."} },
  { id:22,front:"Wind",back:"हवा",tl:"Havaa",pron:"ha-VAA",cat:"Nature & Weather",hint:"Think of a tropical island starting with 'H' where the ___ blows.",trick:"'Hawaii' wo der Wind weht!",example:{hi:"आज हवा तेज़ है।",en:"The wind is strong today.",tl:"Aaj havaa tez hai."} },
  { id:23,front:"River",back:"नदी",tl:"Nadi",pron:"na-DEE",cat:"Nature & Weather",hint:"A girl's name 'Nadia' comes from this word.",trick:"'Nadel' fließt durch Stoff.",example:{hi:"नदी पास है।",en:"The river is near.",tl:"Nadi paas hai."} },
  { id:24,front:"Ocean",back:"समुद्र",tl:"Samudra",pron:"sa-MOOD-ra",cat:"Nature & Weather",hint:"The ___ puts you in a good mood!",trick:"'So viel Mud' gibt's nur im Ozean!",example:{hi:"समुद्र बहुत सुन्दर है।",en:"The ocean is very beautiful.",tl:"Samudra bahut sundar hai."} },
  { id:25,front:"Rose",back:"गुलाब",tl:"Gulaab",pron:"goo-LAAB",cat:"Nature & Weather",hint:"A famous Indian dessert ball is named after this flower.",trick:"'Guck mal Lab!' — Rose im Labor!",example:{hi:"गुलाब का रंग लाल है।",en:"The rose's colour is red.",tl:"Gulaab ka rang laal hai."} },
  { id:26,front:"Weather",back:"मौसम",tl:"Mausam",pron:"MOW-sam",cat:"Nature & Weather",hint:"Sounds like a small animal that watches from the window.",trick:"'Maus am' Fenster beobachtet Wetter.",example:{hi:"आज मौसम अच्छा है।",en:"Today the weather is nice.",tl:"Aaj mausam accha hai."} },
  { id:27,front:"World",back:"दुनिया",tl:"Duniya",pron:"doo-nee-YAA",cat:"Nature & Weather",hint:"Sandy hills (d___s) exist all over the ___.",trick:"'Düne, ja!' — Dünen überall.",example:{hi:"दुनिया बड़ी है।",en:"The world is big.",tl:"Duniya badi hai."} },
  { id:123,front:"Forest",back:"जंगल",tl:"Jungle",pron:"JUN-gul",cat:"Nature & Weather",hint:"This Hindi word became an English word — you already know it!",trick:"'Jungle' — gleiches Wort auf Englisch! Das Wort kommt aus dem Hindi!",example:{hi:"जंगल में हवा ठंडी है।",en:"The wind is cold in the forest.",tl:"Jungle mein havaa thandi hai."} },

  // COLORS
  { id:28,front:"Colour",back:"रंग",tl:"Rang",pron:"rung — like 'rung' of a ladder",cat:"Colors",hint:"Sounds like a step on a ladder — each step a different shade.",trick:"'Rang' — Farben haben einen Rang!",example:{hi:"तुम्हारा रंग कौन सा है?",en:"What is your colour?",tl:"Tumhara rang kaun sa hai?"} },
  { id:29,front:"White",back:"सफ़ेद",tl:"Safed",pron:"sa-FEYD",cat:"Colors",hint:"Starts like the word 'safe' — a ___ flag means safety.",trick:"'Safe' — weiße Flagge = sicher!",example:{hi:"दूध सफ़ेद है।",en:"Milk is white.",tl:"Doodh safed hai."} },
  { id:30,front:"Orange",back:"नारंगी",tl:"Naarangi",pron:"naa-RAN-gee",cat:"Colors",hint:"The word 'rang' (colour) is hidden inside this word!",trick:"'Na, Rangi?' — ist die Orange farbig?",example:{hi:"नारंगी रंग सुन्दर है।",en:"Orange colour is beautiful.",tl:"Naarangi rang sundar hai."} },
  { id:31,front:"Brown",back:"भूरा",tl:"Bhura",pron:"BHOO-raa — aspirated 'bh'",cat:"Colors",hint:"Sounds like 'boo-rah' — old castles are this colour.",trick:"'Bura' (Burg) — alte Burgen sind braun.",example:{hi:"ज़मीन भूरी है।",en:"The ground is brown.",tl:"Zameen bhuri hai."} },

  // FOOD & HOME
  { id:32,front:"Sugar",back:"चीनी",tl:"Cheeni",pron:"CHEE-nee",cat:"Food & Home",hint:"Also the Hindi word for 'Chinese' — the connection is historical!",trick:"Zucker kam aus China!",example:{hi:"चाय में चीनी डालो।",en:"Put sugar in the tea.",tl:"Chai mein cheeni daalo."} },
  { id:33,front:"Food",back:"खाना",tl:"Khaana",pron:"KHAA-naa — guttural 'kh'",cat:"Food & Home",hint:"The guttural sound at the start mimics chewing!",trick:"'Kahn-a' — im Kahn isst man.",example:{hi:"खाना तैयार है।",en:"The food is ready.",tl:"Khaana taiyaar hai."} },
  { id:34,front:"Fruits",back:"फल",tl:"Phal",pron:"full — aspirated 'ph'",cat:"Food & Home",hint:"Sounds like what happens in autumn — they ___ from trees.",trick:"'Phal' wie 'Fall'!",example:{hi:"फल ताज़ा है।",en:"The fruits are fresh.",tl:"Phal taaza hai."} },
  { id:35,front:"Knife",back:"छुरी / चाकू",tl:"Chhuri / Chaaku",pron:"CHHOO-ree / CHAA-koo",cat:"Food & Home",hint:"Both start with 'ch' — first is for kitchen, second for bigger blades.",trick:"'Chhuri' — Kurier bringt das Messer!",example:{hi:"चाकू पास में है।",en:"The knife is nearby.",tl:"Chaaku paas mein hai."} },
  { id:36,front:"Curtain",back:"पर्दा",tl:"Parda",pron:"PAR-daa",cat:"Food & Home",hint:"Starts like 'pardon' — excuse me while I draw the ___!",trick:"'Pardon' — der Vorhang geht auf!",example:{hi:"पर्दा बंद करो।",en:"Close the curtain.",tl:"Parda band karo."} },
  { id:37,front:"Wall",back:"दीवार",tl:"Deevaar",pron:"dee-VAAR",cat:"Food & Home",hint:"Contains 'vaar' — the truth (Wahrheit) is written on the ___.",trick:"'Die Wahr(heit)' steht an der Wand.",example:{hi:"दीवार सफ़ेद है।",en:"The wall is white.",tl:"Deevaar safed hai."} },
  { id:38,front:"Car",back:"गाड़ी",tl:"Gaadi",pron:"GAA-dee",cat:"Food & Home",hint:"Starts with 'gaa' — let's GO by ___!",trick:"'Geh die' Straße entlang.",example:{hi:"गाड़ी बाहर है।",en:"The car is outside.",tl:"Gaadi baahar hai."} },
  { id:99,front:"Apple",back:"सेब",tl:"Seb",pron:"sayb",cat:"Food & Home",hint:"Sounds like 'sieve' — press them through a ___ for juice.",trick:"'Sieb' — Äpfel für Saft!",example:{hi:"एक सेब खाओ।",en:"Eat an apple.",tl:"Ek seb khao."} },
  { id:100,front:"Vegetable",back:"सब्ज़ी",tl:"Sabzi",pron:"SUB-zee",cat:"Food & Home",hint:"Sounds like 'sub' — a veggie submarine sandwich!",trick:"'Sabzi' — Gemüse als Sub!",example:{hi:"ताज़ी सब्ज़ी लाओ।",en:"Bring fresh vegetables.",tl:"Taazi sabzi lao."} },
  { id:101,front:"Banana",back:"केला",tl:"Kelaa",pron:"KAY-laa",cat:"Food & Home",hint:"Sounds like 'cellar' — they ripen in cool, dark places.",trick:"'Keller' — Bananen reifen im Keller!",example:{hi:"केला पीला है।",en:"The banana is yellow.",tl:"Kelaa peela hai."} },
  { id:112,front:"Egg",back:"अंडा",tl:"Andaa",pron:"UN-daa",cat:"Food & Home",hint:"Starts like 'under' — found ___ a chicken!",trick:"'Anders' — ein Ei ist anders!",example:{hi:"अंडा पकाओ।",en:"Cook the egg.",tl:"Andaa pakao."} },
  { id:113,front:"Mirror",back:"शीशा",tl:"Sheeshaa",pron:"SHEE-shaa",cat:"Food & Home",hint:"Sounds like a hookah pipe — both are made of glass.",trick:"'Shisha' — spiegelt Licht!",example:{hi:"शीशा साफ़ करो।",en:"Clean the mirror.",tl:"Sheeshaa saaf karo."} },
  { id:115,front:"Breakfast",back:"नाश्ता",tl:"Naashta",pron:"NAASH-taa",cat:"Food & Home",hint:"'Naash' sounds like 'naschen' (German: to snack) — morning snacking!",trick:"'Nascht-a' — morgens naschen!",example:{hi:"नाश्ता तैयार है।",en:"Breakfast is ready.",tl:"Naashta taiyaar hai."} },
  { id:124,front:"Bell",back:"घंटी",tl:"Ghanti",pron:"GHUN-tee",cat:"Food & Home",hint:"Starts with a guttural 'gh' — the vibration sounds like a ___!",trick:"'Ghanti' — klingt wie 'Gong-ti' — Gong + Glocke!",example:{hi:"घंटी बज रही है।",en:"The bell is ringing.",tl:"Ghanti baj rahi hai."} },
  { id:125,front:"Electricity",back:"बिजली",tl:"Bijli",pron:"BIJ-lee",cat:"Food & Home",hint:"'Bij' sounds like a zapping spark — zzzt!",trick:"'Bijli' — klingt wie 'Bis-li(cht)' — bis das Licht kommt!",example:{hi:"बिजली नहीं है।",en:"There is no electricity.",tl:"Bijli nahin hai."} },

  // PLACES
  { id:39,front:"City",back:"शहर",tl:"Sheher",pron:"sheh-HER",cat:"Places",hint:"'She' is 'here' — she's ___ in the big town!",trick:"'Schere' — scharf und lebendig.",example:{hi:"शहर बड़ा है।",en:"The city is big.",tl:"Sheher bada hai."} },
  { id:40,front:"Village",back:"गाँव",tl:"Gaanv",pron:"gaanv — nasal",cat:"Places",hint:"Sounds like 'ganz' (German: whole) — one whole little ___.",trick:"'Ganz' — ganzes kleines Dorf.",example:{hi:"गाँव पास है।",en:"The village is near.",tl:"Gaanv paas hai."} },
  { id:41,front:"Inside",back:"अंदर",tl:"Andar",pron:"UN-dar",cat:"Places",hint:"Sounds like 'under' — go ___ and under the roof!",trick:"'Anders' — drinnen ist es anders!",example:{hi:"अंदर आओ।",en:"Come inside.",tl:"Andar aao."} },
  { id:42,front:"Outside",back:"बाहर",tl:"Baahar",pron:"BAA-har",cat:"Places",hint:"Starts with 'baa' — the sheep goes ___ to the field.",trick:"'Bahre' — steht draußen.",example:{hi:"बाहर जाओ।",en:"Go outside.",tl:"Baahar jao."} },
  { id:43,front:"Near",back:"पास",tl:"Paas",pron:"paas — like 'pass'",cat:"Places",hint:"Like a mountain 'pass' — it's close by!",trick:"'Pass' — der Gebirgspass ist nah!",example:{hi:"बाज़ार पास है।",en:"The market is near.",tl:"Bazaar paas hai."} },

  // TIME
  { id:44,front:"Month",back:"महीना",tl:"Maheena",pron:"ma-HEE-naa",cat:"Time",hint:"Contains 'hee-na' — like a machine that cycles every ___.",trick:"'Maschine-a' — dreht sich.",example:{hi:"एक महीना बाद।",en:"After one month.",tl:"Ek maheena baad."} },
  { id:45,front:"December",back:"दिसंबर",tl:"Disambar",pron:"di-SUM-bar",cat:"Time",hint:"Almost identical pronunciation — just say it a bit differently!",trick:"'Disambar' ≈ 'Dezember'!",example:{hi:"दिसंबर में सर्दी है।",en:"It's cold in December.",tl:"Disambar mein sardi hai."} },
  { id:46,front:"Date",back:"तारीख़",tl:"Taareekh",pron:"taa-REEKH",cat:"Time",hint:"Sounds like a person's name — ask them for the ___!",trick:"Frag Tarik nach dem Datum!",example:{hi:"आज की तारीख़ क्या है?",en:"What is today's date?",tl:"Aaj ki taareekh kya hai?"} },
  { id:47,front:"Day",back:"दिन",tl:"Din",pron:"din — like English 'din'",cat:"Time",hint:"Like the English word for 'noise' — every ___ has its own sounds.",trick:"'Ding' ohne g.",example:{hi:"आज का दिन अच्छा है।",en:"Today is a good day.",tl:"Aaj ka din accha hai."} },
  { id:48,front:"Birthday",back:"जन्मदिन",tl:"Janamdin",pron:"ja-NAM-din",cat:"Time",hint:"Two words you know: birth (janam) + day (din). Like German Geburts+tag!",trick:"Janam + din — wie 'Geburts-tag'!",example:{hi:"जन्मदिन मुबारक!",en:"Happy birthday!",tl:"Janamdin mubarak!"} },
  { id:49,front:"Often",back:"अक्सर",tl:"Aksar",pron:"UK-sar",cat:"Time",hint:"Starts like 'UK' — I ___ hear a British accent there.",trick:"'Akzent' — oft einen Akzent.",example:{hi:"मैं अक्सर यहाँ आता हूँ।",en:"I often come here.",tl:"Main aksar yahan aata hoon."} },
  { id:50,front:"Always",back:"हमेशा",tl:"Hamesha",pron:"ha-MAY-sha",cat:"Time",hint:"Ha! My sha(tz) — I'll love you ___!",trick:"'Ha, Me, Sha(tz)!' — immer!",example:{hi:"मैं हमेशा तुम्हारे साथ हूँ।",en:"I am always with you.",tl:"Main hamesha tumhare saath hoon."} },
  { id:102,front:"Later",back:"बाद में",tl:"Baad mein",pron:"baad mayn",cat:"Time",hint:"'Baad' sounds like 'bath' — I'll take a bath ___.",trick:"'Bad' — später ins Bad!",example:{hi:"बाद में बात करते हैं।",en:"Let's talk later.",tl:"Baad mein baat karte hain."} },
  { id:103,front:"Immediately",back:"तुरंत",tl:"Turant",pron:"too-RUNT",cat:"Time",hint:"Sounds like 'to-rant' — when someone rants, they want it NOW!",trick:"'Turnen, rannt' — sofort!",example:{hi:"तुरंत आओ!",en:"Come immediately!",tl:"Turant aao!"} },

  // EMOTIONS
  { id:51,front:"Happiness",back:"ख़ुशी",tl:"Khushi",pron:"KHOO-shee",cat:"Emotions",hint:"Sounds like 'cushy' — a cushy life brings ___!",trick:"'Kuschel-i' — Kuscheln = glücklich!",example:{hi:"ख़ुशी बड़ी चीज़ है।",en:"Happiness is a big thing.",tl:"Khushi badi cheez hai."} },
  { id:52,front:"Anger",back:"गुस्सा",tl:"Gussa",pron:"GOOS-saa",cat:"Emotions",hint:"Like a 'gust' of emotion — it blows out suddenly!",trick:"'Guss' — Wutausbruch wie Regenguss!",example:{hi:"गुस्सा मत करो।",en:"Don't be angry.",tl:"Gussa mat karo."} },
  { id:53,front:"Dream",back:"सपना",tl:"Sapna",pron:"SUP-naa",cat:"Emotions",hint:"Sounds like 'sauna' — you drift off and ___ in a warm sauna.",trick:"'Sauna' — man träumt schön.",example:{hi:"मेरा सपना बड़ा है।",en:"My dream is big.",tl:"Mera sapna bada hai."} },
  { id:54,front:"Fun",back:"मज़ा",tl:"Mazaa",pron:"ma-ZAA",cat:"Emotions",hint:"Sounds like 'matza' — flat bread baking party!",trick:"'Matza' — backen macht Spaß!",example:{hi:"बहुत मज़ा आया!",en:"It was so much fun!",tl:"Bahut mazaa aaya!"} },
  { id:55,front:"Health",back:"सेहत",tl:"Sehat",pron:"SEH-hat",cat:"Emotions",hint:"'Seh-hat' — who can SEE well, HAS good ___.",trick:"'Seh hat' — gesund!",example:{hi:"सेहत का ध्यान रखो।",en:"Take care of your health.",tl:"Sehat ka dhyaan rakho."} },
  { id:126,front:"Worries",back:"चिंता",tl:"Chintaa",pron:"CHIN-taa",cat:"Emotions",hint:"Sounds like you're 'chin-deep in ta-rouble' — full of ___!",trick:"'Chintaa' — 'Chin-ta(uchen)' — bis zum Kinn in Sorgen!",example:{hi:"चिंता मत करो।",en:"Don't worry.",tl:"Chintaa mat karo."} },

  // ADJECTIVES
  { id:56,front:"Different",back:"अलग",tl:"Alag",pron:"a-LUG",cat:"Adjectives",hint:"Sounds like 'a-lag' — there's a lag because it's not the same!",trick:"'Alltag' — jeder Alltag ist anders.",example:{hi:"यह अलग है।",en:"This is different.",tl:"Yeh alag hai."} },
  { id:57,front:"Polite",back:"विनम्र",tl:"Vinamra",pron:"vi-NUM-ra",cat:"Adjectives",hint:"Starts with 'vi' (very) + 'namra' (bowing) — very respectful.",trick:"'Fein-Ammer' — höfliche Ammer.",example:{hi:"विनम्र रहो।",en:"Be polite.",tl:"Vinamra raho."} },
  { id:58,front:"Honest",back:"ईमानदार",tl:"Imaandaar",pron:"ee-MAAN-daar",cat:"Adjectives",hint:"'Imaan' (faith) + 'daar' (keeper). A faith-keeper is ___.",trick:"Der Imam ist ehrlich!",example:{hi:"ईमानदार आदमी अच्छा है।",en:"An honest man is good.",tl:"Imaandaar aadmi accha hai."} },
  { id:59,front:"Fast",back:"तेज़ / जल्दी",tl:"Tez / Jaldi",pron:"tayz / JUL-dee",cat:"Adjectives",hint:"First word rhymes with 'days'. Second one: 'Hurry up!' = '___ karo!'",trick:"'Tess rennt schnell'. 'Jaldi' — beeile dich!",example:{hi:"जल्दी करो!",en:"Hurry up!",tl:"Jaldi karo!"} },
  { id:60,front:"Cheap",back:"सस्ता",tl:"Sasta",pron:"SUS-taa",cat:"Adjectives",hint:"Rhymes with 'pasta' — budget pasta is ___!",trick:"'Pasta' — billige Pasta!",example:{hi:"यह बहुत सस्ता है।",en:"This is very cheap.",tl:"Yeh bahut sasta hai."} },
  { id:61,front:"Clean",back:"साफ़",tl:"Saaf",pron:"saaf",cat:"Adjectives",hint:"Sounds like German 'Saft' (juice) — fresh, ___ juice.",trick:"'Saft' — sauberer Saft!",example:{hi:"घर साफ़ है।",en:"The house is clean.",tl:"Ghar saaf hai."} },
  { id:62,front:"Dry",back:"सूखा",tl:"Sookha",pron:"SOO-khaa",cat:"Adjectives",hint:"Starts like 'sue' — searching for ___ land.",trick:"'Suche' — trockenes Land.",example:{hi:"कपड़े सूखे हैं।",en:"The clothes are dry.",tl:"Kapde sookhe hain."} },
  { id:63,front:"Wet",back:"गीला",tl:"Geela",pron:"GEE-laa",cat:"Adjectives",hint:"Like 'gelato' — it melts and gets everything ___!",trick:"'Gelato' — schmilzt!",example:{hi:"बारिश में सब गीला है।",en:"Everything is wet in the rain.",tl:"Baarish mein sab geela hai."} },
  { id:64,front:"Easy",back:"आसान",tl:"Aasaan",pron:"aa-SAAN",cat:"Adjectives",hint:"Starts with 'aah' — a sigh of relief because it's ___!",trick:"'Ah, so angenehm!' — leicht!",example:{hi:"हिंदी आसान है।",en:"Hindi is easy.",tl:"Hindi aasaan hai."} },
  { id:65,front:"Difficult",back:"मुश्किल",tl:"Mushkil",pron:"MUSH-kil",cat:"Adjectives",hint:"Like opening a 'mussel' — prying it apart is ___!",trick:"'Muschel' — schwer zu öffnen!",example:{hi:"यह बहुत मुश्किल है।",en:"This is very difficult.",tl:"Yeh bahut mushkil hai."} },
  { id:66,front:"Bad",back:"बुरा",tl:"Buraa",pron:"boo-RAA",cat:"Adjectives",hint:"'Boo!' — the crowd boos when something is ___!",trick:"'Buhrufe' sind schlecht!",example:{hi:"बुरा मत मानो।",en:"Don't feel bad.",tl:"Buraa mat maano."} },
  { id:67,front:"Interesting",back:"दिलचस्प",tl:"Dilchasp",pron:"dil-CHUSP",cat:"Adjectives",hint:"'Dil' means heart — something that grips your heart is ___.",trick:"Sticks to heart!",example:{hi:"यह बहुत दिलचस्प है।",en:"This is very interesting.",tl:"Yeh bahut dilchasp hai."} },
  { id:68,front:"Enough",back:"काफ़ी / बस",tl:"Kaafi / Bas",pron:"KAA-fee / bus",cat:"Adjectives",hint:"First sounds like a hot drink. Second like a vehicle that stops!",trick:"'Kaffee' genug! 'Bus' — Stopp!",example:{hi:"बस! काफ़ी है।",en:"Stop! That's enough.",tl:"Bas! Kaafi hai."} },
  { id:104,front:"Young",back:"जवान",tl:"Javaan",pron:"ja-VAAN",cat:"Adjectives",hint:"Sounds like a programming language — ___ people learn it fast!",trick:"'Java-n' — junge Leute!",example:{hi:"वह अभी जवान है।",en:"He/she is still young.",tl:"Woh abhi javaan hai."} },
  { id:111,front:"Cold",back:"सर्दी",tl:"Sardi",pron:"SAR-dee",cat:"Adjectives",hint:"Sounds like a small fish that lives in ___ water.",trick:"'Sardine' — kaltes Wasser!",example:{hi:"आज बहुत सर्दी है।",en:"It is very cold today.",tl:"Aaj bahut sardi hai."} },
  { id:127,front:"Wrong",back:"ग़लत",tl:"Galat",pron:"ga-LUT",cat:"Adjectives",hint:"Sounds like 'galoot' — a clumsy galoot always gets it ___!",trick:"'Galat' — klingt wie 'Galopp' — im Galopp macht man Fehler!",example:{hi:"यह ग़लत है।",en:"This is wrong.",tl:"Yeh galat hai."} },
  { id:128,front:"Empty",back:"ख़ाली",tl:"Khaali",pron:"KHAA-lee",cat:"Adjectives",hint:"Starts with a guttural 'kh' — sounds hollow and ___!",trick:"'Khaali' — klingt wie 'kahl' — ein kahler Raum ist leer!",example:{hi:"गिलास ख़ाली है।",en:"The glass is empty.",tl:"Gilaas khaali hai."} },

  // VERBS
  { id:69,front:"To speak",back:"बोलना",tl:"Bolnaa",pron:"BOWL-naa",cat:"Verbs",hint:"Sounds like the sport with pins — people shout while ___!",trick:"'Bowling' — laut!",example:{hi:"हिंदी बोलो।",en:"Speak Hindi.",tl:"Hindi bolo."} },
  { id:70,front:"To learn",back:"सीखना",tl:"Seekhna",pron:"SEEKH-naa",cat:"Verbs",hint:"Starts like 'seek' — seek knowledge = ___!",trick:"Von den Sikhs lernt man!",example:{hi:"हिंदी सीखो।",en:"Learn Hindi.",tl:"Hindi seekho."} },
  { id:71,front:"To walk",back:"चलना",tl:"Chalnaa",pron:"CHUL-naa",cat:"Verbs",hint:"'Chal!' is a common command — like 'Let's go!'",trick:"'Schall' — Gehen macht Schall!",example:{hi:"चलो, बाहर चलते हैं।",en:"Let's go outside.",tl:"Chalo, baahar chalte hain."} },
  { id:72,front:"To read",back:"पढ़ना",tl:"Padhna",pron:"PUDH-naa",cat:"Verbs",hint:"Sounds like a tablet device — you ___ on a pad!",trick:"'Pad' — liest man!",example:{hi:"किताब पढ़ो।",en:"Read the book.",tl:"Kitaab padho."} },
  { id:73,front:"To ask",back:"पूछना",tl:"Poochhnaa",pron:"POOCHH-naa",cat:"Verbs",hint:"'Pooch' sounds like a dog — they always ___ for treats!",trick:"'Putsch-na' — jeder fragt.",example:{hi:"पूछो, क्या चाहिए?",en:"Ask, what do you need?",tl:"Poochho, kya chahiye?"} },
  { id:74,front:"To start",back:"शुरू करना",tl:"Shuru karnaa",pron:"shoo-ROO kar-NAA",cat:"Verbs",hint:"'Shoo!' — shoo yourself into action, ___ now!",trick:"'Schuh-Ruh' — Schuhe an!",example:{hi:"शुरू करो!",en:"Start!",tl:"Shuru karo!"} },
  { id:105,front:"To understand",back:"समझना",tl:"Samajhna",pron:"sa-MUJH-naa",cat:"Verbs",hint:"'Sam-ajh' — Sam says 'Ah-ha!' when he finally ___s!",trick:"'Sam, Ach ja!' — versteht!",example:{hi:"समझ आया?",en:"Did you understand?",tl:"Samajh aaya?"} },
  { id:114,front:"To sit",back:"बैठना",tl:"Baithna",pron:"BAITH-naa",cat:"Verbs",hint:"'Baith' sounds like 'byte' — ___ down at your computer.",trick:"'Byte-na' — sitz!",example:{hi:"यहाँ बैठो।",en:"Sit here.",tl:"Yahan baitho."} },

  // COMMON WORDS
  { id:75,front:"Message",back:"संदेश",tl:"Sandesh",pron:"sun-DAYSH",cat:"Common Words",hint:"A ___ written in the sand — 'sand-esh'.",trick:"'Sand-Esche' — im Sand.",example:{hi:"संदेश भेजो।",en:"Send a message.",tl:"Sandesh bhejo."} },
  { id:76,front:"Answer",back:"जवाब",tl:"Javaab",pron:"ja-VAAB",cat:"Common Words",hint:"Starts with 'ja' (yes!) — the first part of every ___!",trick:"'Ja, waab!'",example:{hi:"जवाब दो।",en:"Give an answer.",tl:"Javaab do."} },
  { id:77,front:"Maybe",back:"शायद",tl:"Shaayad",pron:"SHAA-yad",cat:"Common Words",hint:"Sounds like 'Schade' (German: pity) — ___, next time.",trick:"'Schade' — vielleicht!",example:{hi:"शायद कल।",en:"Maybe tomorrow.",tl:"Shaayad kal."} },
  { id:80,front:"Or",back:"या",tl:"Ya",pron:"yaa",cat:"Common Words",hint:"Just one syllable — sounds like 'yeah?' as a question.",trick:"'Ja' — ja oder nein?",example:{hi:"चाय या कॉफ़ी?",en:"Tea or coffee?",tl:"Chai ya coffee?"} },
  { id:81,front:"Both",back:"दोनों",tl:"Donon",pron:"DOH-non",cat:"Common Words",hint:"Starts like 'do' (two) — because ___ means two things together.",trick:"'Donner' — doppelt!",example:{hi:"दोनों अच्छे हैं।",en:"Both are good.",tl:"Donon acche hain."} },
  { id:82,front:"With",back:"के साथ",tl:"Ke saath",pron:"kay SAATH",cat:"Common Words",hint:"'Saath' sounds like 'Saat' (seed) — plant seeds together, ___ friends.",trick:"'Saat' — zusammen.",example:{hi:"मेरे साथ चलो।",en:"Come with me.",tl:"Mere saath chalo."} },
  { id:83,front:"For",back:"के लिए",tl:"Ke liye",pron:"kay LEE-yay",cat:"Common Words",hint:"'Ke liye' — 'K, leave it ___ me!'",trick:"'Kelly, eh' — für Kelly!",example:{hi:"यह मेरे लिए है।",en:"This is for me.",tl:"Yeh mere liye hai."} },
  { id:84,front:"Too / Also",back:"भी",tl:"Bhi",pron:"bhee",cat:"Common Words",hint:"One tiny word — sounds like a buzzing insect that wants some ___!",trick:"'Biene' — will auch!",example:{hi:"मैं भी चलता हूँ।",en:"I'll come too.",tl:"Main bhi chalta hoon."} },
  { id:85,front:"Right (correct)",back:"सही",tl:"Sahi",pron:"sa-HEE",cat:"Common Words",hint:"Sounds like 'Sahne' (cream) — cream is always the ___ choice!",trick:"'Sahne' — richtige Wahl!",example:{hi:"बिल्कुल सही!",en:"Absolutely right!",tl:"Bilkul sahi!"} },
  { id:79,front:"That's why",back:"इसलिए",tl:"Isliye",pron:"ISS-lee-yay",cat:"Common Words",hint:"'Iss-liye' — eat (iss) it, ___ it's there!",trick:"'Iss lieber' — deshalb!",example:{hi:"बारिश है, इसलिए अंदर रहो।",en:"It's raining, that's why stay inside.",tl:"Baarish hai, isliye andar raho."} },
  { id:106,front:"More",back:"और / ज़्यादा",tl:"Aur / Zyaada",pron:"OWR / zyaa-DAA",cat:"Common Words",hint:"First word sounds like 'ear' (Ohr) — I want ___ ears to listen!",trick:"'Ohr' — mehr Ohren!",example:{hi:"और चाहिए?",en:"Want more?",tl:"Aur chahiye?"} },
  { id:107,front:"Group",back:"समूह",tl:"Samooh",pron:"sa-MOOH",cat:"Common Words",hint:"'Sa-mooh' — Sam says 'ooh!' calling the ___ together.",trick:"'Sam, uh!' — Gruppe!",example:{hi:"यह एक बड़ा समूह है।",en:"This is a big group.",tl:"Yeh ek bada samooh hai."} },
  { id:110,front:"Journey",back:"यात्रा",tl:"Yaatraa",pron:"YAA-traa",cat:"Common Words",hint:"'Yaa-traa' — 'Yes, carry (trage) your bags on the ___!'",trick:"'Ja, Trage!'",example:{hi:"यात्रा लंबी है।",en:"The journey is long.",tl:"Yaatraa lambi hai."} },
  { id:129,front:"Truth",back:"सच",tl:"Sach",pron:"such — like 'such'",cat:"Common Words",hint:"Sounds like English 'such' — such is the ___!",trick:"'Sach' — klingt wie 'Sache' — die Wahrheit ist eine klare Sache!",example:{hi:"सच बोलो।",en:"Speak the truth.",tl:"Sach bolo."} },

  // SENTENCES
  { id:78,front:"Something else?",back:"और कुछ?",tl:"Aur kuchh?",pron:"OWR kootch?",cat:"Sentences",hint:"'Aur' (more) + 'kuchh' (something) — shopkeeper's favorite!",trick:"'Ohr + Kutsche' — noch was?",example:{hi:"और कुछ चाहिए?",en:"Need anything else?",tl:"Aur kuchh chahiye?"} },
  { id:86,front:"I live in Hamburg",back:"मैं हैम्बर्ग में रहता हूँ",tl:"Main Hamburg mein rehta hoon",pron:"main Hamburg mayn REH-taa hoon",cat:"Sentences",hint:"'Main' = I, 'mein' = in, 'rehta hoon' = live. Word order: I Hamburg in live!",trick:"Fast wie Deutsch!",example:{hi:"मैं हैम्बर्ग में रहता हूँ।",en:"I live in Hamburg.",tl:"Main Hamburg mein rehta hoon."} },
  { id:108,front:"I am doing well",back:"मैं ठीक हूँ",tl:"Main theek hoon",pron:"main THEEK hoon",cat:"Sentences",hint:"'Theek' sounds like 'tick' — everything ticks correctly!",trick:"'Tick' — alles tickt richtig!",example:{hi:"मैं ठीक हूँ, धन्यवाद।",en:"I'm fine, thank you.",tl:"Main theek hoon, dhanyavaad."} },
  { id:116,front:"I'm good as well",back:"मैं भी ठीक हूँ",tl:"Main bhi theek hoon",pron:"main bhee THEEK hoon",cat:"Sentences",hint:"Add 'bhi' (also) to 'main theek hoon' — that tiny word does all the work!",trick:"'Bhi' = auch!",example:{hi:"मैं भी ठीक हूँ।",en:"I'm good as well.",tl:"Main bhi theek hoon."} },
];

const CATEGORIES=["All",...Array.from(new Set(ALL_CARDS.map(c=>c.cat)))];
const CC={Numbers:"#E8785A","Family & People":"#B07CC8","Body Parts":"#E8708A","Nature & Weather":"#5AB8C8",Colors:"#D4A84A","Food & Home":"#5CB87A",Places:"#6A9EE0",Time:"#E8A05A",Emotions:"#D87098",Adjectives:"#5AAA8A",Verbs:"#9A7ACA","Common Words":"#7A88D8",Sentences:"#E88A6A"};
const LVL_C=["#E85A5A","#E8935A","#D4A84A","#8BC05A","#4AA85A"];
const LVL_L=["New","48h","4 days","1 week","Monthly"];
const LVL_D=[0,48*36e5,96*36e5,7*864e5,30*864e5];

const TL={bg:"#FFF",bgGrad:"linear-gradient(150deg,#FFF0F3 0%,#FDE8EF 15%,#F5EDFF 30%,#E8F0FF 50%,#E6FAF5 68%,#FFFAE6 85%,#FFF0F0 100%)",cardFront:"linear-gradient(155deg,#FFF,#FFF8FA 40%,#FBF5FF 70%,#F5F8FF)",text:"#2D2530",sub:"#5C5060",muted:"#9A90A0",faint:"#D0C8D4",hintBg:"rgba(180,120,200,.06)",hintBd:"rgba(180,120,200,.14)",hintTx:"#6A5878",trickBg:"rgba(90,184,122,.06)",trickBd:"rgba(90,184,122,.16)",trickTx:"#3A7A52",pillBg:"#FFF",pillBd:"rgba(0,0,0,.06)",btnBg:"#FFF",btnBd:"rgba(0,0,0,.07)",btnTx:"#7A7080",dotBg:"rgba(0,0,0,.07)",divider:"rgba(0,0,0,.06)",cardShadow:"0 6px 32px rgba(0,0,0,.05),0 2px 6px rgba(0,0,0,.03)",accent:"#D87098",pronBg:"rgba(216,112,152,.07)",pronBd:"rgba(216,112,152,.18)",speedBg:"rgba(216,112,152,.04)",speedBd:"rgba(216,112,152,.10)",speedActive:"rgba(216,112,152,.10)",inputBg:"#FFF",inputBd:"rgba(0,0,0,.10)",overlayBg:"rgba(255,255,255,.97)",tabBg:"#FFF",tabBd:"rgba(0,0,0,.06)",barFill:"#D87098",exBg:"rgba(90,184,200,.06)",exBd:"rgba(90,184,200,.14)",exTx:"#2A7B9B"};
const TD={bg:"#110E14",bgGrad:"linear-gradient(150deg,#16101C,#1A1220 25%,#12141E 50%,#141018 75%,#18141C)",cardFront:"linear-gradient(155deg,#1E1826,#1A1520 50%,#161220)",text:"#F0EAF0",sub:"#908498",muted:"#5A5060",faint:"#3A3440",hintBg:"rgba(255,255,255,.04)",hintBd:"rgba(255,255,255,.08)",hintTx:"#908498",trickBg:"rgba(90,184,122,.08)",trickBd:"rgba(90,184,122,.15)",trickTx:"#7AC89A",pillBg:"rgba(255,255,255,.04)",pillBd:"rgba(255,255,255,.07)",btnBg:"rgba(255,255,255,.04)",btnBd:"rgba(255,255,255,.07)",btnTx:"#908498",dotBg:"rgba(255,255,255,.08)",divider:"rgba(255,255,255,.05)",cardShadow:"0 6px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.03)",accent:"#E8889A",pronBg:"rgba(232,136,154,.10)",pronBd:"rgba(232,136,154,.22)",speedBg:"rgba(255,255,255,.03)",speedBd:"rgba(255,255,255,.06)",speedActive:"rgba(232,136,154,.12)",inputBg:"rgba(255,255,255,.06)",inputBd:"rgba(255,255,255,.10)",overlayBg:"rgba(17,14,20,.97)",tabBg:"#1A1520",tabBd:"rgba(255,255,255,.06)",barFill:"#E8889A",exBg:"rgba(90,184,200,.08)",exBd:"rgba(90,184,200,.12)",exTx:"#7AC8D8"};

const SPEEDS=[{key:"normal",label:"Normal",rate:.82,emoji:"🗣️"},{key:"slow",label:"Slow",rate:.15,emoji:"🐢"}];

function useSpeech(){const[s,ss]=useState(false);const[a,sa]=useState(null);const[v,sv]=useState(null);const r=useRef(null);useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;r.current=window.speechSynthesis;const p=()=>{const vs=r.current.getVoices();sv(vs.find(x=>x.lang==="hi-IN")||vs.find(x=>x.lang.startsWith("hi"))||null);};p();r.current.addEventListener("voiceschanged",p);return()=>r.current?.removeEventListener("voiceschanged",p);},[]);const speak=useCallback((t,rate=.82,k="normal")=>{if(!r.current)return;r.current.cancel();const u=new SpeechSynthesisUtterance(t.replace(/\s*\/\s*/g," ").replace(/\n/g," "));u.lang="hi-IN";u.rate=rate;u.pitch=1;if(v)u.voice=v;u.onstart=()=>{ss(true);sa(k);};u.onend=()=>{ss(false);sa(null);};u.onerror=()=>{ss(false);sa(null);};r.current.speak(u);},[v]);const stop=useCallback(()=>{r.current?.cancel();ss(false);sa(null);},[]);return{speak,stop,speaking:s,activeSpeed:a,supported:typeof window!=="undefined"&&!!window.speechSynthesis};}
function useSwipe(onL,onR){const sx=useRef(0);const sy=useRef(0);const onTS=useCallback(e=>{sx.current=e.touches[0].clientX;sy.current=e.touches[0].clientY;},[]);const onTE=useCallback(e=>{const dx=e.changedTouches[0].clientX-sx.current;const dy=e.changedTouches[0].clientY-sy.current;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){dx>0?onR():onL();}},[onL,onR]);return{onTouchStart:onTS,onTouchEnd:onTE};}

async function saveData(uid,d){try{await setDoc(doc(db,"users",uid),{...d,updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.error(e);}}
async function loadData(uid){try{const s=await getDoc(doc(db,"users",uid));if(s.exists())return s.data();}catch(e){console.error(e);}return null;}

function PasswordInput({value,onChange,placeholder,onKeyDown,T}){const[v,setV]=useState(false);return(<div style={{position:"relative",width:"100%"}}><input type={v?"text":"password"} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} style={{width:"100%",padding:"14px 48px 14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}}/><button type="button" onClick={()=>setV(x=>!x)} tabIndex={-1} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:"6px",color:T.muted}}>{v?"🙈":"👁️"}</button></div>);}

function AuthScreen({T}){const[isS,setIsS]=useState(false);const[nm,setNm]=useState("");const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const sub=async()=>{setErr("");if(isS&&!nm.trim()){setErr("Enter your name");return;}if(!em||!pw){setErr("Fill in all fields");return;}if(pw.length<6){setErr("Min 6 characters");return;}setLd(true);try{if(isS){const c=await createUserWithEmailAndPassword(auth,em,pw);await setDoc(doc(db,"users",c.user.uid),{name:nm.trim(),cardLevels:{},stats:{totalMinutes:0,dailyLog:{},dailyTarget:25}});}else await signInWithEmailAndPassword(auth,em,pw);}catch(e){setErr(e.code==="auth/invalid-credential"?"Invalid email or password.":e.code==="auth/email-already-in-use"?"Already registered.":e.message);}setLd(false);};const iS={width:"100%",padding:"14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"};
return(<div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxSizing:"border-box"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{width:"100%",maxWidth:400,textAlign:"center"}}><div style={{fontSize:16,letterSpacing:3,color:T.accent,fontWeight:700,marginBottom:6,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div><h1 style={{fontSize:36,fontWeight:800,margin:0,color:T.text}}>Hindi Flashcards</h1><p style={{fontSize:16,color:T.sub,margin:"8px 0 28px"}}>{isS?"Create account":"Log in"}</p><div style={{display:"flex",flexDirection:"column",gap:12}}>{isS&&<input placeholder="Your name" value={nm} onChange={e=>setNm(e.target.value)} style={iS}/>}<input type="email" placeholder="Email" value={em} onChange={e=>setEm(e.target.value)} style={iS}/><PasswordInput value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password (min 6)" onKeyDown={e=>e.key==="Enter"&&sub()} T={T}/>{err&&<div style={{padding:"10px 14px",borderRadius:12,background:"#F43F5E14",border:"1px solid #F43F5E30",color:"#E11D48",fontSize:13,textAlign:"left"}}>{err}</div>}<button onClick={sub} disabled={ld} style={{padding:"14px",borderRadius:16,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,color:"#FFF",fontSize:17,fontFamily:"inherit",fontWeight:700,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Wait...":isS?"Create Account ✨":"Log In 🚀"}</button><button onClick={()=>{setIsS(s=>!s);setErr("");}} style={{padding:"10px",borderRadius:12,border:`1px solid ${T.pillBd}`,background:"transparent",color:T.sub,fontSize:14,fontFamily:"inherit",cursor:"pointer"}}>{isS?"Have account? Log in":"New? Sign up"}</button></div></div></div>);}

function getLevel(cl,id){return cl[id]||{level:1,lastCorrect:null};}
function isDue(cl,id){const c=getLevel(cl,id);if(!c.lastCorrect||c.level<=1)return true;return Date.now()-new Date(c.lastCorrect).getTime()>=LVL_D[Math.min(c.level-1,4)];}
function lvlUp(cl,id){const c=getLevel(cl,id);return{...cl,[id]:{level:Math.min(c.level+1,5),lastCorrect:new Date().toISOString()}};}
function lvlDown(cl,id){const c=getLevel(cl,id);return{...cl,[id]:{level:Math.max(c.level-1,1),lastCorrect:c.lastCorrect}};}

export default function App(){
  const[user,setUser]=useState(null);const[userName,setUserName]=useState("");const[authLoading,setAuthLoading]=useState(true);
  const[idx,setIdx]=useState(0);const[flipped,setFlipped]=useState(false);const[cat,setCat]=useState("All");
  const[cardLevels,setCardLevels]=useState({});
  const[anim,setAnim]=useState(false);const[dark,setDark]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(true);const[saving,setSaving]=useState(false);
  const[tab,setTab]=useState("practice");const[showList,setShowList]=useState(null);
  const[swipeHint,setSwipeHint]=useState(null);const[practiceMode,setPracticeMode]=useState(null);
  const[stats,setStats]=useState({totalMinutes:0,dailyLog:{},dailyTarget:25});
  const[showHint,setShowHint]=useState(false);
  const[todayFlips,setTodayFlips]=useState(0);
  const lastActivity=useRef(Date.now());
  const timerRef=useRef(null);
  const sessionStart=useRef(Date.now());

  const{speak,stop,speaking,activeSpeed,supported}=useSpeech();
  const T=dark?TD:TL;
  const today=new Date().toISOString().slice(0,10);

  const knownSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=5).map(([k])=>+k)),[cardLevels]);
  const learningSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=2&&v.level<5).map(([k])=>+k)),[cardLevels]);
  const dueCards=useMemo(()=>ALL_CARDS.filter(c=>isDue(cardLevels,c.id)),[cardLevels]);

  const cards=useMemo(()=>{
    if(practiceMode==="learning")return ALL_CARDS.filter(c=>{const l=getLevel(cardLevels,c.id).level;return l>=2&&l<5&&isDue(cardLevels,c.id);});
    if(practiceMode==="due")return dueCards;
    return cat==="All"?ALL_CARDS:ALL_CARDS.filter(c=>c.cat===cat);
  },[cat,practiceMode,cardLevels,dueCards]);
  const card=cards[idx]||cards[0];const color=CC[card?.cat]||"#D87098";

  // Track activity for timer
  const markActive=useCallback(()=>{lastActivity.current=Date.now();},[]);

  useEffect(()=>{const unsub=onAuthStateChanged(auth,async u=>{setUser(u);if(u){const d=await loadData(u.uid);if(d){setCardLevels(d.cardLevels||{});setUserName(d.name||"");setStats(d.stats||{totalMinutes:0,dailyLog:{},dailyTarget:25});setTodayFlips(d.stats?.dailyLog?.[today]||0);}}setAuthLoading(false);});return()=>unsub();},[]);

  // Timer: only counts if active within last 60s
  useEffect(()=>{if(!user)return;timerRef.current=setInterval(()=>{const idle=Date.now()-lastActivity.current;if(idle<60000){const el=(Date.now()-sessionStart.current)/60000;if(el>0&&el<2)setStats(p=>({...p,totalMinutes:(p.totalMinutes||0)+el}));}sessionStart.current=Date.now();},30000);return()=>clearInterval(timerRef.current);},[user]);

  const saveTimeout=useRef(null);
  useEffect(()=>{if(!user)return;if(saveTimeout.current)clearTimeout(saveTimeout.current);saveTimeout.current=setTimeout(async()=>{setSaving(true);await saveData(user.uid,{name:userName,cardLevels,stats});setSaving(false);},1000);return()=>{if(saveTimeout.current)clearTimeout(saveTimeout.current);};},[cardLevels,user,userName,stats]);

  // Only count FRONT→BACK flips (not reverse)
  const prevFlipped=useRef(false);
  useEffect(()=>{
    if(flipped&&!prevFlipped.current){
      // This is a front→back flip
      setTodayFlips(f=>f+1);
      setStats(p=>({...p,dailyLog:{...p.dailyLog,[today]:(p.dailyLog?.[today]||0)+1}}));
      if(autoSpeak&&supported&&card)setTimeout(()=>speak(card.back,.82,"normal"),400);
    }
    prevFlipped.current=flipped;
  },[flipped,card,autoSpeak,supported,speak,today]);

  const doFlip=useCallback(()=>{if(!anim){setFlipped(f=>!f);setShowHint(false);markActive();}},[anim,markActive]);
  const nav=useCallback(d=>{if(anim)return;setAnim(true);setFlipped(false);setShowHint(false);stop();markActive();setTimeout(()=>{setIdx(i=>{const n=i+d;return n<0?cards.length-1:n>=cards.length?0:n;});setAnim(false);},200);},[cards.length,anim,stop,markActive]);

  const markKnow=useCallback(()=>{if(!card)return;markActive();setCardLevels(p=>lvlUp(p,card.id));nav(1);},[card,nav,markActive]);
  const markLearn=useCallback(()=>{if(!card)return;markActive();setCardLevels(p=>lvlDown(p,card.id));nav(1);},[card,nav,markActive]);

  const onSwipeL=useCallback(()=>{setSwipeHint("left");setTimeout(()=>setSwipeHint(null),400);markLearn();},[markLearn]);
  const onSwipeR=useCallback(()=>{setSwipeHint("right");setTimeout(()=>setSwipeHint(null),400);markKnow();},[markKnow]);
  const swipe=useSwipe(onSwipeL,onSwipeR);
  const handleLogout=async()=>{stop();await signOut(auth);};
  const pct=Math.round((knownSet.size/ALL_CARDS.length)*100);
  const handlePlay=(e,sp)=>{e.stopPropagation();markActive();if(speaking&&activeSpeed===sp.key){stop();return;}speak(card.back,sp.rate,sp.key);};
  const displayName=userName||user?.email?.split("@")[0]||"Learner";
  const jumpToCard=id=>{setPracticeMode(null);setCat("All");setFlipped(false);setShowHint(false);stop();const i=ALL_CARDS.findIndex(c=>c.id===id);if(i>=0)setIdx(i);setShowList(null);setTab("practice");};
  const exitPractice=()=>{setPracticeMode(null);setCat("All");setIdx(0);setFlipped(false);setShowHint(false);};
  const dailyTarget=stats.dailyTarget||25;
  const targetPct=Math.min(Math.round((todayFlips/dailyTarget)*100),100);
  const cl=card?getLevel(cardLevels,card.id):{level:1};

  const speakExample=(e)=>{e.stopPropagation();markActive();if(!card?.example)return;speak(card.example.hi,.82,"normal");};

  if(authLoading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgGrad,fontFamily:"'Outfit',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{textAlign:"center",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🇮🇳</div><div style={{fontSize:18,fontWeight:600}}>Loading...</div></div></div>);
  if(!user)return<AuthScreen T={T}/>;

  return(
    <div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",color:T.text,display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 14px 80px",boxSizing:"border-box",transition:"background .5s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes speakPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes barBounce{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes swL{0%{opacity:0;transform:translateX(20px)}50%{opacity:1}100%{opacity:0;transform:translateX(-20px)}}@keyframes swR{0%{opacity:0;transform:translateX(-20px)}50%{opacity:1}100%{opacity:0;transform:translateX(20px)}}@keyframes hintIn{from{opacity:0;max-height:0}to{opacity:1;max-height:200px}}.cat-scroll::-webkit-scrollbar{display:none}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}`}</style>

      {/* List modals */}
      {showList&&<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",padding:20}} onClick={()=>setShowList(null)}><div onClick={e=>e.stopPropagation()} style={{background:T.overlayBg,borderRadius:24,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:22,fontWeight:800,color:T.text,margin:0}}>{showList==="known"?"⭐ Mastered":"📖 Learning"} ({(showList==="known"?knownSet:learningSet).size})</h2>
          <button onClick={()=>setShowList(null)} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${T.pillBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {showList==="learning"&&learningSet.size>0&&<button onClick={()=>{setPracticeMode("learning");setIdx(0);setFlipped(false);setShowList(null);setTab("practice");}} style={{width:"100%",padding:"12px",borderRadius:14,border:"1.5px solid #D4A84A44",background:"#D4A84A12",color:"#D4A84A",fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:12}}>🎯 Practice all</button>}
        {ALL_CARDS.filter(c=>(showList==="known"?knownSet:learningSet).has(c.id)).map(c=>{const lv=getLevel(cardLevels,c.id);return(<button key={c.id} onClick={()=>jumpToCard(c.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:14,border:`1.5px solid ${showList==="known"?"#5CB87A22":"#D4A84A22"}`,background:`${showList==="known"?"#5CB87A":"#D4A84A"}06`,marginBottom:8,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}><div><div style={{fontSize:16,fontWeight:700,color:T.text}}>{c.front}</div><div style={{fontSize:13,color:CC[c.cat]||T.sub,fontWeight:600,marginTop:2}}>{c.back} · {c.tl}</div></div><span style={{fontSize:11,fontWeight:700,color:LVL_C[lv.level-1],background:`${LVL_C[lv.level-1]}18`,padding:"2px 8px",borderRadius:8}}>Lv{lv.level}</span></button>);})}
        {(showList==="known"?knownSet:learningSet).size===0&&<div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>No cards yet!</div>}
      </div></div>}

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:560}}>

        {/* ===== PRACTICE ===== */}
        {tab==="practice"&&<>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:13,letterSpacing:3,color:T.accent,fontWeight:700,marginBottom:2,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div>
            <h1 style={{fontSize:24,fontWeight:800,margin:0,color:T.text}}>Namaste, {displayName}! 👋</h1>
          </div>

          {/* Daily target */}
          <div style={{marginBottom:8,padding:"10px 14px",borderRadius:14,background:T.pillBg,border:`1px solid ${T.pillBd}`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600,color:T.text}}>🎯 {todayFlips}/{dailyTarget} flips</span>
                <span style={{fontWeight:700,color:targetPct>=100?"#4AA85A":T.accent}}>{targetPct>=100?"Done! ✨":`${targetPct}%`}</span>
              </div>
              <div style={{height:6,borderRadius:3,background:T.dotBg,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,width:`${targetPct}%`,background:targetPct>=100?"linear-gradient(90deg,#4AA85A,#8BC05A)":"linear-gradient(90deg,#E8785A,#D4A84A)",transition:"width .4s"}}/>
              </div>
            </div>
          </div>

          {practiceMode&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderRadius:12,background:"#D4A84A14",border:"1.5px solid #D4A84A33",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:700,color:"#D4A84A"}}>🎯 {practiceMode==="learning"?"Learning":"Due"}: {cards.length}</span>
            <button onClick={exitPractice} style={{padding:"5px 10px",borderRadius:10,border:"1px solid #D4A84A44",background:"transparent",color:"#D4A84A",fontSize:11,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>Exit</button>
          </div>}

          {!practiceMode&&<div className="cat-scroll" style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:6,marginBottom:8,scrollbarWidth:"none"}}>
            {CATEGORIES.map(c=>{const active=cat===c;const cc=CC[c]||T.accent;return(<button key={c} onClick={()=>{setCat(c);setIdx(0);setFlipped(false);setShowHint(false);stop();}} style={{padding:"6px 13px",borderRadius:18,border:"1.5px solid",whiteSpace:"nowrap",flexShrink:0,borderColor:active?cc:T.pillBd,background:active?`${cc}18`:T.pillBg,color:active?cc:T.sub,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:active?700:400}}>{c}</button>);})}
          </div>}

          {cards.length>0?<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,padding:"0 4px"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:color}}/>
              <span style={{fontSize:13,color,fontWeight:700,textTransform:"uppercase"}}>{card?.cat}</span>
              <span style={{fontSize:11,fontWeight:700,color:LVL_C[cl.level-1],background:`${LVL_C[cl.level-1]}18`,padding:"2px 8px",borderRadius:8}}>Lv{cl.level} · {LVL_L[cl.level-1]}</span>
            </div>
            <span style={{fontSize:14,color:T.muted,fontWeight:600}}>{idx+1}/{cards.length}</span>
          </div>

          {/* FLASHCARD */}
          <div {...swipe} onClick={doFlip} style={{perspective:1200,cursor:"pointer",marginBottom:8,height:460,position:"relative"}}>
            {swipeHint==="right"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(92,184,122,.15)",animation:"swR .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>✅</span></div>}
            {swipeHint==="left"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(212,168,74,.15)",animation:"swL .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>🔄</span></div>}
            <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0)",transition:"transform .65s cubic-bezier(.23,1,.32,1)"}}>
              {/* FRONT */}
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",borderRadius:24,background:T.cardFront,border:`1.5px solid ${color}${dark?"25":"15"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxShadow:T.cardShadow}}>
                <div style={{position:"absolute",top:14,right:16,fontSize:12,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>English</div>
                <div style={{position:"absolute",top:14,left:16,display:"flex",gap:3}}>{[1,2,3,4,5].map(l=>(<div key={l} style={{width:7,height:7,borderRadius:"50%",background:cl.level>=l?LVL_C[l-1]:T.dotBg}}/>))}</div>
                <div style={{fontSize:card?.front.length>20?26:44,fontWeight:800,textAlign:"center",lineHeight:1.25,color:T.text}}>{card?.front}</div>
                <div style={{marginTop:14,width:"100%",maxWidth:360,textAlign:"center"}}>
                  {!showHint?<button onClick={e=>{e.stopPropagation();setShowHint(true);markActive();}} style={{padding:"8px 18px",borderRadius:14,border:`1.5px solid ${T.hintBd}`,background:T.hintBg,color:T.hintTx,fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,margin:"0 auto"}}>💡 Hint</button>
                  :<div style={{animation:"hintIn .3s ease-out",padding:"10px 16px",borderRadius:14,background:T.hintBg,border:`1.5px solid ${T.hintBd}`,fontSize:14,color:T.hintTx,lineHeight:1.5,fontWeight:500}} onClick={e=>e.stopPropagation()}>{card?.hint}</div>}
                </div>
                <div style={{marginTop:12,fontSize:13,color:T.muted}}>tap to flip · swipe ← →</div>
              </div>
              {/* BACK */}
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:24,background:dark?`linear-gradient(155deg,${color}12,#1A1520 30%,#161220)`:`linear-gradient(155deg,${color}08,#FFF 30%,#FFFAF5)`,border:`1.5px solid ${color}${dark?"30":"18"}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 14px 14px",boxShadow:T.cardShadow,overflowY:"auto",justifyContent:"flex-start",paddingTop:34}}>
                <div style={{position:"absolute",top:10,right:14,fontSize:11,color,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,opacity:.8,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी</div>
                <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:card?.back.length>14?30:48,fontWeight:700,textAlign:"center",color:T.text,lineHeight:1.3,whiteSpace:"pre-line"}}>{card?.back}</div>
                <div style={{marginTop:2,fontSize:18,fontWeight:600,color}}>{card?.tl}</div>
                {/* Audio */}
                {supported&&<div onClick={e=>e.stopPropagation()} style={{marginTop:8,padding:"4px",borderRadius:14,background:T.speedBg,border:`1px solid ${T.speedBd}`,display:"flex",gap:4,width:"100%",maxWidth:400}}>
                  {SPEEDS.map(sp=>{const isA=speaking&&activeSpeed===sp.key;return(<button key={sp.key} onClick={e=>handlePlay(e,sp)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1.5px solid",borderColor:isA?`${color}66`:"transparent",background:isA?T.speedActive:"transparent",color:isA?color:T.sub,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:4,animation:isA?"speakPulse 1.2s ease-in-out infinite":"none"}}>{isA?<div style={{display:"flex",gap:2,height:14}}>{[0,1,2,3].map(b=><div key={b} style={{width:3,height:14,borderRadius:2,background:color,animation:`barBounce 0.${5+b*2}s ease-in-out infinite`,animationDelay:`${b*.1}s`}}/>)}</div>:<span>{sp.emoji}</span>}{sp.label}</button>);})}
                </div>}
                <div style={{marginTop:6,padding:"5px 14px",borderRadius:12,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:14,color,fontWeight:500,display:"flex",alignItems:"center",gap:5,width:"100%",maxWidth:400,justifyContent:"center"}}>📢 {card?.pron}</div>
                <div style={{marginTop:5,padding:"6px 14px",borderRadius:12,background:T.trickBg,border:`1px solid ${T.trickBd}`,fontSize:13,color:T.trickTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:400,fontWeight:500}}>🇩🇪 {card?.trick}</div>
                {/* Example sentence */}
                {card?.example&&<div onClick={e=>e.stopPropagation()} style={{marginTop:5,padding:"8px 14px",borderRadius:12,background:T.exBg,border:`1px solid ${T.exBd}`,width:"100%",maxWidth:400}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.exTx,marginBottom:2}}>Example</div>
                    {supported&&<button onClick={speakExample} style={{padding:"3px 8px",borderRadius:8,border:`1px solid ${T.exBd}`,background:"transparent",color:T.exTx,fontSize:11,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>▶ Play</button>}
                  </div>
                  <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:16,fontWeight:600,color:T.text,lineHeight:1.4}}>{card.example.hi}</div>
                  <div style={{fontSize:12,color:T.exTx,marginTop:1}}>{card.example.tl}</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:1}}>{card.example.en}</div>
                </div>}
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:8}}>
            <button onClick={()=>nav(-1)} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:"inherit"}}>‹</button>
            <button onClick={markLearn} style={{padding:"11px 20px",borderRadius:18,border:"1.5px solid #D4A84A44",background:"#D4A84A10",color:"#D4A84A",cursor:"pointer",fontSize:15,fontFamily:"inherit",fontWeight:700}}>← Still learning</button>
            <button onClick={markKnow} style={{padding:"11px 20px",borderRadius:18,border:"1.5px solid #5CB87A44",background:"#5CB87A10",color:"#5CB87A",cursor:"pointer",fontSize:15,fontFamily:"inherit",fontWeight:700}}>Got it! →</button>
            <button onClick={()=>nav(1)} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:"inherit"}}>›</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"10px 4px",borderTop:`1px solid ${T.divider}`}}>
            {[{l:"Total",v:ALL_CARDS.length,c:T.sub,e:"📚",cl:null},{l:"Mastered",v:knownSet.size,c:"#4AA85A",e:"⭐",cl:()=>setShowList("known")},{l:"Learning",v:learningSet.size,c:"#D4A84A",e:"📖",cl:()=>setShowList("learning")},{l:"Due",v:dueCards.length,c:"#E85A5A",e:"🔥",cl:()=>{setPracticeMode("due");setIdx(0);setTab("practice");}}].map(s=>(<div key={s.l} onClick={s.cl} style={{textAlign:"center",padding:"7px 3px",borderRadius:12,background:dark?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)",cursor:s.cl?"pointer":"default",border:s.cl?`1.5px solid ${s.c}22`:"1.5px solid transparent"}}><div style={{fontSize:11}}>{s.e}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",fontWeight:600}}>{s.l}</div>{s.cl&&<div style={{fontSize:8,color:s.c,fontWeight:600}}>TAP</div>}</div>))}
          </div>
          </>:<div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🎉</div><div style={{fontSize:18,fontWeight:600}}>All done!</div><button onClick={exitPractice} style={{marginTop:16,padding:"12px 24px",borderRadius:16,border:`1.5px solid ${T.accent}44`,background:`${T.accent}12`,color:T.accent,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>Back to all</button></div>}
        </>}

        {/* ===== PROGRESS ===== */}
        {tab==="progress"&&<div>
          <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>📊 Progress</h2>
          <p style={{fontSize:14,color:T.sub,margin:"0 0 14px"}}>{knownSet.size} mastered · {learningSet.size} learning · {ALL_CARDS.length-knownSet.size-learningSet.size} new</p>
          {/* Mastery ring + progress bar */}
          <div style={{display:"flex",alignItems:"center",gap:18,padding:"16px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12}}>
            <div style={{position:"relative",width:80,height:80,flexShrink:0}}><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke={T.dotBg} strokeWidth="7"/><circle cx="40" cy="40" r="34" fill="none" stroke={T.accent} strokeWidth="7" strokeDasharray={`${pct*2.14} ${214-pct*2.14}`} strokeDashoffset="54" strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:T.accent}}>{pct}%</div></div>
            <div><div style={{fontSize:17,fontWeight:700,color:T.text}}>✨ {knownSet.size}/{ALL_CARDS.length}</div><div style={{fontSize:13,color:T.sub,marginTop:3}}>⏱️ {Math.floor((stats.totalMinutes||0)/60)}h {Math.round((stats.totalMinutes||0)%60)}m practice</div><div style={{fontSize:13,color:T.sub,marginTop:2}}>🔥 {dueCards.length} cards due</div></div>
          </div>
          {/* Overall mastered bar */}
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sub,marginBottom:4}}>
              <span>Overall mastery</span><span style={{fontWeight:700,color:T.accent}}>{pct}%</span>
            </div>
            <div style={{height:8,borderRadius:4,background:T.dotBg,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:4,width:`${pct}%`,background:"linear-gradient(90deg,#E8785A,#D4A84A,#5CB87A)",transition:"width .6s",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite"}}/>
            </div>
          </div>
          {/* Weekly */}
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📅 This week</div>
            <div style={{display:"flex",gap:5,alignItems:"flex-end",height:80}}>
              {Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const c=(stats.dailyLog||{})[k]||0;const isT=k===today;const max=Math.max(...Object.values(stats.dailyLog||{1:1}),dailyTarget,1);return(<div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{fontSize:10,fontWeight:700,color:isT?T.accent:T.muted}}>{c}</div><div style={{width:"100%",borderRadius:5,background:isT?T.accent:T.barFill,opacity:isT?1:.35,height:`${Math.max((c/max)*55,3)}px`,transition:"height .4s"}}/><div style={{fontSize:9,color:isT?T.accent:T.muted,fontWeight:isT?700:500}}>{d.toLocaleDateString("en",{weekday:"short"})}</div></div>);})}
            </div>
          </div>
          {/* Level distribution */}
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>🏆 Levels</div>
            {[1,2,3,4,5].map(lv=>{const ct=ALL_CARDS.filter(c=>{const l=getLevel(cardLevels,c.id).level;return lv===1?(l===1||!cardLevels[c.id]):l===lv;}).length;return(<div key={lv} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><div style={{width:50,fontSize:13,fontWeight:700,color:LVL_C[lv-1]}}>Lv {lv}</div><div style={{flex:1,height:7,borderRadius:4,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${(ct/ALL_CARDS.length)*100}%`,background:LVL_C[lv-1]}}/></div><div style={{width:28,fontSize:12,fontWeight:600,color:T.muted,textAlign:"right"}}>{ct}</div></div>);})}
          </div>
          {/* Categories */}
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📂 Categories</div>
            {Object.entries(CC).map(([cat,col])=>{const cc=ALL_CARDS.filter(c=>c.cat===cat);const m=cc.filter(c=>getLevel(cardLevels,c.id).level>=5).length;const cp=cc.length?Math.round((m/cc.length)*100):0;return(<div key={cat} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:col}}>{cat}</span><span style={{fontSize:11,color:T.muted}}>{m}/{cc.length}</span></div><div style={{height:5,borderRadius:3,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${cp}%`,background:col}}/></div></div>);})}
          </div>
        </div>}

        {/* ===== SETTINGS ===== */}
        {tab==="settings"&&<div>
          <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>⚙️ Settings</h2>
          <p style={{fontSize:14,color:T.sub,margin:"0 0 16px"}}>{displayName} · {user.email}</p>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <span style={{fontSize:15,fontWeight:700,color:T.text}}>🌓 Theme</span>
            <button onClick={()=>setDark(d=>!d)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${T.pillBd}`,background:T.btnBg,color:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{dark?"☀️ Light":"🌙 Dark"}</button>
          </div>
          {supported&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <span style={{fontSize:15,fontWeight:700,color:T.text}}>🔊 Auto-play</span>
            <button onClick={()=>setAutoSpeak(a=>!a)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${autoSpeak?T.accent+"44":T.pillBd}`,background:autoSpeak?`${T.accent}14`:T.btnBg,color:autoSpeak?T.accent:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{autoSpeak?"ON":"OFF"}</button>
          </div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>🎯 Daily target</div><div style={{fontSize:12,color:T.muted}}>{dailyTarget} flips/day</div></div>
            <div style={{display:"flex",gap:5}}>{[15,25,40,60].map(n=>(<button key={n} onClick={()=>setStats(p=>({...p,dailyTarget:n}))} style={{padding:"6px 10px",borderRadius:10,border:`1.5px solid ${dailyTarget===n?T.accent+"44":T.pillBd}`,background:dailyTarget===n?`${T.accent}14`:"transparent",color:dailyTarget===n?T.accent:T.muted,fontSize:12,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{n}</button>))}</div>
          </div>
          <button onClick={handleLogout} style={{width:"100%",padding:"14px",borderRadius:16,border:`1.5px solid ${T.pillBd}`,background:T.pillBg,color:T.text,fontSize:16,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:16}}>🚪 Logout</button>
          <DeleteBtn T={T}/>
        </div>}
      </div>

      {/* BOTTOM TABS */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.tabBg,borderTop:`1px solid ${T.tabBd}`,display:"flex",justifyContent:"center",backdropFilter:"blur(16px)"}}>
        <div style={{display:"flex",maxWidth:560,width:"100%"}}>
          {[{k:"practice",i:"📚",l:"Practice"},{k:"progress",i:"📊",l:"Progress"},{k:"settings",i:"⚙️",l:"Settings"}].map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);stop();}} style={{flex:1,padding:"10px 0 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",color:tab===t.k?T.accent:T.muted}}>
            <span style={{fontSize:22}}>{t.i}</span><span style={{fontSize:11,fontWeight:tab===t.k?700:500}}>{t.l}</span>
            {tab===t.k&&<div style={{width:20,height:3,borderRadius:2,background:T.accent}}/>}
          </button>))}
        </div>
      </div>
    </div>
  );
}

function DeleteBtn({T}){const[cd,setCd]=useState(false);const[dp,setDp]=useState("");const[de,setDe]=useState("");const[dl,setDl]=useState(false);const hd=async()=>{if(!cd){setCd(true);return;}if(!dp){setDe("Enter password");return;}setDl(true);try{const c=EmailAuthProvider.credential(auth.currentUser.email,dp);await reauthenticateWithCredential(auth.currentUser,c);await deleteDoc(doc(db,"users",auth.currentUser.uid));await deleteUser(auth.currentUser);}catch(e){setDe("Wrong password.");setDl(false);}};
return(<div style={{padding:"14px",borderRadius:16,border:"1.5px solid #F43F5E30",background:"#F43F5E08"}}><div style={{fontSize:14,fontWeight:700,color:"#E11D48",marginBottom:4}}>⚠️ Delete Account</div><div style={{fontSize:11,color:T.muted,marginBottom:8}}>Permanently deletes everything.</div>{cd&&<><PasswordInput value={dp} onChange={e=>setDp(e.target.value)} placeholder="Password" T={T} onKeyDown={e=>e.key==="Enter"&&hd()}/>{de&&<div style={{marginTop:6,fontSize:11,color:"#E11D48"}}>{de}</div>}</>}<button onClick={hd} disabled={dl} style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:cd?"#E11D48":"transparent",color:cd?"#FFF":"#E11D48",fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700,cursor:dl?"wait":"pointer",marginTop:8,opacity:dl?.6:1}}>{dl?"Deleting...":cd?"Confirm Delete":"Delete Account"}</button>{cd&&<button onClick={()=>{setCd(false);setDe("");setDp("");}} style={{width:"100%",padding:"6px",border:"none",background:"transparent",color:T.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer",marginTop:4}}>Cancel</button>}</div>);}
