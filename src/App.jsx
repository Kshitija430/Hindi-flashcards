import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

// ——— UI STRINGS ———
const UI = {
  en: {
    practice:"Practice",progress:"Progress",settings:"Settings",
    flipHint:"tap to flip · swipe ← →",hint:"Hint",gotIt:"Got it! →",stillLearning:"← Still learning",
    mastered:"Mastered",learning:"Learning",due:"Due",total:"Total",
    flipsToday:"flips",done:"Done! ✨",example:"Example",play:"▶ Play",
    theme:"Theme",autoPlay:"Auto-play",dailyTarget:"Daily target",flipsDay:"flips/day",
    logout:"Logout",deleteAccount:"Delete Account",deleteWarning:"Permanently deletes everything.",
    confirmDelete:"Confirm Delete",cancel:"Cancel",enterPassword:"Password",
    overallMastery:"Overall mastery",thisWeek:"This week",levels:"Levels",categories:"Categories",
    practiceDue:"Due",practiceLearning:"Learning",practiceAll:"Practice all",exit:"Exit",
    allDone:"All done!",backToAll:"Back to all",
    english:"English",german:"Deutsch",langLabel:"Learning language",
    new:"New",hours48:"48h",days4:"4 days",week1:"1 week",monthly:"Monthly",
  },
  de: {
    practice:"Übung",progress:"Fortschritt",settings:"Einstellungen",
    flipHint:"Tippen = umdrehen · Wischen ← →",hint:"Hinweis",gotIt:"Kann ich! →",stillLearning:"← Noch lernen",
    mastered:"Gemeistert",learning:"Am Lernen",due:"Fällig",total:"Gesamt",
    flipsToday:"Karten",done:"Geschafft! ✨",example:"Beispiel",play:"▶ Abspielen",
    theme:"Aussehen",autoPlay:"Auto-Ton",dailyTarget:"Tagesziel",flipsDay:"Karten/Tag",
    logout:"Abmelden",deleteAccount:"Konto löschen",deleteWarning:"Löscht alles unwiderruflich.",
    confirmDelete:"Endgültig löschen",cancel:"Abbrechen",enterPassword:"Passwort",
    overallMastery:"Gesamtfortschritt",thisWeek:"Diese Woche",levels:"Stufen",categories:"Kategorien",
    practiceDue:"Fällig",practiceLearning:"Lernkarten",practiceAll:"Alle üben",exit:"Beenden",
    allDone:"Alles erledigt!",backToAll:"Zurück",
    english:"English",german:"Deutsch",langLabel:"Lernsprache",
    new:"Neu",hours48:"48 Std.",days4:"4 Tage",week1:"1 Woche",monthly:"Monatlich",
  },
};

