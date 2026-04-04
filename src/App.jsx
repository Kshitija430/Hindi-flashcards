import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const ALL_CARDS = [
  { id:1, front:"One (1)", back:"एक", tl:"Ek", pron:"ehk — rhymes with 'check'", cat:"Numbers", hint:"Also means 'a/an' — 'ek aadmi' = 'a man'.", trick:"Klingt wie 'Eck' (Ecke) — eine Ecke hat einen Punkt = eins." },
  { id:2, front:"Two (2)", back:"दो", tl:"Do", pron:"doe — like a female deer", cat:"Numbers", hint:"'Do baar' means 'twice'.", trick:"Klingt wie 'doh' — denk an Do-ppel = zwei." },
  { id:3, front:"Three (3)", back:"तीन", tl:"Teen", pron:"teen — like English 'teen'", cat:"Numbers", hint:"Same sound as the English word — easy!", trick:"Wie 'Tee in' drei Tassen — Teen = drei." },
  { id:4, front:"Four (4)", back:"चार", tl:"Chaar", pron:"chaar — 'ch' + rhymes with 'car'", cat:"Numbers", hint:"'Chaarpai' — a traditional four-legged cot.", trick:"Ein Char (Charakter) hat 4 Buchstaben — Chaar = vier." },
  { id:5, front:"Five (5)", back:"पाँच", tl:"Paanch", pron:"paanch — nasal 'n', like 'punch'", cat:"Numbers", hint:"Related to 'Panchayat' — a council of five.", trick:"Klingt wie 'Punsch' — fünf Zutaten im Punsch!" },
  { id:6, front:"Six (6)", back:"छह", tl:"Chhah", pron:"cheh — aspirated 'ch', short 'e'", cat:"Numbers", hint:"The 'chh' is breathier than 'ch'.", trick:"Klingt fast wie 'Schach' rückwärts — sechs Figuren-Typen im Schach." },
  { id:7, front:"Seven (7)", back:"सात", tl:"Saat", pron:"saat — rhymes with 'hot' + 's'", cat:"Numbers", hint:"'Saat phere' = the seven Hindu wedding vows.", trick:"Wie 'Saat' (Samen) — sieben Samen säen. Gleiches Wort!" },
  { id:8, front:"Eight (8)", back:"आठ", tl:"Aath", pron:"aath — like 'art' but with 'th'", cat:"Numbers", hint:"Soft dental 'th' — tongue touches upper teeth.", trick:"Klingt wie 'Acht' ohne das 'ch' — fast identisch!" },
  { id:9, front:"Nine (9)", back:"नौ", tl:"Nau", pron:"now — exactly like English 'now'", cat:"Numbers", hint:"Easiest to remember — sounds just like 'now'!", trick:"'Nau' klingt wie 'neu' — neun ist fast 'neu'!" },
  { id:10, front:"Ten (10)", back:"दस", tl:"Das", pron:"thus — without the 'th'", cat:"Numbers", hint:"'Dussehra' comes from 'das' (ten).", trick:"'Das' ist auch deutsch! 'Das sind zehn' — Das = zehn." },
  { id:11, front:"Father", back:"पिता", tl:"Pitaa", pron:"pi-TAA", cat:"Family & People", hint:"Formal. Casual = 'Paapaa' — like father vs dad.", trick:"Klingt wie 'Pita'-Brot — Vater bringt Pita mit nach Hause." },
  { id:12, front:"Sister", back:"बहन", tl:"Behen", pron:"beh-HEN — soft 'h'", cat:"Family & People", hint:"'Didi' for elder sister.", trick:"'Behen' klingt wie 'Bähnen' — meine Schwester bahnt mir den Weg." },
  { id:13, front:"Relative", back:"रिश्तेदार", tl:"Rishtedaar", pron:"rish-tay-DAAR", cat:"Family & People", hint:"Hindi has unique words for every relative.", trick:"'Rishte' klingt wie 'Riste' (Handgelenk) — Verwandte reichen dir die Hand." },
  { id:14, front:"Neighbour", back:"पड़ोसी", tl:"Padosi", pron:"pa-ROH-see", cat:"Family & People", hint:"Neighbours = almost family in Indian culture.", trick:"'Padosi' — denk an 'Paradiso' nebenan." },
  { id:15, front:"Guest", back:"मेहमान", tl:"Mehmaan", pron:"meh-MAAN", cat:"Family & People", hint:"'Atithi Devo Bhava' — Guest is God.", trick:"'Mehmaan' — 'Mehr Mann' kommt zu Besuch!" },
  { id:16, front:"Man", back:"आदमी", tl:"Aadmi", pron:"AAD-mee", cat:"Family & People", hint:"'Aam aadmi' = common man.", trick:"Klingt wie 'Adam' + i — Adam war der erste Mann." },
  { id:17, front:"Anybody", back:"कोई भी", tl:"Koi bhi", pron:"KOY bhee", cat:"Family & People", hint:"'Koi' = someone. 'Bhi' = also/even.", trick:"Klingt wie 'Koi' (Fisch) — jeder beliebige Koi im Teich." },
  { id:109, front:"Customer", back:"ग्राहक", tl:"Graahak", pron:"GRAA-hak", cat:"Family & People", hint:"'Graahak bhagwaan hai' = The customer is God.", trick:"'Graahak' — klingt wie 'Gra(b)-Hack' — der Kunde hackt nach Angeboten!" },
  { id:18, front:"Hand", back:"हाथ", tl:"Haath", pron:"haath — like 'heart' with 'th'", cat:"Body Parts", hint:"'Haath milana' = shake hands.", trick:"'Haath' klingt wie 'hat' — die Hand hat fünf Finger." },
  { id:19, front:"Head", back:"सिर", tl:"Sir", pron:"sir — like English 'sir'", cat:"Body Parts", hint:"'Sir dard' = headache.", trick:"Wie 'Sir' — ein Sir trägt eine Krone auf dem Kopf!" },
  { id:20, front:"Ear", back:"कान", tl:"Kaan", pron:"kaan — like 'con' with long 'aa'", cat:"Body Parts", hint:"'Kaan pakadna' = to apologize.", trick:"Klingt wie 'Kahn' — ein Ohr hat die Form eines Kahns!" },
  { id:98, front:"Foot", back:"पैर", tl:"Pair", pron:"pair — like English 'pair'", cat:"Body Parts", hint:"'Paidal' means 'on foot'.", trick:"Klingt wie 'Paar' — ein Paar Füße hat man immer!" },
  { id:21, front:"Rain", back:"बारिश", tl:"Baarish", pron:"BAA-rish", cat:"Nature & Weather", hint:"India's monsoon makes 'baarish' beloved.", trick:"'Baarish' — 'Bar' + 'isch': barsch wenn es regnet." },
  { id:22, front:"Wind", back:"हवा", tl:"Havaa", pron:"ha-VAA", cat:"Nature & Weather", hint:"Also means 'air'.", trick:"'Havaa' — denk an 'Hawaii' wo der Wind weht!" },
  { id:23, front:"River", back:"नदी", tl:"Nadi", pron:"na-DEE", cat:"Nature & Weather", hint:"India's rivers are sacred — Ganga, Yamuna.", trick:"'Nadi' — wie 'Nadel' die durch Stoff fließt." },
  { id:24, front:"Ocean", back:"समुद्र", tl:"Samudra", pron:"sa-MOOD-ra", cat:"Nature & Weather", hint:"'Samudra Manthan' — famous myth.", trick:"'Sa-mud-ra' — 'So viel Mud' gibt's nur im Ozean!" },
  { id:25, front:"Rose", back:"गुलाब", tl:"Gulaab", pron:"goo-LAAB", cat:"Nature & Weather", hint:"'Gulab jamun' = rose-water flavored dessert.", trick:"'Gulaab' — 'Guck mal Lab!' — eine Rose im Labor!" },
  { id:26, front:"Weather", back:"मौसम", tl:"Mausam", pron:"MOW-sam", cat:"Nature & Weather", hint:"India has 6 seasons!", trick:"'Mausam' — 'Maus am' Fenster beobachtet das Wetter." },
  { id:27, front:"World", back:"दुनिया", tl:"Duniya", pron:"doo-nee-YAA", cat:"Nature & Weather", hint:"'Saari duniya' = the whole world.", trick:"'Duniya' — 'Düne, ja!' — Dünen überall auf der Welt." },
  { id:28, front:"Colour", back:"रंग", tl:"Rang", pron:"rung — like 'rung' of a ladder", cat:"Colors", hint:"Holi = festival of colours.", trick:"'Rang' klingt wie 'Rang' — Farben haben einen Rang!" },
  { id:29, front:"White", back:"सफ़ेद", tl:"Safed", pron:"sa-FEYD", cat:"Colors", hint:"White = peace & mourning in India.", trick:"'Safed' — wie 'safe' — weiße Flagge = sicher!" },
  { id:30, front:"Orange", back:"नारंगी", tl:"Naarangi", pron:"naa-RAN-gee", cat:"Colors", hint:"Same word for fruit and color!", trick:"'Naarangi' — 'Na, Rangi?' — ist die Orange farbig?" },
  { id:31, front:"Brown", back:"भूरा", tl:"Bhura", pron:"BHOO-raa — aspirated 'bh'", cat:"Colors", hint:"Practice 'bh' = 'b' with extra air.", trick:"'Bhura' klingt wie 'Bura' (Burg) — alte Burgen sind braun." },
  { id:32, front:"Sugar", back:"चीनी", tl:"Cheeni", pron:"CHEE-nee", cat:"Food & Home", hint:"Also means 'Chinese'!", trick:"'Cheeni' — wie 'China' — Zucker kam aus China!" },
  { id:33, front:"Food", back:"खाना", tl:"Khaana", pron:"KHAA-naa — guttural 'kh'", cat:"Food & Home", hint:"'Khaana khaana' = to eat food — same word twice!", trick:"'Khaana' — 'Kahn-a' — im Kahn isst man Essen." },
  { id:34, front:"Fruits", back:"फल", tl:"Phal", pron:"full — aspirated 'ph'", cat:"Food & Home", hint:"'Ph' is aspirated 'p', not 'f'.", trick:"'Phal' — wie 'Fall' — Obst fällt vom Baum!" },
  { id:35, front:"Knife", back:"चाकू", tl:"Chaaku", pron:"CHAA-koo", cat:"Food & Home", hint:"Indians traditionally eat with hands.", trick:"'Chaaku' — 'Schau, ein ku-hles Messer!'" },
  { id:36, front:"Curtain", back:"पर्दा", tl:"Parda", pron:"PAR-daa", cat:"Food & Home", hint:"Also means 'veil' or movie screen.", trick:"'Parda' — 'Pard(on)' — der Vorhang geht auf!" },
  { id:37, front:"Wall", back:"दीवार", tl:"Deevaar", pron:"dee-VAAR", cat:"Food & Home", hint:"Iconic Bollywood film 'Deewaar' (1975).", trick:"'Deevaar' — 'die Wahr(heit)' steht an der Wand." },
  { id:38, front:"Car", back:"गाड़ी", tl:"Gaadi", pron:"GAA-dee — hard 'd'", cat:"Food & Home", hint:"Used for any vehicle!", trick:"'Gaadi' — 'geh die' Straße entlang mit dem Auto." },
  { id:99, front:"Apple", back:"सेब", tl:"Seb", pron:"sayb — like 'sabe'", cat:"Food & Home", hint:"India is a major apple producer, especially Kashmir.", trick:"'Seb' klingt wie 'Sieb' — Äpfel durch ein Sieb für Saft!" },
  { id:100, front:"Vegetable", back:"सब्ज़ी", tl:"Sabzi", pron:"SUB-zee", cat:"Food & Home", hint:"'Sabzi mandi' = vegetable market.", trick:"'Sabzi' — klingt wie 'Subs-i' — Gemüse als Substitute!" },
  { id:101, front:"Banana", back:"केला", tl:"Kelaa", pron:"KAY-laa", cat:"Food & Home", hint:"India is the world's largest banana producer!", trick:"'Kelaa' — klingt wie 'Keller' — Bananen reifen im Keller!" },
  { id:112, front:"Egg", back:"अंडा", tl:"Andaa", pron:"UN-daa", cat:"Food & Home", hint:"'Anda bhurji' = Indian scrambled eggs — beloved street food!", trick:"'Andaa' — klingt wie 'Ander(s)' — ein Ei ist anders als alles andere!" },
  { id:113, front:"Mirror", back:"शीशा", tl:"Sheeshaa", pron:"SHEE-shaa", cat:"Food & Home", hint:"'Sheesha mahal' = palace of mirrors in Jaipur.", trick:"'Sheeshaa' — klingt wie 'Shisha' — in der Shisha spiegelt sich Licht!" },
  { id:115, front:"Breakfast", back:"नाश्ता", tl:"Naashta", pron:"NAASH-taa", cat:"Food & Home", hint:"Indian breakfasts vary by region: poha, idli, paratha!", trick:"'Naashta' — klingt wie 'Nascht-a' — morgens naschen = frühstücken!" },
  { id:39, front:"City", back:"शहर", tl:"Sheher", pron:"sheh-HER", cat:"Places", hint:"From Persian. India has 8 mega cities.", trick:"'Sheher' — klingt wie 'Schere' — scharf und lebendig." },
  { id:40, front:"Village", back:"गाँव", tl:"Gaanv", pron:"gaanv — nasal", cat:"Places", hint:"~65% of India lives in villages.", trick:"'Gaanv' — klingt wie 'ganz' — ein ganzes kleines Dorf." },
  { id:41, front:"Inside", back:"अंदर", tl:"Andar", pron:"UN-dar", cat:"Places", hint:"'Andar aao' = Come inside.", trick:"'Andar' — wie 'ander(s)' — drinnen ist es anders!" },
  { id:42, front:"Outside", back:"बाहर", tl:"Baahar", pron:"BAA-har", cat:"Places", hint:"Opposite of 'andar'.", trick:"'Baahar' — wie 'Bahre' — die Bahre steht draußen." },
  { id:43, front:"Near", back:"पास", tl:"Paas", pron:"paas — like 'pass'", cat:"Places", hint:"'Mere paas maa hai!' — iconic dialogue.", trick:"'Paas' — wie 'Pass' — der Gebirgspass ist nah!" },
  { id:44, front:"Month", back:"महीना", tl:"Maheena", pron:"ma-HEE-naa", cat:"Time", hint:"Hindi has unique month names.", trick:"'Maheena' — wie 'Maschine-a' — die Monats-Maschine dreht sich." },
  { id:45, front:"December", back:"दिसंबर", tl:"Disambar", pron:"di-SUM-bar", cat:"Time", hint:"Borrowed from English!", trick:"Klingt fast identisch — 'Disambar' ≈ 'Dezember'. Leicht!" },
  { id:46, front:"Date", back:"तारीख़", tl:"Taareekh", pron:"taa-REEKH", cat:"Time", hint:"'Aaj ki taareekh' = today's date.", trick:"'Taareekh' — frag Tarik nach dem Datum!" },
  { id:47, front:"Day", back:"दिन", tl:"Din", pron:"din — like English 'din'", cat:"Time", hint:"'Aaj ka din' = today.", trick:"'Din' — wie 'Ding' ohne g — jeder Tag ist ein neues Ding!" },
  { id:48, front:"Birthday", back:"जन्मदिन", tl:"Janamdin", pron:"ja-NAM-din", cat:"Time", hint:"'Janamdin mubarak!' = Happy Birthday!", trick:"'Janam' (Geburt) + 'din' (Tag) — wie 'Geburts-tag'!" },
  { id:49, front:"Often", back:"अक्सर", tl:"Aksar", pron:"UK-sar", cat:"Time", hint:"'Main aksar yahan aata hoon' = I often come here.", trick:"'Aksar' — wie 'Akzent' — oft einen Akzent hören." },
  { id:50, front:"Always", back:"हमेशा", tl:"Hamesha", pron:"ha-MAY-sha", cat:"Time", hint:"Bollywood favorite word.", trick:"'Hamesha' — 'Ha, Me, Sha(tz)!' — ich liebe dich immer!" },
  { id:102, front:"Later", back:"बाद में", tl:"Baad mein", pron:"baad mayn", cat:"Time", hint:"'Baad mein milte hain' = See you later.", trick:"'Baad' klingt wie 'Bad' — ich gehe später ins Bad!" },
  { id:103, front:"Immediately", back:"तुरंत", tl:"Turant", pron:"too-RUNT", cat:"Time", hint:"'Turant aao!' = Come immediately!", trick:"'Turant' — 'Turnen, rannt' — er rannte sofort zum Turnen!" },
  { id:51, front:"Happiness", back:"ख़ुशी", tl:"Khushi", pron:"KHOO-shee", cat:"Emotions", hint:"Popular girl's name!", trick:"'Khushi' klingt wie 'kuschel-i' — Kuscheln macht glücklich!" },
  { id:52, front:"Anger", back:"गुस्सा", tl:"Gussa", pron:"GOOS-saa", cat:"Emotions", hint:"'Gussa mat karo' = Don't get angry.", trick:"'Gussa' — wie 'Guss' — ein Wutausbruch wie ein Regenguss!" },
  { id:53, front:"Dream", back:"सपना", tl:"Sapna", pron:"SUP-naa", cat:"Emotions", hint:"Also a popular girl's name.", trick:"'Sapna' — wie 'Sauna' — in der Sauna träumt man schön." },
  { id:54, front:"Fun", back:"मज़ा", tl:"Mazaa", pron:"ma-ZAA", cat:"Emotions", hint:"'Mazaa aaya!' = That was fun!", trick:"'Mazaa' — wie 'Matza' — Matza backen macht Spaß!" },
  { id:55, front:"Health", back:"सेहत", tl:"Sehat", pron:"SEH-hat", cat:"Emotions", hint:"'Sehat ka khayal rakhna' = take care of health.", trick:"'Sehat' — 'Seh hat' — wer gut sehen hat, ist gesund!" },
  { id:56, front:"Different", back:"अलग", tl:"Alag", pron:"a-LUG", cat:"Adjectives", hint:"'Alag alag' = various.", trick:"'Alag' — wie 'Alltag' — jeder Alltag ist anders." },
  { id:57, front:"Polite", back:"विनम्र", tl:"Vinamra", pron:"vi-NUM-ra", cat:"Adjectives", hint:"Politeness through 'aap' (formal).", trick:"'Vinamra' — 'Fein-Ammer' — eine höfliche Ammer." },
  { id:58, front:"Honest", back:"ईमानदार", tl:"Imaandaar", pron:"ee-MAAN-daar", cat:"Adjectives", hint:"'Imaandaar aadmi' = honest person.", trick:"'Imaan-daar' — der Imam ist ehrlich!" },
  { id:59, front:"Fast", back:"तेज़", tl:"Tez", pron:"tayz — like 'days' with 't'", cat:"Adjectives", hint:"Also = sharp/bright.", trick:"'Tez' — wie 'Tess' — Tess rennt schnell!" },
  { id:60, front:"Cheap", back:"सस्ता", tl:"Sasta", pron:"SUS-taa", cat:"Adjectives", hint:"Essential for bargaining!", trick:"'Sasta' — wie 'Pasta' — billige Pasta ist sasta!" },
  { id:61, front:"Clean", back:"साफ़", tl:"Saaf", pron:"saaf — like 'sauf'", cat:"Adjectives", hint:"'Swachh Bharat' = Clean India.", trick:"'Saaf' — wie 'Saft' — sauberer Saft!" },
  { id:62, front:"Dry", back:"सूखा", tl:"Sookha", pron:"SOO-khaa", cat:"Adjectives", hint:"Also means 'drought'.", trick:"'Sookha' — wie 'Suche' — ich suche trockenes Land." },
  { id:63, front:"Wet", back:"गीला", tl:"Geela", pron:"GEE-laa", cat:"Adjectives", hint:"Monsoon essential!", trick:"'Geela' — wie 'Gela(to)' — Gelato wird nass wenn es schmilzt!" },
  { id:64, front:"Easy", back:"आसान", tl:"Aasaan", pron:"aa-SAAN", cat:"Adjectives", hint:"'Hindi aasaan hai!' = Hindi is easy!", trick:"'Aasaan' — 'Ah, so an(genehm)!' — leicht!" },
  { id:65, front:"Difficult", back:"मुश्किल", tl:"Mushkil", pron:"MUSH-kil", cat:"Adjectives", hint:"Film: 'Ae Dil Hai Mushkil'.", trick:"'Mushkil' — 'Muschel' — schwer zu öffnen!" },
  { id:66, front:"Bad", back:"बुरा", tl:"Buraa", pron:"boo-RAA", cat:"Adjectives", hint:"'Bura mat maano, Holi hai!'", trick:"'Buraa' — 'Buhrufe' — Buhrufe sind schlecht!" },
  { id:67, front:"Interesting", back:"दिलचस्प", tl:"Dilchasp", pron:"dil-CHUSP", cat:"Adjectives", hint:"'Dil' (heart) + 'chasp' (sticking).", trick:"'Dilchasp' — 'Dill-Chasp' — interessanter Dill!" },
  { id:68, front:"Enough", back:"काफ़ी / बस", tl:"Kaafi / Bas", pron:"KAA-fee / bus", cat:"Adjectives", hint:"'Bas!' = Stop! Enough!", trick:"'Kaafi' wie 'Kaffee' — genug Kaffee!" },
  { id:104, front:"Young", back:"जवान", tl:"Javaan", pron:"ja-VAAN", cat:"Adjectives", hint:"Also means 'soldier'.", trick:"'Javaan' — 'Java-n' — junge Leute programmieren Java!" },
  { id:111, front:"Cold", back:"सर्दी", tl:"Sardi", pron:"SAR-dee", cat:"Adjectives", hint:"Also means 'winter'!", trick:"'Sardi' — klingt wie 'Sardine' — Sardinen im kalten Wasser!" },
  { id:69, front:"To speak", back:"बोलना", tl:"Bolnaa", pron:"BOWL-naa", cat:"Verbs", hint:"'Bol!' = Speak!", trick:"'Bolnaa' — wie 'Bowling' — beim Bowling spricht man laut!" },
  { id:70, front:"To learn", back:"सीखना", tl:"Seekhna", pron:"SEEKH-naa", cat:"Verbs", hint:"'Main Hindi seekh raha hoon' = I'm learning Hindi.", trick:"'Seekhna' — von den Sikhs kann man viel lernen!" },
  { id:71, front:"To walk", back:"चलना", tl:"Chalnaa", pron:"CHUL-naa", cat:"Verbs", hint:"'Chalo!' = Let's go!", trick:"'Chalnaa' — 'Schall-na' — beim Gehen macht man Schall!" },
  { id:72, front:"To read", back:"पढ़ना", tl:"Padhna", pron:"PUDH-naa — hard 'dh'", cat:"Verbs", hint:"Also = 'to study'.", trick:"'Padhna' — wie 'Pad' — auf dem Pad liest man!" },
  { id:73, front:"To ask", back:"पूछना", tl:"Poochhnaa", pron:"POOCHH-naa", cat:"Verbs", hint:"'Kuch poochna hai' = I want to ask.", trick:"'Poochna' — 'Putsch-na' — nach einem Putsch fragt jeder." },
  { id:74, front:"To start", back:"शुरू करना", tl:"Shuru karnaa", pron:"shoo-ROO kar-NAA", cat:"Verbs", hint:"'Shuru karte hain!' = Let's begin!", trick:"'Shuru' — 'Schuh-Ruh' — Schuhe an und starte!" },
  { id:105, front:"To understand", back:"समझना", tl:"Samajhna", pron:"sa-MUJH-naa", cat:"Verbs", hint:"'Samajh aaya?' = Did you understand?", trick:"'Samajhna' — 'Sam, Ach ja!' — Sam versteht es endlich!" },
  { id:114, front:"To sit", back:"बैठना", tl:"Baithna", pron:"BAITH-naa", cat:"Verbs", hint:"'Baitho!' = Sit down! 'Baithiye' = please sit (polite).", trick:"'Baithna' — 'Byte-na' — setz dich und programmiere Bytes!" },
  { id:75, front:"Message", back:"संदेश", tl:"Sandesh", pron:"sun-DAYSH", cat:"Common Words", hint:"Also a Bengali sweet!", trick:"'Sandesh' — 'Sand-Esch(e)' — Nachricht in den Sand." },
  { id:76, front:"Answer", back:"जवाब", tl:"Javaab", pron:"ja-VAAB", cat:"Common Words", hint:"'Javaab do!' = Answer me!", trick:"'Javaab' — 'Ja, waab!' — die Antwort webt sich zusammen!" },
  { id:77, front:"Maybe", back:"शायद", tl:"Shaayad", pron:"SHAA-yad", cat:"Common Words", hint:"Very poetic Urdu word.", trick:"'Shaayad' — wie 'Schade' — schade, vielleicht!" },
  { id:80, front:"Or", back:"या", tl:"Ya", pron:"yaa — like 'yeah'", cat:"Common Words", hint:"'Chai ya coffee?'", trick:"'Ya' — wie 'Ja' — ja oder nein?" },
  { id:81, front:"Both", back:"दोनों", tl:"Donon", pron:"DOH-non", cat:"Common Words", hint:"'Donon acche hain' = Both are good.", trick:"'Donon' — wie 'Donner' — doppelt laut!" },
  { id:82, front:"With", back:"के साथ", tl:"Ke saath", pron:"kay SAATH", cat:"Common Words", hint:"'Mere saath chalo' = Come with me.", trick:"'Saath' — wie 'Saat' — zusammen pflanzen." },
  { id:83, front:"For", back:"के लिए", tl:"Ke liye", pron:"kay LEE-yay", cat:"Common Words", hint:"'Mere liye' = for me.", trick:"'Ke liye' — 'Kelly, eh' — das ist für Kelly!" },
  { id:84, front:"Too / Also", back:"भी", tl:"Bhi", pron:"bhee — breathy 'bh'", cat:"Common Words", hint:"'Main bhi' = Me too.", trick:"'Bhi' — wie 'Biene' — die Biene will auch!" },
  { id:85, front:"Right (correct)", back:"सही", tl:"Sahi", pron:"sa-HEE", cat:"Common Words", hint:"'Sahi hai!' = That's right!", trick:"'Sahi' — wie 'Sahne' — Sahne ist die richtige Wahl!" },
  { id:79, front:"That's why", back:"इसलिए", tl:"Isliye", pron:"ISS-lee-yay", cat:"Common Words", hint:"Connects cause & effect.", trick:"'Isliye' — 'Is(s) lie(ber)' — iss lieber deshalb!" },
  { id:106, front:"More", back:"और / ज़्यादा", tl:"Aur / Zyaada", pron:"OWR / zyaa-DAA", cat:"Common Words", hint:"'Aur' also means 'and'.", trick:"'Aur' klingt wie 'Ohr' — mehr Ohren zum Hören!" },
  { id:107, front:"Group", back:"समूह", tl:"Samooh", pron:"sa-MOOH", cat:"Common Words", hint:"Formal. Casually people say 'group'.", trick:"'Samooh' — 'Sam, uh!' — Sam ruft die Gruppe!" },
  { id:110, front:"Journey", back:"यात्रा", tl:"Yaatraa", pron:"YAA-traa", cat:"Common Words", hint:"Also used for pilgrimages.", trick:"'Yaatraa' — 'Ja, Trage!' — trage deinen Koffer auf die Reise!" },
  { id:78, front:"Something else?", back:"कुछ और?", tl:"Kuchh aur?", pron:"kootch OWR?", cat:"Sentences", hint:"Shopkeepers say this constantly!", trick:"'Kuchh aur' — 'Kutsch(e) + Ohr' — noch eine Kutsche fürs Ohr?" },
  { id:86, front:"I live in Hamburg", back:"मैं हैम्बर्ग में रहता हूँ", tl:"Main Hamburg mein rehta hoon", pron:"main Hamburg mayn REH-taa hoon", cat:"Sentences", hint:"'Rehta' (male) / 'rehti' (female).", trick:"'Main' = ich, 'mein' = in, 'rehta hoon' = wohne — fast wie Deutsch!" },
  { id:108, front:"I am doing well", back:"मैं ठीक हूँ", tl:"Main theek hoon", pron:"main THEEK hoon", cat:"Sentences", hint:"Standard reply to 'Aap kaise hain?'.", trick:"'Theek' klingt wie 'Tick' — alles tickt richtig!" },
  { id:116, front:"I'm good as well", back:"मैं भी ठीक हूँ", tl:"Main bhi theek hoon", pron:"main bhee THEEK hoon", cat:"Sentences", hint:"Reply when someone asks you back. 'Bhi' = also.", trick:"Einfach 'bhi' (auch) einfügen! Mir geht's auch gut!" },
];

