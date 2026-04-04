import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const ALL_CARDS = [
  { id:1,front:"One (1)",back:"एक",tl:"Ek",pron:"ehk — rhymes with 'check'",cat:"Numbers",hint:"Also means 'a/an' — 'ek aadmi' = 'a man'.",trick:"Klingt wie 'Eck' (Ecke) — eine Ecke = eins." },
  { id:2,front:"Two (2)",back:"दो",tl:"Do",pron:"doe — like a female deer",cat:"Numbers",hint:"'Do baar' means 'twice'.",trick:"Klingt wie 'doh' — Do-ppel = zwei." },
  { id:3,front:"Three (3)",back:"तीन",tl:"Teen",pron:"teen — like English 'teen'",cat:"Numbers",hint:"Same sound as English — easy!",trick:"'Tee in' drei Tassen — Teen = drei." },
  { id:4,front:"Four (4)",back:"चार",tl:"Chaar",pron:"chaar — 'ch' + rhymes with 'car'",cat:"Numbers",hint:"'Chaarpai' — a four-legged cot.",trick:"Char hat 4 Buchstaben — Chaar = vier." },
  { id:5,front:"Five (5)",back:"पाँच",tl:"Paanch",pron:"paanch — nasal 'n', like 'punch'",cat:"Numbers",hint:"'Panchayat' — council of five.",trick:"Klingt wie 'Punsch' — fünf Zutaten!" },
  { id:6,front:"Six (6)",back:"छह",tl:"Chhah",pron:"cheh — aspirated 'ch'",cat:"Numbers",hint:"'Chh' is breathier than 'ch'.",trick:"Klingt wie 'Schach' rückwärts — sechs Figuren." },
  { id:7,front:"Seven (7)",back:"सात",tl:"Saat",pron:"saat — rhymes with 'hot' + 's'",cat:"Numbers",hint:"'Saat phere' = seven wedding vows.",trick:"Wie 'Saat' (Samen) — gleiches Wort im Deutschen!" },
  { id:8,front:"Eight (8)",back:"आठ",tl:"Aath",pron:"aath — like 'art' but with 'th'",cat:"Numbers",hint:"Soft dental 'th' — tongue on upper teeth.",trick:"Klingt wie 'Acht' ohne 'ch' — fast identisch!" },
  { id:9,front:"Nine (9)",back:"नौ",tl:"Nau",pron:"now — like English 'now'",cat:"Numbers",hint:"Sounds just like 'now'!",trick:"'Nau' klingt wie 'neu' — neun ist fast 'neu'!" },
  { id:10,front:"Ten (10)",back:"दस",tl:"Das",pron:"thus — without the 'th'",cat:"Numbers",hint:"'Dussehra' from 'das' (ten).",trick:"'Das' ist auch deutsch! Das = zehn." },
  { id:11,front:"Father",back:"पिता",tl:"Pitaa",pron:"pi-TAA",cat:"Family & People",hint:"Formal. Casual = 'Paapaa'.",trick:"Klingt wie 'Pita'-Brot — Vater bringt Pita mit." },
  { id:12,front:"Sister",back:"बहन",tl:"Behen",pron:"beh-HEN — soft 'h'",cat:"Family & People",hint:"'Didi' for elder sister.",trick:"'Behen' — Schwester bahnt mir den Weg." },
  { id:13,front:"Relative",back:"रिश्तेदार",tl:"Rishtedaar",pron:"rish-tay-DAAR",cat:"Family & People",hint:"Unique words for every relative in Hindi.",trick:"'Rishte' — Verwandte reichen dir die Hand." },
  { id:14,front:"Neighbour",back:"पड़ोसी",tl:"Padosi",pron:"pa-ROH-see",cat:"Family & People",hint:"Neighbours = almost family in India.",trick:"'Padosi' — 'Paradiso' nebenan." },
  { id:15,front:"Guest",back:"मेहमान",tl:"Mehmaan",pron:"meh-MAAN",cat:"Family & People",hint:"'Atithi Devo Bhava' — Guest is God.",trick:"'Mehmaan' — 'Mehr Mann' zu Besuch!" },
  { id:16,front:"Man",back:"आदमी",tl:"Aadmi",pron:"AAD-mee",cat:"Family & People",hint:"'Aam aadmi' = common man.",trick:"Wie 'Adam' + i — der erste Mann." },
  { id:17,front:"Anybody",back:"कोई भी",tl:"Koi bhi",pron:"KOY bhee",cat:"Family & People",hint:"'Koi' = someone. 'Bhi' = also.",trick:"'Koi' (Fisch) — jeder Koi im Teich." },
  { id:109,front:"Customer",back:"ग्राहक",tl:"Graahak",pron:"GRAA-hak",cat:"Family & People",hint:"'Graahak bhagwaan hai' = Customer is God.",trick:"'Graahak' — Kunde hackt nach Angeboten!" },
  { id:18,front:"Hand",back:"हाथ",tl:"Haath",pron:"haath — like 'heart' with 'th'",cat:"Body Parts",hint:"'Haath milana' = shake hands.",trick:"'Haath' wie 'hat' — Hand hat fünf Finger." },
  { id:19,front:"Head",back:"सिर",tl:"Sir",pron:"sir — like English 'sir'",cat:"Body Parts",hint:"'Sir dard' = headache.",trick:"'Sir' — trägt eine Krone auf dem Kopf!" },
  { id:20,front:"Ear",back:"कान",tl:"Kaan",pron:"kaan — like 'con' with long 'aa'",cat:"Body Parts",hint:"'Kaan pakadna' = to apologize.",trick:"'Kahn' — Ohr hat die Form eines Kahns!" },
  { id:98,front:"Foot",back:"पैर",tl:"Pair",pron:"pair — like English 'pair'",cat:"Body Parts",hint:"'Paidal' means 'on foot'.",trick:"'Paar' — ein Paar Füße hat man immer!" },
  { id:21,front:"Rain",back:"बारिश",tl:"Baarish",pron:"BAA-rish",cat:"Nature & Weather",hint:"Monsoon makes 'baarish' beloved.",trick:"'Baarish' — barsch wenn es regnet." },
  { id:22,front:"Wind",back:"हवा",tl:"Havaa",pron:"ha-VAA",cat:"Nature & Weather",hint:"Also means 'air'.",trick:"'Havaa' — 'Hawaii' wo der Wind weht!" },
  { id:23,front:"River",back:"नदी",tl:"Nadi",pron:"na-DEE",cat:"Nature & Weather",hint:"Sacred rivers — Ganga, Yamuna.",trick:"'Nadi' — 'Nadel' fließt durch Stoff." },
  { id:24,front:"Ocean",back:"समुद्र",tl:"Samudra",pron:"sa-MOOD-ra",cat:"Nature & Weather",hint:"'Samudra Manthan' — famous myth.",trick:"'So viel Mud' gibt's nur im Ozean!" },
  { id:25,front:"Rose",back:"गुलाब",tl:"Gulaab",pron:"goo-LAAB",cat:"Nature & Weather",hint:"'Gulab jamun' = rose-water dessert.",trick:"'Guck mal Lab!' — Rose im Labor!" },
  { id:26,front:"Weather",back:"मौसम",tl:"Mausam",pron:"MOW-sam",cat:"Nature & Weather",hint:"India has 6 seasons!",trick:"'Maus am' Fenster beobachtet Wetter." },
  { id:27,front:"World",back:"दुनिया",tl:"Duniya",pron:"doo-nee-YAA",cat:"Nature & Weather",hint:"'Saari duniya' = the whole world.",trick:"'Düne, ja!' — Dünen überall." },
  { id:28,front:"Colour",back:"रंग",tl:"Rang",pron:"rung — like 'rung' of a ladder",cat:"Colors",hint:"Holi = festival of colours.",trick:"'Rang' — Farben haben einen Rang!" },
  { id:29,front:"White",back:"सफ़ेद",tl:"Safed",pron:"sa-FEYD",cat:"Colors",hint:"White = peace & mourning.",trick:"'Safed' — 'safe' — weiße Flagge = sicher!" },
  { id:30,front:"Orange",back:"नारंगी",tl:"Naarangi",pron:"naa-RAN-gee",cat:"Colors",hint:"Same word for fruit and color!",trick:"'Na, Rangi?' — ist die Orange farbig?" },
  { id:31,front:"Brown",back:"भूरा",tl:"Bhura",pron:"BHOO-raa — aspirated 'bh'",cat:"Colors",hint:"'Bh' = 'b' with extra air.",trick:"'Bura' (Burg) — alte Burgen sind braun." },
  { id:32,front:"Sugar",back:"चीनी",tl:"Cheeni",pron:"CHEE-nee",cat:"Food & Home",hint:"Also means 'Chinese'!",trick:"'Cheeni' — Zucker kam aus China!" },
  { id:33,front:"Food",back:"खाना",tl:"Khaana",pron:"KHAA-naa — guttural 'kh'",cat:"Food & Home",hint:"'Khaana khaana' = to eat food!",trick:"'Kahn-a' — im Kahn isst man Essen." },
  { id:34,front:"Fruits",back:"फल",tl:"Phal",pron:"full — aspirated 'ph'",cat:"Food & Home",hint:"'Ph' is aspirated 'p', not 'f'.",trick:"'Phal' wie 'Fall' — Obst fällt vom Baum!" },
  { id:35,front:"Knife",back:"छुरी / चाकू",tl:"Chhuri / Chaaku",pron:"CHHOO-ree / CHAA-koo",cat:"Food & Home",hint:"'Chhuri' is more common at home, 'chaaku' for bigger knives. Indians traditionally eat with hands.",trick:"'Chhuri' — klingt wie 'Kurier' — der Kurier bringt das Messer!" },
  { id:36,front:"Curtain",back:"पर्दा",tl:"Parda",pron:"PAR-daa",cat:"Food & Home",hint:"Also means 'veil' or movie screen.",trick:"'Pard(on)' — der Vorhang geht auf!" },
  { id:37,front:"Wall",back:"दीवार",tl:"Deevaar",pron:"dee-VAAR",cat:"Food & Home",hint:"Iconic film 'Deewaar' (1975).",trick:"'Die Wahr(heit)' steht an der Wand." },
  { id:38,front:"Car",back:"गाड़ी",tl:"Gaadi",pron:"GAA-dee — hard 'd'",cat:"Food & Home",hint:"Used for any vehicle!",trick:"'Geh die' Straße entlang mit dem Auto." },
  { id:99,front:"Apple",back:"सेब",tl:"Seb",pron:"sayb — like 'sabe'",cat:"Food & Home",hint:"Major producer in Kashmir.",trick:"'Seb' wie 'Sieb' — Äpfel für Saft!" },
  { id:100,front:"Vegetable",back:"सब्ज़ी",tl:"Sabzi",pron:"SUB-zee",cat:"Food & Home",hint:"'Sabzi mandi' = veggie market.",trick:"'Sabzi' — Gemüse als Substitute!" },
  { id:101,front:"Banana",back:"केला",tl:"Kelaa",pron:"KAY-laa",cat:"Food & Home",hint:"India = world's largest producer!",trick:"'Keller' — Bananen reifen im Keller!" },
  { id:112,front:"Egg",back:"अंडा",tl:"Andaa",pron:"UN-daa",cat:"Food & Home",hint:"'Anda bhurji' = scrambled eggs.",trick:"'Ander(s)' — ein Ei ist anders!" },
  { id:113,front:"Mirror",back:"शीशा",tl:"Sheeshaa",pron:"SHEE-shaa",cat:"Food & Home",hint:"'Sheesha mahal' = mirror palace.",trick:"'Shisha' — spiegelt sich das Licht!" },
  { id:115,front:"Breakfast",back:"नाश्ता",tl:"Naashta",pron:"NAASH-taa",cat:"Food & Home",hint:"Poha, idli, paratha by region!",trick:"'Nascht-a' — morgens naschen = frühstücken!" },
  { id:39,front:"City",back:"शहर",tl:"Sheher",pron:"sheh-HER",cat:"Places",hint:"From Persian. 8 mega cities.",trick:"'Schere' — scharf und lebendig." },
  { id:40,front:"Village",back:"गाँव",tl:"Gaanv",pron:"gaanv — nasal",cat:"Places",hint:"~65% of India in villages.",trick:"'Ganz' — ein ganzes kleines Dorf." },
  { id:41,front:"Inside",back:"अंदर",tl:"Andar",pron:"UN-dar",cat:"Places",hint:"'Andar aao' = Come inside.",trick:"'Ander(s)' — drinnen ist es anders!" },
  { id:42,front:"Outside",back:"बाहर",tl:"Baahar",pron:"BAA-har",cat:"Places",hint:"Opposite of 'andar'.",trick:"'Bahre' — steht draußen." },
  { id:43,front:"Near",back:"पास",tl:"Paas",pron:"paas — like 'pass'",cat:"Places",hint:"'Mere paas maa hai!'",trick:"'Pass' — der Gebirgspass ist nah!" },
  { id:44,front:"Month",back:"महीना",tl:"Maheena",pron:"ma-HEE-naa",cat:"Time",hint:"Unique Hindi month names exist.",trick:"'Maschine-a' — Monats-Maschine dreht sich." },
  { id:45,front:"December",back:"दिसंबर",tl:"Disambar",pron:"di-SUM-bar",cat:"Time",hint:"Borrowed from English!",trick:"'Disambar' ≈ 'Dezember'. Leicht!" },
  { id:46,front:"Date",back:"तारीख़",tl:"Taareekh",pron:"taa-REEKH",cat:"Time",hint:"'Aaj ki taareekh' = today's date.",trick:"Frag Tarik nach dem Datum!" },
  { id:47,front:"Day",back:"दिन",tl:"Din",pron:"din — like English 'din'",cat:"Time",hint:"'Aaj ka din' = today.",trick:"'Ding' ohne g — neues Ding jeden Tag!" },
  { id:48,front:"Birthday",back:"जन्मदिन",tl:"Janamdin",pron:"ja-NAM-din",cat:"Time",hint:"'Janamdin mubarak!'",trick:"'Janam' + 'din' — wie 'Geburts-tag'!" },
  { id:49,front:"Often",back:"अक्सर",tl:"Aksar",pron:"UK-sar",cat:"Time",hint:"'Main aksar yahan aata hoon'.",trick:"'Akzent' — oft einen Akzent hören." },
  { id:50,front:"Always",back:"हमेशा",tl:"Hamesha",pron:"ha-MAY-sha",cat:"Time",hint:"Bollywood favorite.",trick:"'Ha, Me, Sha(tz)!' — immer!" },
  { id:102,front:"Later",back:"बाद में",tl:"Baad mein",pron:"baad mayn",cat:"Time",hint:"'Baad mein milte hain'.",trick:"'Bad' — später ins Bad!" },
  { id:103,front:"Immediately",back:"तुरंत",tl:"Turant",pron:"too-RUNT",cat:"Time",hint:"'Turant aao!' = Come now!",trick:"'Turnen, rannt' — sofort zum Turnen!" },
  { id:51,front:"Happiness",back:"ख़ुशी",tl:"Khushi",pron:"KHOO-shee",cat:"Emotions",hint:"Popular girl's name!",trick:"'Kuschel-i' — Kuscheln macht glücklich!" },
  { id:52,front:"Anger",back:"गुस्सा",tl:"Gussa",pron:"GOOS-saa",cat:"Emotions",hint:"'Gussa mat karo' = Don't be angry.",trick:"'Guss' — Wutausbruch wie Regenguss!" },
  { id:53,front:"Dream",back:"सपना",tl:"Sapna",pron:"SUP-naa",cat:"Emotions",hint:"Also a popular girl's name.",trick:"'Sauna' — in der Sauna träumt man." },
  { id:54,front:"Fun",back:"मज़ा",tl:"Mazaa",pron:"ma-ZAA",cat:"Emotions",hint:"'Mazaa aaya!' = That was fun!",trick:"'Matza' — Matza backen macht Spaß!" },
  { id:55,front:"Health",back:"सेहत",tl:"Sehat",pron:"SEH-hat",cat:"Emotions",hint:"'Sehat ka khayal rakhna'.",trick:"'Seh hat' — wer gut sieht ist gesund!" },
  { id:56,front:"Different",back:"अलग",tl:"Alag",pron:"a-LUG",cat:"Adjectives",hint:"'Alag alag' = various.",trick:"'Alltag' — jeder Alltag ist anders." },
  { id:57,front:"Polite",back:"विनम्र",tl:"Vinamra",pron:"vi-NUM-ra",cat:"Adjectives",hint:"Politeness via 'aap' (formal).",trick:"'Fein-Ammer' — höfliche Ammer." },
  { id:58,front:"Honest",back:"ईमानदार",tl:"Imaandaar",pron:"ee-MAAN-daar",cat:"Adjectives",hint:"'Imaandaar aadmi' = honest man.",trick:"Der Imam ist ehrlich!" },
  { id:59,front:"Fast",back:"तेज़ / जल्दी",tl:"Tez / Jaldi",pron:"tayz / JUL-dee",cat:"Adjectives",hint:"'Tez' = fast/sharp/bright. 'Jaldi' = quickly/hurry. 'Jaldi karo!' = Hurry up!",trick:"'Tez' wie 'Tess rennt schnell'. 'Jaldi' — 'Ja, ldi(es)' — ja, beeile dich!" },
  { id:60,front:"Cheap",back:"सस्ता",tl:"Sasta",pron:"SUS-taa",cat:"Adjectives",hint:"Essential for bargaining!",trick:"'Pasta' — billige Pasta ist sasta!" },
  { id:61,front:"Clean",back:"साफ़",tl:"Saaf",pron:"saaf — like 'sauf'",cat:"Adjectives",hint:"'Swachh Bharat' = Clean India.",trick:"'Saft' — sauberer Saft!" },
  { id:62,front:"Dry",back:"सूखा",tl:"Sookha",pron:"SOO-khaa",cat:"Adjectives",hint:"Also means 'drought'.",trick:"'Suche' — trockenes Land suchen." },
  { id:63,front:"Wet",back:"गीला",tl:"Geela",pron:"GEE-laa",cat:"Adjectives",hint:"Monsoon essential!",trick:"'Gela(to)' — schmilzt und wird nass!" },
  { id:64,front:"Easy",back:"आसान",tl:"Aasaan",pron:"aa-SAAN",cat:"Adjectives",hint:"'Hindi aasaan hai!'",trick:"'Ah, so an(genehm)!' — leicht!" },
  { id:65,front:"Difficult",back:"मुश्किल",tl:"Mushkil",pron:"MUSH-kil",cat:"Adjectives",hint:"Film: 'Ae Dil Hai Mushkil'.",trick:"'Muschel' — schwer zu öffnen!" },
  { id:66,front:"Bad",back:"बुरा",tl:"Buraa",pron:"boo-RAA",cat:"Adjectives",hint:"'Bura mat maano, Holi hai!'",trick:"'Buhrufe' sind schlecht!" },
  { id:67,front:"Interesting",back:"दिलचस्प",tl:"Dilchasp",pron:"dil-CHUSP",cat:"Adjectives",hint:"'Dil' + 'chasp' = sticks to heart.",trick:"'Dill-Chasp' — interessanter Dill!" },
  { id:68,front:"Enough",back:"काफ़ी / बस",tl:"Kaafi / Bas",pron:"KAA-fee / bus",cat:"Adjectives",hint:"'Bas!' = Stop! Enough!",trick:"'Kaffee' — genug Kaffee!" },
  { id:104,front:"Young",back:"जवान",tl:"Javaan",pron:"ja-VAAN",cat:"Adjectives",hint:"Also means 'soldier'.",trick:"'Java-n' — junge Leute coden Java!" },
  { id:111,front:"Cold",back:"सर्दी",tl:"Sardi",pron:"SAR-dee",cat:"Adjectives",hint:"Also means 'winter'!",trick:"'Sardine' — im kalten Wasser!" },
  { id:69,front:"To speak",back:"बोलना",tl:"Bolnaa",pron:"BOWL-naa",cat:"Verbs",hint:"'Bol!' = Speak!",trick:"'Bowling' — laut beim Bowling!" },
  { id:70,front:"To learn",back:"सीखना",tl:"Seekhna",pron:"SEEKH-naa",cat:"Verbs",hint:"'Main Hindi seekh raha hoon'.",trick:"Von den Sikhs lernt man viel!" },
  { id:71,front:"To walk",back:"चलना",tl:"Chalnaa",pron:"CHUL-naa",cat:"Verbs",hint:"'Chalo!' = Let's go!",trick:"'Schall-na' — Gehen macht Schall!" },
  { id:72,front:"To read",back:"पढ़ना",tl:"Padhna",pron:"PUDH-naa",cat:"Verbs",hint:"Also = 'to study'.",trick:"'Pad' — auf dem Pad liest man!" },
  { id:73,front:"To ask",back:"पूछना",tl:"Poochhnaa",pron:"POOCHH-naa",cat:"Verbs",hint:"'Kuch poochna hai'.",trick:"'Putsch-na' — jeder fragt danach." },
  { id:74,front:"To start",back:"शुरू करना",tl:"Shuru karnaa",pron:"shoo-ROO kar-NAA",cat:"Verbs",hint:"'Shuru karte hain!'",trick:"'Schuh-Ruh' — Schuhe an, starte!" },
  { id:105,front:"To understand",back:"समझना",tl:"Samajhna",pron:"sa-MUJH-naa",cat:"Verbs",hint:"'Samajh aaya?'",trick:"'Sam, Ach ja!' — versteht es endlich!" },
  { id:114,front:"To sit",back:"बैठना",tl:"Baithna",pron:"BAITH-naa",cat:"Verbs",hint:"'Baitho!' = Sit! 'Baithiye' = polite.",trick:"'Byte-na' — sitz und programmiere!" },
  { id:75,front:"Message",back:"संदेश",tl:"Sandesh",pron:"sun-DAYSH",cat:"Common Words",hint:"Also a Bengali sweet!",trick:"'Sand-Esch(e)' — Nachricht im Sand." },
  { id:76,front:"Answer",back:"जवाब",tl:"Javaab",pron:"ja-VAAB",cat:"Common Words",hint:"'Javaab do!' = Answer me!",trick:"'Ja, waab!' — Antwort webt sich." },
  { id:77,front:"Maybe",back:"शायद",tl:"Shaayad",pron:"SHAA-yad",cat:"Common Words",hint:"Very poetic Urdu word.",trick:"'Schade' — schade, vielleicht!" },
  { id:80,front:"Or",back:"या",tl:"Ya",pron:"yaa — like 'yeah'",cat:"Common Words",hint:"'Chai ya coffee?'",trick:"'Ja' — ja oder nein?" },
  { id:81,front:"Both",back:"दोनों",tl:"Donon",pron:"DOH-non",cat:"Common Words",hint:"'Donon acche hain'.",trick:"'Donner' — doppelt laut!" },
  { id:82,front:"With",back:"के साथ",tl:"Ke saath",pron:"kay SAATH",cat:"Common Words",hint:"'Mere saath chalo'.",trick:"'Saat' — zusammen pflanzen." },
  { id:83,front:"For",back:"के लिए",tl:"Ke liye",pron:"kay LEE-yay",cat:"Common Words",hint:"'Mere liye' = for me.",trick:"'Kelly, eh' — für Kelly!" },
  { id:84,front:"Too / Also",back:"भी",tl:"Bhi",pron:"bhee — breathy 'bh'",cat:"Common Words",hint:"'Main bhi' = Me too.",trick:"'Biene' — die Biene will auch!" },
  { id:85,front:"Right (correct)",back:"सही",tl:"Sahi",pron:"sa-HEE",cat:"Common Words",hint:"'Sahi hai!' = Cool!",trick:"'Sahne' — richtige Wahl!" },
  { id:79,front:"That's why",back:"इसलिए",tl:"Isliye",pron:"ISS-lee-yay",cat:"Common Words",hint:"Connects cause & effect.",trick:"'Is(s) lie(ber)' — iss lieber deshalb!" },
  { id:106,front:"More",back:"और / ज़्यादा",tl:"Aur / Zyaada",pron:"OWR / zyaa-DAA",cat:"Common Words",hint:"'Aur' also means 'and'.",trick:"'Ohr' — mehr Ohren zum Hören!" },
  { id:107,front:"Group",back:"समूह",tl:"Samooh",pron:"sa-MOOH",cat:"Common Words",hint:"Formal. Casually say 'group'.",trick:"'Sam, uh!' — ruft die Gruppe!" },
  { id:110,front:"Journey",back:"यात्रा",tl:"Yaatraa",pron:"YAA-traa",cat:"Common Words",hint:"Also for pilgrimages.",trick:"'Ja, Trage!' — Koffer auf die Reise!" },
  { id:78,front:"Something else?",back:"और कुछ?",tl:"Aur kuchh?",pron:"OWR kootch?",cat:"Sentences",hint:"Shopkeepers say this constantly! 'Aur' = more/and, 'kuchh' = something.",trick:"'Aur kuchh' — 'Ohr + Kutsch(e)' — noch was fürs Ohr?" },
  { id:86,front:"I live in Hamburg",back:"मैं हैम्बर्ग में रहता हूँ",tl:"Main Hamburg mein rehta hoon",pron:"main Hamburg mayn REH-taa hoon",cat:"Sentences",hint:"'Rehta' (male) / 'rehti' (female).",trick:"'Main' = ich, 'mein' = in — fast wie Deutsch!" },
  { id:108,front:"I am doing well",back:"मैं ठीक हूँ",tl:"Main theek hoon",pron:"main THEEK hoon",cat:"Sentences",hint:"Reply to 'Aap kaise hain?'.",trick:"'Tick' — alles tickt richtig!" },
  { id:116,front:"I'm good as well",back:"मैं भी ठीक हूँ",tl:"Main bhi theek hoon",pron:"main bhee THEEK hoon",cat:"Sentences",hint:"'Bhi' = also.",trick:"'Bhi' einfügen — mir geht's auch gut!" },
];