// ——— CARD DATA ———
const ALL_CARDS = [
  {id:1,front:"One (1)",frontDe:"Eins (1)",back:"एक (१)",tl:"Ek",pron:"ehk — rhymes with 'check'",cat:"Numbers",hint:"Starts with the same sound as 'egg' — just one!",hintDe:"Klingt wie 'Eck' — eine Ecke hat einen Punkt = eins.",trick:"Klingt wie 'Eck' (Ecke) — eine Ecke = eins.",example:{hi:"एक सेब दो।",en:"Give one apple.",de:"Gib einen Apfel.",tl:"Ek seb do."}},
  {id:2,front:"Two (2)",frontDe:"Zwei (2)",back:"दो (२)",tl:"Do",pron:"doe — like a female deer",cat:"Numbers",hint:"Sounds like 'dough' — split it in half.",hintDe:"Klingt wie 'doh' — denk an Do-ppel = zwei.",trick:"Klingt wie 'doh' — Do-ppel = zwei.",example:{hi:"दो केले लाओ।",en:"Bring two bananas.",de:"Bring zwei Bananen.",tl:"Do kele lao."}},
  {id:3,front:"Three (3)",frontDe:"Drei (3)",back:"तीन (३)",tl:"Teen",pron:"teen — like English 'teen'",cat:"Numbers",hint:"Think 'thir-___' — the number is hiding there!",hintDe:"Wie 'Tee in' drei Tassen — Teen = drei.",trick:"'Tee in' drei Tassen.",example:{hi:"तीन दिन बाद।",en:"After three days.",de:"Nach drei Tagen.",tl:"Teen din baad."}},
  {id:4,front:"Four (4)",frontDe:"Vier (4)",back:"चार (४)",tl:"Chaar",pron:"chaar — 'ch' + rhymes with 'car'",cat:"Numbers",hint:"Rhymes with 'car' but starts with 'ch'.",hintDe:"Ein 'Char' hat 4 Buchstaben — Chaar = vier.",trick:"Char hat 4 Buchstaben.",example:{hi:"चार लोग आए।",en:"Four people came.",de:"Vier Leute kamen.",tl:"Chaar log aaye."}},
  {id:5,front:"Five (5)",frontDe:"Fünf (5)",back:"पाँच (५)",tl:"Paanch",pron:"paanch — nasal, like 'punch'",cat:"Numbers",hint:"Like 'punch' — count five fingers in your fist!",hintDe:"Klingt wie 'Punsch' — fünf Zutaten!",trick:"Klingt wie 'Punsch'.",example:{hi:"पाँच मिनट रुको।",en:"Wait five minutes.",de:"Warte fünf Minuten.",tl:"Paanch minute ruko."}},
  {id:6,front:"Six (6)",frontDe:"Sechs (6)",back:"छह (६)",tl:"Chhah",pron:"cheh — aspirated 'ch'",cat:"Numbers",hint:"A breathy 'ch' — like blowing air. Six breaths!",hintDe:"Klingt wie 'Schach' — sechs Figuren-Typen.",trick:"Klingt wie 'Schach'.",example:{hi:"छह बजे आओ।",en:"Come at six.",de:"Komm um sechs.",tl:"Chhah baje aao."}},
  {id:7,front:"Seven (7)",frontDe:"Sieben (7)",back:"सात (७)",tl:"Saat",pron:"saat — rhymes with 'hot'",cat:"Numbers",hint:"German speakers: this word exists in YOUR language! (Seeds)",hintDe:"Wie 'Saat' (Samen) — gleiches Wort!",trick:"Wie 'Saat' (Samen).",example:{hi:"सात दिन एक हफ़्ता।",en:"Seven days make a week.",de:"Sieben Tage sind eine Woche.",tl:"Saat din ek hafta."}},
  {id:8,front:"Eight (8)",frontDe:"Acht (8)",back:"आठ (८)",tl:"Aath",pron:"aath — like 'art' with 'th'",cat:"Numbers",hint:"Almost identical to the German word — just softer!",hintDe:"Klingt wie 'Acht' ohne 'ch' — fast identisch!",trick:"Klingt wie 'Acht'.",example:{hi:"आठ बजे नाश्ता।",en:"Breakfast at eight.",de:"Frühstück um acht.",tl:"Aath baje naashta."}},
  {id:9,front:"Nine (9)",frontDe:"Neun (9)",back:"नौ (९)",tl:"Nau",pron:"now — like English 'now'",cat:"Numbers",hint:"Sounds exactly like 'now' — nine is now!",hintDe:"'Nau' klingt wie 'neu' — neun ist 'neu'!",trick:"Klingt wie 'neu'.",example:{hi:"नौ लोग हैं।",en:"There are nine people.",de:"Es sind neun Leute.",tl:"Nau log hain."}},
  {id:10,front:"Ten (10)",frontDe:"Zehn (10)",back:"दस (१०)",tl:"Das",pron:"thus — without the 'th'",cat:"Numbers",hint:"German speakers: this is also a German word! '___' ist zehn.",hintDe:"'Das' ist auch deutsch! Das = zehn.",trick:"'Das' ist auch deutsch.",example:{hi:"दस मिनट और।",en:"Ten more minutes.",de:"Noch zehn Minuten.",tl:"Das minute aur."}},
  {id:11,front:"Father",frontDe:"Vater",back:"पिता",tl:"Pitaa",pron:"pi-TAA",cat:"Family & People",hint:"Think of a flat bread starting with the same letters.",hintDe:"Klingt wie 'Pita'-Brot — Vater bringt Pita mit.",trick:"'Pita'-Brot.",example:{hi:"मेरे पिता अंदर हैं।",en:"My father is inside.",de:"Mein Vater ist drinnen.",tl:"Mere pitaa andar hain."}},
  {id:12,front:"Sister",frontDe:"Schwester",back:"बहन",tl:"Behen",pron:"beh-HEN",cat:"Family & People",hint:"Sounds like a farm bird with 'b' at the start.",hintDe:"'Behen' — Schwester bahnt mir den Weg.",trick:"'Behen' — bahnt den Weg.",example:{hi:"मेरी बहन जवान है।",en:"My sister is young.",de:"Meine Schwester ist jung.",tl:"Meri behen javaan hai."}},
  {id:13,front:"Relative",frontDe:"Verwandter",back:"रिश्तेदार",tl:"Rishtedaar",pron:"rish-tay-DAAR",cat:"Family & People",hint:"'Rishta' = relationship + '-daar' (keeper).",hintDe:"'Rishte' — Verwandte reichen die Hand.",trick:"Verwandte reichen die Hand.",example:{hi:"मेरे रिश्तेदार यहाँ हैं।",en:"My relatives are here.",de:"Meine Verwandten sind hier.",tl:"Mere rishtedaar yahan hain."}},
  {id:14,front:"Neighbour",frontDe:"Nachbar",back:"पड़ोसी",tl:"Padosi",pron:"pa-ROH-see",cat:"Family & People",hint:"Sounds like 'paradise' — the person next door.",hintDe:"'Padosi' — 'Paradiso' nebenan.",trick:"'Paradiso' nebenan.",example:{hi:"हमारे पड़ोसी अच्छे हैं।",en:"Our neighbours are nice.",de:"Unsere Nachbarn sind nett.",tl:"Hamare padosi acche hain."}},
  {id:15,front:"Guest",frontDe:"Gast",back:"मेहमान",tl:"Mehmaan",pron:"meh-MAAN",cat:"Family & People",hint:"'More' + 'man' — more people visiting!",hintDe:"'Mehr Mann' kommt zu Besuch!",trick:"'Mehr Mann' kommt.",example:{hi:"मेहमान आ रहे हैं।",en:"Guests are coming.",de:"Gäste kommen.",tl:"Mehmaan aa rahe hain."}},
  {id:16,front:"Man",frontDe:"Mann",back:"आदमी",tl:"Aadmi",pron:"AAD-mee",cat:"Family & People",hint:"Think of the first man — starts with 'A'.",hintDe:"Wie 'Adam' + i — der erste Mann.",trick:"Wie 'Adam'.",example:{hi:"वह एक अच्छा आदमी है।",en:"He is a good man.",de:"Er ist ein guter Mann.",tl:"Woh ek accha aadmi hai."}},
  {id:17,front:"Anybody",frontDe:"Irgendjemand",back:"कोई भी",tl:"Koi bhi",pron:"KOY bhee",cat:"Family & People",hint:"First word = colorful fish. Second = 'also'.",hintDe:"'Koi' (Fisch) — jeder Koi im Teich.",trick:"Jeder Koi im Teich.",example:{hi:"कोई भी आ सकता है।",en:"Anybody can come.",de:"Jeder kann kommen.",tl:"Koi bhi aa sakta hai."}},
  {id:109,front:"Customer",frontDe:"Kunde",back:"ग्राहक",tl:"Graahak",pron:"GRAA-hak",cat:"Family & People",hint:"Starts with 'graa' — they GRAB at deals!",hintDe:"'Graahak' — Kunde hackt nach Angeboten!",trick:"Kunde hackt.",example:{hi:"ग्राहक हमेशा सही है।",en:"The customer is always right.",de:"Der Kunde hat immer recht.",tl:"Graahak hamesha sahi hai."}},
  {id:120,front:"Person",frontDe:"Person",back:"इंसान",tl:"Insaan",pron:"in-SAAN",cat:"Family & People",hint:"Sounds like 'in-sane' — every person is unique!",hintDe:"'Insaan' — jeder Mensch ist einzigartig!",trick:"Jeder Mensch ist einzigartig.",example:{hi:"हर इंसान अलग है।",en:"Every person is different.",de:"Jeder Mensch ist anders.",tl:"Har insaan alag hai."}},
  {id:121,front:"Partner",frontDe:"Partner",back:"साथी",tl:"Saathi",pron:"SAA-thee",cat:"Family & People",hint:"Related to 'saath' (with) — someone WITH you.",hintDe:"Von 'Saath' (mit) — der Mit-Mensch!",trick:"Der Mit-Mensch.",example:{hi:"मेरा साथी ठीक है।",en:"My partner is fine.",de:"Meinem Partner geht's gut.",tl:"Mera saathi theek hai."}},
  {id:18,front:"Hand",frontDe:"Hand",back:"हाथ",tl:"Haath",pron:"haath — like 'heart' with 'th'",cat:"Body Parts",hint:"Sounds like reaching for your 'heart'.",hintDe:"'Haath' wie 'hat' — Hand hat fünf Finger.",trick:"Hand hat fünf Finger.",example:{hi:"हाथ साफ़ करो।",en:"Clean your hands.",de:"Händ waschen.",tl:"Haath saaf karo."}},
  {id:19,front:"Head",frontDe:"Kopf",back:"सिर",tl:"Sir",pron:"sir — like English 'sir'",cat:"Body Parts",hint:"How you address authority — he leads with his ___.",hintDe:"'Sir' — Krone auf dem Kopf!",trick:"Krone auf dem Kopf.",example:{hi:"मेरा सिर दुखता है।",en:"My head hurts.",de:"Mein Kopf tut weh.",tl:"Mera sir dukhta hai."}},
  {id:20,front:"Ear",frontDe:"Ohr",back:"कान",tl:"Kaan",pron:"kaan — long 'aa'",cat:"Body Parts",hint:"Sounds like a boat (Kahn) — shaped like one!",hintDe:"'Kahn' — Ohr hat die Form eines Kahns!",trick:"Form eines Kahns.",example:{hi:"कान से सुनो।",en:"Listen with your ears.",de:"Hör mit deinen Ohren.",tl:"Kaan se suno."}},
  {id:98,front:"Foot",frontDe:"Fuß",back:"पैर",tl:"Pair",pron:"pair — like English 'pair'",cat:"Body Parts",hint:"Like 'pair' — you have a ___ of them!",hintDe:"'Paar' — ein Paar Füße hat man immer!",trick:"Ein Paar Füße.",example:{hi:"पैर मत हिलाओ।",en:"Don't shake your foot.",de:"Wackel nicht mit dem Fuß.",tl:"Pair mat hilao."}},
  {id:122,front:"Tongue",frontDe:"Zunge",back:"जीभ",tl:"Jeebh",pron:"JEEBH — soft 'bh'",cat:"Body Parts",hint:"Starts with 'jee' — helps you say 'ji' (yes, sir)!",hintDe:"'Jeebh' — die Zunge hilft dir 'ji' zu sagen!",trick:"Die Zunge sagt 'ji'.",example:{hi:"जीभ मत दिखाओ।",en:"Don't show your tongue.",de:"Zeig nicht die Zunge.",tl:"Jeebh mat dikhao."}},
  {id:21,front:"Rain",frontDe:"Regen",back:"बारिश",tl:"Baarish",pron:"BAA-rish",cat:"Nature & Weather",hint:"Starts with 'baa' — sheep caught in the ___!",hintDe:"'Baarish' — barsch wenn es regnet.",trick:"Barsch wenn es regnet.",example:{hi:"बारिश हो रही है।",en:"It is raining.",de:"Es regnet.",tl:"Baarish ho rahi hai."}},
  {id:22,front:"Wind",frontDe:"Wind",back:"हवा",tl:"Havaa",pron:"ha-VAA",cat:"Nature & Weather",hint:"Think of a tropical island starting with 'H'.",hintDe:"'Hawaii' — wo der Wind immer weht!",trick:"Hawaii.",example:{hi:"आज हवा तेज़ है।",en:"The wind is strong today.",de:"Heute ist der Wind stark.",tl:"Aaj havaa tez hai."}},
  {id:23,front:"River",frontDe:"Fluss",back:"नदी",tl:"Nadi",pron:"na-DEE",cat:"Nature & Weather",hint:"A girl's name 'Nadia' comes from this word.",hintDe:"'Nadi' — wie 'Nadel' fließt durch Stoff.",trick:"Nadel fließt.",example:{hi:"नदी पास है।",en:"The river is near.",de:"Der Fluss ist nah.",tl:"Nadi paas hai."}},
  {id:24,front:"Ocean",frontDe:"Ozean",back:"समुद्र",tl:"Samudra",pron:"sa-MOOD-ra",cat:"Nature & Weather",hint:"The ___ puts you in a good mood!",hintDe:"'So viel Mud' gibt's nur im Ozean!",trick:"So viel Mud.",example:{hi:"समुद्र सुन्दर है।",en:"The ocean is beautiful.",de:"Der Ozean ist schön.",tl:"Samudra sundar hai."}},
  {id:25,front:"Rose",frontDe:"Rose",back:"गुलाब",tl:"Gulaab",pron:"goo-LAAB",cat:"Nature & Weather",hint:"A famous Indian dessert ball is named after this.",hintDe:"'Guck mal Lab!' — Rose im Labor!",trick:"Rose im Labor.",example:{hi:"गुलाब लाल है।",en:"The rose is red.",de:"Die Rose ist rot.",tl:"Gulaab laal hai."}},
  {id:26,front:"Weather",frontDe:"Wetter",back:"मौसम",tl:"Mausam",pron:"MOW-sam",cat:"Nature & Weather",hint:"A small animal watching from the window.",hintDe:"'Maus am' Fenster beobachtet das Wetter.",trick:"Maus am Fenster.",example:{hi:"आज मौसम अच्छा है।",en:"Today the weather is nice.",de:"Heute ist das Wetter gut.",tl:"Aaj mausam accha hai."}},
  {id:27,front:"World",frontDe:"Welt",back:"दुनिया",tl:"Duniya",pron:"doo-nee-YAA",cat:"Nature & Weather",hint:"Sandy hills (d___s) exist all around the ___.",hintDe:"'Düne, ja!' — Dünen überall auf der Welt.",trick:"Dünen überall.",example:{hi:"दुनिया बड़ी है।",en:"The world is big.",de:"Die Welt ist groß.",tl:"Duniya badi hai."}},
  {id:123,front:"Forest",frontDe:"Wald",back:"जंगल",tl:"Jungle",pron:"JUN-gul",cat:"Nature & Weather",hint:"This Hindi word became an English word — you know it!",hintDe:"Dieses Hindi-Wort wurde zum englischen 'Jungle'!",trick:"Jungle kommt aus dem Hindi.",example:{hi:"जंगल में हवा ठंडी है।",en:"The wind is cold in the forest.",de:"Der Wind ist kalt im Wald.",tl:"Jungle mein havaa thandi hai."}},
  {id:28,front:"Colour",frontDe:"Farbe",back:"रंग",tl:"Rang",pron:"rung — like a ladder rung",cat:"Colors",hint:"Like a step on a ladder — each one a different shade.",hintDe:"'Rang' — Farben haben einen Rang!",trick:"Farben haben Rang.",example:{hi:"कौन सा रंग?",en:"Which colour?",de:"Welche Farbe?",tl:"Kaun sa rang?"}},
  {id:29,front:"White",frontDe:"Weiß",back:"सफ़ेद",tl:"Safed",pron:"sa-FEYD",cat:"Colors",hint:"Starts like 'safe' — a ___ flag = safety.",hintDe:"'Safe' — weiße Flagge = sicher!",trick:"Weiße Flagge = sicher.",example:{hi:"दूध सफ़ेद है।",en:"Milk is white.",de:"Milch ist weiß.",tl:"Doodh safed hai."}},
  {id:30,front:"Orange",frontDe:"Orange",back:"नारंगी",tl:"Naarangi",pron:"naa-RAN-gee",cat:"Colors",hint:"'Rang' (colour) is hidden inside this word!",hintDe:"'Rang' steckt im Wort drin!",trick:"Rang steckt drin.",example:{hi:"नारंगी रंग सुन्दर है।",en:"Orange is beautiful.",de:"Orange ist schön.",tl:"Naarangi rang sundar hai."}},
  {id:31,front:"Brown",frontDe:"Braun",back:"भूरा",tl:"Bhura",pron:"BHOO-raa",cat:"Colors",hint:"Sounds like 'boo-rah' — old castles are this colour.",hintDe:"'Burg' — alte Burgen sind braun.",trick:"Alte Burgen = braun.",example:{hi:"ज़मीन भूरी है।",en:"The ground is brown.",de:"Der Boden ist braun.",tl:"Zameen bhuri hai."}},
  {id:32,front:"Sugar",frontDe:"Zucker",back:"चीनी",tl:"Cheeni",pron:"CHEE-nee",cat:"Food & Home",hint:"Also the Hindi word for 'Chinese' — historical connection!",hintDe:"'Cheeni' — Zucker kam aus China!",trick:"Zucker aus China.",example:{hi:"चीनी डालो।",en:"Add sugar.",de:"Zucker hinzufügen.",tl:"Cheeni daalo."}},
  {id:33,front:"Food",frontDe:"Essen",back:"खाना",tl:"Khaana",pron:"KHAA-naa",cat:"Food & Home",hint:"The guttural start mimics chewing!",hintDe:"'Kahn-a' — im Kahn isst man.",trick:"Im Kahn isst man.",example:{hi:"खाना तैयार है।",en:"Food is ready.",de:"Essen ist fertig.",tl:"Khaana taiyaar hai."}},
  {id:34,front:"Fruits",frontDe:"Obst",back:"फल",tl:"Phal",pron:"full — aspirated 'ph'",cat:"Food & Home",hint:"Sounds like 'fall' — they ___ from trees!",hintDe:"Wie 'Fall' — Obst fällt vom Baum!",trick:"Obst fällt.",example:{hi:"फल ताज़ा है।",en:"Fruits are fresh.",de:"Obst ist frisch.",tl:"Phal taaza hai."}},
  {id:35,front:"Knife",frontDe:"Messer",back:"छुरी / चाकू",tl:"Chhuri / Chaaku",pron:"CHHOO-ree / CHAA-koo",cat:"Food & Home",hint:"Both start with 'ch' — small vs big blade.",hintDe:"'Chhuri' für Küchenmesser, 'Chaaku' für größere.",trick:"Kurier bringt das Messer.",example:{hi:"चाकू पास में है।",en:"The knife is nearby.",de:"Das Messer ist in der Nähe.",tl:"Chaaku paas mein hai."}},
  {id:36,front:"Curtain",frontDe:"Vorhang",back:"पर्दा",tl:"Parda",pron:"PAR-daa",cat:"Food & Home",hint:"Starts like 'pardon' — excuse me!",hintDe:"'Pardon' — der Vorhang geht auf!",trick:"Pardon — Vorhang auf.",example:{hi:"पर्दा बंद करो।",en:"Close the curtain.",de:"Mach den Vorhang zu.",tl:"Parda band karo."}},
  {id:37,front:"Wall",frontDe:"Wand",back:"दीवार",tl:"Deevaar",pron:"dee-VAAR",cat:"Food & Home",hint:"Contains 'vaar' — truth (Wahrheit) is on the ___.",hintDe:"'Die Wahrheit' steht an der Wand.",trick:"Wahrheit an der Wand.",example:{hi:"दीवार सफ़ेद है।",en:"The wall is white.",de:"Die Wand ist weiß.",tl:"Deevaar safed hai."}},
  {id:38,front:"Car",frontDe:"Auto",back:"गाड़ी",tl:"Gaadi",pron:"GAA-dee",cat:"Food & Home",hint:"Starts with 'gaa' — let's GO!",hintDe:"'Geh die' Straße entlang.",trick:"Geh die Straße.",example:{hi:"गाड़ी बाहर है।",en:"The car is outside.",de:"Das Auto ist draußen.",tl:"Gaadi baahar hai."}},
  {id:99,front:"Apple",frontDe:"Apfel",back:"सेब",tl:"Seb",pron:"sayb",cat:"Food & Home",hint:"Sounds like 'sieve' — press for juice.",hintDe:"'Sieb' — Äpfel durch ein Sieb!",trick:"Sieb.",example:{hi:"एक सेब खाओ।",en:"Eat an apple.",de:"Iss einen Apfel.",tl:"Ek seb khao."}},
  {id:100,front:"Vegetable",frontDe:"Gemüse",back:"सब्ज़ी",tl:"Sabzi",pron:"SUB-zee",cat:"Food & Home",hint:"Like 'sub' — a veggie sub sandwich!",hintDe:"'Sabzi' — Gemüse als Substitute!",trick:"Gemüse als Sub.",example:{hi:"सब्ज़ी लाओ।",en:"Bring vegetables.",de:"Bring Gemüse.",tl:"Sabzi lao."}},
  {id:101,front:"Banana",frontDe:"Banane",back:"केला",tl:"Kelaa",pron:"KAY-laa",cat:"Food & Home",hint:"Sounds like 'cellar' — ripen in cool places.",hintDe:"'Keller' — Bananen reifen im Keller!",trick:"Keller.",example:{hi:"केला पीला है।",en:"Banana is yellow.",de:"Die Banane ist gelb.",tl:"Kelaa peela hai."}},
  {id:112,front:"Egg",frontDe:"Ei",back:"अंडा",tl:"Andaa",pron:"UN-daa",cat:"Food & Home",hint:"Starts like 'under' — found ___ a chicken!",hintDe:"'Anders' — ein Ei ist anders!",trick:"Anders als alles.",example:{hi:"अंडा पकाओ।",en:"Cook the egg.",de:"Koch das Ei.",tl:"Andaa pakao."}},
  {id:113,front:"Mirror",frontDe:"Spiegel",back:"शीशा",tl:"Sheeshaa",pron:"SHEE-shaa",cat:"Food & Home",hint:"Like a hookah pipe — both are glass.",hintDe:"Wie 'Shisha' — spiegelt Licht!",trick:"Shisha spiegelt.",example:{hi:"शीशा साफ़ करो।",en:"Clean the mirror.",de:"Putz den Spiegel.",tl:"Sheeshaa saaf karo."}},
  {id:115,front:"Breakfast",frontDe:"Frühstück",back:"नाश्ता",tl:"Naashta",pron:"NAASH-taa",cat:"Food & Home",hint:"'Naash' = 'naschen' (German: snack) — morning snacking!",hintDe:"'Nascht-a' — morgens naschen = frühstücken!",trick:"Morgens naschen.",example:{hi:"नाश्ता तैयार है।",en:"Breakfast is ready.",de:"Frühstück ist fertig.",tl:"Naashta taiyaar hai."}},
  {id:124,front:"Bell",frontDe:"Glocke",back:"घंटी",tl:"Ghanti",pron:"GHUN-tee",cat:"Food & Home",hint:"Guttural 'gh' vibrates — like a ___!",hintDe:"'Ghanti' — wie 'Gong-ti'!",trick:"Gong + Glocke.",example:{hi:"घंटी बज रही है।",en:"The bell is ringing.",de:"Die Glocke läutet.",tl:"Ghanti baj rahi hai."}},
  {id:125,front:"Electricity",frontDe:"Strom",back:"बिजली",tl:"Bijli",pron:"BIJ-lee",cat:"Food & Home",hint:"'Bij' sounds like a spark — zzzt!",hintDe:"'Bijli' — bis das Licht kommt!",trick:"Bis Licht kommt.",example:{hi:"बिजली नहीं है।",en:"No electricity.",de:"Kein Strom.",tl:"Bijli nahin hai."}},
  {id:39,front:"City",frontDe:"Stadt",back:"शहर",tl:"Sheher",pron:"sheh-HER",cat:"Places",hint:"'She' is 'here' in the big town!",hintDe:"'Schere' — scharf und lebendig.",trick:"Scharf und lebendig.",example:{hi:"शहर बड़ा है।",en:"The city is big.",de:"Die Stadt ist groß.",tl:"Sheher bada hai."}},
  {id:40,front:"Village",frontDe:"Dorf",back:"गाँव",tl:"Gaanv",pron:"gaanv",cat:"Places",hint:"Sounds like 'ganz' — one whole little ___.",hintDe:"'Ganz' — ein ganzes kleines Dorf.",trick:"Ganzes kleines Dorf.",example:{hi:"गाँव पास है।",en:"Village is near.",de:"Das Dorf ist nah.",tl:"Gaanv paas hai."}},
  {id:41,front:"Inside",frontDe:"Drinnen",back:"अंदर",tl:"Andar",pron:"UN-dar",cat:"Places",hint:"Sounds like 'under' — go ___ the roof.",hintDe:"'Anders' — drinnen ist es anders!",trick:"Drinnen ist anders.",example:{hi:"अंदर आओ।",en:"Come inside.",de:"Komm rein.",tl:"Andar aao."}},
  {id:42,front:"Outside",frontDe:"Draußen",back:"बाहर",tl:"Baahar",pron:"BAA-har",cat:"Places",hint:"'Baa' — the sheep goes ___ to the field.",hintDe:"'Bahre' — steht draußen.",trick:"Bahre steht draußen.",example:{hi:"बाहर जाओ।",en:"Go outside.",de:"Geh raus.",tl:"Baahar jao."}},
  {id:43,front:"Near",frontDe:"Nah",back:"पास",tl:"Paas",pron:"paas — like 'pass'",cat:"Places",hint:"Like a mountain 'pass' — it's close by!",hintDe:"'Pass' — der Gebirgspass ist nah!",trick:"Gebirgspass.",example:{hi:"बाज़ार पास है।",en:"Market is near.",de:"Der Markt ist nah.",tl:"Bazaar paas hai."}},
  {id:44,front:"Month",frontDe:"Monat",back:"महीना",tl:"Maheena",pron:"ma-HEE-naa",cat:"Time",hint:"Contains 'hee-na' — machine that cycles monthly.",hintDe:"'Maschine-a' — Monats-Maschine.",trick:"Monats-Maschine.",example:{hi:"एक महीना बाद।",en:"After one month.",de:"Nach einem Monat.",tl:"Ek maheena baad."}},
  {id:45,front:"December",frontDe:"Dezember",back:"दिसंबर",tl:"Disambar",pron:"di-SUM-bar",cat:"Time",hint:"Almost identical — just a slight accent change!",hintDe:"Fast identisch — 'Disambar' ≈ 'Dezember'!",trick:"Dezember.",example:{hi:"दिसंबर में सर्दी है।",en:"December is cold.",de:"Dezember ist kalt.",tl:"Disambar mein sardi hai."}},
  {id:46,front:"Date",frontDe:"Datum",back:"तारीख़",tl:"Taareekh",pron:"taa-REEKH",cat:"Time",hint:"Sounds like a person's name — ask them!",hintDe:"Frag Tarik nach dem Datum!",trick:"Frag Tarik.",example:{hi:"आज की तारीख़?",en:"Today's date?",de:"Welches Datum?",tl:"Aaj ki taareekh?"}},
  {id:47,front:"Day",frontDe:"Tag",back:"दिन",tl:"Din",pron:"din",cat:"Time",hint:"Like 'din' (noise) — every ___ has its sounds.",hintDe:"'Ding' ohne g — neues Ding jeden Tag!",trick:"Ding ohne g.",example:{hi:"अच्छा दिन है।",en:"Good day.",de:"Guter Tag.",tl:"Accha din hai."}},
  {id:48,front:"Birthday",frontDe:"Geburtstag",back:"जन्मदिन",tl:"Janamdin",pron:"ja-NAM-din",cat:"Time",hint:"Birth (janam) + day (din) = ___. Like German!",hintDe:"Janam + din — wie 'Geburts-tag'!",trick:"Geburts-tag.",example:{hi:"जन्मदिन मुबारक!",en:"Happy birthday!",de:"Alles Gute zum Geburtstag!",tl:"Janamdin mubarak!"}},
  {id:49,front:"Often",frontDe:"Oft",back:"अक्सर",tl:"Aksar",pron:"UK-sar",cat:"Time",hint:"Starts like 'UK' — I ___ hear accents there.",hintDe:"'Akzent' — oft einen Akzent hören.",trick:"Akzent.",example:{hi:"मैं अक्सर आता हूँ।",en:"I come often.",de:"Ich komme oft.",tl:"Main aksar aata hoon."}},
  {id:50,front:"Always",frontDe:"Immer",back:"हमेशा",tl:"Hamesha",pron:"ha-MAY-sha",cat:"Time",hint:"Ha! My sha(tz) — I love you ___!",hintDe:"'Ha, Me, Schatz!' — ich liebe dich immer!",trick:"Ha, Me, Schatz!",example:{hi:"हमेशा साथ।",en:"Always together.",de:"Immer zusammen.",tl:"Hamesha saath."}},
  {id:102,front:"Later",frontDe:"Später",back:"बाद में",tl:"Baad mein",pron:"baad mayn",cat:"Time",hint:"'Baad' sounds like 'bath' — I'll bathe ___.",hintDe:"'Bad' — später ins Bad!",trick:"Später ins Bad.",example:{hi:"बाद में बात करें।",en:"Talk later.",de:"Reden wir später.",tl:"Baad mein baat karein."}},
  {id:103,front:"Immediately",frontDe:"Sofort",back:"तुरंत",tl:"Turant",pron:"too-RUNT",cat:"Time",hint:"Sounds like 'to-rant' — they want it NOW!",hintDe:"'Turnen, rannt' — sofort zum Turnen gerannt!",trick:"Turnen gerannt.",example:{hi:"तुरंत आओ!",en:"Come now!",de:"Komm sofort!",tl:"Turant aao!"}},
  {id:51,front:"Happiness",frontDe:"Glück",back:"ख़ुशी",tl:"Khushi",pron:"KHOO-shee",cat:"Emotions",hint:"Sounds like 'cushy' — a cushy life = ___!",hintDe:"'Kuschel-i' — Kuscheln macht glücklich!",trick:"Kuscheln = glücklich.",example:{hi:"ख़ुशी बड़ी चीज़ है।",en:"Happiness is big.",de:"Glück ist wichtig.",tl:"Khushi badi cheez hai."}},
  {id:52,front:"Anger",frontDe:"Wut",back:"गुस्सा",tl:"Gussa",pron:"GOOS-saa",cat:"Emotions",hint:"Like a 'gust' of emotion — blows out suddenly!",hintDe:"'Guss' — Wutausbruch wie Regenguss!",trick:"Regenguss der Wut.",example:{hi:"गुस्सा मत करो।",en:"Don't be angry.",de:"Sei nicht wütend.",tl:"Gussa mat karo."}},
  {id:53,front:"Dream",frontDe:"Traum",back:"सपना",tl:"Sapna",pron:"SUP-naa",cat:"Emotions",hint:"Sounds like 'sauna' — you drift off and ___.",hintDe:"'Sauna' — man träumt in der Sauna.",trick:"Sauna — träumen.",example:{hi:"सपना बड़ा है।",en:"The dream is big.",de:"Der Traum ist groß.",tl:"Sapna bada hai."}},
  {id:54,front:"Fun",frontDe:"Spaß",back:"मज़ा",tl:"Mazaa",pron:"ma-ZAA",cat:"Emotions",hint:"Sounds like 'matza' — baking party!",hintDe:"'Matza' backen macht Spaß!",trick:"Matza backen.",example:{hi:"बहुत मज़ा आया!",en:"So much fun!",de:"Hat viel Spaß gemacht!",tl:"Bahut mazaa aaya!"}},
  {id:55,front:"Health",frontDe:"Gesundheit",back:"सेहत",tl:"Sehat",pron:"SEH-hat",cat:"Emotions",hint:"'Seh-hat' — who can SEE well HAS good ___.",hintDe:"'Seh hat' — wer gut sieht, ist gesund!",trick:"Seh hat = gesund.",example:{hi:"सेहत का ध्यान रखो।",en:"Take care of health.",de:"Pass auf deine Gesundheit auf.",tl:"Sehat ka dhyaan rakho."}},
  {id:126,front:"Worries",frontDe:"Sorgen",back:"चिंता",tl:"Chintaa",pron:"CHIN-taa",cat:"Emotions",hint:"Chin-deep in trouble = full of ___!",hintDe:"'Chin-ta(uchen)' — bis zum Kinn in Sorgen!",trick:"Bis zum Kinn.",example:{hi:"चिंता मत करो।",en:"Don't worry.",de:"Mach dir keine Sorgen.",tl:"Chintaa mat karo."}},
  {id:56,front:"Different",frontDe:"Anders",back:"अलग",tl:"Alag",pron:"a-LUG",cat:"Adjectives",hint:"'A-lag' — there's a lag because it's NOT the same.",hintDe:"'Alltag' — jeder Alltag ist anders.",trick:"Jeder Alltag ist anders.",example:{hi:"यह अलग है।",en:"This is different.",de:"Das ist anders.",tl:"Yeh alag hai."}},
  {id:57,front:"Polite",frontDe:"Höflich",back:"विनम्र",tl:"Vinamra",pron:"vi-NUM-ra",cat:"Adjectives",hint:"'Vi' (very) + 'namra' (bowing) = very respectful.",hintDe:"'Fein-Ammer' — eine höfliche Ammer.",trick:"Höfliche Ammer.",example:{hi:"विनम्र रहो।",en:"Be polite.",de:"Sei höflich.",tl:"Vinamra raho."}},
  {id:58,front:"Honest",frontDe:"Ehrlich",back:"ईमानदार",tl:"Imaandaar",pron:"ee-MAAN-daar",cat:"Adjectives",hint:"'Imaan' (faith) + 'daar' (keeper) = faith-keeper.",hintDe:"Der Imam ist ehrlich!",trick:"Imam = ehrlich.",example:{hi:"ईमानदार रहो।",en:"Be honest.",de:"Sei ehrlich.",tl:"Imaandaar raho."}},
  {id:59,front:"Fast",frontDe:"Schnell",back:"तेज़ / जल्दी",tl:"Tez / Jaldi",pron:"tayz / JUL-dee",cat:"Adjectives",hint:"First rhymes with 'days'. Second: '___ karo!' = Hurry up!",hintDe:"'Tez' = schnell. 'Jaldi karo!' = Beeil dich!",trick:"Tess rennt schnell.",example:{hi:"जल्दी करो!",en:"Hurry up!",de:"Beeil dich!",tl:"Jaldi karo!"}},
  {id:60,front:"Cheap",frontDe:"Billig",back:"सस्ता",tl:"Sasta",pron:"SUS-taa",cat:"Adjectives",hint:"Rhymes with 'pasta' — budget pasta!",hintDe:"'Pasta' — billige Pasta ist 'sasta'!",trick:"Billige Pasta.",example:{hi:"यह सस्ता है।",en:"This is cheap.",de:"Das ist billig.",tl:"Yeh sasta hai."}},
  {id:61,front:"Clean",frontDe:"Sauber",back:"साफ़",tl:"Saaf",pron:"saaf",cat:"Adjectives",hint:"Sounds like 'Saft' (juice) — fresh ___ juice.",hintDe:"'Saft' — sauberer Saft!",trick:"Sauberer Saft.",example:{hi:"घर साफ़ है।",en:"House is clean.",de:"Das Haus ist sauber.",tl:"Ghar saaf hai."}},
  {id:62,front:"Dry",frontDe:"Trocken",back:"सूखा",tl:"Sookha",pron:"SOO-khaa",cat:"Adjectives",hint:"Like 'sue' — searching for ___ land.",hintDe:"'Suche' — trockenes Land suchen.",trick:"Trockenes Land suchen.",example:{hi:"कपड़े सूखे हैं।",en:"Clothes are dry.",de:"Die Kleidung ist trocken.",tl:"Kapde sookhe hain."}},
  {id:63,front:"Wet",frontDe:"Nass",back:"गीला",tl:"Geela",pron:"GEE-laa",cat:"Adjectives",hint:"Like 'gelato' — melts and gets everything ___!",hintDe:"'Gelato' — schmilzt und wird nass!",trick:"Gelato schmilzt.",example:{hi:"सब गीला है।",en:"Everything is wet.",de:"Alles ist nass.",tl:"Sab geela hai."}},
  {id:64,front:"Easy",frontDe:"Einfach",back:"आसान",tl:"Aasaan",pron:"aa-SAAN",cat:"Adjectives",hint:"Starts with 'aah' — relief because it's ___!",hintDe:"'Ah, so angenehm!' — leicht!",trick:"Angenehm = leicht.",example:{hi:"हिंदी आसान है।",en:"Hindi is easy.",de:"Hindi ist einfach.",tl:"Hindi aasaan hai."}},
  {id:65,front:"Difficult",frontDe:"Schwierig",back:"मुश्किल",tl:"Mushkil",pron:"MUSH-kil",cat:"Adjectives",hint:"Like opening a 'mussel' — prying apart is ___.",hintDe:"'Muschel' — schwer zu öffnen!",trick:"Muschel öffnen.",example:{hi:"बहुत मुश्किल है।",en:"Very difficult.",de:"Sehr schwierig.",tl:"Bahut mushkil hai."}},
  {id:66,front:"Bad",frontDe:"Schlecht",back:"बुरा",tl:"Buraa",pron:"boo-RAA",cat:"Adjectives",hint:"'Boo!' — the crowd boos at something ___.",hintDe:"'Buhrufe' — Buhrufe sind schlecht!",trick:"Buhrufe = schlecht.",example:{hi:"बुरा मत मानो।",en:"Don't feel bad.",de:"Nimm's nicht übel.",tl:"Buraa mat maano."}},
  {id:67,front:"Interesting",frontDe:"Interessant",back:"दिलचस्प",tl:"Dilchasp",pron:"dil-CHUSP",cat:"Adjectives",hint:"'Dil' = heart. Something gripping your heart.",hintDe:"Was am Herzen (Dil) klebt, ist interessant!",trick:"Am Herzen kleben.",example:{hi:"बहुत दिलचस्प।",en:"Very interesting.",de:"Sehr interessant.",tl:"Bahut dilchasp."}},
  {id:68,front:"Enough",frontDe:"Genug",back:"काफ़ी / बस",tl:"Kaafi / Bas",pron:"KAA-fee / bus",cat:"Adjectives",hint:"First = hot drink. Second = vehicle that STOPS!",hintDe:"'Kaffee' genug! 'Bus' — Stopp!",trick:"Kaffee + Bus = Stopp.",example:{hi:"बस! काफ़ी है।",en:"Stop! Enough.",de:"Stopp! Genug.",tl:"Bas! Kaafi hai."}},
  {id:104,front:"Young",frontDe:"Jung",back:"जवान",tl:"Javaan",pron:"ja-VAAN",cat:"Adjectives",hint:"Sounds like a programming language — ___ people learn it.",hintDe:"'Java-n' — junge Leute coden Java!",trick:"Java = jung.",example:{hi:"वह जवान है।",en:"He/she is young.",de:"Er/sie ist jung.",tl:"Woh javaan hai."}},
  {id:111,front:"Cold",frontDe:"Kalt",back:"सर्दी",tl:"Sardi",pron:"SAR-dee",cat:"Adjectives",hint:"Small fish in ___ water.",hintDe:"'Sardine' — im kalten Wasser!",trick:"Sardine.",example:{hi:"बहुत सर्दी है।",en:"Very cold.",de:"Sehr kalt.",tl:"Bahut sardi hai."}},
  {id:127,front:"Wrong",frontDe:"Falsch",back:"ग़लत",tl:"Galat",pron:"ga-LUT",cat:"Adjectives",hint:"Like 'galoot' — clumsy person gets it ___!",hintDe:"'Galopp' — im Galopp macht man Fehler!",trick:"Im Galopp = Fehler.",example:{hi:"यह ग़लत है।",en:"This is wrong.",de:"Das ist falsch.",tl:"Yeh galat hai."}},
  {id:128,front:"Empty",frontDe:"Leer",back:"ख़ाली",tl:"Khaali",pron:"KHAA-lee",cat:"Adjectives",hint:"Guttural 'kh' — sounds hollow and ___!",hintDe:"'Kahl' — ein kahler Raum ist leer!",trick:"Kahl = leer.",example:{hi:"गिलास ख़ाली है।",en:"Glass is empty.",de:"Das Glas ist leer.",tl:"Gilaas khaali hai."}},
  {id:69,front:"To speak",frontDe:"Sprechen",back:"बोलना",tl:"Bolnaa",pron:"BOWL-naa",cat:"Verbs",hint:"People shout at the bowling alley!",hintDe:"'Bowling' — beim Bowling spricht man laut!",trick:"Bowling.",example:{hi:"हिंदी बोलो।",en:"Speak Hindi.",de:"Sprich Hindi.",tl:"Hindi bolo."}},
  {id:70,front:"To learn",frontDe:"Lernen",back:"सीखना",tl:"Seekhna",pron:"SEEKH-naa",cat:"Verbs",hint:"Starts like 'seek' — seek knowledge!",hintDe:"'Seek knowledge' — Wissen suchen!",trick:"Wissen suchen.",example:{hi:"हिंदी सीखो।",en:"Learn Hindi.",de:"Lerne Hindi.",tl:"Hindi seekho."}},
  {id:71,front:"To walk",frontDe:"Gehen",back:"चलना",tl:"Chalnaa",pron:"CHUL-naa",cat:"Verbs",hint:"'Chal!' = 'Let's go!' — most common command.",hintDe:"'Schall' — beim Gehen macht man Schall!",trick:"Schall beim Gehen.",example:{hi:"चलो बाहर।",en:"Let's go outside.",de:"Lass uns rausgehen.",tl:"Chalo baahar."}},
  {id:72,front:"To read",frontDe:"Lesen",back:"पढ़ना",tl:"Padhna",pron:"PUDH-naa",cat:"Verbs",hint:"Like a tablet — you ___ on a pad!",hintDe:"'Pad' — auf dem Pad liest man!",trick:"Pad = lesen.",example:{hi:"किताब पढ़ो।",en:"Read a book.",de:"Lies ein Buch.",tl:"Kitaab padho."}},
  {id:73,front:"To ask",frontDe:"Fragen",back:"पूछना",tl:"Poochhnaa",pron:"POOCHH-naa",cat:"Verbs",hint:"'Pooch' — a dog always ___ for treats!",hintDe:"'Pooch' (Hund) fragt immer nach Futter!",trick:"Hund fragt.",example:{hi:"पूछो क्या चाहिए?",en:"Ask what you need.",de:"Frag was du brauchst.",tl:"Poochho kya chahiye?"}},
  {id:74,front:"To start",frontDe:"Anfangen",back:"शुरू करना",tl:"Shuru karnaa",pron:"shoo-ROO kar-NAA",cat:"Verbs",hint:"'Shoo!' — shoo yourself into action!",hintDe:"'Schuh-Ruh' — Schuhe an und los!",trick:"Schuhe an.",example:{hi:"शुरू करो!",en:"Start!",de:"Fang an!",tl:"Shuru karo!"}},
  {id:105,front:"To understand",frontDe:"Verstehen",back:"समझना",tl:"Samajhna",pron:"sa-MUJH-naa",cat:"Verbs",hint:"Sam says 'Ah-ha!' when he finally ___s!",hintDe:"'Sam, Ach ja!' — Sam versteht es!",trick:"Sam versteht.",example:{hi:"समझ आया?",en:"Understood?",de:"Verstanden?",tl:"Samajh aaya?"}},
  {id:114,front:"To sit",frontDe:"Sitzen",back:"बैठना",tl:"Baithna",pron:"BAITH-naa",cat:"Verbs",hint:"'Baith' = 'byte' — sit at your computer!",hintDe:"'Byte-na' — sitz und programmiere!",trick:"Byte = sitzen.",example:{hi:"यहाँ बैठो।",en:"Sit here.",de:"Setz dich hier hin.",tl:"Yahan baitho."}},
  {id:75,front:"Message",frontDe:"Nachricht",back:"संदेश",tl:"Sandesh",pron:"sun-DAYSH",cat:"Common Words",hint:"Written in the sand — 'sand-esh'.",hintDe:"'Sand-Esche' — Nachricht im Sand.",trick:"Sand.",example:{hi:"संदेश भेजो।",en:"Send a message.",de:"Schick eine Nachricht.",tl:"Sandesh bhejo."}},
  {id:76,front:"Answer",frontDe:"Antwort",back:"जवाब",tl:"Javaab",pron:"ja-VAAB",cat:"Common Words",hint:"Starts with 'ja' (yes!) — first part of any ___!",hintDe:"'Ja, waab!' — Antwort webt sich zusammen.",trick:"Ja + weben.",example:{hi:"जवाब दो।",en:"Give an answer.",de:"Gib eine Antwort.",tl:"Javaab do."}},
  {id:77,front:"Maybe",frontDe:"Vielleicht",back:"शायद",tl:"Shaayad",pron:"SHAA-yad",cat:"Common Words",hint:"'Schade' — ___, next time!",hintDe:"Wie 'Schade' — vielleicht!",trick:"Schade.",example:{hi:"शायद कल।",en:"Maybe tomorrow.",de:"Vielleicht morgen.",tl:"Shaayad kal."}},
  {id:80,front:"Or",frontDe:"Oder",back:"या",tl:"Ya",pron:"yaa",cat:"Common Words",hint:"One syllable — like 'yeah?' as a question.",hintDe:"Wie 'Ja' — ja oder nein?",trick:"Ja.",example:{hi:"चाय या कॉफ़ी?",en:"Tea or coffee?",de:"Tee oder Kaffee?",tl:"Chai ya coffee?"}},
  {id:81,front:"Both",frontDe:"Beide",back:"दोनों",tl:"Donon",pron:"DOH-non",cat:"Common Words",hint:"Starts like 'do' (two) — two things together.",hintDe:"'Donner' — beide doppelt laut!",trick:"Donner.",example:{hi:"दोनों अच्छे हैं।",en:"Both are good.",de:"Beide sind gut.",tl:"Donon acche hain."}},
  {id:82,front:"With",frontDe:"Mit",back:"के साथ",tl:"Ke saath",pron:"kay SAATH",cat:"Common Words",hint:"'Saath' = 'Saat' (seed) — plant together!",hintDe:"'Saat' — zusammen pflanzen.",trick:"Zusammen pflanzen.",example:{hi:"मेरे साथ चलो।",en:"Come with me.",de:"Komm mit mir.",tl:"Mere saath chalo."}},
  {id:83,front:"For",frontDe:"Für",back:"के लिए",tl:"Ke liye",pron:"kay LEE-yay",cat:"Common Words",hint:"'K, leave it ___ me!'",hintDe:"'Kelly, eh' — das ist für Kelly!",trick:"Für Kelly.",example:{hi:"मेरे लिए।",en:"For me.",de:"Für mich.",tl:"Mere liye."}},
  {id:84,front:"Too / Also",frontDe:"Auch",back:"भी",tl:"Bhi",pron:"bhee",cat:"Common Words",hint:"A buzzing insect wants some ___!",hintDe:"'Biene' — die Biene will auch!",trick:"Biene.",example:{hi:"मैं भी।",en:"Me too.",de:"Ich auch.",tl:"Main bhi."}},
  {id:85,front:"Right",frontDe:"Richtig",back:"सही",tl:"Sahi",pron:"sa-HEE",cat:"Common Words",hint:"'Sahne' (cream) — always the ___ choice!",hintDe:"'Sahne' — die richtige Wahl!",trick:"Sahne.",example:{hi:"बिल्कुल सही!",en:"Absolutely right!",de:"Genau richtig!",tl:"Bilkul sahi!"}},
  {id:79,front:"That's why",frontDe:"Deshalb",back:"इसलिए",tl:"Isliye",pron:"ISS-lee-yay",cat:"Common Words",hint:"'Iss' it — ___ it's there!",hintDe:"'Iss lieber' — deshalb!",trick:"Iss lieber.",example:{hi:"बारिश है, इसलिए अंदर रहो।",en:"It's raining, so stay in.",de:"Es regnet, deshalb bleib drin.",tl:"Baarish hai, isliye andar raho."}},
  {id:106,front:"More",frontDe:"Mehr",back:"और / ज़्यादा",tl:"Aur / Zyaada",pron:"OWR / zyaa-DAA",cat:"Common Words",hint:"First sounds like 'ear' — want ___ ears!",hintDe:"'Ohr' — mehr Ohren zum Hören!",trick:"Mehr Ohren.",example:{hi:"और चाहिए?",en:"Want more?",de:"Mehr?",tl:"Aur chahiye?"}},
  {id:107,front:"Group",frontDe:"Gruppe",back:"समूह",tl:"Samooh",pron:"sa-MOOH",cat:"Common Words",hint:"Sam says 'ooh!' calling the ___ together.",hintDe:"'Sam, uh!' — ruft die Gruppe!",trick:"Sam ruft.",example:{hi:"बड़ा समूह।",en:"Big group.",de:"Große Gruppe.",tl:"Bada samooh."}},
  {id:110,front:"Journey",frontDe:"Reise",back:"यात्रा",tl:"Yaatraa",pron:"YAA-traa",cat:"Common Words",hint:"'Yes, carry your bags on the ___!'",hintDe:"'Ja, Trage!' — Koffer auf die Reise!",trick:"Ja, Trage!",example:{hi:"यात्रा लंबी है।",en:"Long journey.",de:"Lange Reise.",tl:"Yaatraa lambi hai."}},
  {id:129,front:"Truth",frontDe:"Wahrheit",back:"सच",tl:"Sach",pron:"such",cat:"Common Words",hint:"Like English 'such' — such is the ___!",hintDe:"'Sache' — die Wahrheit ist eine klare Sache!",trick:"Klare Sache.",example:{hi:"सच बोलो।",en:"Speak truth.",de:"Sag die Wahrheit.",tl:"Sach bolo."}},
  {id:78,front:"Something else?",frontDe:"Noch etwas?",back:"और कुछ?",tl:"Aur kuchh?",pron:"OWR kootch?",cat:"Sentences",hint:"'Aur' (more) + 'kuchh' (something) — shopkeeper's line!",hintDe:"'Ohr + Kutsche' — noch was fürs Ohr?",trick:"Ohr + Kutsche.",example:{hi:"और कुछ चाहिए?",en:"Need anything else?",de:"Brauchen Sie noch etwas?",tl:"Aur kuchh chahiye?"}},
  {id:86,front:"I live in Hamburg",frontDe:"Ich wohne in Hamburg",back:"मैं हैम्बर्ग में रहता हूँ",tl:"Main Hamburg mein rehta hoon",pron:"main Hamburg mayn REH-taa hoon",cat:"Sentences",hint:"Main = I, mein = in, rehta hoon = live.",hintDe:"'Main' = ich, 'mein' = in — fast wie Deutsch!",trick:"Fast wie Deutsch.",example:{hi:"मैं हैम्बर्ग में रहता हूँ।",en:"I live in Hamburg.",de:"Ich wohne in Hamburg.",tl:"Main Hamburg mein rehta hoon."}},
  {id:108,front:"I am doing well",frontDe:"Mir geht es gut",back:"मैं ठीक हूँ",tl:"Main theek hoon",pron:"main THEEK hoon",cat:"Sentences",hint:"'Theek' = 'tick' — everything ticks correctly!",hintDe:"'Tick' — alles tickt richtig, mir geht's gut!",trick:"Tick.",example:{hi:"मैं ठीक हूँ।",en:"I'm fine.",de:"Mir geht es gut.",tl:"Main theek hoon."}},
  {id:116,front:"I'm good as well",frontDe:"Mir geht es auch gut",back:"मैं भी ठीक हूँ",tl:"Main bhi theek hoon",pron:"main bhee THEEK hoon",cat:"Sentences",hint:"Add 'bhi' (also) — that tiny word does all the work!",hintDe:"'Bhi' = auch — mir geht's auch gut!",trick:"Bhi = auch.",example:{hi:"मैं भी ठीक हूँ।",en:"I'm good too.",de:"Mir geht es auch gut.",tl:"Main bhi theek hoon."}},
];