const CATEGORIES = ["All", ...Array.from(new Set(ALL_CARDS.map(c => c.cat)))];
const CC = { Numbers:"#E8785A","Family & People":"#B07CC8","Body Parts":"#E8708A","Nature & Weather":"#5AB8C8",Colors:"#D4A84A","Food & Home":"#5CB87A",Places:"#6A9EE0",Time:"#E8A05A",Emotions:"#D87098",Adjectives:"#5AAA8A",Verbs:"#9A7ACA","Common Words":"#7A88D8",Sentences:"#E88A6A" };

const LIGHT = {
  bg:"#FFF",bgGrad:"linear-gradient(150deg, #FFF0F3 0%, #FDE8EF 15%, #F5EDFF 30%, #E8F0FF 50%, #E6FAF5 68%, #FFFAE6 85%, #FFF0F0 100%)",
  cardFront:"linear-gradient(155deg, #FFFFFF 0%, #FFF8FA 40%, #FBF5FF 70%, #F5F8FF 100%)",
  text:"#2D2530",sub:"#5C5060",muted:"#9A90A0",faint:"#D0C8D4",
  hintBg:"rgba(180,120,200,0.05)",hintBd:"rgba(180,120,200,0.12)",hintTx:"#6A5878",
  trickBg:"rgba(90,184,122,0.06)",trickBd:"rgba(90,184,122,0.16)",trickTx:"#3A7A52",
  pillBg:"#FFFFFF",pillBd:"rgba(0,0,0,0.06)",btnBg:"#FFFFFF",btnBd:"rgba(0,0,0,0.07)",btnTx:"#7A7080",
  dotBg:"rgba(0,0,0,0.07)",divider:"rgba(0,0,0,0.06)",
  shadow:"0 3px 16px rgba(0,0,0,0.04)",cardShadow:"0 6px 32px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.03)",
  togBg:"#FFFFFF",togTx:"#2D2530",accent:"#D87098",
  pronBg:"rgba(216,112,152,0.07)",pronBd:"rgba(216,112,152,0.18)",
  speedBg:"rgba(216,112,152,0.04)",speedBd:"rgba(216,112,152,0.10)",
  speedActive:"rgba(216,112,152,0.10)",speedActiveBd:"rgba(216,112,152,0.30)",
  inputBg:"#FFFFFF",inputBd:"rgba(0,0,0,0.10)",
};
const DARK = {
  bg:"#110E14",bgGrad:"linear-gradient(150deg, #16101C 0%, #1A1220 25%, #12141E 50%, #141018 75%, #18141C 100%)",
  cardFront:"linear-gradient(155deg, #1E1826 0%, #1A1520 50%, #161220 100%)",
  text:"#F0EAF0",sub:"#908498",muted:"#5A5060",faint:"#3A3440",
  hintBg:"rgba(255,255,255,0.03)",hintBd:"rgba(255,255,255,0.06)",hintTx:"#908498",
  trickBg:"rgba(90,184,122,0.08)",trickBd:"rgba(90,184,122,0.15)",trickTx:"#7AC89A",
  pillBg:"rgba(255,255,255,0.04)",pillBd:"rgba(255,255,255,0.07)",btnBg:"rgba(255,255,255,0.04)",btnBd:"rgba(255,255,255,0.07)",btnTx:"#908498",
  dotBg:"rgba(255,255,255,0.08)",divider:"rgba(255,255,255,0.05)",
  shadow:"0 2px 14px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
  cardShadow:"0 6px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
  togBg:"rgba(255,255,255,0.06)",togTx:"#F0EAF0",accent:"#E8889A",
  pronBg:"rgba(232,136,154,0.10)",pronBd:"rgba(232,136,154,0.22)",
  speedBg:"rgba(255,255,255,0.03)",speedBd:"rgba(255,255,255,0.06)",
  speedActive:"rgba(232,136,154,0.12)",speedActiveBd:"rgba(232,136,154,0.30)",
  inputBg:"rgba(255,255,255,0.06)",inputBd:"rgba(255,255,255,0.10)",
};

