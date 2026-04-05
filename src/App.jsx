import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

// ——— CARD DATA ———
const ALL_CARDS = [
  { id:1,front:"One (1)",back:"एक",tl:"Ek",pron:"ehk — rhymes with 'check'",cat:"Numbers",hint:"Starts with 'E' — think of 'Eck' (corner). Just one corner.",trick:"Klingt wie 'Eck' (Ecke) — eine Ecke = eins." },
  { id:2,front:"Two (2)",back:"दो",tl:"Do",pron:"doe — like a female deer",cat:"Numbers",hint:"Sounds like 'dough' — you need two hands to knead dough.",trick:"Klingt wie 'doh' — Do-ppel = zwei." },
  { id:3,front:"Three (3)",back:"तीन",tl:"Teen",pron:"teen — like English 'teen'",cat:"Numbers",hint:"Like 'teen' — thir-TEEN has three in it!",trick:"'Tee in' drei Tassen — Teen = drei." },
  { id:4,front:"Four (4)",back:"चार",tl:"Chaar",pron:"chaar — 'ch' + rhymes with 'car'",cat:"Numbers",hint:"Sounds like 'char' — a char-iot has four wheels.",trick:"Char hat 4 Buchstaben — Chaar = vier." },
  { id:5,front:"Five (5)",back:"पाँच",tl:"Paanch",pron:"paanch — nasal 'n', like 'punch'",cat:"Numbers",hint:"Like 'punch' — five fingers make a punch!",trick:"Klingt wie 'Punsch' — fünf Zutaten!" },
  { id:6,front:"Six (6)",back:"छह",tl:"Chhah",pron:"cheh — aspirated 'ch'",cat:"Numbers",hint:"Starts with 'chh' — a breathy, airy sound. Think: six breaths.",trick:"Klingt wie 'Schach' — sechs Figuren-Typen." },
  { id:7,front:"Seven (7)",back:"सात",tl:"Saat",pron:"saat — rhymes with 'hot' + 's'",cat:"Numbers",hint:"Like 'saat' (seed in German) — plant seven seeds!",trick:"Wie 'Saat' (Samen) — gleiches Wort!" },
  { id:8,front:"Eight (8)",back:"आठ",tl:"Aath",pron:"aath — like 'art' but with 'th'",cat:"Numbers",hint:"Sounds almost like 'Acht' in German — drop the 'ch'!",trick:"Klingt wie 'Acht' ohne 'ch' — fast identisch!" },
  { id:9,front:"Nine (9)",back:"नौ",tl:"Nau",pron:"now — like English 'now'",cat:"Numbers",hint:"Sounds exactly like 'now'! Nine is now!",trick:"'Nau' klingt wie 'neu' — neun ist 'neu'!" },
  { id:10,front:"Ten (10)",back:"दस",tl:"Das",pron:"thus — without the 'th'",cat:"Numbers",hint:"Like German 'das' — das ist zehn!",trick:"'Das' ist auch deutsch! Das = zehn." },
  { id:11,front:"Father",back:"पिता",tl:"Pitaa",pron:"pi-TAA",cat:"Family & People",hint:"Think 'pita bread' — father brings pita home.",trick:"'Pita'-Brot — Vater bringt Pita mit." },
  { id:12,front:"Sister",back:"बहन",tl:"Behen",pron:"beh-HEN — soft 'h'",cat:"Family & People",hint:"'Beh-HEN' — like a hen, sisters can be chatty and caring!",trick:"'Behen' — Schwester bahnt den Weg." },
  { id:13,front:"Relative",back:"रिश्तेदार",tl:"Rishtedaar",pron:"rish-tay-DAAR",cat:"Family & People",hint:"'Rishta' = relationship. '-daar' = keeper. Relationship-keeper!",trick:"'Rishte' — Verwandte reichen die Hand." },
  { id:14,front:"Neighbour",back:"पड़ोसी",tl:"Padosi",pron:"pa-ROH-see",cat:"Family & People",hint:"Sounds like 'para-dosie' — paradise next door!",trick:"'Padosi' — 'Paradiso' nebenan." },
  { id:15,front:"Guest",back:"मेहमान",tl:"Mehmaan",pron:"meh-MAAN",cat:"Family & People",hint:"'Meh-MAAN' — more men coming to visit!",trick:"'Mehr Mann' kommt zu Besuch!" },
  { id:16,front:"Man",back:"आदमी",tl:"Aadmi",pron:"AAD-mee",cat:"Family & People",hint:"Like 'Adam' — the first man. Aad-mi!",trick:"Wie 'Adam' + i — der erste Mann." },
  { id:17,front:"Anybody",back:"कोई भी",tl:"Koi bhi",pron:"KOY bhee",cat:"Family & People",hint:"'Koi' sounds like koi fish — any koi in the pond!",trick:"'Koi' (Fisch) — jeder Koi im Teich." },
  { id:109,front:"Customer",back:"ग्राहक",tl:"Graahak",pron:"GRAA-hak",cat:"Family & People",hint:"'GRAA-hak' — the customer grabs and hacks at deals!",trick:"'Graahak' — Kunde hackt nach Angeboten!" },
  { id:18,front:"Hand",back:"हाथ",tl:"Haath",pron:"haath — like 'heart' with 'th'",cat:"Body Parts",hint:"'Haath' sounds like 'heart' — you hold your heart in your hand.",trick:"'Haath' wie 'hat' — Hand hat fünf Finger." },
  { id:19,front:"Head",back:"सिर",tl:"Sir",pron:"sir — like English 'sir'",cat:"Body Parts",hint:"Exactly like 'sir' — a sir nods his head!",trick:"'Sir' — trägt eine Krone auf dem Kopf!" },
  { id:20,front:"Ear",back:"कान",tl:"Kaan",pron:"kaan — like 'con' with long 'aa'",cat:"Body Parts",hint:"Sounds like 'khan' — Khan listens with big ears!",trick:"'Kahn' — Ohr hat die Form eines Kahns!" },
  { id:98,front:"Foot",back:"पैर",tl:"Pair",pron:"pair — like English 'pair'",cat:"Body Parts",hint:"Exactly like 'pair' — you always have a pair of feet!",trick:"'Paar' — ein Paar Füße hat man immer!" },
  { id:21,front:"Rain",back:"बारिश",tl:"Baarish",pron:"BAA-rish",cat:"Nature & Weather",hint:"'BAA-rish' — baa like a sheep caught in the rain!",trick:"'Baarish' — barsch wenn es regnet." },
  { id:22,front:"Wind",back:"हवा",tl:"Havaa",pron:"ha-VAA",cat:"Nature & Weather",hint:"Think 'Hawaii' — where the wind always blows!",trick:"'Havaa' — 'Hawaii' wo der Wind weht!" },
  { id:23,front:"River",back:"नदी",tl:"Nadi",pron:"na-DEE",cat:"Nature & Weather",hint:"Like 'Nadia' — a name meaning river in many cultures.",trick:"'Nadi' — 'Nadel' fließt durch Stoff." },
  { id:24,front:"Ocean",back:"समुद्र",tl:"Samudra",pron:"sa-MOOD-ra",cat:"Nature & Weather",hint:"'Sa-MOOD-ra' — the ocean sets your mood right!",trick:"'So viel Mud' gibt's nur im Ozean!" },
  { id:25,front:"Rose",back:"गुलाब",tl:"Gulaab",pron:"goo-LAAB",cat:"Nature & Weather",hint:"Think 'gulab jamun' — that sweet dessert IS rose-flavored!",trick:"'Guck mal Lab!' — Rose im Labor!" },
  { id:26,front:"Weather",back:"मौसम",tl:"Mausam",pron:"MOW-sam",cat:"Nature & Weather",hint:"'MOW-sam' — the mouse checks the weather from the window.",trick:"'Maus am' Fenster beobachtet Wetter." },
  { id:27,front:"World",back:"दुनिया",tl:"Duniya",pron:"doo-nee-YAA",cat:"Nature & Weather",hint:"'Doo-nee-ya' — dunes everywhere around the world!",trick:"'Düne, ja!' — Dünen überall." },
  { id:28,front:"Colour",back:"रंग",tl:"Rang",pron:"rung — like 'rung' of a ladder",cat:"Colors",hint:"Like 'rang' — each rung of a ladder is a different color!",trick:"'Rang' — Farben haben einen Rang!" },
  { id:29,front:"White",back:"सफ़ेद",tl:"Safed",pron:"sa-FEYD",cat:"Colors",hint:"'Safe-d' — white flag means safe!",trick:"'Safe' — weiße Flagge = sicher!" },
  { id:30,front:"Orange",back:"नारंगी",tl:"Naarangi",pron:"naa-RAN-gee",cat:"Colors",hint:"'Na-RANG-ee' — 'rang' (color) is literally inside this word!",trick:"'Na, Rangi?' — ist die Orange farbig?" },
  { id:31,front:"Brown",back:"भूरा",tl:"Bhura",pron:"BHOO-raa — aspirated 'bh'",cat:"Colors",hint:"'BHOO-ra' — sounds like 'boo-rah!' — old brown things are scary!",trick:"'Bura' (Burg) — alte Burgen sind braun." },
  { id:32,front:"Sugar",back:"चीनी",tl:"Cheeni",pron:"CHEE-nee",cat:"Food & Home",hint:"Sounds like 'China' — sugar historically came from there!",trick:"'Cheeni' — Zucker kam aus China!" },
  { id:33,front:"Food",back:"खाना",tl:"Khaana",pron:"KHAA-naa — guttural 'kh'",cat:"Food & Home",hint:"'KHAA-na' — the guttural 'kh' sounds like you're eating!",trick:"'Kahn-a' — im Kahn isst man Essen." },
  { id:34,front:"Fruits",back:"फल",tl:"Phal",pron:"full — aspirated 'ph'",cat:"Food & Home",hint:"'Phal' like 'fall' — fruits fall from trees!",trick:"'Phal' wie 'Fall' — Obst fällt vom Baum!" },
  { id:35,front:"Knife",back:"छुरी / चाकू",tl:"Chhuri / Chaaku",pron:"CHHOO-ree / CHAA-koo",cat:"Food & Home",hint:"'Chhuri' for kitchen knife, 'Chaaku' for bigger blades. Both start with 'ch'!",trick:"'Chhuri' — 'Kurier' bringt das Messer!" },
  { id:36,front:"Curtain",back:"पर्दा",tl:"Parda",pron:"PAR-daa",cat:"Food & Home",hint:"Like 'pardon' — pardon me while I draw the curtain!",trick:"'Pard(on)' — der Vorhang geht auf!" },
  { id:37,front:"Wall",back:"दीवार",tl:"Deevaar",pron:"dee-VAAR",cat:"Food & Home",hint:"'Dee-VAAR' — the truth (die Wahrheit) is written on the wall!",trick:"'Die Wahr(heit)' steht an der Wand." },
  { id:38,front:"Car",back:"गाड़ी",tl:"Gaadi",pron:"GAA-dee — hard 'd'",cat:"Food & Home",hint:"'GAA-dee' — go-dee — let's go by car!",trick:"'Geh die' Straße entlang mit dem Auto." },
  { id:99,front:"Apple",back:"सेब",tl:"Seb",pron:"sayb — like 'sabe'",cat:"Food & Home",hint:"'Seb' sounds like 'sieve' — strain apple juice through a sieve!",trick:"'Sieb' — Äpfel durch ein Sieb!" },
  { id:100,front:"Vegetable",back:"सब्ज़ी",tl:"Sabzi",pron:"SUB-zee",cat:"Food & Home",hint:"'Sub-zee' — a veggie submarine sub!",trick:"'Sabzi' — Gemüse als Substitute!" },
  { id:101,front:"Banana",back:"केला",tl:"Kelaa",pron:"KAY-laa",cat:"Food & Home",hint:"'Kay-la' — bananas ripen in the cellar (Keller)!",trick:"'Keller' — Bananen reifen im Keller!" },
  { id:112,front:"Egg",back:"अंडा",tl:"Andaa",pron:"UN-daa",cat:"Food & Home",hint:"'Un-DAA' — an egg is unlike (anders) anything else!",trick:"'Ander(s)' — ein Ei ist anders!" },
  { id:113,front:"Mirror",back:"शीशा",tl:"Sheeshaa",pron:"SHEE-shaa",cat:"Food & Home",hint:"Like 'shisha' — a shisha pipe is made of glass, like a mirror!",trick:"'Shisha' — spiegelt sich das Licht!" },
  { id:115,front:"Breakfast",back:"नाश्ता",tl:"Naashta",pron:"NAASH-taa",cat:"Food & Home",hint:"'NAASH-ta' — naschen (snack) in the morning = breakfast!",trick:"'Nascht-a' — morgens naschen!" },
  { id:39,front:"City",back:"शहर",tl:"Sheher",pron:"sheh-HER",cat:"Places",hint:"'Sheh-HER' — she's here, in the city!",trick:"'Schere' — scharf und lebendig." },
  { id:40,front:"Village",back:"गाँव",tl:"Gaanv",pron:"gaanv — nasal",cat:"Places",hint:"'Gaanv' sounds like 'ganz' (German: whole) — a whole little village!",trick:"'Ganz' — ein ganzes kleines Dorf." },
  { id:41,front:"Inside",back:"अंदर",tl:"Andar",pron:"UN-dar",cat:"Places",hint:"'Andar' — it's 'anders' (different) inside!",trick:"'Ander(s)' — drinnen ist es anders!" },
  { id:42,front:"Outside",back:"बाहर",tl:"Baahar",pron:"BAA-har",cat:"Places",hint:"'BAA-har' — 'baa' goes the sheep, outside in the field!",trick:"'Bahre' — steht draußen." },
  { id:43,front:"Near",back:"पास",tl:"Paas",pron:"paas — like 'pass'",cat:"Places",hint:"Like 'pass' — the mountain pass is nearby!",trick:"'Pass' — der Gebirgspass ist nah!" },
  { id:44,front:"Month",back:"महीना",tl:"Maheena",pron:"ma-HEE-naa",cat:"Time",hint:"'Ma-HEE-na' — the monthly machine keeps spinning!",trick:"'Maschine-a' — Monats-Maschine." },
  { id:45,front:"December",back:"दिसंबर",tl:"Disambar",pron:"di-SUM-bar",cat:"Time",hint:"Almost identical to 'December' — just say it with an Indian accent!",trick:"'Disambar' ≈ 'Dezember'. Leicht!" },
  { id:46,front:"Date",back:"तारीख़",tl:"Taareekh",pron:"taa-REEKH",cat:"Time",hint:"'Taa-REEKH' — ask Tarik for today's date!",trick:"Frag Tarik nach dem Datum!" },
  { id:47,front:"Day",back:"दिन",tl:"Din",pron:"din — like English 'din'",cat:"Time",hint:"Like 'din' (noise) — every day has its own noise!",trick:"'Ding' ohne g — neues Ding jeden Tag!" },
  { id:48,front:"Birthday",back:"जन्मदिन",tl:"Janamdin",pron:"ja-NAM-din",cat:"Time",hint:"'Janam' (birth) + 'din' (day) = birthday. Just like German 'Geburts-tag'!",trick:"'Janam' + 'din' — wie 'Geburts-tag'!" },
  { id:49,front:"Often",back:"अक्सर",tl:"Aksar",pron:"UK-sar",cat:"Time",hint:"'UK-sar' — I often hear a British accent (UK)!",trick:"'Akzent' — oft einen Akzent hören." },
  { id:50,front:"Always",back:"हमेशा",tl:"Hamesha",pron:"ha-MAY-sha",cat:"Time",hint:"'Ha-MAY-sha' — Ha! My sweetheart, always!",trick:"'Ha, Me, Sha(tz)!' — immer!" },
  { id:102,front:"Later",back:"बाद में",tl:"Baad mein",pron:"baad mayn",cat:"Time",hint:"'Baad' sounds like 'Bad' (bath) — I'll take a bath later!",trick:"'Bad' — später ins Bad!" },
  { id:103,front:"Immediately",back:"तुरंत",tl:"Turant",pron:"too-RUNT",cat:"Time",hint:"'Too-RUNT' — he ran to gymnastics (turnen) immediately!",trick:"'Turnen, rannt' — sofort!" },
  { id:51,front:"Happiness",back:"ख़ुशी",tl:"Khushi",pron:"KHOO-shee",cat:"Emotions",hint:"'KHOO-shee' — cuddling (kuscheln) brings happiness!",trick:"'Kuschel-i' — Kuscheln = glücklich!" },
  { id:52,front:"Anger",back:"गुस्सा",tl:"Gussa",pron:"GOOS-saa",cat:"Emotions",hint:"'GOOS-sa' — anger pours out like a gush of rain!",trick:"'Guss' — Wutausbruch wie Regenguss!" },
  { id:53,front:"Dream",back:"सपना",tl:"Sapna",pron:"SUP-naa",cat:"Emotions",hint:"'Sup-NAA' — you dream in a sauna!",trick:"'Sauna' — träumt man schön." },
  { id:54,front:"Fun",back:"मज़ा",tl:"Mazaa",pron:"ma-ZAA",cat:"Emotions",hint:"'Ma-ZAA' — like 'matza' — baking matza is fun!",trick:"'Matza' — backen macht Spaß!" },
  { id:55,front:"Health",back:"सेहत",tl:"Sehat",pron:"SEH-hat",cat:"Emotions",hint:"'SEH-hat' — who can see (sehen) well, has good health!",trick:"'Seh hat' — wer gut sieht ist gesund!" },
  { id:56,front:"Different",back:"अलग",tl:"Alag",pron:"a-LUG",cat:"Adjectives",hint:"'A-lug' — every day (Alltag) is different!",trick:"'Alltag' — jeder Alltag ist anders." },
  { id:57,front:"Polite",back:"विनम्र",tl:"Vinamra",pron:"vi-NUM-ra",cat:"Adjectives",hint:"'Vi-NUM-ra' — a very fine (fein) and polite manner!",trick:"'Fein-Ammer' — höfliche Ammer." },
  { id:58,front:"Honest",back:"ईमानदार",tl:"Imaandaar",pron:"ee-MAAN-daar",cat:"Adjectives",hint:"'Imaan' = faith. '-daar' = keeper. A faith-keeper is honest!",trick:"Der Imam ist ehrlich!" },
  { id:59,front:"Fast",back:"तेज़ / जल्दी",tl:"Tez / Jaldi",pron:"tayz / JUL-dee",cat:"Adjectives",hint:"'Tez' = fast/sharp. 'Jaldi' = quickly. 'Jaldi karo!' = Hurry up!",trick:"'Tess rennt schnell'. 'Jaldi' — ja, beeile dich!" },
  { id:60,front:"Cheap",back:"सस्ता",tl:"Sasta",pron:"SUS-taa",cat:"Adjectives",hint:"'SUS-ta' — cheap pasta is 'sasta'!",trick:"'Pasta' — billige Pasta ist sasta!" },
  { id:61,front:"Clean",back:"साफ़",tl:"Saaf",pron:"saaf — like 'sauf'",cat:"Adjectives",hint:"'Saaf' sounds like 'Saft' (juice) — clean, fresh juice!",trick:"'Saft' — sauberer Saft!" },
  { id:62,front:"Dry",back:"सूखा",tl:"Sookha",pron:"SOO-khaa",cat:"Adjectives",hint:"'SOO-kha' — searching (suchen) for dry land!",trick:"'Suche' — trockenes Land." },
  { id:63,front:"Wet",back:"गीला",tl:"Geela",pron:"GEE-laa",cat:"Adjectives",hint:"'GEE-la' — gelato melts and gets everything wet!",trick:"'Gela(to)' — schmilzt und wird nass!" },
  { id:64,front:"Easy",back:"आसान",tl:"Aasaan",pron:"aa-SAAN",cat:"Adjectives",hint:"'Aa-SAAN' — ah, so pleasant and easy!",trick:"'Ah, so an(genehm)!' — leicht!" },
  { id:65,front:"Difficult",back:"मुश्किल",tl:"Mushkil",pron:"MUSH-kil",cat:"Adjectives",hint:"'MUSH-kil' — opening a mussel (Muschel) is difficult!",trick:"'Muschel' — schwer zu öffnen!" },
  { id:66,front:"Bad",back:"बुरा",tl:"Buraa",pron:"boo-RAA",cat:"Adjectives",hint:"'Boo-RAA' — boo! That's bad!",trick:"'Buhrufe' sind schlecht!" },
  { id:67,front:"Interesting",back:"दिलचस्प",tl:"Dilchasp",pron:"dil-CHUSP",cat:"Adjectives",hint:"'Dil' = heart. Something that grips your heart is interesting!",trick:"'Dill-Chasp' — sticks to heart!" },
  { id:68,front:"Enough",back:"काफ़ी / बस",tl:"Kaafi / Bas",pron:"KAA-fee / bus",cat:"Adjectives",hint:"'Kaafi' like 'coffee' — enough coffee! 'Bas' like 'bus' — stop!",trick:"'Kaffee' — genug Kaffee!" },
  { id:104,front:"Young",back:"जवान",tl:"Javaan",pron:"ja-VAAN",cat:"Adjectives",hint:"'Ja-VAAN' — young people code in Java!",trick:"'Java-n' — junge Leute coden Java!" },
  { id:111,front:"Cold",back:"सर्दी",tl:"Sardi",pron:"SAR-dee",cat:"Adjectives",hint:"'SAR-dee' — sardines swim in cold water!",trick:"'Sardine' — im kalten Wasser!" },
  { id:69,front:"To speak",back:"बोलना",tl:"Bolnaa",pron:"BOWL-naa",cat:"Verbs",hint:"'BOWL-na' — people shout when bowling!",trick:"'Bowling' — laut beim Bowling!" },
  { id:70,front:"To learn",back:"सीखना",tl:"Seekhna",pron:"SEEKH-naa",cat:"Verbs",hint:"'SEEKH-na' — seek knowledge! Seek + na = to learn!",trick:"Von den Sikhs lernt man viel!" },
  { id:71,front:"To walk",back:"चलना",tl:"Chalnaa",pron:"CHUL-naa",cat:"Verbs",hint:"'CHUL-na' — your shoes make a sound (Schall) when you walk!",trick:"'Schall-na' — Gehen macht Schall!" },
  { id:72,front:"To read",back:"पढ़ना",tl:"Padhna",pron:"PUDH-naa",cat:"Verbs",hint:"'PUDH-na' — read on your iPad (pad)!",trick:"'Pad' — auf dem Pad liest man!" },
  { id:73,front:"To ask",back:"पूछना",tl:"Poochhnaa",pron:"POOCHH-naa",cat:"Verbs",hint:"'POOCHH-na' — pooch (dog) always asks for food!",trick:"'Putsch-na' — jeder fragt." },
  { id:74,front:"To start",back:"शुरू करना",tl:"Shuru karnaa",pron:"shoo-ROO kar-NAA",cat:"Verbs",hint:"'Shoo-ROO' — put on your shoes and start running!",trick:"'Schuh-Ruh' — Schuhe an, starte!" },
  { id:105,front:"To understand",back:"समझना",tl:"Samajhna",pron:"sa-MUJH-naa",cat:"Verbs",hint:"'Sa-MUJH-na' — Sam, oh ja! Sam understands!",trick:"'Sam, Ach ja!' — versteht es!" },
  { id:114,front:"To sit",back:"बैठना",tl:"Baithna",pron:"BAITH-naa",cat:"Verbs",hint:"'BAITH-na' — take a byte (sit at computer)!",trick:"'Byte-na' — sitz und programmiere!" },
  { id:75,front:"Message",back:"संदेश",tl:"Sandesh",pron:"sun-DAYSH",cat:"Common Words",hint:"'Sun-DAYSH' — a message written in the sand!",trick:"'Sand-Esch(e)' — Nachricht im Sand." },
  { id:76,front:"Answer",back:"जवाब",tl:"Javaab",pron:"ja-VAAB",cat:"Common Words",hint:"'Ja-VAAB' — 'Ja!' weaves the answer together!",trick:"'Ja, waab!' — Antwort webt sich." },
  { id:77,front:"Maybe",back:"शायद",tl:"Shaayad",pron:"SHAA-yad",cat:"Common Words",hint:"'SHAA-yad' — 'Schade!' (pity) — maybe next time!",trick:"'Schade' — vielleicht!" },
  { id:80,front:"Or",back:"या",tl:"Ya",pron:"yaa — like 'yeah'",cat:"Common Words",hint:"Just 'ya' — like saying 'yeah?' as a question. This or that?",trick:"'Ja' — ja oder nein?" },
  { id:81,front:"Both",back:"दोनों",tl:"Donon",pron:"DOH-non",cat:"Common Words",hint:"'DOH-non' — double thunder (Donner)! Both of them!",trick:"'Donner' — doppelt laut!" },
  { id:82,front:"With",back:"के साथ",tl:"Ke saath",pron:"kay SAATH",cat:"Common Words",hint:"'Saath' sounds like 'Saat' (seed) — plant seeds together, with friends!",trick:"'Saat' — zusammen pflanzen." },
  { id:83,front:"For",back:"के लिए",tl:"Ke liye",pron:"kay LEE-yay",cat:"Common Words",hint:"'Kay LEE-yay' — 'K, leave it for me!'",trick:"'Kelly, eh' — für Kelly!" },
  { id:84,front:"Too / Also",back:"भी",tl:"Bhi",pron:"bhee — breathy 'bh'",cat:"Common Words",hint:"'Bhee' — a bee (Biene) wants some too!",trick:"'Biene' — will auch!" },
  { id:85,front:"Right (correct)",back:"सही",tl:"Sahi",pron:"sa-HEE",cat:"Common Words",hint:"'Sa-HEE' — cream (Sahne) is always the right choice!",trick:"'Sahne' — richtige Wahl!" },
  { id:79,front:"That's why",back:"इसलिए",tl:"Isliye",pron:"ISS-lee-yay",cat:"Common Words",hint:"'ISS-lee-yay' — eat (iss) it, that's why it's there!",trick:"'Is(s) lie(ber)' — iss lieber deshalb!" },
  { id:106,front:"More",back:"और / ज़्यादा",tl:"Aur / Zyaada",pron:"OWR / zyaa-DAA",cat:"Common Words",hint:"'Aur' sounds like 'Ohr' (ear) — I want more ears to listen!",trick:"'Ohr' — mehr Ohren!" },
  { id:107,front:"Group",back:"समूह",tl:"Samooh",pron:"sa-MOOH",cat:"Common Words",hint:"'Sa-MOOH' — Sam says 'uh!' calling the group together!",trick:"'Sam, uh!' — ruft die Gruppe!" },
  { id:110,front:"Journey",back:"यात्रा",tl:"Yaatraa",pron:"YAA-traa",cat:"Common Words",hint:"'YAA-tra' — 'Yes, carry (trage) your bags on the journey!'",trick:"'Ja, Trage!' — Koffer auf die Reise!" },
  { id:78,front:"Something else?",back:"और कुछ?",tl:"Aur kuchh?",pron:"OWR kootch?",cat:"Sentences",hint:"'Aur' = and/more, 'kuchh' = something. Shopkeeper's favorite phrase!",trick:"'Ohr + Kutsch(e)' — noch was?" },
  { id:86,front:"I live in Hamburg",back:"मैं हैम्बर्ग में रहता हूँ",tl:"Main Hamburg mein rehta hoon",pron:"main Hamburg mayn REH-taa hoon",cat:"Sentences",hint:"'Main' = I, 'mein' = in, 'rehta hoon' = live. Almost like German word order!",trick:"Fast wie Deutsch!" },
  { id:108,front:"I am doing well",back:"मैं ठीक हूँ",tl:"Main theek hoon",pron:"main THEEK hoon",cat:"Sentences",hint:"'Theek' sounds like 'tick' — everything ticks correctly, I'm fine!",trick:"'Tick' — alles tickt richtig!" },
  { id:116,front:"I'm good as well",back:"मैं भी ठीक हूँ",tl:"Main bhi theek hoon",pron:"main bhee THEEK hoon",cat:"Sentences",hint:"Just add 'bhi' (also) to 'main theek hoon'. Bhi = also = auch!",trick:"'Bhi' = auch — mir geht's auch gut!" },
];