const CATEGORIES=["All",...Array.from(new Set(ALL_CARDS.map(c=>c.cat)))];
const CC={Numbers:"#E8785A","Family & People":"#B07CC8","Body Parts":"#E8708A","Nature & Weather":"#5AB8C8",Colors:"#D4A84A","Food & Home":"#5CB87A",Places:"#6A9EE0",Time:"#E8A05A",Emotions:"#D87098",Adjectives:"#5AAA8A",Verbs:"#9A7ACA","Common Words":"#7A88D8",Sentences:"#E88A6A"};
const LVL_C=["#E85A5A","#E8935A","#D4A84A","#8BC05A","#4AA85A"];
const LVL_D=[0,48*36e5,96*36e5,7*864e5,30*864e5];

const TL={bg:"#FFF",bgGrad:"linear-gradient(150deg,#FFF0F3 0%,#FDE8EF 15%,#F5EDFF 30%,#E8F0FF 50%,#E6FAF5 68%,#FFFAE6 85%,#FFF0F0 100%)",cardFront:"linear-gradient(155deg,#FFF,#FFF8FA 40%,#FBF5FF 70%,#F5F8FF)",text:"#2D2530",sub:"#5C5060",muted:"#9A90A0",faint:"#D0C8D4",hintBg:"rgba(180,120,200,.06)",hintBd:"rgba(180,120,200,.14)",hintTx:"#6A5878",trickBg:"rgba(90,184,122,.06)",trickBd:"rgba(90,184,122,.16)",trickTx:"#3A7A52",pillBg:"#FFF",pillBd:"rgba(0,0,0,.06)",btnBg:"#FFF",btnBd:"rgba(0,0,0,.07)",btnTx:"#7A7080",dotBg:"rgba(0,0,0,.07)",divider:"rgba(0,0,0,.06)",cardShadow:"0 6px 32px rgba(0,0,0,.05),0 2px 6px rgba(0,0,0,.03)",accent:"#D87098",pronBg:"rgba(216,112,152,.07)",pronBd:"rgba(216,112,152,.18)",speedBg:"rgba(216,112,152,.04)",speedBd:"rgba(216,112,152,.10)",speedActive:"rgba(216,112,152,.10)",inputBg:"#FFF",inputBd:"rgba(0,0,0,.10)",overlayBg:"rgba(255,255,255,.97)",tabBg:"#FFF",tabBd:"rgba(0,0,0,.06)",barFill:"#D87098",exBg:"rgba(90,184,200,.06)",exBd:"rgba(90,184,200,.14)",exTx:"#2A7B9B",tutBg:"rgba(216,112,152,0.06)",tutBd:"rgba(216,112,152,0.16)"};
const TD={bg:"#110E14",bgGrad:"linear-gradient(150deg,#16101C,#1A1220 25%,#12141E 50%,#141018 75%,#18141C)",cardFront:"linear-gradient(155deg,#1E1826,#1A1520 50%,#161220)",text:"#F0EAF0",sub:"#908498",muted:"#5A5060",faint:"#3A3440",hintBg:"rgba(255,255,255,.04)",hintBd:"rgba(255,255,255,.08)",hintTx:"#908498",trickBg:"rgba(90,184,122,.08)",trickBd:"rgba(90,184,122,.15)",trickTx:"#7AC89A",pillBg:"rgba(255,255,255,.04)",pillBd:"rgba(255,255,255,.07)",btnBg:"rgba(255,255,255,.04)",btnBd:"rgba(255,255,255,.07)",btnTx:"#908498",dotBg:"rgba(255,255,255,.08)",divider:"rgba(255,255,255,.05)",cardShadow:"0 6px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.03)",accent:"#E8889A",pronBg:"rgba(232,136,154,.10)",pronBd:"rgba(232,136,154,.22)",speedBg:"rgba(255,255,255,.03)",speedBd:"rgba(255,255,255,.06)",speedActive:"rgba(232,136,154,.12)",inputBg:"rgba(255,255,255,.06)",inputBd:"rgba(255,255,255,.10)",overlayBg:"rgba(17,14,20,.97)",tabBg:"#1A1520",tabBd:"rgba(255,255,255,.06)",barFill:"#E8889A",exBg:"rgba(90,184,200,.08)",exBd:"rgba(90,184,200,.12)",exTx:"#7AC8D8",tutBg:"rgba(232,136,154,0.08)",tutBd:"rgba(232,136,154,0.18)"};
const SPEEDS=[{key:"normal",label:"Normal",rate:.82,emoji:"🗣️"},{key:"slow",label:"Slow",rate:.15,emoji:"🐢"}];