const CATEGORIES=["All",...Array.from(new Set(ALL_CARDS.map(c=>c.cat)))];
const CC={Numbers:"#E8785A","Family & People":"#B07CC8","Body Parts":"#E8708A","Nature & Weather":"#5AB8C8",Colors:"#D4A84A","Food & Home":"#5CB87A",Places:"#6A9EE0",Time:"#E8A05A",Emotions:"#D87098",Adjectives:"#5AAA8A",Verbs:"#9A7ACA","Common Words":"#7A88D8",Sentences:"#E88A6A"};
const L={bg:"#FFF",bgGrad:"linear-gradient(150deg,#FFF0F3 0%,#FDE8EF 15%,#F5EDFF 30%,#E8F0FF 50%,#E6FAF5 68%,#FFFAE6 85%,#FFF0F0 100%)",cardFront:"linear-gradient(155deg,#FFFFFF,#FFF8FA 40%,#FBF5FF 70%,#F5F8FF)",text:"#2D2530",sub:"#5C5060",muted:"#9A90A0",faint:"#D0C8D4",hintBg:"rgba(180,120,200,.05)",hintBd:"rgba(180,120,200,.12)",hintTx:"#6A5878",trickBg:"rgba(90,184,122,.06)",trickBd:"rgba(90,184,122,.16)",trickTx:"#3A7A52",pillBg:"#FFF",pillBd:"rgba(0,0,0,.06)",btnBg:"#FFF",btnBd:"rgba(0,0,0,.07)",btnTx:"#7A7080",dotBg:"rgba(0,0,0,.07)",divider:"rgba(0,0,0,.06)",shadow:"0 3px 16px rgba(0,0,0,.04)",cardShadow:"0 6px 32px rgba(0,0,0,.05),0 2px 6px rgba(0,0,0,.03)",togBg:"#FFF",togTx:"#2D2530",accent:"#D87098",pronBg:"rgba(216,112,152,.07)",pronBd:"rgba(216,112,152,.18)",speedBg:"rgba(216,112,152,.04)",speedBd:"rgba(216,112,152,.10)",speedActive:"rgba(216,112,152,.10)",inputBg:"#FFF",inputBd:"rgba(0,0,0,.10)",overlayBg:"rgba(255,255,255,.97)",tabBg:"#FFFFFF",tabBd:"rgba(0,0,0,.06)",barFill:"#D87098"};
const D={bg:"#110E14",bgGrad:"linear-gradient(150deg,#16101C,#1A1220 25%,#12141E 50%,#141018 75%,#18141C)",cardFront:"linear-gradient(155deg,#1E1826,#1A1520 50%,#161220)",text:"#F0EAF0",sub:"#908498",muted:"#5A5060",faint:"#3A3440",hintBg:"rgba(255,255,255,.03)",hintBd:"rgba(255,255,255,.06)",hintTx:"#908498",trickBg:"rgba(90,184,122,.08)",trickBd:"rgba(90,184,122,.15)",trickTx:"#7AC89A",pillBg:"rgba(255,255,255,.04)",pillBd:"rgba(255,255,255,.07)",btnBg:"rgba(255,255,255,.04)",btnBd:"rgba(255,255,255,.07)",btnTx:"#908498",dotBg:"rgba(255,255,255,.08)",divider:"rgba(255,255,255,.05)",shadow:"0 2px 14px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.03)",cardShadow:"0 6px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.03)",togBg:"rgba(255,255,255,.06)",togTx:"#F0EAF0",accent:"#E8889A",pronBg:"rgba(232,136,154,.10)",pronBd:"rgba(232,136,154,.22)",speedBg:"rgba(255,255,255,.03)",speedBd:"rgba(255,255,255,.06)",speedActive:"rgba(232,136,154,.12)",inputBg:"rgba(255,255,255,.06)",inputBd:"rgba(255,255,255,.10)",overlayBg:"rgba(17,14,20,.97)",tabBg:"#1A1520",tabBd:"rgba(255,255,255,.06)",barFill:"#E8889A"};