const CATEGORIES=["All",...Array.from(new Set(ALL_CARDS.map(c=>c.cat)))];
const CC={Numbers:"#E8785A","Family & People":"#B07CC8","Body Parts":"#E8708A","Nature & Weather":"#5AB8C8",Colors:"#D4A84A","Food & Home":"#5CB87A",Places:"#6A9EE0",Time:"#E8A05A",Emotions:"#D87098",Adjectives:"#5AAA8A",Verbs:"#9A7ACA","Common Words":"#7A88D8",Sentences:"#E88A6A"};

// Level colors: 1=red, 2=orange, 3=yellow, 4=lime, 5=green
const LVL_COLORS=["#E85A5A","#E8935A","#D4A84A","#8BC05A","#4AA85A"];
const LVL_LABELS=["New","48h","4 days","1 week","Monthly"];
const LVL_DELAYS=[0,48*3600000,96*3600000,7*24*3600000,30*24*3600000];// ms

const TH={light:{bg:"#FFF",bgGrad:"linear-gradient(150deg,#FFF0F3 0%,#FDE8EF 15%,#F5EDFF 30%,#E8F0FF 50%,#E6FAF5 68%,#FFFAE6 85%,#FFF0F0 100%)",cardFront:"linear-gradient(155deg,#FFFFFF,#FFF8FA 40%,#FBF5FF 70%,#F5F8FF)",text:"#2D2530",sub:"#5C5060",muted:"#9A90A0",faint:"#D0C8D4",hintBg:"rgba(180,120,200,.06)",hintBd:"rgba(180,120,200,.14)",hintTx:"#6A5878",trickBg:"rgba(90,184,122,.06)",trickBd:"rgba(90,184,122,.16)",trickTx:"#3A7A52",pillBg:"#FFF",pillBd:"rgba(0,0,0,.06)",btnBg:"#FFF",btnBd:"rgba(0,0,0,.07)",btnTx:"#7A7080",dotBg:"rgba(0,0,0,.07)",divider:"rgba(0,0,0,.06)",cardShadow:"0 6px 32px rgba(0,0,0,.05),0 2px 6px rgba(0,0,0,.03)",togBg:"#FFF",togTx:"#2D2530",accent:"#D87098",pronBg:"rgba(216,112,152,.07)",pronBd:"rgba(216,112,152,.18)",speedBg:"rgba(216,112,152,.04)",speedBd:"rgba(216,112,152,.10)",speedActive:"rgba(216,112,152,.10)",inputBg:"#FFF",inputBd:"rgba(0,0,0,.10)",overlayBg:"rgba(255,255,255,.97)",tabBg:"#FFFFFF",tabBd:"rgba(0,0,0,.06)",barFill:"#D87098"},dark:{bg:"#110E14",bgGrad:"linear-gradient(150deg,#16101C,#1A1220 25%,#12141E 50%,#141018 75%,#18141C)",cardFront:"linear-gradient(155deg,#1E1826,#1A1520 50%,#161220)",text:"#F0EAF0",sub:"#908498",muted:"#5A5060",faint:"#3A3440",hintBg:"rgba(255,255,255,.04)",hintBd:"rgba(255,255,255,.08)",hintTx:"#908498",trickBg:"rgba(90,184,122,.08)",trickBd:"rgba(90,184,122,.15)",trickTx:"#7AC89A",pillBg:"rgba(255,255,255,.04)",pillBd:"rgba(255,255,255,.07)",btnBg:"rgba(255,255,255,.04)",btnBd:"rgba(255,255,255,.07)",btnTx:"#908498",dotBg:"rgba(255,255,255,.08)",divider:"rgba(255,255,255,.05)",cardShadow:"0 6px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.03)",togBg:"rgba(255,255,255,.06)",togTx:"#F0EAF0",accent:"#E8889A",pronBg:"rgba(232,136,154,.10)",pronBd:"rgba(232,136,154,.22)",speedBg:"rgba(255,255,255,.03)",speedBd:"rgba(255,255,255,.06)",speedActive:"rgba(232,136,154,.12)",inputBg:"rgba(255,255,255,.06)",inputBd:"rgba(255,255,255,.10)",overlayBg:"rgba(17,14,20,.97)",tabBg:"#1A1520",tabBd:"rgba(255,255,255,.06)",barFill:"#E8889A"}};