// ——— Clean text for speech: strip Devanagari numerals in brackets ———
function cleanForSpeech(text){return text.replace(/\s*\(.*?\)\s*/g," ").replace(/\s*\/\s*/g," ").replace(/\n/g," ").trim();}

function useSpeech(){const[s,ss]=useState(false);const[a,sa]=useState(null);const[v,sv]=useState(null);const r=useRef(null);useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;r.current=window.speechSynthesis;const p=()=>{const vs=r.current.getVoices();sv(vs.find(x=>x.lang==="hi-IN")||vs.find(x=>x.lang.startsWith("hi"))||null);};p();r.current.addEventListener("voiceschanged",p);return()=>r.current?.removeEventListener("voiceschanged",p);},[]);const speak=useCallback((t,rate=.82,k="normal")=>{if(!r.current)return;r.current.cancel();const u=new SpeechSynthesisUtterance(cleanForSpeech(t));u.lang="hi-IN";u.rate=rate;u.pitch=1;if(v)u.voice=v;u.onstart=()=>{ss(true);sa(k);};u.onend=()=>{ss(false);sa(null);};u.onerror=()=>{ss(false);sa(null);};r.current.speak(u);},[v]);const stop=useCallback(()=>{r.current?.cancel();ss(false);sa(null);},[]);return{speak,stop,speaking:s,activeSpeed:a,supported:typeof window!=="undefined"&&!!window.speechSynthesis};}
function useSwipe(onL,onR){const sx=useRef(0);const sy=useRef(0);const onTS=useCallback(e=>{sx.current=e.touches[0].clientX;sy.current=e.touches[0].clientY;},[]);const onTE=useCallback(e=>{const dx=e.changedTouches[0].clientX-sx.current;const dy=e.changedTouches[0].clientY-sy.current;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){dx>0?onR():onL();}},[onL,onR]);return{onTouchStart:onTS,onTouchEnd:onTE};}