const SPEEDS=[{key:"normal",label:"Normal",rate:0.82,emoji:"🗣️",desc:"Conversational"},{key:"slow",label:"Slow",rate:0.15,emoji:"🐢",desc:"Every syllable"}];

function useSpeech(){const[s,setS]=useState(false);const[a,setA]=useState(null);const[v,setV]=useState(null);const r=useRef(null);useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;r.current=window.speechSynthesis;const p=()=>{const vs=r.current.getVoices();setV(vs.find(x=>x.lang==="hi-IN")||vs.find(x=>x.lang.startsWith("hi"))||null);};p();r.current.addEventListener("voiceschanged",p);return()=>r.current?.removeEventListener("voiceschanged",p);},[]);const speak=useCallback((t,rate=.82,k="normal")=>{if(!r.current)return;r.current.cancel();const u=new SpeechSynthesisUtterance(t.replace(/\s*\/\s*/g," ").replace(/\n/g," "));u.lang="hi-IN";u.rate=rate;u.pitch=1;if(v)u.voice=v;u.onstart=()=>{setS(true);setA(k);};u.onend=()=>{setS(false);setA(null);};u.onerror=()=>{setS(false);setA(null);};r.current.speak(u);},[v]);const stop=useCallback(()=>{r.current?.cancel();setS(false);setA(null);},[]);return{speak,stop,speaking:s,activeSpeed:a,supported:typeof window!=="undefined"&&!!window.speechSynthesis};}