const SPEEDS = [
  { key:"normal", label:"Normal", rate:0.82, emoji:"🗣️", desc:"Conversational" },
  { key:"slow", label:"Slow", rate:0.35, emoji:"🐢", desc:"Hear each word" },
  { key:"slower", label:"Very Slow", rate:0.15, emoji:"🔬", desc:"Every syllable" },
];

// ——— SPEECH HOOK ———
function useSpeech(){
  const [speaking,setSpeaking]=useState(false);
  const [activeSpeed,setActiveSpeed]=useState(null);
  const [hindiVoice,setHindiVoice]=useState(null);
  const synthRef=useRef(null);
  useEffect(()=>{
    if(typeof window==="undefined"||!window.speechSynthesis)return;
    synthRef.current=window.speechSynthesis;
    const pick=()=>{const v=synthRef.current.getVoices();setHindiVoice(v.find(x=>x.lang==="hi-IN")||v.find(x=>x.lang.startsWith("hi"))||null);};
    pick();synthRef.current.addEventListener("voiceschanged",pick);
    return()=>synthRef.current?.removeEventListener("voiceschanged",pick);
  },[]);
  const speak=useCallback((text,rate=0.82,key="normal")=>{
    if(!synthRef.current)return;synthRef.current.cancel();
    const u=new SpeechSynthesisUtterance(text.replace(/\s*\/\s*/g," ").replace(/\n/g," "));
    u.lang="hi-IN";u.rate=rate;u.pitch=1;if(hindiVoice)u.voice=hindiVoice;
    u.onstart=()=>{setSpeaking(true);setActiveSpeed(key);};
    u.onend=()=>{setSpeaking(false);setActiveSpeed(null);};
    u.onerror=()=>{setSpeaking(false);setActiveSpeed(null);};
    synthRef.current.speak(u);
  },[hindiVoice]);
  const stop=useCallback(()=>{synthRef.current?.cancel();setSpeaking(false);setActiveSpeed(null);},[]);
  return{speak,stop,speaking,activeSpeed,supported:typeof window!=="undefined"&&!!window.speechSynthesis};
}