const SPEEDS=[{key:"normal",label:"Normal",rate:.82,emoji:"🗣️"},{key:"slow",label:"Slow",rate:.15,emoji:"🐢"}];

function useSpeech(){const[s,ss]=useState(false);const[a,sa]=useState(null);const[v,sv]=useState(null);const r=useRef(null);useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;r.current=window.speechSynthesis;const p=()=>{const vs=r.current.getVoices();sv(vs.find(x=>x.lang==="hi-IN")||vs.find(x=>x.lang.startsWith("hi"))||null);};p();r.current.addEventListener("voiceschanged",p);return()=>r.current?.removeEventListener("voiceschanged",p);},[]);const speak=useCallback((t,rate=.82,k="normal")=>{if(!r.current)return;r.current.cancel();const u=new SpeechSynthesisUtterance(t.replace(/\s*\/\s*/g," ").replace(/\n/g," "));u.lang="hi-IN";u.rate=rate;u.pitch=1;if(v)u.voice=v;u.onstart=()=>{ss(true);sa(k);};u.onend=()=>{ss(false);sa(null);};u.onerror=()=>{ss(false);sa(null);};r.current.speak(u);},[v]);const stop=useCallback(()=>{r.current?.cancel();ss(false);sa(null);},[]);return{speak,stop,speaking:s,activeSpeed:a,supported:typeof window!=="undefined"&&!!window.speechSynthesis};}
function useSwipe(onL,onR){const sx=useRef(0);const sy=useRef(0);const onTS=useCallback(e=>{sx.current=e.touches[0].clientX;sy.current=e.touches[0].clientY;},[]);const onTE=useCallback(e=>{const dx=e.changedTouches[0].clientX-sx.current;const dy=e.changedTouches[0].clientY-sy.current;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){dx>0?onR():onL();}},[onL,onR]);return{onTouchStart:onTS,onTouchEnd:onTE};}