async function saveData(uid,d){try{await setDoc(doc(db,"users",uid),{...d,updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.error(e);}}
async function loadData(uid){try{const s=await getDoc(doc(db,"users",uid));if(s.exists())return s.data();}catch(e){console.error(e);}return null;}

function PasswordInput({value,onChange,placeholder,onKeyDown,T}){const[v,setV]=useState(false);return(<div style={{position:"relative",width:"100%"}}><input type={v?"text":"password"} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} style={{width:"100%",padding:"14px 48px 14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}}/><button type="button" onClick={()=>setV(x=>!x)} tabIndex={-1} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:"6px",color:T.muted}}>{v?"🙈":"👁️"}</button></div>);}

// ——— TUTORIAL ———
const TUTORIAL_STEPS=[
  {emoji:"👋",title:"Welcome!",body:"Learn Hindi with flashcards, audio, and spaced repetition. Let's take a quick tour!"},
  {emoji:"📚",title:"Flip Cards",body:"Tap any card to flip it and reveal the Hindi word. Swipe right if you know it, swipe left if you're still learning."},
  {emoji:"💡",title:"Get Hints",body:"Stuck? Tap the '💡 Hint' button on the front of any card for a clue — without revealing the answer!"},
  {emoji:"🗣️",title:"Listen & Learn",body:"On the back, press Normal or Slow to hear the pronunciation. Each card also has an example sentence with audio."},
  {emoji:"🏆",title:"Level Up",body:"Cards have 5 levels. Correct answers level up, wrong ones drop. Higher levels are shown less often — spaced repetition!"},
  {emoji:"📊",title:"Track Progress",body:"Check the Progress tab for stats, charts, and category breakdowns. Set a daily flip target in Settings!"},
  {emoji:"🇩🇪",title:"German Speakers",body:"Every card has a German memory trick (🇩🇪). You can also switch the entire interface to German in Settings!"},
  {emoji:"🚀",title:"You're Ready!",body:"Start flipping cards and build your Hindi vocabulary. Have fun — बहुत मज़ा आएगा!"},
];

function Tutorial({T,onDone}){
  const[step,setStep]=useState(0);
  const s=TUTORIAL_STEPS[step];
  const isLast=step===TUTORIAL_STEPS.length-1;
  return(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",padding:20,boxSizing:"border-box"}}>
    <div style={{background:T.overlayBg,borderRadius:28,padding:"32px 24px 24px",width:"100%",maxWidth:380,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.3)",backdropFilter:"blur(20px)"}}>
      <div style={{fontSize:48,marginBottom:8}}>{s.emoji}</div>
      <h2 style={{fontSize:22,fontWeight:800,color:T.text,margin:"0 0 8px"}}>{s.title}</h2>
      <p style={{fontSize:15,color:T.sub,lineHeight:1.6,margin:"0 0 24px"}}>{s.body}</p>
      <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:16}}>
        {TUTORIAL_STEPS.map((_,i)=>(<div key={i} style={{width:i===step?20:8,height:6,borderRadius:3,background:i===step?T.accent:`${T.accent}30`,transition:"all .3s"}}/>))}
      </div>
      <div style={{display:"flex",gap:10}}>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"12px",borderRadius:14,border:`1.5px solid ${T.pillBd}`,background:T.btnBg,color:T.sub,fontSize:15,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>← Back</button>}
        <button onClick={()=>isLast?onDone():setStep(s=>s+1)} style={{flex:1,padding:"12px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,color:"#FFF",fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{isLast?"Let's Go! 🚀":"Next →"}</button>
      </div>
      <button onClick={onDone} style={{marginTop:10,background:"none",border:"none",color:T.muted,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>Skip tutorial</button>
    </div>
  </div>);
}

function AuthScreen({T}){const[isS,setIsS]=useState(false);const[nm,setNm]=useState("");const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const sub=async()=>{setErr("");if(isS&&!nm.trim()){setErr("Enter your name");return;}if(!em||!pw){setErr("Fill in all fields");return;}if(pw.length<6){setErr("Min 6 characters");return;}setLd(true);try{if(isS){const c=await createUserWithEmailAndPassword(auth,em,pw);await setDoc(doc(db,"users",c.user.uid),{name:nm.trim(),cardLevels:{},stats:{totalMinutes:0,dailyLog:{},dailyTarget:25},lang:"en",showTutorial:true});}else await signInWithEmailAndPassword(auth,em,pw);}catch(e){setErr(e.code==="auth/invalid-credential"?"Invalid email or password.":e.code==="auth/email-already-in-use"?"Already registered.":e.message);}setLd(false);};const iS={width:"100%",padding:"14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"};
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
  const[showTutorial,setShowTutorial]=useState(false);
  const[lang,setLang]=useState("en");// "en" | "de"
  const lastActivity=useRef(Date.now());
  const sessionStart=useRef(Date.now());

  const{speak,stop,speaking,activeSpeed,supported}=useSpeech();
  const T=dark?TD:TL;
  const u=UI[lang]||UI.en;
  const today=new Date().toISOString().slice(0,10);
  const lvlLabels=[u.new,u.hours48,u.days4,u.week1,u.monthly];

  const knownSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=5).map(([k])=>+k)),[cardLevels]);
  const learningSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=2&&v.level<5).map(([k])=>+k)),[cardLevels]);
  const dueCards=useMemo(()=>ALL_CARDS.filter(c=>isDue(cardLevels,c.id)),[cardLevels]);

  const cards=useMemo(()=>{
    if(practiceMode==="learning")return ALL_CARDS.filter(c=>{const l=getLevel(cardLevels,c.id).level;return l>=2&&l<5&&isDue(cardLevels,c.id);});
    if(practiceMode==="due")return dueCards;
    return cat==="All"?ALL_CARDS:ALL_CARDS.filter(c=>c.cat===cat);
  },[cat,practiceMode,cardLevels,dueCards]);
  const card=cards[idx]||cards[0];const color=CC[card?.cat]||"#D87098";
  const cardFront=lang==="de"?(card?.frontDe||card?.front):card?.front;
  const cardHint=lang==="de"?(card?.hintDe||card?.hint):card?.hint;
  const exLang=lang==="de"?(card?.example?.de||card?.example?.en):card?.example?.en;

  const markActive=useCallback(()=>{lastActivity.current=Date.now();},[]);

  useEffect(()=>{const unsub=onAuthStateChanged(auth,async usr=>{setUser(usr);if(usr){const d=await loadData(usr.uid);if(d){setCardLevels(d.cardLevels||{});setUserName(d.name||"");setStats(d.stats||{totalMinutes:0,dailyLog:{},dailyTarget:25});setTodayFlips(d.stats?.dailyLog?.[today]||0);setLang(d.lang||"en");if(d.showTutorial)setShowTutorial(true);}}setAuthLoading(false);});return()=>unsub();},[]);

  useEffect(()=>{if(!user)return;const iv=setInterval(()=>{const idle=Date.now()-lastActivity.current;if(idle<60000){const el=(Date.now()-sessionStart.current)/60000;if(el>0&&el<2)setStats(p=>({...p,totalMinutes:(p.totalMinutes||0)+el}));}sessionStart.current=Date.now();},30000);return()=>clearInterval(iv);},[user]);

  const saveTimeout=useRef(null);
  useEffect(()=>{if(!user)return;if(saveTimeout.current)clearTimeout(saveTimeout.current);saveTimeout.current=setTimeout(async()=>{setSaving(true);await saveData(user.uid,{name:userName,cardLevels,stats,lang,showTutorial:false});setSaving(false);},1000);return()=>{if(saveTimeout.current)clearTimeout(saveTimeout.current);};},[cardLevels,user,userName,stats,lang]);

  const prevFlipped=useRef(false);
  useEffect(()=>{if(flipped&&!prevFlipped.current){setTodayFlips(f=>f+1);setStats(p=>({...p,dailyLog:{...p.dailyLog,[today]:(p.dailyLog?.[today]||0)+1}}));if(autoSpeak&&supported&&card)setTimeout(()=>speak(card.back,.82,"normal"),400);}prevFlipped.current=flipped;},[flipped,card,autoSpeak,supported,speak,today]);

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
  const speakEx=e=>{e.stopPropagation();markActive();if(card?.example)speak(card.example.hi,.82,"normal");};
  const closeTutorial=()=>{setShowTutorial(false);if(user)saveData(user.uid,{showTutorial:false});};

  if(authLoading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgGrad,fontFamily:"'Outfit',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{textAlign:"center",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🇮🇳</div><div style={{fontSize:18,fontWeight:600}}>Loading...</div></div></div>);
  if(!user)return<AuthScreen T={T}/>;

  return(
    <div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",color:T.text,display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 14px 80px",boxSizing:"border-box",transition:"background .5s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes speakPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes barBounce{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes swL{0%{opacity:0;transform:translateX(20px)}50%{opacity:1}100%{opacity:0;transform:translateX(-20px)}}@keyframes swR{0%{opacity:0;transform:translateX(-20px)}50%{opacity:1}100%{opacity:0;transform:translateX(20px)}}@keyframes hintIn{from{opacity:0;max-height:0}to{opacity:1;max-height:200px}}.cat-scroll::-webkit-scrollbar{display:none}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}`}</style>

      {showTutorial&&<Tutorial T={T} onDone={closeTutorial}/>}

      {showList&&<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",padding:20}} onClick={()=>setShowList(null)}><div onClick={e=>e.stopPropagation()} style={{background:T.overlayBg,borderRadius:24,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:22,fontWeight:800,color:T.text,margin:0}}>{showList==="known"?`⭐ ${u.mastered}`:`📖 ${u.learning}`} ({(showList==="known"?knownSet:learningSet).size})</h2>
          <button onClick={()=>setShowList(null)} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${T.pillBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {showList==="learning"&&learningSet.size>0&&<button onClick={()=>{setPracticeMode("learning");setIdx(0);setFlipped(false);setShowList(null);setTab("practice");}} style={{width:"100%",padding:"12px",borderRadius:14,border:"1.5px solid #D4A84A44",background:"#D4A84A12",color:"#D4A84A",fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:12}}>🎯 {u.practiceAll}</button>}
        {ALL_CARDS.filter(c=>(showList==="known"?knownSet:learningSet).has(c.id)).map(c=>{const lv=getLevel(cardLevels,c.id);const front=lang==="de"?(c.frontDe||c.front):c.front;return(<button key={c.id} onClick={()=>jumpToCard(c.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:14,border:`1.5px solid ${showList==="known"?"#5CB87A22":"#D4A84A22"}`,background:`${showList==="known"?"#5CB87A":"#D4A84A"}06`,marginBottom:8,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}><div><div style={{fontSize:16,fontWeight:700,color:T.text}}>{front}</div><div style={{fontSize:13,color:CC[c.cat]||T.sub,fontWeight:600,marginTop:2}}>{c.back} · {c.tl}</div></div><span style={{fontSize:11,fontWeight:700,color:LVL_C[lv.level-1],background:`${LVL_C[lv.level-1]}18`,padding:"2px 8px",borderRadius:8}}>Lv{lv.level}</span></button>);})}
        {(showList==="known"?knownSet:learningSet).size===0&&<div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>—</div>}
      </div></div>}

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:560}}>

        {tab==="practice"&&<>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:13,letterSpacing:3,color:T.accent,fontWeight:700,marginBottom:2,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div>
            <h1 style={{fontSize:24,fontWeight:800,margin:0,color:T.text}}>Namaste, {displayName}! 👋</h1>
          </div>
          <div style={{marginBottom:8,padding:"10px 14px",borderRadius:14,background:T.pillBg,border:`1px solid ${T.pillBd}`}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
              <span style={{fontWeight:600,color:T.text}}>🎯 {todayFlips}/{dailyTarget} {u.flipsToday}</span>
              <span style={{fontWeight:700,color:targetPct>=100?"#4AA85A":T.accent}}>{targetPct>=100?u.done:`${targetPct}%`}</span>
            </div>
            <div style={{height:6,borderRadius:3,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${targetPct}%`,background:targetPct>=100?"linear-gradient(90deg,#4AA85A,#8BC05A)":"linear-gradient(90deg,#E8785A,#D4A84A)",transition:"width .4s"}}/></div>
          </div>
          {practiceMode&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderRadius:12,background:"#D4A84A14",border:"1.5px solid #D4A84A33",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:700,color:"#D4A84A"}}>🎯 {practiceMode==="learning"?u.practiceLearning:u.practiceDue}: {cards.length}</span>
            <button onClick={exitPractice} style={{padding:"5px 10px",borderRadius:10,border:"1px solid #D4A84A44",background:"transparent",color:"#D4A84A",fontSize:11,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{u.exit}</button>
          </div>}
          {!practiceMode&&<div className="cat-scroll" style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:6,marginBottom:8,scrollbarWidth:"none"}}>
            {CATEGORIES.map(c=>{const active=cat===c;const cc=CC[c]||T.accent;return(<button key={c} onClick={()=>{setCat(c);setIdx(0);setFlipped(false);setShowHint(false);stop();}} style={{padding:"6px 13px",borderRadius:18,border:"1.5px solid",whiteSpace:"nowrap",flexShrink:0,borderColor:active?cc:T.pillBd,background:active?`${cc}18`:T.pillBg,color:active?cc:T.sub,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:active?700:400}}>{c}</button>);})}
          </div>}
          {cards.length>0?<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,padding:"0 4px"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:color}}/>
              <span style={{fontSize:13,color,fontWeight:700,textTransform:"uppercase"}}>{card?.cat}</span>
              <span style={{fontSize:11,fontWeight:700,color:LVL_C[cl.level-1],background:`${LVL_C[cl.level-1]}18`,padding:"2px 8px",borderRadius:8}}>Lv{cl.level} · {lvlLabels[cl.level-1]}</span>
            </div>
            <span style={{fontSize:14,color:T.muted,fontWeight:600}}>{idx+1}/{cards.length}</span>
          </div>
          <div {...swipe} onClick={doFlip} style={{perspective:1200,cursor:"pointer",marginBottom:8,height:460,position:"relative"}}>
            {swipeHint==="right"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(92,184,122,.15)",animation:"swR .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>✅</span></div>}
            {swipeHint==="left"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(212,168,74,.15)",animation:"swL .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>🔄</span></div>}
            <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0)",transition:"transform .65s cubic-bezier(.23,1,.32,1)"}}>
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",borderRadius:24,background:T.cardFront,border:`1.5px solid ${color}${dark?"25":"15"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxShadow:T.cardShadow}}>
                <div style={{position:"absolute",top:14,right:16,fontSize:12,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>{lang==="de"?"Deutsch":"English"}</div>
                <div style={{position:"absolute",top:14,left:16,display:"flex",gap:3}}>{[1,2,3,4,5].map(l=>(<div key={l} style={{width:7,height:7,borderRadius:"50%",background:cl.level>=l?LVL_C[l-1]:T.dotBg}}/>))}</div>
                <div style={{fontSize:cardFront.length>20?26:44,fontWeight:800,textAlign:"center",lineHeight:1.25,color:T.text}}>{cardFront}</div>
                <div style={{marginTop:14,width:"100%",maxWidth:360,textAlign:"center"}}>
                  {!showHint?<button onClick={e=>{e.stopPropagation();setShowHint(true);markActive();}} style={{padding:"8px 18px",borderRadius:14,border:`1.5px solid ${T.hintBd}`,background:T.hintBg,color:T.hintTx,fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,margin:"0 auto"}}>💡 {u.hint}</button>
                  :<div style={{animation:"hintIn .3s ease-out",padding:"10px 16px",borderRadius:14,background:T.hintBg,border:`1.5px solid ${T.hintBd}`,fontSize:14,color:T.hintTx,lineHeight:1.5,fontWeight:500}} onClick={e=>e.stopPropagation()}>{cardHint}</div>}
                </div>
                <div style={{marginTop:12,fontSize:13,color:T.muted}}>{u.flipHint}</div>
              </div>
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:24,background:dark?`linear-gradient(155deg,${color}12,#1A1520 30%,#161220)`:`linear-gradient(155deg,${color}08,#FFF 30%,#FFFAF5)`,border:`1.5px solid ${color}${dark?"30":"18"}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 14px 14px",boxShadow:T.cardShadow,overflowY:"auto",justifyContent:"flex-start",paddingTop:34}}>
                <div style={{position:"absolute",top:10,right:14,fontSize:11,color,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,opacity:.8,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी</div>
                <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:card?.back.length>14?30:48,fontWeight:700,textAlign:"center",color:T.text,lineHeight:1.3,whiteSpace:"pre-line"}}>{card?.back}</div>
                <div style={{marginTop:2,fontSize:18,fontWeight:600,color}}>{card?.tl}</div>
                {supported&&<div onClick={e=>e.stopPropagation()} style={{marginTop:8,padding:"4px",borderRadius:14,background:T.speedBg,border:`1px solid ${T.speedBd}`,display:"flex",gap:4,width:"100%",maxWidth:400}}>
                  {SPEEDS.map(sp=>{const isA=speaking&&activeSpeed===sp.key;return(<button key={sp.key} onClick={e=>handlePlay(e,sp)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1.5px solid",borderColor:isA?`${color}66`:"transparent",background:isA?T.speedActive:"transparent",color:isA?color:T.sub,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:4,animation:isA?"speakPulse 1.2s ease-in-out infinite":"none"}}>{isA?<div style={{display:"flex",gap:2,height:14}}>{[0,1,2,3].map(b=><div key={b} style={{width:3,height:14,borderRadius:2,background:color,animation:`barBounce 0.${5+b*2}s ease-in-out infinite`,animationDelay:`${b*.1}s`}}/>)}</div>:<span>{sp.emoji}</span>}{sp.label}</button>);})}
                </div>}
                <div style={{marginTop:6,padding:"5px 14px",borderRadius:12,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:14,color,fontWeight:500,display:"flex",alignItems:"center",gap:5,width:"100%",maxWidth:400,justifyContent:"center"}}>📢 {card?.pron}</div>
                <div style={{marginTop:5,padding:"6px 14px",borderRadius:12,background:T.trickBg,border:`1px solid ${T.trickBd}`,fontSize:13,color:T.trickTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:400,fontWeight:500}}>🇩🇪 {card?.trick}</div>
                {card?.example&&<div onClick={e=>e.stopPropagation()} style={{marginTop:5,padding:"8px 14px",borderRadius:12,background:T.exBg,border:`1px solid ${T.exBd}`,width:"100%",maxWidth:400}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,fontWeight:700,color:T.exTx}}>{u.example}</span>
                    {supported&&<button onClick={speakEx} style={{padding:"3px 8px",borderRadius:8,border:`1px solid ${T.exBd}`,background:"transparent",color:T.exTx,fontSize:11,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{u.play}</button>}
                  </div>
                  <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:16,fontWeight:600,color:T.text,lineHeight:1.4}}>{card.example.hi}</div>
                  <div style={{fontSize:12,color:T.exTx,marginTop:1}}>{card.example.tl}</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:1}}>{exLang}</div>
                </div>}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:8}}>
            <button onClick={()=>nav(-1)} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:"inherit"}}>‹</button>
            <button onClick={markLearn} style={{padding:"11px 18px",borderRadius:18,border:"1.5px solid #D4A84A44",background:"#D4A84A10",color:"#D4A84A",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700}}>{u.stillLearning}</button>
            <button onClick={markKnow} style={{padding:"11px 18px",borderRadius:18,border:"1.5px solid #5CB87A44",background:"#5CB87A10",color:"#5CB87A",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700}}>{u.gotIt}</button>
            <button onClick={()=>nav(1)} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:"inherit"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"10px 4px",borderTop:`1px solid ${T.divider}`}}>
            {[{l:u.total,v:ALL_CARDS.length,c:T.sub,e:"📚",cl:null},{l:u.mastered,v:knownSet.size,c:"#4AA85A",e:"⭐",cl:()=>setShowList("known")},{l:u.learning,v:learningSet.size,c:"#D4A84A",e:"📖",cl:()=>setShowList("learning")},{l:u.due,v:dueCards.length,c:"#E85A5A",e:"🔥",cl:()=>{setPracticeMode("due");setIdx(0);setTab("practice");}}].map(s=>(<div key={s.l} onClick={s.cl} style={{textAlign:"center",padding:"7px 3px",borderRadius:12,background:dark?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)",cursor:s.cl?"pointer":"default",border:s.cl?`1.5px solid ${s.c}22`:"1.5px solid transparent"}}><div style={{fontSize:11}}>{s.e}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",fontWeight:600}}>{s.l}</div>{s.cl&&<div style={{fontSize:8,color:s.c,fontWeight:600}}>TAP</div>}</div>))}
          </div>
          </>:<div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🎉</div><div style={{fontSize:18,fontWeight:600}}>{u.allDone}</div><button onClick={exitPractice} style={{marginTop:16,padding:"12px 24px",borderRadius:16,border:`1.5px solid ${T.accent}44`,background:`${T.accent}12`,color:T.accent,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{u.backToAll}</button></div>}
        </>}

        {tab==="progress"&&<div>
          <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>📊 {u.progress}</h2>
          <p style={{fontSize:14,color:T.sub,margin:"0 0 14px"}}>{knownSet.size} {u.mastered.toLowerCase()} · {learningSet.size} {u.learning.toLowerCase()}</p>
          <div style={{display:"flex",alignItems:"center",gap:18,padding:"16px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12}}>
            <div style={{position:"relative",width:80,height:80,flexShrink:0}}><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke={T.dotBg} strokeWidth="7"/><circle cx="40" cy="40" r="34" fill="none" stroke={T.accent} strokeWidth="7" strokeDasharray={`${pct*2.14} ${214-pct*2.14}`} strokeDashoffset="54" strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:T.accent}}>{pct}%</div></div>
            <div><div style={{fontSize:17,fontWeight:700,color:T.text}}>✨ {knownSet.size}/{ALL_CARDS.length}</div><div style={{fontSize:13,color:T.sub,marginTop:3}}>⏱️ {Math.floor((stats.totalMinutes||0)/60)}h {Math.round((stats.totalMinutes||0)%60)}m</div><div style={{fontSize:13,color:T.sub,marginTop:2}}>🔥 {dueCards.length} {u.due.toLowerCase()}</div></div>
          </div>
          <div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.sub,marginBottom:4}}><span>{u.overallMastery}</span><span style={{fontWeight:700,color:T.accent}}>{pct}%</span></div><div style={{height:8,borderRadius:4,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${pct}%`,background:"linear-gradient(90deg,#E8785A,#D4A84A,#5CB87A)",transition:"width .6s",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite"}}/></div></div>
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📅 {u.thisWeek}</div>
            <div style={{display:"flex",gap:5,alignItems:"flex-end",height:80}}>
              {Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const c=(stats.dailyLog||{})[k]||0;const isT=k===today;const max=Math.max(...Object.values(stats.dailyLog||{1:1}),dailyTarget,1);return(<div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{fontSize:10,fontWeight:700,color:isT?T.accent:T.muted}}>{c}</div><div style={{width:"100%",borderRadius:5,background:isT?T.accent:T.barFill,opacity:isT?1:.35,height:`${Math.max((c/max)*55,3)}px`,transition:"height .4s"}}/><div style={{fontSize:9,color:isT?T.accent:T.muted,fontWeight:isT?700:500}}>{d.toLocaleDateString(lang==="de"?"de":"en",{weekday:"short"})}</div></div>);})}
            </div>
          </div>
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>🏆 {u.levels}</div>
            {[1,2,3,4,5].map(lv=>{const ct=ALL_CARDS.filter(c=>{const l=getLevel(cardLevels,c.id).level;return lv===1?(l===1||!cardLevels[c.id]):l===lv;}).length;return(<div key={lv} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><div style={{width:56,fontSize:12,fontWeight:700,color:LVL_C[lv-1]}}>Lv{lv} {lvlLabels[lv-1]}</div><div style={{flex:1,height:7,borderRadius:4,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${(ct/ALL_CARDS.length)*100}%`,background:LVL_C[lv-1]}}/></div><div style={{width:24,fontSize:12,fontWeight:600,color:T.muted,textAlign:"right"}}>{ct}</div></div>);})}
          </div>
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📂 {u.categories}</div>
            {Object.entries(CC).map(([cat,col])=>{const cc=ALL_CARDS.filter(c=>c.cat===cat);const m=cc.filter(c=>getLevel(cardLevels,c.id).level>=5).length;const cp=cc.length?Math.round((m/cc.length)*100):0;return(<div key={cat} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:col}}>{cat}</span><span style={{fontSize:11,color:T.muted}}>{m}/{cc.length}</span></div><div style={{height:5,borderRadius:3,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${cp}%`,background:col}}/></div></div>);})}
          </div>
        </div>}

        {tab==="settings"&&<div>
          <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>⚙️ {u.settings}</h2>
          <p style={{fontSize:14,color:T.sub,margin:"0 0 16px"}}>{displayName} · {user.email}</p>
          {/* Language */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>🌐 {u.langLabel}</div></div>
            <div style={{display:"flex",gap:5}}>
              {[{k:"en",l:"English"},{k:"de",l:"Deutsch"}].map(o=>(<button key={o.k} onClick={()=>setLang(o.k)} style={{padding:"7px 12px",borderRadius:12,border:`1.5px solid ${lang===o.k?T.accent+"44":T.pillBd}`,background:lang===o.k?`${T.accent}14`:T.btnBg,color:lang===o.k?T.accent:T.text,fontSize:13,fontFamily:"inherit",fontWeight:lang===o.k?700:500,cursor:"pointer"}}>{o.l}</button>))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <span style={{fontSize:15,fontWeight:700,color:T.text}}>🌓 {u.theme}</span>
            <button onClick={()=>setDark(d=>!d)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${T.pillBd}`,background:T.btnBg,color:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{dark?"☀️ Light":"🌙 Dark"}</button>
          </div>
          {supported&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <span style={{fontSize:15,fontWeight:700,color:T.text}}>🔊 {u.autoPlay}</span>
            <button onClick={()=>setAutoSpeak(a=>!a)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${autoSpeak?T.accent+"44":T.pillBd}`,background:autoSpeak?`${T.accent}14`:T.btnBg,color:autoSpeak?T.accent:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{autoSpeak?"ON":"OFF"}</button>
          </div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>🎯 {u.dailyTarget}</div><div style={{fontSize:12,color:T.muted}}>{dailyTarget} {u.flipsDay}</div></div>
            <div style={{display:"flex",gap:5}}>{[15,25,40,60].map(n=>(<button key={n} onClick={()=>setStats(p=>({...p,dailyTarget:n}))} style={{padding:"6px 10px",borderRadius:10,border:`1.5px solid ${dailyTarget===n?T.accent+"44":T.pillBd}`,background:dailyTarget===n?`${T.accent}14`:"transparent",color:dailyTarget===n?T.accent:T.muted,fontSize:12,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{n}</button>))}</div>
          </div>
          {/* Replay tutorial */}
          <button onClick={()=>setShowTutorial(true)} style={{width:"100%",padding:"14px",borderRadius:16,border:`1.5px solid ${T.pillBd}`,background:T.pillBg,color:T.text,fontSize:15,fontFamily:"inherit",fontWeight:600,cursor:"pointer",marginBottom:8}}>📖 {lang==="de"?"Tutorial nochmal":"Replay Tutorial"}</button>
          <button onClick={handleLogout} style={{width:"100%",padding:"14px",borderRadius:16,border:`1.5px solid ${T.pillBd}`,background:T.pillBg,color:T.text,fontSize:16,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:16}}>🚪 {u.logout}</button>
          <DeleteBtn T={T} u={u}/>
        </div>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.tabBg,borderTop:`1px solid ${T.tabBd}`,display:"flex",justifyContent:"center",backdropFilter:"blur(16px)"}}>
        <div style={{display:"flex",maxWidth:560,width:"100%"}}>
          {[{k:"practice",i:"📚",l:u.practice},{k:"progress",i:"📊",l:u.progress},{k:"settings",i:"⚙️",l:u.settings}].map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);stop();}} style={{flex:1,padding:"10px 0 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",color:tab===t.k?T.accent:T.muted}}>
            <span style={{fontSize:22}}>{t.i}</span><span style={{fontSize:11,fontWeight:tab===t.k?700:500}}>{t.l}</span>
            {tab===t.k&&<div style={{width:20,height:3,borderRadius:2,background:T.accent}}/>}
          </button>))}
        </div>
      </div>
    </div>
  );
}

function DeleteBtn({T,u}){const[cd,setCd]=useState(false);const[dp,setDp]=useState("");const[de,setDe]=useState("");const[dl,setDl]=useState(false);const hd=async()=>{if(!cd){setCd(true);return;}if(!dp){setDe(u.enterPassword);return;}setDl(true);try{const c=EmailAuthProvider.credential(auth.currentUser.email,dp);await reauthenticateWithCredential(auth.currentUser,c);await deleteDoc(doc(db,"users",auth.currentUser.uid));await deleteUser(auth.currentUser);}catch(e){setDe("Wrong password.");setDl(false);}};
return(<div style={{padding:"14px",borderRadius:16,border:"1.5px solid #F43F5E30",background:"#F43F5E08"}}><div style={{fontSize:14,fontWeight:700,color:"#E11D48",marginBottom:4}}>⚠️ {u.deleteAccount}</div><div style={{fontSize:11,color:T.muted,marginBottom:8}}>{u.deleteWarning}</div>{cd&&<><PasswordInput value={dp} onChange={e=>setDp(e.target.value)} placeholder={u.enterPassword} T={T} onKeyDown={e=>e.key==="Enter"&&hd()}/>{de&&<div style={{marginTop:6,fontSize:11,color:"#E11D48"}}>{de}</div>}</>}<button onClick={hd} disabled={dl} style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:cd?"#E11D48":"transparent",color:cd?"#FFF":"#E11D48",fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700,cursor:dl?"wait":"pointer",marginTop:8,opacity:dl?.6:1}}>{dl?"...":cd?u.confirmDelete:u.deleteAccount}</button>{cd&&<button onClick={()=>{setCd(false);setDe("");setDp("");}} style={{width:"100%",padding:"6px",border:"none",background:"transparent",color:T.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer",marginTop:4}}>{u.cancel}</button>}</div>);}