// ——— FIREBASE: Save & Load progress ———
async function saveProgress(userId, knownIds, learningIds) {
  try {
    await setDoc(doc(db, "users", userId), {
      known: [...knownIds],
      learning: [...learningIds],
      updatedAt: new Date().toISOString(),
    });
  } catch (e) { console.error("Save failed:", e); }
}

async function loadProgress(userId) {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      const data = snap.data();
      return { known: new Set(data.known || []), learning: new Set(data.learning || []) };
    }
  } catch (e) { console.error("Load failed:", e); }
  return { known: new Set(), learning: new Set() };
}

// ——— AUTH SCREEN ———
function AuthScreen({ T, onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in both fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      const msg = e.code === "auth/user-not-found" ? "No account found. Try signing up."
        : e.code === "auth/wrong-password" ? "Wrong password. Try again."
        : e.code === "auth/invalid-credential" ? "Invalid email or password."
        : e.code === "auth/email-already-in-use" ? "Email already registered. Try logging in."
        : e.code === "auth/invalid-email" ? "Invalid email format."
        : e.message;
      setError(msg);
    }
    setLoading(false);
  };

  const inputStyle = {
    width:"100%",padding:"14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,
    background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",
    outline:"none",transition:"border-color .2s",boxSizing:"border-box",
  };

  return (
    <div style={{minHeight:"100vh",minWidth:"100vw",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxSizing:"border-box"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:16,letterSpacing:3,textTransform:"uppercase",color:T.accent,fontWeight:700,marginBottom:6,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div>
        <h1 style={{fontSize:36,fontWeight:800,margin:0,color:T.text,lineHeight:1.1}}>Hindi Flashcards</h1>
        <p style={{fontSize:16,color:T.sub,margin:"8px 0 28px",fontWeight:400}}>{isSignup ? "Create your account to save progress" : "Log in to continue learning"}</p>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}
            style={inputStyle} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.inputBd} />
          <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e=>setPassword(e.target.value)}
            style={inputStyle} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.inputBd}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />

          {error && <div style={{padding:"10px 14px",borderRadius:12,background:"#F43F5E14",border:"1px solid #F43F5E30",color:"#E11D48",fontSize:13,fontWeight:500,textAlign:"left"}}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{
            padding:"14px",borderRadius:16,border:"none",
            background:`linear-gradient(135deg, ${T.accent}, ${T.accent}CC)`,
            color:"#FFF",fontSize:17,fontFamily:"inherit",fontWeight:700,cursor:loading?"wait":"pointer",
            opacity:loading?0.7:1,transition:"all .2s",
            boxShadow:`0 4px 16px ${T.accent}40`,
          }}>
            {loading ? "Please wait..." : isSignup ? "Create Account ✨" : "Log In 🚀"}
          </button>

          <button onClick={()=>{setIsSignup(s=>!s);setError("");}} style={{
            padding:"10px",borderRadius:12,border:`1px solid ${T.pillBd}`,
            background:"transparent",color:T.sub,fontSize:14,fontFamily:"inherit",fontWeight:500,cursor:"pointer",
          }}>
            {isSignup ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— MAIN APP ———
export default function App(){
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [idx,setIdx]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [cat,setCat]=useState("All");
  const [known,setKnown]=useState(new Set());
  const [learning,setLearning]=useState(new Set());
  const [flips,setFlips]=useState(0);
  const [anim,setAnim]=useState(false);
  const [dark,setDark]=useState(false);
  const [autoSpeak,setAutoSpeak]=useState(true);
  const [saving,setSaving]=useState(false);

  const {speak,stop,speaking,activeSpeed,supported}=useSpeech();
  const T=dark?DARK:LIGHT;
  const cards=useMemo(()=>cat==="All"?ALL_CARDS:ALL_CARDS.filter(c=>c.cat===cat),[cat]);
  const card=cards[idx]||cards[0];
  const color=CC[card?.cat]||"#D87098";

  // Listen for auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const progress = await loadProgress(u.uid);
        setKnown(progress.known);
        setLearning(progress.learning);
      } else {
        setKnown(new Set());
        setLearning(new Set());
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Auto-save when known/learning changes
  const saveTimeout = useRef(null);
  useEffect(() => {
    if (!user) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      await saveProgress(user.uid, known, learning);
      setSaving(false);
    }, 800);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [known, learning, user]);

  const prevFlipped=useRef(false);
  useEffect(()=>{
    if(flipped&&!prevFlipped.current&&autoSpeak&&supported&&card){
      setTimeout(()=>speak(card.back,0.82,"normal"),400);
    }
    prevFlipped.current=flipped;
  },[flipped,card,autoSpeak,supported,speak]);

  const doFlip=useCallback(()=>{if(!anim){setFlipped(f=>!f);setFlips(c=>c+1);}},[anim]);
  const nav=useCallback(d=>{
    if(anim)return;setAnim(true);setFlipped(false);stop();
    setTimeout(()=>{setIdx(i=>{const n=i+d;return n<0?cards.length-1:n>=cards.length?0:n;});setAnim(false);},200);
  },[cards.length,anim,stop]);
  const mark=useCallback(type=>{
    if(!card)return;
    if(type==="k"){setKnown(s=>{const n=new Set(s);n.add(card.id);return n;});setLearning(s=>{const n=new Set(s);n.delete(card.id);return n;});}
    else{setLearning(s=>{const n=new Set(s);n.add(card.id);return n;});setKnown(s=>{const n=new Set(s);n.delete(card.id);return n;});}
    nav(1);
  },[card,nav]);

  const handleLogout = async () => { stop(); await signOut(auth); };

  const pct=Math.round((known.size/ALL_CARDS.length)*100);
  const st=id=>known.has(id)?"k":learning.has(id)?"l":"u";
  const handlePlay=(e,sp)=>{e.stopPropagation();if(speaking&&activeSpeed===sp.key){stop();return;}speak(card.back,sp.rate,sp.key);};

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgGrad,fontFamily:"'Outfit',sans-serif"}}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <div style={{textAlign:"center",color:T.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>🇮🇳</div>
          <div style={{fontSize:18,fontWeight:600}}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show login/signup if not authenticated
  if (!user) {
    return <AuthScreen T={T} />;
  }

  return(
    <div style={{minHeight:"100vh",minWidth:"100vw",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",color:T.text,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 14px",boxSizing:"border-box",position:"relative",overflow:"hidden",transition:"background .5s",WebkitTextSizeAdjust:"100%"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes speakPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes barBounce{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .cat-scroll::-webkit-scrollbar{display:none}
        .speed-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
        html,body{margin:0;padding:0;overflow-x:hidden}
      `}</style>

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:560}}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:14,letterSpacing:3,textTransform:"uppercase",color:T.accent,fontWeight:700,marginBottom:2,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div>
            <h1 style={{fontSize:32,fontWeight:800,margin:0,lineHeight:1.1,color:T.text}}>Hindi Flashcards</h1>
            <p style={{fontSize:14,color:T.sub,margin:"3px 0 0",fontWeight:400}}>
              {user.email.split("@")[0]} · {saving?"Saving...":"✅ Saved"} · {ALL_CARDS.length} words
            </p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
            <div style={{display:"flex",gap:5}}>
              <button onClick={()=>setDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 11px",borderRadius:18,background:T.togBg,border:`1px solid ${T.pillBd}`,cursor:"pointer",fontSize:13,fontFamily:"inherit",color:T.togTx,fontWeight:600}}>
                {dark?"☀️":"🌙"}
              </button>
              <button onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 11px",borderRadius:18,background:T.togBg,border:`1px solid ${T.pillBd}`,cursor:"pointer",fontSize:12,fontFamily:"inherit",color:"#E11D48",fontWeight:600}}>
                Logout
              </button>
            </div>
            {supported&&(
              <button onClick={()=>setAutoSpeak(a=>!a)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:16,background:autoSpeak?`${T.accent}14`:T.togBg,border:`1px solid ${autoSpeak?T.accent+"30":T.pillBd}`,cursor:"pointer",fontSize:11,fontFamily:"inherit",color:autoSpeak?T.accent:T.muted,fontWeight:600}}>
                🔊 Auto {autoSpeak?"ON":"OFF"}
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS */}
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:15,color:T.sub}}>
            <span style={{fontWeight:500}}>✨ {known.size} mastered</span><span style={{fontWeight:700,color:T.accent}}>{pct}%</span>
          </div>
          <div style={{height:7,borderRadius:4,background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:4,width:`${pct}%`,background:"linear-gradient(90deg, #E8785A, #D4A84A, #5CB87A)",transition:"width .6s cubic-bezier(.22,1,.36,1)",backgroundSize:"200% 100%",animation:"shimmer 3s ease-in-out infinite"}}/>
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="cat-scroll" style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:10,scrollbarWidth:"none"}}>
          {CATEGORIES.map(c=>{
            const active=cat===c;const catCol=CC[c]||T.accent;
            return(
              <button key={c} onClick={()=>{setCat(c);setIdx(0);setFlipped(false);stop();}} style={{
                padding:"7px 15px",borderRadius:20,border:"1.5px solid",whiteSpace:"nowrap",flexShrink:0,
                borderColor:active?catCol:T.pillBd,background:active?`${catCol}18`:T.pillBg,
                color:active?catCol:T.sub,fontSize:15,fontFamily:"inherit",cursor:"pointer",fontWeight:active?700:400,
                transition:"all .25s",boxShadow:active?`0 2px 10px ${catCol}20`:"none",
              }}>{c}{active?` (${cards.length})`:""}</button>
            );
          })}
        </div>

        {/* CARD LABEL */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,padding:"0 4px"}}>
          <span style={{fontSize:14,color,fontWeight:700,letterSpacing:1,textTransform:"uppercase",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:color,display:"inline-block"}}/>{card?.cat}
          </span>
          <span style={{fontSize:15,color:T.muted,fontWeight:600,background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",padding:"3px 12px",borderRadius:10}}>{idx+1}/{cards.length}</span>
        </div>

        {/* FLASHCARD */}
        <div onClick={doFlip} style={{perspective:1200,cursor:"pointer",marginBottom:10,height:460}}>
          <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0)",transition:"transform .65s cubic-bezier(.23,1,.32,1)"}}>
            {/* FRONT */}
            <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",borderRadius:24,background:T.cardFront,border:`1.5px solid ${color}${dark?"25":"15"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"30px 24px",boxShadow:`${T.cardShadow}, 0 0 60px ${color}${dark?"08":"04"}`,transition:"all .4s"}}>
              <div style={{position:"absolute",top:16,right:18,fontSize:13,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>English</div>
              {st(card?.id)!=="u"&&<div style={{position:"absolute",top:16,left:18,padding:"4px 12px",borderRadius:10,fontSize:12,fontWeight:700,background:st(card?.id)==="k"?"#5CB87A18":"#D4A84A18",color:st(card?.id)==="k"?"#5CB87A":"#D4A84A"}}>{st(card?.id)==="k"?"Mastered":"Learning"}</div>}
              <div style={{fontSize:card?.front.length>20?28:46,fontWeight:800,textAlign:"center",lineHeight:1.25,color:T.text}}>{card?.front}</div>
              <div style={{marginTop:20,fontSize:15,color:T.muted,display:"flex",alignItems:"center",gap:7,background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",padding:"8px 16px",borderRadius:12}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                tap to flip
              </div>
            </div>
            {/* BACK */}
            <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:24,background:dark?`linear-gradient(155deg,${color}12,#1A1520 30%,#161220)`:`linear-gradient(155deg,${color}08,#FFFFFF 30%,#FFFAF5)`,border:`1.5px solid ${color}${dark?"30":"18"}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 14px 16px",boxShadow:`${T.cardShadow}, 0 0 60px ${color}${dark?"10":"06"}`,transition:"all .4s",overflowY:"auto",justifyContent:"flex-start",paddingTop:38}}>
              <div style={{position:"absolute",top:12,right:16,fontSize:12,color,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,opacity:.8,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी</div>
              <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:card?.back.length>14?34:52,fontWeight:700,textAlign:"center",color:T.text,lineHeight:1.3,whiteSpace:"pre-line"}}>{card?.back}</div>
              <div style={{marginTop:2,fontSize:20,fontWeight:600,color,letterSpacing:.5}}>{card?.tl}</div>
              {supported&&(
                <div onClick={e=>e.stopPropagation()} style={{marginTop:10,padding:"5px 5px",borderRadius:16,background:T.speedBg,border:`1px solid ${T.speedBd}`,display:"flex",gap:4,alignItems:"stretch",width:"100%",maxWidth:420}}>
                  {SPEEDS.map(sp=>{const isA=speaking&&activeSpeed===sp.key;return(
                    <button className="speed-btn" key={sp.key} onClick={e=>handlePlay(e,sp)} style={{flex:1,padding:"8px 4px",borderRadius:12,border:"1.5px solid",borderColor:isA?`${color}66`:"transparent",background:isA?T.speedActive:"transparent",color:isA?color:T.sub,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600,display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all .25s",animation:isA?"speakPulse 1.2s ease-in-out infinite":"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        {isA?(<div style={{display:"flex",gap:2,alignItems:"flex-end",height:14}}>{[0,1,2,3].map(b=>(<div key={b} style={{width:3,height:14,borderRadius:2,background:color,animation:`barBounce 0.${5+b*2}s ease-in-out infinite`,animationDelay:`${b*.1}s`}}/>))}</div>
                        ):(<span style={{fontSize:15}}>{sp.emoji}</span>)}
                        <span style={{fontSize:14,fontWeight:700}}>{sp.label}</span>
                      </div>
                      <div style={{fontSize:10,opacity:.6,fontWeight:400}}>{sp.desc}</div>
                    </button>
                  );})}
                </div>
              )}
              <div style={{marginTop:8,padding:"6px 14px",borderRadius:12,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:15,color,fontWeight:500,display:"flex",alignItems:"center",gap:6,textAlign:"center",lineHeight:1.4,width:"100%",maxWidth:420,justifyContent:"center"}}>📢 {card?.pron}</div>
              <div style={{marginTop:6,padding:"7px 14px",borderRadius:12,background:T.trickBg,border:`1px solid ${T.trickBd}`,fontSize:14,color:T.trickTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:420,fontWeight:500}}>🇩🇪 {card?.trick}</div>
              <div style={{marginTop:6,padding:"7px 14px",borderRadius:12,background:T.hintBg,border:`1px solid ${T.hintBd}`,fontSize:13,color:T.hintTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:420,fontWeight:400}}>💡 {card?.hint}</div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:10}}>
          <button onClick={()=>nav(-1)} style={{width:50,height:50,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontFamily:"inherit"}}>‹</button>
          <button onClick={()=>mark("l")} style={{padding:"12px 22px",borderRadius:18,border:"1.5px solid #D4A84A44",background:"#D4A84A10",color:"#D4A84A",cursor:"pointer",fontSize:16,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>🔄 Learning</button>
          <button onClick={()=>mark("k")} style={{padding:"12px 22px",borderRadius:18,border:"1.5px solid #5CB87A44",background:"#5CB87A10",color:"#5CB87A",cursor:"pointer",fontSize:16,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>✅ Know it</button>
          <button onClick={()=>nav(1)} style={{width:50,height:50,borderRadius:"50%",border:`1px solid ${T.btnBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontFamily:"inherit"}}>›</button>
        </div>

        {/* DOTS */}
        <div style={{display:"flex",justifyContent:"center",gap:4,flexWrap:"wrap",marginBottom:12,padding:"0 2px"}}>
          {cards.map((c,i)=>{const s=st(c.id);return(
            <button key={c.id} onClick={()=>{setIdx(i);setFlipped(false);stop();}} style={{width:i===idx?20:8,height:8,borderRadius:4,border:"none",padding:0,cursor:"pointer",transition:"all .3s cubic-bezier(.22,1,.36,1)",background:i===idx?color:s==="k"?"#5CB87A55":s==="l"?"#D4A84A55":T.dotBg}}/>
          );})}
        </div>

        {/* STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"12px 4px",borderTop:`1px solid ${T.divider}`}}>
          {[{l:"Total",v:ALL_CARDS.length,c:T.sub,e:"📚"},{l:"Mastered",v:known.size,c:"#5CB87A",e:"⭐"},{l:"Learning",v:learning.size,c:"#D4A84A",e:"📖"},{l:"Flips",v:flips,c:"#E8785A",e:"🔄"}].map(s=>(
            <div key={s.l} style={{textAlign:"center",padding:"8px 4px",borderRadius:14,background:dark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.015)"}}>
              <div style={{fontSize:12,marginBottom:2}}>{s.e}</div>
              <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:12,color:T.muted,letterSpacing:.5,marginTop:1,textTransform:"uppercase",fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