function useSwipe(onL,onR){const sx=useRef(0);const sy=useRef(0);const sw=useRef(false);const onTS=useCallback(e=>{sx.current=e.touches[0].clientX;sy.current=e.touches[0].clientY;sw.current=true;},[]);const onTE=useCallback(e=>{if(!sw.current)return;sw.current=false;const dx=e.changedTouches[0].clientX-sx.current;const dy=e.changedTouches[0].clientY-sy.current;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){dx>0?onR():onL();}},[onL,onR]);return{onTouchStart:onTS,onTouchEnd:onTE};}

async function saveProgress(uid,known,learning,name,stats){try{await setDoc(doc(db,"users",uid),{name:name||"",known:[...known],learning:[...learning],stats:stats||{},updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.error(e);}}
async function loadProgress(uid){try{const s=await getDoc(doc(db,"users",uid));if(s.exists()){const d=s.data();return{known:new Set(d.known||[]),learning:new Set(d.learning||[]),name:d.name||"",stats:d.stats||{}};}}catch(e){console.error(e);}return{known:new Set(),learning:new Set(),name:"",stats:{}};}

function PasswordInput({value,onChange,placeholder,onKeyDown,T}){const[v,setV]=useState(false);return(<div style={{position:"relative",width:"100%"}}><input type={v?"text":"password"} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.inputBd} style={{width:"100%",padding:"14px 48px 14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}}/><button type="button" onClick={()=>setVis(x=>!x)} tabIndex={-1} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:"6px 8px",color:T.muted}} onClick={()=>setV(x=>!x)}>{v?<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div>);}

function AuthScreen({T}){const[isS,setIsS]=useState(false);const[nm,setNm]=useState("");const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const sub=async()=>{setErr("");if(isS&&!nm.trim()){setErr("Please enter your name");return;}if(!em||!pw){setErr("Fill in all fields");return;}if(pw.length<6){setErr("Password: min 6 characters");return;}setLd(true);try{if(isS){const c=await createUserWithEmailAndPassword(auth,em,pw);await setDoc(doc(db,"users",c.user.uid),{name:nm.trim(),known:[],learning:[],stats:{totalMinutes:0,dailyLog:{}},updatedAt:new Date().toISOString()});}else await signInWithEmailAndPassword(auth,em,pw);}catch(e){const m=e.code==="auth/user-not-found"?"No account found.":e.code==="auth/wrong-password"?"Wrong password.":e.code==="auth/invalid-credential"?"Invalid email or password.":e.code==="auth/email-already-in-use"?"Already registered.":e.code==="auth/invalid-email"?"Invalid email.":e.message;setErr(m);}setLd(false);};const iS={width:"100%",padding:"14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"};
return(<div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxSizing:"border-box"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{width:"100%",maxWidth:400,textAlign:"center"}}><div style={{fontSize:16,letterSpacing:3,textTransform:"uppercase",color:T.accent,fontWeight:700,marginBottom:6,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div><h1 style={{fontSize:36,fontWeight:800,margin:0,color:T.text}}>Hindi Flashcards</h1><p style={{fontSize:16,color:T.sub,margin:"8px 0 28px"}}>{isS?"Create your account":"Log in to continue"}</p><div style={{display:"flex",flexDirection:"column",gap:12}}>{isS&&<input type="text" placeholder="Your name" value={nm} onChange={e=>setNm(e.target.value)} style={iS}/>}<input type="email" placeholder="Email" value={em} onChange={e=>setEm(e.target.value)} style={iS}/><PasswordInput value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password (min 6)" onKeyDown={e=>e.key==="Enter"&&sub()} T={T}/>{err&&<div style={{padding:"10px 14px",borderRadius:12,background:"#F43F5E14",border:"1px solid #F43F5E30",color:"#E11D48",fontSize:13,fontWeight:500,textAlign:"left"}}>{err}</div>}<button onClick={sub} disabled={ld} style={{padding:"14px",borderRadius:16,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,color:"#FFF",fontSize:17,fontFamily:"inherit",fontWeight:700,cursor:ld?"wait":"pointer",opacity:ld?.7:1,boxShadow:`0 4px 16px ${T.accent}40`}}>{ld?"Please wait...":isS?"Create Account ✨":"Log In 🚀"}</button><button onClick={()=>{setIsS(s=>!s);setErr("");}} style={{padding:"10px",borderRadius:12,border:`1px solid ${T.pillBd}`,background:"transparent",color:T.sub,fontSize:14,fontFamily:"inherit",cursor:"pointer"}}>{isS?"Have an account? Log in":"New? Create an account"}</button></div></div></div>);}

// ——— PROGRESS TAB ———
function ProgressTab({T,known,learning,stats,allCards}){
  const today=new Date().toISOString().slice(0,10);
  const dailyLog=stats.dailyLog||{};
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);return{date:k,label:d.toLocaleDateString("en",{weekday:"short"}),count:dailyLog[k]||0};});
  const maxCount=Math.max(...last7.map(d=>d.count),1);
  const totalMin=Math.round(stats.totalMinutes||0);
  const hrs=Math.floor(totalMin/60);const mins=totalMin%60;
  const totalLearned=known.size;const inProgress=learning.size;const remaining=allCards.length-totalLearned-inProgress;
  const pct=Math.round((totalLearned/allCards.length)*100);

  // Category breakdown
  const catStats=useMemo(()=>{const cats={};allCards.forEach(c=>{if(!cats[c.cat])cats[c.cat]={total:0,known:0,learning:0};cats[c.cat].total++;if(known.has(c.id))cats[c.cat].known++;if(learning.has(c.id))cats[c.cat].learning++;});return Object.entries(cats).sort((a,b)=>b[1].total-a[1].total);},[known,learning,allCards]);

  return(<div style={{width:"100%",maxWidth:560,margin:"0 auto"}}>
    <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>📊 Your Progress</h2>
    <p style={{fontSize:14,color:T.sub,margin:"0 0 20px"}}>{totalLearned} mastered · {inProgress} learning · {remaining} remaining</p>

    {/* Big progress ring */}
    <div style={{display:"flex",alignItems:"center",gap:20,padding:"20px 16px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:16}}>
      <div style={{position:"relative",width:90,height:90,flexShrink:0}}>
        <svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="38" fill="none" stroke={T.dotBg} strokeWidth="8"/><circle cx="45" cy="45" r="38" fill="none" stroke={T.accent} strokeWidth="8" strokeDasharray={`${pct*2.39} ${239-pct*2.39}`} strokeDashoffset="60" strokeLinecap="round" style={{transition:"stroke-dasharray .8s ease"}}/></svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:T.accent}}>{pct}%</div>
      </div>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:T.text}}>{totalLearned} of {allCards.length} words</div>
        <div style={{fontSize:14,color:T.sub,marginTop:4}}>⏱️ {hrs>0?`${hrs}h ${mins}m`:`${mins} min`} total practice time</div>
      </div>
    </div>

    {/* Weekly chart */}
    <div style={{padding:"16px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:16}}>
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:12}}>📅 Words learned this week</div>
      <div style={{display:"flex",gap:6,alignItems:"flex-end",height:100}}>
        {last7.map(d=>(<div key={d.date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{fontSize:11,fontWeight:700,color:d.date===today?T.accent:T.muted}}>{d.count}</div>
          <div style={{width:"100%",borderRadius:6,background:d.date===today?T.accent:T.barFill,opacity:d.date===today?1:.4,height:`${Math.max((d.count/maxCount)*70,4)}px`,transition:"height .4s ease"}}/>
          <div style={{fontSize:10,color:d.date===today?T.accent:T.muted,fontWeight:d.date===today?700:500}}>{d.label}</div>
        </div>))}
      </div>
    </div>

    {/* Category breakdown */}
    <div style={{padding:"16px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`}}>
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:12}}>📂 By category</div>
      {catStats.map(([cat,s])=>{const catPct=s.total>0?Math.round(((s.known)/s.total)*100):0;return(
        <div key={cat} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:14,fontWeight:600,color:CC[cat]||T.sub}}>{cat}</span>
            <span style={{fontSize:12,color:T.muted}}>{s.known}/{s.total} · {catPct}%</span>
          </div>
          <div style={{height:6,borderRadius:3,background:T.dotBg,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:3,width:`${catPct}%`,background:CC[cat]||T.accent,transition:"width .4s"}}/>
          </div>
        </div>
      );})}
    </div>
  </div>);
}

// ——— SETTINGS TAB ———
function SettingsTab({T,dark,setDark,autoSpeak,setAutoSpeak,supported,user,displayName,onLogout}){
  const[cd,setCd]=useState(false);const[dp,setDp]=useState("");const[de,setDe]=useState("");const[dl,setDl]=useState(false);
  const hd=async()=>{if(!cd){setCd(true);return;}if(!dp){setDe("Enter password");return;}setDl(true);setDe("");try{const c=EmailAuthProvider.credential(auth.currentUser.email,dp);await reauthenticateWithCredential(auth.currentUser,c);await deleteDoc(doc(db,"users",auth.currentUser.uid));await deleteUser(auth.currentUser);}catch(e){setDe(e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Wrong password.":"Failed. Try again.");setDl(false);}};
  return(<div style={{width:"100%",maxWidth:560,margin:"0 auto"}}>
    <h2 style={{fontSize:26,fontWeight:800,color:T.text,margin:"0 0 4px"}}>⚙️ Settings</h2>
    <p style={{fontSize:14,color:T.sub,margin:"0 0 20px"}}>{displayName} · {user.email}</p>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:10}}>
      <div><div style={{fontSize:16,fontWeight:700,color:T.text}}>🌓 Appearance</div><div style={{fontSize:13,color:T.muted}}>Light or dark theme</div></div>
      <button onClick={()=>setDark(d=>!d)} style={{padding:"8px 16px",borderRadius:14,border:`1.5px solid ${T.pillBd}`,background:T.btnBg,color:T.text,fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{dark?"☀️ Light":"🌙 Dark"}</button>
    </div>

    {supported&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:10}}>
      <div><div style={{fontSize:16,fontWeight:700,color:T.text}}>🔊 Auto-play Sound</div><div style={{fontSize:13,color:T.muted}}>Speak on card flip</div></div>
      <button onClick={()=>setAutoSpeak(a=>!a)} style={{padding:"8px 16px",borderRadius:14,border:`1.5px solid ${autoSpeak?T.accent+"44":T.pillBd}`,background:autoSpeak?`${T.accent}14`:T.btnBg,color:autoSpeak?T.accent:T.text,fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{autoSpeak?"ON":"OFF"}</button>
    </div>}

    <button onClick={onLogout} style={{width:"100%",padding:"16px",borderRadius:16,border:`1.5px solid ${T.pillBd}`,background:T.pillBg,color:T.text,fontSize:16,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>🚪 Logout</button>

    <div style={{padding:"16px",borderRadius:16,border:"1.5px solid #F43F5E30",background:"#F43F5E08"}}>
      <div style={{fontSize:15,fontWeight:700,color:"#E11D48",marginBottom:6}}>⚠️ Delete Account</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Permanently deletes account and all progress.</div>
      {cd&&<><PasswordInput value={dp} onChange={e=>setDp(e.target.value)} placeholder="Password to confirm" T={T} onKeyDown={e=>e.key==="Enter"&&hd()}/>{de&&<div style={{marginTop:8,fontSize:12,color:"#E11D48"}}>{de}</div>}</>}
      <button onClick={hd} disabled={dl} style={{width:"100%",padding:"12px",borderRadius:14,border:"none",background:cd?"#E11D48":"transparent",color:cd?"#FFF":"#E11D48",fontSize:14,fontFamily:"inherit",fontWeight:700,cursor:dl?"wait":"pointer",marginTop:10,opacity:dl?.6:1}}>{dl?"Deleting...":cd?"Confirm Delete":"Delete My Account"}</button>
      {cd&&<button onClick={()=>{setCd(false);setDe("");setDp("");}} style={{width:"100%",padding:"8px",border:"none",background:"transparent",color:T.muted,fontSize:13,fontFamily:"inherit",cursor:"pointer",marginTop:4}}>Cancel</button>}
    </div>
  </div>);
}

// ——— Practice List ———
function PracticeList({T,title,emoji,color,cardIds,allCards,onSelectCard,onClose,onPracticeAll}){
  const items=allCards.filter(c=>cardIds.has(c.id));
  return(<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",padding:20,boxSizing:"border-box"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:T.overlayBg,borderRadius:24,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",backdropFilter:"blur(20px)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h2 style={{fontSize:22,fontWeight:800,color:T.text,margin:0}}>{emoji} {title} ({items.length})</h2>
      <button onClick={onClose} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${T.pillBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
    </div>
    {onPracticeAll&&items.length>0&&<button onClick={onPracticeAll} style={{width:"100%",padding:"12px",borderRadius:14,border:`1.5px solid ${color}44`,background:`${color}12`,color,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🎯 Practice all {items.length} words</button>}
    {items.length===0?<div style={{textAlign:"center",padding:"40px 0",color:T.muted,fontSize:16}}>No cards here yet!</div>
    :items.map(c=>(<button key={c.id} onClick={()=>onSelectCard(c.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:14,border:`1.5px solid ${color}22`,background:`${color}06`,marginBottom:8,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}><div><div style={{fontSize:17,fontWeight:700,color:T.text}}>{c.front}</div><div style={{fontSize:14,color,fontWeight:600,marginTop:2}}>{c.back} · {c.tl}</div></div><div style={{fontSize:12,color:T.muted,flexShrink:0,marginLeft:10}}>{c.cat}</div></button>))}
  </div></div>);
}

// ——— MAIN ———
export default function App(){
  const[user,setUser]=useState(null);const[userName,setUserName]=useState("");const[authLoading,setAuthLoading]=useState(true);
  const[idx,setIdx]=useState(0);const[flipped,setFlipped]=useState(false);const[cat,setCat]=useState("All");
  const[known,setKnown]=useState(new Set());const[learning,setLearning]=useState(new Set());
  const[flips,setFlips]=useState(0);const[anim,setAnim]=useState(false);const[dark,setDark]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(true);const[saving,setSaving]=useState(false);
  const[tab,setTab]=useState("practice");// "practice"|"progress"|"settings"
  const[showList,setShowList]=useState(null);const[swipeHint,setSwipeHint]=useState(null);
  const[practiceMode,setPracticeMode]=useState(null);// null | "learning"
  const[stats,setStats]=useState({totalMinutes:0,dailyLog:{}});
  const sessionStart=useRef(Date.now());

  const{speak,stop,speaking,activeSpeed,supported}=useSpeech();
  const T=dark?D:L;

  // Cards: either all/category or practice-learning mode
  const cards=useMemo(()=>{
    if(practiceMode==="learning") return ALL_CARDS.filter(c=>learning.has(c.id));
    return cat==="All"?ALL_CARDS:ALL_CARDS.filter(c=>c.cat===cat);
  },[cat,practiceMode,learning]);
  const card=cards[idx]||cards[0];const color=CC[card?.cat]||"#D87098";

  // Auth
  useEffect(()=>{const unsub=onAuthStateChanged(auth,async u=>{setUser(u);if(u){const p=await loadProgress(u.uid);setKnown(p.known);setLearning(p.learning);setUserName(p.name);setStats(p.stats||{totalMinutes:0,dailyLog:{}});}else{setKnown(new Set());setLearning(new Set());setUserName("");setStats({totalMinutes:0,dailyLog:{}});}setAuthLoading(false);});return()=>unsub();},[]);

  // Track time every 30s
  useEffect(()=>{if(!user)return;const iv=setInterval(()=>{const elapsed=(Date.now()-sessionStart.current)/60000;sessionStart.current=Date.now();if(elapsed>0&&elapsed<5){setStats(prev=>({...prev,totalMinutes:(prev.totalMinutes||0)+elapsed}));}},30000);return()=>clearInterval(iv);},[user]);

  // Save
  const saveTimeout=useRef(null);
  useEffect(()=>{if(!user)return;if(saveTimeout.current)clearTimeout(saveTimeout.current);saveTimeout.current=setTimeout(async()=>{setSaving(true);await saveProgress(user.uid,known,learning,userName,stats);setSaving(false);},800);return()=>{if(saveTimeout.current)clearTimeout(saveTimeout.current);};},[known,learning,user,userName,stats]);

  const prevFlipped=useRef(false);
  useEffect(()=>{if(flipped&&!prevFlipped.current&&autoSpeak&&supported&&card)setTimeout(()=>speak(card.back,.82,"normal"),400);prevFlipped.current=flipped;},[flipped,card,autoSpeak,supported,speak]);

  const doFlip=useCallback(()=>{if(!anim){setFlipped(f=>!f);setFlips(c=>c+1);}},[anim]);
  const nav=useCallback(d=>{if(anim)return;setAnim(true);setFlipped(false);stop();setTimeout(()=>{setIdx(i=>{const n=i+d;return n<0?cards.length-1:n>=cards.length?0:n;});setAnim(false);},200);},[cards.length,anim,stop]);

  const mark=useCallback(type=>{
    if(!card)return;
    const today=new Date().toISOString().slice(0,10);
    if(type==="k"&&!known.has(card.id)){setStats(p=>({...p,dailyLog:{...p.dailyLog,[today]:(p.dailyLog?.[today]||0)+1}}));}
    if(type==="k"){setKnown(s=>{const n=new Set(s);n.add(card.id);return n;});setLearning(s=>{const n=new Set(s);n.delete(card.id);return n;});}
    else{setLearning(s=>{const n=new Set(s);n.add(card.id);return n;});setKnown(s=>{const n=new Set(s);n.delete(card.id);return n;});}
    nav(1);
  },[card,nav,known]);

  const onSwipeL=useCallback(()=>{setSwipeHint("left");setTimeout(()=>setSwipeHint(null),400);mark("l");},[mark]);
  const onSwipeR=useCallback(()=>{setSwipeHint("right");setTimeout(()=>setSwipeHint(null),400);mark("k");},[mark]);
  const swipe=useSwipe(onSwipeL,onSwipeR);
  const handleLogout=async()=>{stop();await signOut(auth);};
  const pct=Math.round((known.size/ALL_CARDS.length)*100);
  const st=id=>known.has(id)?"k":learning.has(id)?"l":"u";
  const handlePlay=(e,sp)=>{e.stopPropagation();if(speaking&&activeSpeed===sp.key){stop();return;}speak(card.back,sp.rate,sp.key);};
  const displayName=userName||user?.email?.split("@")[0]||"Learner";
  const jumpToCard=id=>{setPracticeMode(null);setCat("All");setFlipped(false);stop();const i=ALL_CARDS.findIndex(c=>c.id===id);if(i>=0)setIdx(i);setShowList(null);};
  const startPracticeLearning=()=>{setPracticeMode("learning");setIdx(0);setFlipped(false);setShowList(null);setTab("practice");};
  const exitPracticeMode=()=>{setPracticeMode(null);setCat("All");setIdx(0);setFlipped(false);};

  if(authLoading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgGrad,fontFamily:"'Outfit',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{textAlign:"center",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🇮🇳</div><div style={{fontSize:18,fontWeight:600}}>Loading...</div></div></div>);
  if(!user)return<AuthScreen T={T}/>;

  return(
    <div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",color:T.text,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 14px 80px",boxSizing:"border-box",transition:"background .5s",WebkitTextSizeAdjust:"100%"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes speakPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes barBounce{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes swipeL{0%{opacity:0;transform:translateX(20px)}50%{opacity:1}100%{opacity:0;transform:translateX(-20px)}}@keyframes swipeR{0%{opacity:0;transform:translateX(-20px)}50%{opacity:1}100%{opacity:0;transform:translateX(20px)}}.cat-scroll::-webkit-scrollbar{display:none}.speed-btn:hover{filter:brightness(1.08)}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}html,body{margin:0;padding:0;overflow-x:hidden}`}</style>

      {showList==="known"&&<PracticeList T={T} title="Mastered" emoji="⭐" color="#5CB87A" cardIds={known} allCards={ALL_CARDS} onSelectCard={jumpToCard} onClose={()=>setShowList(null)}/>}
      {showList==="learning"&&<PracticeList T={T} title="Learning" emoji="📖" color="#D4A84A" cardIds={learning} allCards={ALL_CARDS} onSelectCard={jumpToCard} onClose={()=>setShowList(null)} onPracticeAll={startPracticeLearning}/>}

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:560}}>

        {/* ===== PRACTICE TAB ===== */}
        {tab==="practice"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:14,letterSpacing:3,textTransform:"uppercase",color:T.accent,fontWeight:700,marginBottom:2,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div>
              <h1 style={{fontSize:26,fontWeight:800,margin:0,lineHeight:1.1,color:T.text}}>Namaste, {displayName}! 👋</h1>
              <p style={{fontSize:13,color:T.sub,margin:"3px 0 0"}}>{saving?"Saving...":"✅ Saved"} · {practiceMode?"🎯 Practice mode":ALL_CARDS.length+" words"}</p>
            </div>
          </div>

          {/* Practice mode banner */}
          {practiceMode==="learning"&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:14,background:"#D4A84A14",border:"1.5px solid #D4A84A33",marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:700,color:"#D4A84A"}}>🎯 Practicing {cards.length} learning words</span>
            <button onClick={exitPracticeMode} style={{padding:"6px 12px",borderRadius:10,border:"1px solid #D4A84A44",background:"transparent",color:"#D4A84A",fontSize:12,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>Exit</button>
          </div>}

          {/* Progress bar */}
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:15,color:T.sub}}>
              <span style={{fontWeight:500}}>✨ {known.size} mastered</span><span style={{fontWeight:700,color:T.accent}}>{pct}%</span>
            </div>
            <div style={{height:7,borderRadius:4,background:dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:4,width:`${pct}%`,background:"linear-gradient(90deg,#E8785A,#D4A84A,#5CB87A)",transition:"width .6s",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite"}}/>
            </div>
          </div>

          {/* Categories (hidden in practice mode) */}
          {!practiceMode&&<div className="cat-scroll" style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:10,scrollbarWidth:"none"}}>
            {CATEGORIES.map(c=>{const active=cat===c;const cc=CC[c]||T.accent;return(<button key={c} onClick={()=>{setCat(c);setIdx(0);setFlipped(false);stop();}} style={{padding:"7px 15px",borderRadius:20,border:"1.5px solid",whiteSpace:"nowrap",flexShrink:0,borderColor:active?cc:T.pillBd,background:active?`${cc}18`:T.pillBg,color:active?cc:T.sub,fontSize:15,fontFamily:"inherit",cursor:"pointer",fontWeight:active?700:400,boxShadow:active?`0 2px 10px ${cc}20`:"none"}}>{c}{active?` (${cards.length})`:""}</button>);})}
          </div>}

          {/* Card label */}
          {cards.length>0?<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,padding:"0 4px"}}>
            <span style={{fontSize:14,color,fontWeight:700,letterSpacing:1,textTransform:"uppercase",display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:"50%",background:color,display:"inline-block"}}/>{card?.cat}</span>
            <span style={{fontSize:15,color:T.muted,fontWeight:600,background:dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.03)",padding:"3px 12px",borderRadius:10}}>{idx+1}/{cards.length}</span>
          </div>

          {/* FLASHCARD */}
          <div {...swipe} onClick={doFlip} style={{perspective:1200,cursor:"pointer",marginBottom:10,height:460,position:"relative"}}>
            {swipeHint==="right"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(92,184,122,.15)",animation:"swipeR .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>✅</span></div>}
            {swipeHint==="left"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(212,168,74,.15)",animation:"swipeL .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:40}}>🔄</span></div>}
            <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0)",transition:"transform .65s cubic-bezier(.23,1,.32,1)"}}>
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",borderRadius:24,background:T.cardFront,border:`1.5px solid ${color}${dark?"25":"15"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"30px 24px",boxShadow:T.cardShadow}}>
                <div style={{position:"absolute",top:16,right:18,fontSize:13,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>English</div>
                {st(card?.id)!=="u"&&<div style={{position:"absolute",top:16,left:18,padding:"4px 12px",borderRadius:10,fontSize:12,fontWeight:700,background:st(card?.id)==="k"?"#5CB87A18":"#D4A84A18",color:st(card?.id)==="k"?"#5CB87A":"#D4A84A"}}>{st(card?.id)==="k"?"Mastered":"Learning"}</div>}
                <div style={{fontSize:card?.front.length>20?28:46,fontWeight:800,textAlign:"center",lineHeight:1.25,color:T.text}}>{card?.front}</div>
                <div style={{marginTop:20,fontSize:14,color:T.muted,display:"flex",alignItems:"center",gap:6,background:dark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",padding:"8px 16px",borderRadius:12}}>tap to flip · swipe ← →</div>
              </div>
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:24,background:dark?`linear-gradient(155deg,${color}12,#1A1520 30%,#161220)`:`linear-gradient(155deg,${color}08,#FFF 30%,#FFFAF5)`,border:`1.5px solid ${color}${dark?"30":"18"}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 14px 16px",boxShadow:T.cardShadow,overflowY:"auto",justifyContent:"flex-start",paddingTop:38}}>
                <div style={{position:"absolute",top:12,right:16,fontSize:12,color,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,opacity:.8,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी</div>
                <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:card?.back.length>14?34:52,fontWeight:700,textAlign:"center",color:T.text,lineHeight:1.3,whiteSpace:"pre-line"}}>{card?.back}</div>
                <div style={{marginTop:2,fontSize:20,fontWeight:600,color,letterSpacing:.5}}>{card?.tl}</div>
                {supported&&<div onClick={e=>e.stopPropagation()} style={{marginTop:10,padding:"5px",borderRadius:16,background:T.speedBg,border:`1px solid ${T.speedBd}`,display:"flex",gap:4,width:"100%",maxWidth:420}}>
                  {SPEEDS.map(sp=>{const isA=speaking&&activeSpeed===sp.key;return(<button className="speed-btn" key={sp.key} onClick={e=>handlePlay(e,sp)} style={{flex:1,padding:"8px 4px",borderRadius:12,border:"1.5px solid",borderColor:isA?`${color}66`:"transparent",background:isA?T.speedActive:"transparent",color:isA?color:T.sub,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600,display:"flex",flexDirection:"column",alignItems:"center",gap:2,animation:isA?"speakPulse 1.2s ease-in-out infinite":"none"}}><div style={{display:"flex",alignItems:"center",gap:4}}>{isA?<div style={{display:"flex",gap:2,alignItems:"flex-end",height:14}}>{[0,1,2,3].map(b=><div key={b} style={{width:3,height:14,borderRadius:2,background:color,animation:`barBounce 0.${5+b*2}s ease-in-out infinite`,animationDelay:`${b*.1}s`}}/>)}</div>:<span style={{fontSize:15}}>{sp.emoji}</span>}<span style={{fontSize:14,fontWeight:700}}>{sp.label}</span></div><div style={{fontSize:10,opacity:.6}}>{sp.desc}</div></button>);})}
                </div>}
                <div style={{marginTop:8,padding:"6px 14px",borderRadius:12,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:15,color,fontWeight:500,display:"flex",alignItems:"center",gap:6,width:"100%",maxWidth:420,justifyContent:"center"}}>📢 {card?.pron}</div>
                <div style={{marginTop:6,padding:"7px 14px",borderRadius:12,background:T.trickBg,border:`1px solid ${T.trickBd}`,fontSize:14,color:T.trickTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:420,fontWeight:500}}>🇩🇪 {card?.trick}</div>
                <div style={{marginTop:6,padding:"7px 14px",borderRadius:12,background:T.hintBg,border:`1px solid ${T.hintBd}`,fontSize:13,color:T.hintTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:420}}>💡 {card?.hint}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:10}}>
            <button onClick={()=>nav(-1)} style={{width:50,height:50,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontFamily:"inherit"}}>‹</button>
            <button onClick={()=>mark("l")} style={{padding:"12px 22px",borderRadius:18,border:"1.5px solid #D4A84A44",background:"#D4A84A10",color:"#D4A84A",cursor:"pointer",fontSize:16,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>← Learning</button>
            <button onClick={()=>mark("k")} style={{padding:"12px 22px",borderRadius:18,border:"1.5px solid #5CB87A44",background:"#5CB87A10",color:"#5CB87A",cursor:"pointer",fontSize:16,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>Know it →</button>
            <button onClick={()=>nav(1)} style={{width:50,height:50,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontFamily:"inherit"}}>›</button>
          </div>

          {/* Dots */}
          <div style={{display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap",marginBottom:12,padding:"0 2px"}}>
            {cards.map((c,i)=>{const s=st(c.id);return(<button key={c.id} onClick={()=>{setIdx(i);setFlipped(false);stop();}} style={{width:i===idx?20:8,height:8,borderRadius:4,border:"none",padding:0,cursor:"pointer",transition:"all .3s",background:i===idx?color:s==="k"?"#5CB87A55":s==="l"?"#D4A84A55":T.dotBg}}/>);})}
          </div>

          {/* Stats — clickable */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"12px 4px",borderTop:`1px solid ${T.divider}`}}>
            {[{l:"Total",v:ALL_CARDS.length,c:T.sub,e:"📚",cl:null},{l:"Mastered",v:known.size,c:"#5CB87A",e:"⭐",cl:()=>setShowList("known")},{l:"Learning",v:learning.size,c:"#D4A84A",e:"📖",cl:()=>setShowList("learning")},{l:"Flips",v:flips,c:"#E8785A",e:"🔄",cl:null}].map(s=>(<div key={s.l} onClick={s.cl} style={{textAlign:"center",padding:"8px 4px",borderRadius:14,background:dark?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)",cursor:s.cl?"pointer":"default",border:s.cl?`1.5px solid ${s.c}22`:"1.5px solid transparent"}}><div style={{fontSize:12,marginBottom:2}}>{s.e}</div><div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:T.muted,letterSpacing:.5,marginTop:1,textTransform:"uppercase",fontWeight:600}}>{s.l}</div>{s.cl&&<div style={{fontSize:9,color:s.c,marginTop:2,fontWeight:600}}>TAP TO VIEW</div>}</div>))}
          </div>
          </>:<div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🎉</div><div style={{fontSize:18,fontWeight:600}}>All learning cards cleared!</div><button onClick={exitPracticeMode} style={{marginTop:16,padding:"12px 24px",borderRadius:16,border:`1.5px solid ${T.accent}44`,background:`${T.accent}12`,color:T.accent,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>Back to all cards</button></div>}
        </>}

        {/* ===== PROGRESS TAB ===== */}
        {tab==="progress"&&<ProgressTab T={T} known={known} learning={learning} stats={stats} allCards={ALL_CARDS}/>}

        {/* ===== SETTINGS TAB ===== */}
        {tab==="settings"&&<SettingsTab T={T} dark={dark} setDark={setDark} autoSpeak={autoSpeak} setAutoSpeak={setAutoSpeak} supported={supported} user={user} displayName={displayName} onLogout={handleLogout}/>}
      </div>

      {/* ===== BOTTOM TAB BAR ===== */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.tabBg,borderTop:`1px solid ${T.tabBd}`,display:"flex",justifyContent:"center",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
        <div style={{display:"flex",maxWidth:560,width:"100%"}}>
          {[{k:"practice",icon:"📚",label:"Practice"},{k:"progress",icon:"📊",label:"Progress"},{k:"settings",icon:"⚙️",label:"Settings"}].map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);if(t.k==="practice")stop();}} style={{flex:1,padding:"10px 0 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",color:tab===t.k?T.accent:T.muted,transition:"color .2s"}}>
            <span style={{fontSize:22}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:tab===t.k?700:500}}>{t.label}</span>
            {tab===t.k&&<div style={{width:20,height:3,borderRadius:2,background:T.accent,marginTop:1}}/>}
          </button>))}
        </div>
      </div>
    </div>
  );
}