async function saveData(uid,data){try{await setDoc(doc(db,"users",uid),{...data,updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.error(e);}}
async function loadData(uid){try{const s=await getDoc(doc(db,"users",uid));if(s.exists())return s.data();}catch(e){console.error(e);}return null;}

function PasswordInput({value,onChange,placeholder,onKeyDown,T}){const[v,setV]=useState(false);return(<div style={{position:"relative",width:"100%"}}><input type={v?"text":"password"} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} style={{width:"100%",padding:"14px 48px 14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}}/><button type="button" onClick={()=>setV(x=>!x)} tabIndex={-1} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:"6px 8px",color:T.muted}}>{v?<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div>);}

function AuthScreen({T}){const[isS,setIsS]=useState(false);const[nm,setNm]=useState("");const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const sub=async()=>{setErr("");if(isS&&!nm.trim()){setErr("Please enter your name");return;}if(!em||!pw){setErr("Fill in all fields");return;}if(pw.length<6){setErr("Password: min 6 characters");return;}setLd(true);try{if(isS){const c=await createUserWithEmailAndPassword(auth,em,pw);await setDoc(doc(db,"users",c.user.uid),{name:nm.trim(),cardLevels:{},stats:{totalMinutes:0,dailyLog:{},dailyTarget:25},updatedAt:new Date().toISOString()});}else await signInWithEmailAndPassword(auth,em,pw);}catch(e){const m=e.code==="auth/user-not-found"?"No account found.":e.code==="auth/wrong-password"?"Wrong password.":e.code==="auth/invalid-credential"?"Invalid email or password.":e.code==="auth/email-already-in-use"?"Already registered.":e.code==="auth/invalid-email"?"Invalid email.":e.message;setErr(m);}setLd(false);};const iS={width:"100%",padding:"14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"};
return(<div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxSizing:"border-box"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{width:"100%",maxWidth:400,textAlign:"center"}}><div style={{fontSize:16,letterSpacing:3,textTransform:"uppercase",color:T.accent,fontWeight:700,marginBottom:6,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div><h1 style={{fontSize:36,fontWeight:800,margin:0,color:T.text}}>Hindi Flashcards</h1><p style={{fontSize:16,color:T.sub,margin:"8px 0 28px"}}>{isS?"Create your account":"Log in to continue"}</p><div style={{display:"flex",flexDirection:"column",gap:12}}>{isS&&<input type="text" placeholder="Your name" value={nm} onChange={e=>setNm(e.target.value)} style={iS}/>}<input type="email" placeholder="Email" value={em} onChange={e=>setEm(e.target.value)} style={iS}/><PasswordInput value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password (min 6)" onKeyDown={e=>e.key==="Enter"&&sub()} T={T}/>{err&&<div style={{padding:"10px 14px",borderRadius:12,background:"#F43F5E14",border:"1px solid #F43F5E30",color:"#E11D48",fontSize:13,textAlign:"left"}}>{err}</div>}<button onClick={sub} disabled={ld} style={{padding:"14px",borderRadius:16,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,color:"#FFF",fontSize:17,fontFamily:"inherit",fontWeight:700,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Please wait...":isS?"Create Account ✨":"Log In 🚀"}</button><button onClick={()=>{setIsS(s=>!s);setErr("");}} style={{padding:"10px",borderRadius:12,border:`1px solid ${T.pillBd}`,background:"transparent",color:T.sub,fontSize:14,fontFamily:"inherit",cursor:"pointer"}}>{isS?"Have an account? Log in":"New? Create an account"}</button></div></div></div>);}

function getCardLevel(cardLevels,id){return cardLevels[id]||{level:1,lastCorrect:null};}
function isDue(cardLevels,id){const cl=getCardLevel(cardLevels,id);if(!cl.lastCorrect||cl.level<=1)return true;const delay=LVL_DELAYS[Math.min(cl.level-1,4)];return Date.now()-new Date(cl.lastCorrect).getTime()>=delay;}
function levelUp(cardLevels,id){const cl=getCardLevel(cardLevels,id);return{...cardLevels,[id]:{level:Math.min(cl.level+1,5),lastCorrect:new Date().toISOString()}};}
function levelDown(cardLevels,id){const cl=getCardLevel(cardLevels,id);return{...cardLevels,[id]:{level:Math.max(cl.level-1,1),lastCorrect:cl.lastCorrect}};}

// ——— MAIN ———
export default function App(){
  const[user,setUser]=useState(null);const[userName,setUserName]=useState("");const[authLoading,setAuthLoading]=useState(true);
  const[idx,setIdx]=useState(0);const[flipped,setFlipped]=useState(false);const[cat,setCat]=useState("All");
  const[cardLevels,setCardLevels]=useState({});
  const[flips,setFlips]=useState(0);const[anim,setAnim]=useState(false);const[dark,setDark]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(true);const[saving,setSaving]=useState(false);
  const[tab,setTab]=useState("practice");const[showList,setShowList]=useState(null);
  const[swipeHint,setSwipeHint]=useState(null);const[practiceMode,setPracticeMode]=useState(null);
  const[stats,setStats]=useState({totalMinutes:0,dailyLog:{},dailyTarget:25});
  const[showHint,setShowHint]=useState(false);
  const[todayFlips,setTodayFlips]=useState(0);
  const sessionStart=useRef(Date.now());

  const{speak,stop,speaking,activeSpeed,supported}=useSpeech();
  const T=dark?TH.dark:TH.light;
  const today=new Date().toISOString().slice(0,10);

  const knownSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=5).map(([k])=>+k)),[cardLevels]);
  const learningSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=2&&v.level<5).map(([k])=>+k)),[cardLevels]);
  const dueCards=useMemo(()=>ALL_CARDS.filter(c=>isDue(cardLevels,c.id)),[cardLevels]);

  const cards=useMemo(()=>{
    if(practiceMode==="learning")return ALL_CARDS.filter(c=>{const l=getCardLevel(cardLevels,c.id).level;return l>=2&&l<5&&isDue(cardLevels,c.id);});
    if(practiceMode==="due")return dueCards;
    return cat==="All"?ALL_CARDS:ALL_CARDS.filter(c=>c.cat===cat);
  },[cat,practiceMode,cardLevels,dueCards]);
  const card=cards[idx]||cards[0];const color=CC[card?.cat]||"#D87098";

  useEffect(()=>{const unsub=onAuthStateChanged(auth,async u=>{setUser(u);if(u){const d=await loadData(u.uid);if(d){setCardLevels(d.cardLevels||{});setUserName(d.name||"");setStats(d.stats||{totalMinutes:0,dailyLog:{},dailyTarget:25});setTodayFlips(d.stats?.dailyLog?.[new Date().toISOString().slice(0,10)]||0);}}else{setCardLevels({});setUserName("");setStats({totalMinutes:0,dailyLog:{},dailyTarget:25});}setAuthLoading(false);});return()=>unsub();},[]);

  useEffect(()=>{if(!user)return;const iv=setInterval(()=>{const el=(Date.now()-sessionStart.current)/60000;sessionStart.current=Date.now();if(el>0&&el<5)setStats(p=>({...p,totalMinutes:(p.totalMinutes||0)+el}));},30000);return()=>clearInterval(iv);},[user]);

  const saveTimeout=useRef(null);
  useEffect(()=>{if(!user)return;if(saveTimeout.current)clearTimeout(saveTimeout.current);saveTimeout.current=setTimeout(async()=>{setSaving(true);await saveData(user.uid,{name:userName,cardLevels,stats});setSaving(false);},1000);return()=>{if(saveTimeout.current)clearTimeout(saveTimeout.current);};},[cardLevels,user,userName,stats]);

  const prevFlipped=useRef(false);
  useEffect(()=>{if(flipped&&!prevFlipped.current&&autoSpeak&&supported&&card)setTimeout(()=>speak(card.back,.82,"normal"),400);prevFlipped.current=flipped;},[flipped,card,autoSpeak,supported,speak]);

  const doFlip=useCallback(()=>{if(!anim){setFlipped(f=>!f);setFlips(c=>c+1);setShowHint(false);setTodayFlips(f=>f+1);setStats(p=>({...p,dailyLog:{...p.dailyLog,[today]:(p.dailyLog?.[today]||0)+1}}));}},[anim,today]);
  const nav=useCallback(d=>{if(anim)return;setAnim(true);setFlipped(false);setShowHint(false);stop();setTimeout(()=>{setIdx(i=>{const n=i+d;return n<0?cards.length-1:n>=cards.length?0:n;});setAnim(false);},200);},[cards.length,anim,stop]);

  const markKnow=useCallback(()=>{if(!card)return;setCardLevels(prev=>levelUp(prev,card.id));nav(1);},[card,nav]);
  const markLearn=useCallback(()=>{if(!card)return;setCardLevels(prev=>levelDown(prev,card.id));nav(1);},[card,nav]);

  const onSwipeL=useCallback(()=>{setSwipeHint("left");setTimeout(()=>setSwipeHint(null),400);markLearn();},[markLearn]);
  const onSwipeR=useCallback(()=>{setSwipeHint("right");setTimeout(()=>setSwipeHint(null),400);markKnow();},[markKnow]);
  const swipe=useSwipe(onSwipeL,onSwipeR);
  const handleLogout=async()=>{stop();await signOut(auth);};
  const pct=Math.round((knownSet.size/ALL_CARDS.length)*100);
  const handlePlay=(e,sp)=>{e.stopPropagation();if(speaking&&activeSpeed===sp.key){stop();return;}speak(card.back,sp.rate,sp.key);};
  const displayName=userName||user?.email?.split("@")[0]||"Learner";
  const jumpToCard=id=>{setPracticeMode(null);setCat("All");setFlipped(false);setShowHint(false);stop();const i=ALL_CARDS.findIndex(c=>c.id===id);if(i>=0)setIdx(i);setShowList(null);};
  const exitPractice=()=>{setPracticeMode(null);setCat("All");setIdx(0);setFlipped(false);setShowHint(false);};
  const dailyTarget=stats.dailyTarget||25;
  const targetPct=Math.min(Math.round((todayFlips/dailyTarget)*100),100);
  const cl=card?getCardLevel(cardLevels,card.id):{level:1};

  if(authLoading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgGrad,fontFamily:"'Outfit',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{textAlign:"center",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🇮🇳</div><div style={{fontSize:18,fontWeight:600}}>Loading...</div></div></div>);
  if(!user)return<AuthScreen T={T}/>;

  return(
    <div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",color:T.text,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 14px 80px",boxSizing:"border-box",transition:"background .5s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes speakPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes barBounce{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes swL{0%{opacity:0;transform:translateX(20px)}50%{opacity:1}100%{opacity:0;transform:translateX(-20px)}}@keyframes swR{0%{opacity:0;transform:translateX(-20px)}50%{opacity:1}100%{opacity:0;transform:translateX(20px)}}@keyframes hintReveal{from{opacity:0;max-height:0}to{opacity:1;max-height:200px}}.cat-scroll::-webkit-scrollbar{display:none}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}`}</style>

      {/* List modals */}
      {showList&&<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",padding:20}} onClick={()=>setShowList(null)}><div onClick={e=>e.stopPropagation()} style={{background:T.overlayBg,borderRadius:24,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",backdropFilter:"blur(20px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:22,fontWeight:800,color:T.text,margin:0}}>{showList==="known"?"⭐ Mastered":"📖 Learning"} ({(showList==="known"?knownSet:learningSet).size})</h2>
          <button onClick={()=>setShowList(null)} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${T.pillBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {showList==="learning"&&learningSet.size>0&&<button onClick={()=>{setPracticeMode("learning");setIdx(0);setFlipped(false);setShowList(null);setTab("practice");}} style={{width:"100%",padding:"12px",borderRadius:14,border:"1.5px solid #D4A84A44",background:"#D4A84A12",color:"#D4A84A",fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:12}}>🎯 Practice all learning words</button>}
        {ALL_CARDS.filter(c=>(showList==="known"?knownSet:learningSet).has(c.id)).map(c=>{const lv=getCardLevel(cardLevels,c.id);return(<button key={c.id} onClick={()=>jumpToCard(c.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:14,border:`1.5px solid ${showList==="known"?"#5CB87A22":"#D4A84A22"}`,background:`${showList==="known"?"#5CB87A":"#D4A84A"}06`,marginBottom:8,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}><div><div style={{fontSize:17,fontWeight:700,color:T.text}}>{c.front}</div><div style={{fontSize:14,color:CC[c.cat]||T.sub,fontWeight:600,marginTop:2}}>{c.back} · {c.tl}</div></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:11,fontWeight:700,color:LVL_COLORS[lv.level-1],background:`${LVL_COLORS[lv.level-1]}18`,padding:"2px 8px",borderRadius:8}}>Lv{lv.level}</span></div></button>);})}
        {(showList==="known"?knownSet:learningSet).size===0&&<div style={{textAlign:"center",padding:"40px 0",color:T.muted,fontSize:16}}>No cards here yet!</div>}
      </div></div>}

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:560}}>

        {/* ===== PRACTICE ===== */}
        {tab==="practice"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:13,letterSpacing:3,textTransform:"uppercase",color:T.accent,fontWeight:700,marginBottom:2,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div>
              <h1 style={{fontSize:24,fontWeight:800,margin:0,lineHeight:1.1,color:T.text}}>Namaste, {displayName}! 👋</h1>
              <p style={{fontSize:12,color:T.sub,margin:"2px 0 0"}}>{saving?"Saving...":"✅ Synced"} · {dueCards.length} cards due · {practiceMode?"🎯 Practice mode":""}</p>
            </div>
          </div>

          {/* Daily target bar */}
          <div style={{marginBottom:10,padding:"10px 14px",borderRadius:14,background:T.pillBg,border:`1px solid ${T.pillBd}`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600,color:T.text}}>🎯 Today: {todayFlips}/{dailyTarget} flips</span>
                <span style={{fontWeight:700,color:targetPct>=100?"#4AA85A":T.accent}}>{targetPct>=100?"Done! ✨":`${targetPct}%`}</span>
              </div>
              <div style={{height:6,borderRadius:3,background:T.dotBg,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,width:`${targetPct}%`,background:targetPct>=100?"linear-gradient(90deg,#4AA85A,#8BC05A)":"linear-gradient(90deg,#E8785A,#D4A84A)",transition:"width .4s"}}/>
              </div>
            </div>
          </div>

          {practiceMode&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderRadius:12,background:"#D4A84A14",border:"1.5px solid #D4A84A33",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:700,color:"#D4A84A"}}>🎯 {practiceMode==="learning"?"Learning cards":"Due cards"}: {cards.length}</span>
            <button onClick={exitPractice} style={{padding:"5px 10px",borderRadius:10,border:"1px solid #D4A84A44",background:"transparent",color:"#D4A84A",fontSize:11,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>Exit</button>
          </div>}

          {/* Progress */}
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:14,color:T.sub}}>
              <span>✨ {knownSet.size} mastered</span><span style={{fontWeight:700,color:T.accent}}>{pct}%</span>
            </div>
            <div style={{height:6,borderRadius:3,background:T.dotBg,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:"linear-gradient(90deg,#E8785A,#D4A84A,#5CB87A)",transition:"width .6s",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite"}}/>
            </div>
          </div>

          {/* Categories */}
          {!practiceMode&&<div className="cat-scroll" style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:6,marginBottom:8,scrollbarWidth:"none"}}>
            {CATEGORIES.map(c=>{const active=cat===c;const cc=CC[c]||T.accent;return(<button key={c} onClick={()=>{setCat(c);setIdx(0);setFlipped(false);setShowHint(false);stop();}} style={{padding:"6px 13px",borderRadius:18,border:"1.5px solid",whiteSpace:"nowrap",flexShrink:0,borderColor:active?cc:T.pillBd,background:active?`${cc}18`:T.pillBg,color:active?cc:T.sub,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:active?700:400}}>{c}</button>);})}
          </div>}

          {cards.length>0?<>
          {/* Card label + level */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,padding:"0 4px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:color}}/>
              <span style={{fontSize:13,color,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{card?.cat}</span>
              <span style={{fontSize:11,fontWeight:700,color:LVL_COLORS[cl.level-1],background:`${LVL_COLORS[cl.level-1]}18`,padding:"2px 8px",borderRadius:8}}>Lv{cl.level} · {LVL_LABELS[cl.level-1]}</span>
            </div>
            <span style={{fontSize:14,color:T.muted,fontWeight:600}}>{idx+1}/{cards.length}</span>
          </div>

          {/* FLASHCARD */}
          <div {...swipe} onClick={doFlip} style={{perspective:1200,cursor:"pointer",marginBottom:8,height:440,position:"relative"}}>
            {swipeHint==="right"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(92,184,122,.15)",animation:"swR .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>✅</span></div>}
            {swipeHint==="left"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(212,168,74,.15)",animation:"swL .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>🔄</span></div>}
            <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0)",transition:"transform .65s cubic-bezier(.23,1,.32,1)"}}>
              {/* FRONT — with hint reveal */}
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",borderRadius:24,background:T.cardFront,border:`1.5px solid ${color}${dark?"25":"15"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxShadow:T.cardShadow}}>
                <div style={{position:"absolute",top:14,right:16,fontSize:12,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>English</div>
                {/* Level badge */}
                <div style={{position:"absolute",top:14,left:16,display:"flex",gap:3}}>{[1,2,3,4,5].map(l=>(<div key={l} style={{width:8,height:8,borderRadius:"50%",background:cl.level>=l?LVL_COLORS[l-1]:T.dotBg,transition:"background .3s"}}/>))}</div>
                <div style={{fontSize:card?.front.length>20?26:44,fontWeight:800,textAlign:"center",lineHeight:1.25,color:T.text}}>{card?.front}</div>

                {/* Hint section */}
                <div style={{marginTop:16,width:"100%",maxWidth:380,textAlign:"center"}}>
                  {!showHint?<button onClick={e=>{e.stopPropagation();setShowHint(true);}} style={{padding:"8px 18px",borderRadius:14,border:`1.5px solid ${T.hintBd}`,background:T.hintBg,color:T.hintTx,fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,margin:"0 auto"}}>💡 Show hint</button>
                  :<div style={{animation:"hintReveal .3s ease-out",overflow:"hidden",padding:"10px 16px",borderRadius:14,background:T.hintBg,border:`1.5px solid ${T.hintBd}`,fontSize:14,color:T.hintTx,lineHeight:1.5,fontWeight:500}} onClick={e=>e.stopPropagation()}>{card?.hint}</div>}
                </div>

                <div style={{marginTop:12,fontSize:13,color:T.muted,display:"flex",alignItems:"center",gap:6}}>tap to flip · swipe ← →</div>
              </div>
              {/* BACK */}
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:24,background:dark?`linear-gradient(155deg,${color}12,#1A1520 30%,#161220)`:`linear-gradient(155deg,${color}08,#FFF 30%,#FFFAF5)`,border:`1.5px solid ${color}${dark?"30":"18"}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 14px 16px",boxShadow:T.cardShadow,overflowY:"auto",justifyContent:"flex-start",paddingTop:36}}>
                <div style={{position:"absolute",top:12,right:16,fontSize:11,color,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,opacity:.8,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी</div>
                <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:card?.back.length>14?32:50,fontWeight:700,textAlign:"center",color:T.text,lineHeight:1.3,whiteSpace:"pre-line"}}>{card?.back}</div>
                <div style={{marginTop:2,fontSize:19,fontWeight:600,color,letterSpacing:.5}}>{card?.tl}</div>
                {supported&&<div onClick={e=>e.stopPropagation()} style={{marginTop:10,padding:"4px",borderRadius:14,background:T.speedBg,border:`1px solid ${T.speedBd}`,display:"flex",gap:4,width:"100%",maxWidth:400}}>
                  {SPEEDS.map(sp=>{const isA=speaking&&activeSpeed===sp.key;return(<button key={sp.key} onClick={e=>handlePlay(e,sp)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"1.5px solid",borderColor:isA?`${color}66`:"transparent",background:isA?T.speedActive:"transparent",color:isA?color:T.sub,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:4,animation:isA?"speakPulse 1.2s ease-in-out infinite":"none"}}>{isA?<div style={{display:"flex",gap:2,height:14}}>{[0,1,2,3].map(b=><div key={b} style={{width:3,height:14,borderRadius:2,background:color,animation:`barBounce 0.${5+b*2}s ease-in-out infinite`,animationDelay:`${b*.1}s`}}/>)}</div>:<span>{sp.emoji}</span>}{sp.label}</button>);})}
                </div>}
                <div style={{marginTop:8,padding:"6px 14px",borderRadius:12,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:15,color,fontWeight:500,display:"flex",alignItems:"center",gap:6,width:"100%",maxWidth:400,justifyContent:"center"}}>📢 {card?.pron}</div>
                <div style={{marginTop:6,padding:"7px 14px",borderRadius:12,background:T.trickBg,border:`1px solid ${T.trickBd}`,fontSize:14,color:T.trickTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:400,fontWeight:500}}>🇩🇪 {card?.trick}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:8}}>
            <button onClick={()=>nav(-1)} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:"inherit"}}>‹</button>
            <button onClick={markLearn} style={{padding:"11px 20px",borderRadius:18,border:"1.5px solid #D4A84A44",background:"#D4A84A10",color:"#D4A84A",cursor:"pointer",fontSize:15,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>← Still learning</button>
            <button onClick={markKnow} style={{padding:"11px 20px",borderRadius:18,border:"1.5px solid #5CB87A44",background:"#5CB87A10",color:"#5CB87A",cursor:"pointer",fontSize:15,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>Got it! →</button>
            <button onClick={()=>nav(1)} style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontFamily:"inherit"}}>›</button>
          </div>

          {/* Dots */}
          <div style={{display:"flex",justifyContent:"center",gap:3,flexWrap:"wrap",marginBottom:10,padding:"0 2px"}}>
            {cards.map((c,i)=>{const lv=getCardLevel(cardLevels,c.id).level;return(<button key={c.id} onClick={()=>{setIdx(i);setFlipped(false);setShowHint(false);stop();}} style={{width:i===idx?18:7,height:7,borderRadius:4,border:"none",padding:0,cursor:"pointer",transition:"all .3s",background:i===idx?color:LVL_COLORS[lv-1]+"55"}}/>);})}
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:"10px 4px",borderTop:`1px solid ${T.divider}`}}>
            {[{l:"Total",v:ALL_CARDS.length,c:T.sub,e:"📚",cl:null},{l:"Mastered",v:knownSet.size,c:"#4AA85A",e:"⭐",cl:()=>setShowList("known")},{l:"Learning",v:learningSet.size,c:"#D4A84A",e:"📖",cl:()=>setShowList("learning")},{l:"Due",v:dueCards.length,c:"#E85A5A",e:"🔥",cl:()=>{setPracticeMode("due");setIdx(0);setTab("practice");}}].map(s=>(<div key={s.l} onClick={s.cl} style={{textAlign:"center",padding:"7px 3px",borderRadius:12,background:dark?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)",cursor:s.cl?"pointer":"default",border:s.cl?`1.5px solid ${s.c}22`:"1.5px solid transparent"}}><div style={{fontSize:11}}>{s.e}</div><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.muted,textTransform:"uppercase",fontWeight:600}}>{s.l}</div>{s.cl&&<div style={{fontSize:8,color:s.c,marginTop:1,fontWeight:600}}>TAP</div>}</div>))}
          </div>
          </>:<div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🎉</div><div style={{fontSize:18,fontWeight:600}}>All done for now!</div><button onClick={exitPractice} style={{marginTop:16,padding:"12px 24px",borderRadius:16,border:`1.5px solid ${T.accent}44`,background:`${T.accent}12`,color:T.accent,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>Back to all cards</button></div>}
        </>}

        {/* ===== PROGRESS ===== */}
        {tab==="progress"&&<div>
          <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>📊 Progress</h2>
          <p style={{fontSize:14,color:T.sub,margin:"0 0 16px"}}>{knownSet.size} mastered · {learningSet.size} learning · {ALL_CARDS.length-knownSet.size-learningSet.size} new</p>
          <div style={{display:"flex",alignItems:"center",gap:20,padding:"18px 16px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:14}}>
            <div style={{position:"relative",width:80,height:80,flexShrink:0}}><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke={T.dotBg} strokeWidth="7"/><circle cx="40" cy="40" r="34" fill="none" stroke={T.accent} strokeWidth="7" strokeDasharray={`${pct*2.14} ${214-pct*2.14}`} strokeDashoffset="54" strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:T.accent}}>{pct}%</div></div>
            <div><div style={{fontSize:17,fontWeight:700,color:T.text}}>{knownSet.size}/{ALL_CARDS.length} words</div><div style={{fontSize:13,color:T.sub,marginTop:4}}>⏱️ {Math.floor((stats.totalMinutes||0)/60)}h {Math.round((stats.totalMinutes||0)%60)}m total</div><div style={{fontSize:13,color:T.sub,marginTop:2}}>🔥 {dueCards.length} cards due for review</div></div>
          </div>
          {/* Weekly */}
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📅 This week</div>
            <div style={{display:"flex",gap:5,alignItems:"flex-end",height:80}}>
              {Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const c=(stats.dailyLog||{})[k]||0;const isToday=k===today;const max=Math.max(...Object.values(stats.dailyLog||{1:1}),dailyTarget,1);return(<div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{fontSize:10,fontWeight:700,color:isToday?T.accent:T.muted}}>{c}</div><div style={{width:"100%",borderRadius:5,background:isToday?T.accent:T.barFill,opacity:isToday?1:.35,height:`${Math.max((c/max)*55,3)}px`,transition:"height .4s"}}/><div style={{fontSize:9,color:isToday?T.accent:T.muted,fontWeight:isToday?700:500}}>{d.toLocaleDateString("en",{weekday:"short"})}</div></div>);})}
            </div>
          </div>
          {/* Level distribution */}
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>🏆 Level distribution</div>
            {[1,2,3,4,5].map(lv=>{const count=ALL_CARDS.filter(c=>getCardLevel(cardLevels,c.id).level===lv).length;const newCount=ALL_CARDS.filter(c=>!cardLevels[c.id]).length;const ct=lv===1?count+newCount:count;return(<div key={lv} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{width:50,fontSize:13,fontWeight:700,color:LVL_COLORS[lv-1]}}>Lv {lv}</div><div style={{flex:1,height:8,borderRadius:4,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${(ct/ALL_CARDS.length)*100}%`,background:LVL_COLORS[lv-1],transition:"width .4s"}}/></div><div style={{width:30,fontSize:12,fontWeight:600,color:T.muted,textAlign:"right"}}>{ct}</div></div>);})}
          </div>
          {/* Categories */}
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📂 Categories</div>
            {Object.entries(CC).map(([cat,col])=>{const catCards=ALL_CARDS.filter(c=>c.cat===cat);const mastered=catCards.filter(c=>getCardLevel(cardLevels,c.id).level>=5).length;const cp=catCards.length>0?Math.round((mastered/catCards.length)*100):0;return(<div key={cat} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:col}}>{cat}</span><span style={{fontSize:11,color:T.muted}}>{mastered}/{catCards.length} · {cp}%</span></div><div style={{height:5,borderRadius:3,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${cp}%`,background:col,transition:"width .4s"}}/></div></div>);})}
          </div>
        </div>}

        {/* ===== SETTINGS ===== */}
        {tab==="settings"&&<div>
          <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>⚙️ Settings</h2>
          <p style={{fontSize:14,color:T.sub,margin:"0 0 16px"}}>{displayName} · {user.email}</p>
          {/* Theme */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>🌓 Theme</div></div>
            <button onClick={()=>setDark(d=>!d)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${T.pillBd}`,background:T.btnBg,color:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{dark?"☀️ Light":"🌙 Dark"}</button>
          </div>
          {/* Sound */}
          {supported&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>🔊 Auto-play</div></div>
            <button onClick={()=>setAutoSpeak(a=>!a)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${autoSpeak?T.accent+"44":T.pillBd}`,background:autoSpeak?`${T.accent}14`:T.btnBg,color:autoSpeak?T.accent:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{autoSpeak?"ON":"OFF"}</button>
          </div>}
          {/* Daily target */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8}}>
            <div><div style={{fontSize:15,fontWeight:700,color:T.text}}>🎯 Daily target</div><div style={{fontSize:12,color:T.muted}}>{dailyTarget} flips per day</div></div>
            <div style={{display:"flex",gap:6}}>
              {[15,25,40,60].map(n=>(<button key={n} onClick={()=>setStats(p=>({...p,dailyTarget:n}))} style={{padding:"6px 10px",borderRadius:10,border:`1.5px solid ${dailyTarget===n?T.accent+"44":T.pillBd}`,background:dailyTarget===n?`${T.accent}14`:"transparent",color:dailyTarget===n?T.accent:T.muted,fontSize:12,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{n}</button>))}
            </div>
          </div>
          {/* Logout */}
          <button onClick={handleLogout} style={{width:"100%",padding:"14px",borderRadius:16,border:`1.5px solid ${T.pillBd}`,background:T.pillBg,color:T.text,fontSize:16,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginTop:8,marginBottom:16}}>🚪 Logout</button>
          {/* Delete */}
          <DeleteAccount T={T}/>
        </div>}
      </div>

      {/* BOTTOM TABS */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.tabBg,borderTop:`1px solid ${T.tabBd}`,display:"flex",justifyContent:"center",backdropFilter:"blur(16px)"}}>
        <div style={{display:"flex",maxWidth:560,width:"100%"}}>
          {[{k:"practice",icon:"📚",label:"Practice"},{k:"progress",icon:"📊",label:"Progress"},{k:"settings",icon:"⚙️",label:"Settings"}].map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);if(t.k==="practice")stop();}} style={{flex:1,padding:"10px 0 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",color:tab===t.k?T.accent:T.muted}}>
            <span style={{fontSize:22}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:tab===t.k?700:500}}>{t.label}</span>
            {tab===t.k&&<div style={{width:20,height:3,borderRadius:2,background:T.accent}}/>}
          </button>))}
        </div>
      </div>
    </div>
  );
}

function DeleteAccount({T}){const[cd,setCd]=useState(false);const[dp,setDp]=useState("");const[de,setDe]=useState("");const[dl,setDl]=useState(false);const hd=async()=>{if(!cd){setCd(true);return;}if(!dp){setDe("Enter password");return;}setDl(true);setDe("");try{const c=EmailAuthProvider.credential(auth.currentUser.email,dp);await reauthenticateWithCredential(auth.currentUser,c);await deleteDoc(doc(db,"users",auth.currentUser.uid));await deleteUser(auth.currentUser);}catch(e){setDe(e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Wrong password.":"Failed.");setDl(false);}};
return(<div style={{padding:"14px",borderRadius:16,border:"1.5px solid #F43F5E30",background:"#F43F5E08"}}><div style={{fontSize:14,fontWeight:700,color:"#E11D48",marginBottom:4}}>⚠️ Delete Account</div><div style={{fontSize:11,color:TH.light.muted,marginBottom:8}}>Permanently deletes everything.</div>{cd&&<><PasswordInput value={dp} onChange={e=>setDp(e.target.value)} placeholder="Password" T={T} onKeyDown={e=>e.key==="Enter"&&hd()}/>{de&&<div style={{marginTop:6,fontSize:11,color:"#E11D48"}}>{de}</div>}</>}<button onClick={hd} disabled={dl} style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:cd?"#E11D48":"transparent",color:cd?"#FFF":"#E11D48",fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700,cursor:dl?"wait":"pointer",marginTop:8,opacity:dl?.6:1}}>{dl?"Deleting...":cd?"Confirm Delete":"Delete Account"}</button>{cd&&<button onClick={()=>{setCd(false);setDe("");setDp("");}} style={{width:"100%",padding:"8px",border:"none",background:"transparent",color:TH.light.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer",marginTop:4}}>Cancel</button>}</div>);}
