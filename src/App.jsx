import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import ALL_CARDS from "./cards";

const UI={en:{practice:"Practice",progress:"Progress",settings:"Settings",flipHint:"tap to flip · swipe ← →",hint:"Hint",gotIt:"Got it! →",still:"← Still learning",mastered:"Mastered",learning:"Learning",due:"Due",total:"Total",flips:"flips",done:"Target hit! ✨",example:"Example",play:"▶ Play",theme:"Appearance",autoPlay:"Auto-play sound",target:"Daily target",perDay:"/day",logout:"Log out",deleteAcc:"Delete account",deleteWarn:"Permanently deletes everything.",confirm:"Confirm delete",cancel:"Cancel",pw:"Password",mastery:"Overall mastery",week:"This week",levels:"Levels",cats:"Categories",pracDue:"Due cards",pracLearn:"Learning cards",pracAll:"Practice all",exit:"Exit",allDone:"All caught up!",back:"Back to categories",lang:"Interface language",shuffle:"Shuffle",replay:"Replay tutorial",new:"New",reviewing:"Reviewing",improving:"Improving",strong:"Strong",master:"Mastered",browseAll:"Browse all",dueNow:"due now"},de:{practice:"Übung",progress:"Fortschritt",settings:"Einstellungen",flipHint:"Tippen = umdrehen · Wischen ← →",hint:"Hinweis",gotIt:"Kann ich! →",still:"← Noch lernen",mastered:"Gemeistert",learning:"Am Lernen",due:"Fällig",total:"Gesamt",flips:"Karten",done:"Geschafft! ✨",example:"Beispiel",play:"▶",theme:"Aussehen",autoPlay:"Auto-Ton",target:"Tagesziel",perDay:"/Tag",logout:"Abmelden",deleteAcc:"Konto löschen",deleteWarn:"Löscht alles unwiderruflich.",confirm:"Endgültig löschen",cancel:"Abbrechen",pw:"Passwort",mastery:"Gesamtfortschritt",week:"Diese Woche",levels:"Stufen",cats:"Kategorien",pracDue:"Fällige Karten",pracLearn:"Lernkarten",pracAll:"Alle üben",exit:"Beenden",allDone:"Alles erledigt!",back:"Zurück",lang:"Sprache",shuffle:"Mischen",replay:"Tutorial wiederholen",new:"Neu",reviewing:"Wiederholung",improving:"Fortschritt",strong:"Sicher",master:"Gemeistert",browseAll:"Alle ansehen",dueNow:"fällig"}};
const CAT_DE={Numbers:"Zahlen","Family & People":"Familie","Body Parts":"Körperteile","Nature & Weather":"Natur & Wetter",Colors:"Farben","Food & Home":"Essen & Haus",Places:"Orte",Time:"Zeit",Emotions:"Gefühle",Adjectives:"Adjektive",Verbs:"Verben","Common Words":"Häufige Wörter",Sentences:"Sätze"};
const CAT_EMOJI={Numbers:"🔢","Family & People":"👨‍👩‍👧","Body Parts":"🫳","Nature & Weather":"🌧️",Colors:"🎨","Food & Home":"🏠",Places:"📍",Time:"⏰",Emotions:"💛",Adjectives:"✨",Verbs:"🏃","Common Words":"💬",Sentences:"🗣️"};

const CATEGORIES=["All",...Array.from(new Set(ALL_CARDS.map(c=>c.cat)))];
const CC={Numbers:"#E07850","Family & People":"#A070C0","Body Parts":"#D86888","Nature & Weather":"#50A8B8",Colors:"#C8A040","Food & Home":"#58B070",Places:"#5890D0",Time:"#D89050",Emotions:"#C86088",Adjectives:"#50A080",Verbs:"#8870B8","Common Words":"#6878C0",Sentences:"#D08058"};
const LVL_C=["#D06060","#D89050","#C8A040","#80B050","#40A050"];
const LVL_D=[0,48*36e5,96*36e5,7*864e5,30*864e5];
function cleanForSpeech(t){return t.replace(/\s*\(.*?\)\s*/g," ").replace(/\n/g," ").trim();}

const TL={bgGrad:"linear-gradient(155deg,#F8F6F3 0%,#F2EDE8 30%,#ECE8F2 55%,#E8F0F0 75%,#F5F2EA 100%)",cardFront:"linear-gradient(155deg,#FFF,#FDFBF8 40%,#F8F6FD 70%,#F5F8FB)",text:"#1E1A20",sub:"#58505E",muted:"#908898",faint:"#C8C0D0",hintBg:"rgba(160,112,192,.06)",hintBd:"rgba(160,112,192,.15)",hintTx:"#5E4878",trickBg:"rgba(88,176,112,.06)",trickBd:"rgba(88,176,112,.16)",trickTx:"#38784A",pillBg:"#FFF",pillBd:"rgba(0,0,0,.06)",btnBg:"#FFF",btnBd:"rgba(0,0,0,.08)",btnTx:"#78708A",dotBg:"rgba(0,0,0,.07)",divider:"rgba(0,0,0,.06)",cardShadow:"0 8px 32px rgba(30,20,40,.06),0 2px 8px rgba(0,0,0,.03)",accent:"#C06080",pronBg:"rgba(192,96,128,.06)",pronBd:"rgba(192,96,128,.16)",speedBg:"rgba(192,96,128,.04)",speedBd:"rgba(192,96,128,.10)",speedActive:"rgba(192,96,128,.12)",inputBg:"#FFF",inputBd:"rgba(0,0,0,.10)",overlayBg:"rgba(248,246,243,.98)",tabBg:"#FFF",tabBd:"rgba(0,0,0,.06)",barFill:"#C06080",exBg:"rgba(80,168,184,.05)",exBd:"rgba(80,168,184,.14)",exTx:"#28708A",catCardBg:"#FFF",catCardBd:"rgba(0,0,0,.05)",catCardShadow:"0 2px 12px rgba(0,0,0,.04)"};
const TD={bgGrad:"linear-gradient(155deg,#14101A 0%,#181420 30%,#121418 55%,#161218 75%,#181418 100%)",cardFront:"linear-gradient(155deg,#201828,#1A1620 40%,#161420)",text:"#EDE8F0",sub:"#8A8098",muted:"#585060",faint:"#383040",hintBg:"rgba(255,255,255,.04)",hintBd:"rgba(255,255,255,.08)",hintTx:"#8A8098",trickBg:"rgba(88,176,112,.08)",trickBd:"rgba(88,176,112,.14)",trickTx:"#78C098",pillBg:"rgba(255,255,255,.04)",pillBd:"rgba(255,255,255,.06)",btnBg:"rgba(255,255,255,.05)",btnBd:"rgba(255,255,255,.08)",btnTx:"#8A8098",dotBg:"rgba(255,255,255,.08)",divider:"rgba(255,255,255,.05)",cardShadow:"0 8px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.03)",accent:"#E08898",pronBg:"rgba(224,136,152,.10)",pronBd:"rgba(224,136,152,.20)",speedBg:"rgba(255,255,255,.03)",speedBd:"rgba(255,255,255,.06)",speedActive:"rgba(224,136,152,.14)",inputBg:"rgba(255,255,255,.06)",inputBd:"rgba(255,255,255,.10)",overlayBg:"rgba(20,16,26,.98)",tabBg:"#1A1620",tabBd:"rgba(255,255,255,.06)",barFill:"#E08898",exBg:"rgba(80,168,184,.08)",exBd:"rgba(80,168,184,.12)",exTx:"#78C0D0",catCardBg:"rgba(255,255,255,.04)",catCardBd:"rgba(255,255,255,.06)",catCardShadow:"0 2px 12px rgba(0,0,0,.2)"};
const SPEEDS=[{key:"normal",label:"Normal",rate:.82,emoji:"🗣️"},{key:"slow",label:"Slow",rate:.15,emoji:"🐢"}];

// ——— LANDING PAGE ———
const PREVIEW_CARDS=[
  {front:"Hello",back:"नमस्ते",tl:"Namaste",color:"#C06080"},
  {front:"Water",back:"पानी",tl:"Paani",color:"#50A8B8"},
  {front:"Thank you",back:"शुक्रिया",tl:"Shukriya",color:"#58B070"},
  {front:"Beautiful",back:"सुन्दर",tl:"Sundar",color:"#A070C0"},
  {front:"Family",back:"परिवार",tl:"Parivaar",color:"#D89050"},
];
const FEATURES=[
  {icon:"🗣️",title:"Audio pronunciation",desc:"Normal & slow speed for every word, plus example sentences"},
  {icon:"🧠",title:"Spaced repetition",desc:"5-level system adapts to what you know and what needs work"},
  {icon:"🇩🇪",title:"Built for German speakers",desc:"Memory tricks, hints & full German interface available"},
  {icon:"📊",title:"Track your progress",desc:"Daily goals, mastery charts & category breakdowns"},
];

function LandingPage({onStart,onLogin}){
  const[flipIdx,setFlipIdx]=useState(0);
  const[isFlipped,setIsFlipped]=useState(false);
  const[fadeIn,setFadeIn]=useState(false);
  useEffect(()=>{setTimeout(()=>setFadeIn(true),100);},[]);
  useEffect(()=>{const iv=setInterval(()=>{setIsFlipped(true);setTimeout(()=>{setFlipIdx(i=>(i+1)%PREVIEW_CARDS.length);setIsFlipped(false);},700);},3200);return()=>clearInterval(iv);},[]);
  const pc=PREVIEW_CARDS[flipIdx];
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg,#FBF9F6 0%,#F4EFE9 25%,#EDE8F2 50%,#E8F0F0 75%,#F7F4EC 100%)",fontFamily:"'Outfit',sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes floatA{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-12px) rotate(-6deg)}}
        @keyframes floatB{0%,100%{transform:translateY(0) rotate(4deg)}50%{transform:translateY(-10px) rotate(4deg)}}
        @keyframes floatC{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(-2deg)}}
        .land-fade{opacity:0;transform:translateY(24px);transition:opacity .8s ease,transform .8s ease}
        .land-fade.in{opacity:1;transform:translateY(0)}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
      `}</style>
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22,fontFamily:"'Noto Sans Devanagari',sans-serif",fontWeight:700,color:"#C06080"}}>हि</span>
          <span style={{fontSize:17,fontWeight:800,color:"#1E1A20",letterSpacing:-.5}}>Hindi Flashcards</span>
        </div>
        <button onClick={onLogin} style={{padding:"9px 20px",borderRadius:12,border:"1.5px solid rgba(0,0,0,.1)",background:"#FFF",color:"#58505E",fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>Log in</button>
      </nav>
      <div className={`land-fade ${fadeIn?"in":""}`} style={{maxWidth:960,margin:"0 auto",padding:"40px 24px 0",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:20,background:"rgba(192,96,128,.08)",border:"1px solid rgba(192,96,128,.15)",marginBottom:20}}>
          <span style={{fontSize:13,fontWeight:600,color:"#C06080"}}>Free forever · No credit card</span>
        </div>
        <h1 style={{fontSize:"clamp(32px,6vw,56px)",fontWeight:900,textAlign:"center",lineHeight:1.1,color:"#1E1A20",maxWidth:640,letterSpacing:"-1.5px"}}>
          Learn Hindi faster with<br/><span style={{color:"#C06080"}}>smart flashcards</span>
        </h1>
        <p style={{fontSize:"clamp(16px,2.5vw,19px)",color:"#58505E",textAlign:"center",maxWidth:500,lineHeight:1.6,marginTop:16,fontWeight:400}}>
          {ALL_CARDS.length} cards across 13 categories. Audio pronunciation, spaced repetition, and memory tricks designed for German speakers.
        </p>
        <div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={onStart} style={{padding:"15px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#C06080,#D08898)",color:"#FFF",fontSize:17,fontFamily:"inherit",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(192,96,128,.3),0 1px 3px rgba(0,0,0,.1)",letterSpacing:-.3}}>Start learning →</button>
          <button onClick={onLogin} style={{padding:"15px 28px",borderRadius:16,border:"1.5px solid rgba(0,0,0,.1)",background:"#FFF",color:"#1E1A20",fontSize:16,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>I have an account</button>
        </div>
      </div>
      <div className={`land-fade ${fadeIn?"in":""}`} style={{transitionDelay:".2s",display:"flex",justifyContent:"center",padding:"48px 24px 20px",position:"relative"}}>
        <div style={{position:"relative",width:320,height:220}}>
          <div style={{position:"absolute",top:18,left:-20,width:160,height:100,borderRadius:16,background:"linear-gradient(135deg,#50A8B8,#50A8B8CC)",opacity:.15,animation:"floatA 4s ease-in-out infinite"}}/>
          <div style={{position:"absolute",bottom:10,right:-15,width:140,height:90,borderRadius:16,background:"linear-gradient(135deg,#A070C0,#A070C0CC)",opacity:.12,animation:"floatB 5s ease-in-out infinite"}}/>
          <div style={{position:"absolute",top:-5,right:30,width:120,height:80,borderRadius:14,background:"linear-gradient(135deg,#58B070,#58B070CC)",opacity:.1,animation:"floatC 4.5s ease-in-out infinite"}}/>
          <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:260,height:170,perspective:800}}>
            <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform .6s cubic-bezier(.23,1,.32,1)",transform:isFlipped?"rotateY(180deg)":"rotateY(0)"}}>
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",borderRadius:20,background:"#FFF",border:`2px solid ${pc.color}18`,boxShadow:"0 12px 40px rgba(30,20,40,.08),0 2px 8px rgba(0,0,0,.04)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
                <div style={{fontSize:11,color:"#908898",letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:8}}>English</div>
                <div style={{fontSize:32,fontWeight:800,color:"#1E1A20"}}>{pc.front}</div>
                <div style={{marginTop:12,fontSize:12,color:"#C8C0D0"}}>tap to flip</div>
              </div>
              <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:20,background:`linear-gradient(155deg,${pc.color}08,#FFF 30%)`,border:`2px solid ${pc.color}20`,boxShadow:"0 12px 40px rgba(30,20,40,.08),0 2px 8px rgba(0,0,0,.04)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
                <div style={{fontSize:11,color:pc.color,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:6,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी</div>
                <div style={{fontSize:36,fontWeight:700,color:"#1E1A20",fontFamily:"'Noto Sans Devanagari',sans-serif"}}>{pc.back}</div>
                <div style={{fontSize:15,color:pc.color,fontWeight:600,marginTop:4}}>{pc.tl}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`land-fade ${fadeIn?"in":""}`} style={{transitionDelay:".4s",maxWidth:800,margin:"0 auto",padding:"30px 24px 40px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
          {FEATURES.map((f,i)=>(
            <div key={i} style={{padding:"20px 18px",borderRadius:18,background:"#FFF",border:"1px solid rgba(0,0,0,.05)",boxShadow:"0 2px 12px rgba(0,0,0,.03)"}}>
              <div style={{fontSize:28,marginBottom:8}}>{f.icon}</div>
              <div style={{fontSize:15,fontWeight:700,color:"#1E1A20",marginBottom:4}}>{f.title}</div>
              <div style={{fontSize:13,color:"#58505E",lineHeight:1.5}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={`land-fade ${fadeIn?"in":""}`} style={{transitionDelay:".5s",textAlign:"center",padding:"20px 24px 50px"}}>
        <div style={{fontSize:13,color:"#908898",marginBottom:14}}>✓ 100% free &nbsp; ✓ No ads &nbsp; ✓ Works offline</div>
        <button onClick={onStart} style={{padding:"15px 40px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#C06080,#D08898)",color:"#FFF",fontSize:17,fontFamily:"inherit",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(192,96,128,.3)"}}>Start learning Hindi →</button>
      </div>
    </div>
  );
}

function useSpeech(){const[s,ss]=useState(false);const[a,sa]=useState(null);const[v,sv]=useState(null);const r=useRef(null);useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;r.current=window.speechSynthesis;const p=()=>{const vs=r.current.getVoices();sv(vs.find(x=>x.lang==="hi-IN")||vs.find(x=>x.lang.startsWith("hi"))||null);};p();r.current.addEventListener("voiceschanged",p);return()=>r.current?.removeEventListener("voiceschanged",p);},[]);
  // speakParts: split on "/" and speak each part with a pause
  const speak=useCallback((t,rate=.82,k="normal")=>{if(!r.current)return;r.current.cancel();
    const cleaned=cleanForSpeech(t);
    const parts=cleaned.split(/\s*\/\s*/).filter(Boolean);
    const speakPart=(i)=>{
      if(i>=parts.length){ss(false);sa(null);return;}
      const u=new SpeechSynthesisUtterance(parts[i].trim());
      u.lang="hi-IN";u.rate=rate;u.pitch=1;if(v)u.voice=v;
      u.onstart=()=>{ss(true);sa(k);};
      u.onend=()=>{if(i<parts.length-1){setTimeout(()=>speakPart(i+1),450);}else{ss(false);sa(null);}};
      u.onerror=()=>{ss(false);sa(null);};
      r.current.speak(u);
    };
    speakPart(0);
  },[v]);const stop=useCallback(()=>{r.current?.cancel();ss(false);sa(null);},[]);return{speak,stop,speaking:s,activeSpeed:a,supported:typeof window!=="undefined"&&!!window.speechSynthesis};}
function useSwipe(onL,onR){const sx=useRef(0);const sy=useRef(0);return{onTouchStart:useCallback(e=>{sx.current=e.touches[0].clientX;sy.current=e.touches[0].clientY;},[]),onTouchEnd:useCallback(e=>{const dx=e.changedTouches[0].clientX-sx.current;const dy=e.changedTouches[0].clientY-sy.current;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){dx>0?onR():onL();}},[onL,onR])};}

async function saveData(uid,d){try{await setDoc(doc(db,"users",uid),{...d,updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.error(e);}}
async function loadData(uid){try{const s=await getDoc(doc(db,"users",uid));if(s.exists())return s.data();}catch(e){console.error(e);}return null;}

function PasswordInput({value,onChange,placeholder,onKeyDown,T}){const[v,setV]=useState(false);return(<div style={{position:"relative",width:"100%"}}><input type={v?"text":"password"} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} style={{width:"100%",padding:"14px 48px 14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}}/><button type="button" onClick={()=>setV(x=>!x)} tabIndex={-1} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:"6px",color:T.muted,fontSize:16}}>{v?"🙈":"👁️"}</button></div>);}

const TUTORIAL=[{e:"👋",t:"Welcome!",b:"Learn Hindi with flashcards, audio & spaced repetition."},{e:"📚",t:"Flip & Swipe",b:"Tap to flip. Swipe right = got it, left = still learning."},{e:"💡",t:"Hints",b:"Tap '💡 Hint' for a clue — first letter, letter count, sound-alikes."},{e:"🏆",t:"5 Levels",b:"Correct → level up, wrong → level down. Higher levels repeat less."},{e:"🗣️",t:"Audio",b:"Normal & Slow speed. Example sentences with audio too."},{e:"🌐",t:"Deutsch?",b:"Switch to German in Settings. Every card has 🇩🇪 memory tricks."},{e:"🚀",t:"Ready!",b:"Pick a category and start — बहुत मज़ा आएगा!"}];
function TutorialModal({T,onDone}){const[s,setS]=useState(0);const t=TUTORIAL[s];const last=s===TUTORIAL.length-1;return(<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",padding:20,boxSizing:"border-box"}}><div style={{background:T.overlayBg,borderRadius:28,padding:"32px 24px 24px",width:"100%",maxWidth:380,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.2)",backdropFilter:"blur(20px)"}}><div style={{fontSize:48,marginBottom:8}}>{t.e}</div><h2 style={{fontSize:22,fontWeight:800,color:T.text,margin:"0 0 8px"}}>{t.t}</h2><p style={{fontSize:15,color:T.sub,lineHeight:1.6,margin:"0 0 20px"}}>{t.b}</p><div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:16}}>{TUTORIAL.map((_,i)=>(<div key={i} style={{width:i===s?18:8,height:5,borderRadius:3,background:i===s?T.accent:`${T.accent}30`,transition:"all .3s"}}/>))}</div><div style={{display:"flex",gap:10}}>{s>0&&<button onClick={()=>setS(s=>s-1)} style={{flex:1,padding:"12px",borderRadius:14,border:`1.5px solid ${T.pillBd}`,background:T.btnBg,color:T.sub,fontSize:15,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>←</button>}<button onClick={()=>last?onDone():setS(s=>s+1)} style={{flex:1,padding:"12px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent}DD)`,color:"#FFF",fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{last?"Let's go!":"Next →"}</button></div><button onClick={onDone} style={{marginTop:8,background:"none",border:"none",color:T.muted,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>Skip</button></div></div>);}

function AuthScreen({T,onBack,initialMode}){const[isS,setIsS]=useState(initialMode==="signup");const[nm,setNm]=useState("");const[em,setEm]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");const[ld,setLd]=useState(false);const sub=async()=>{setErr("");if(isS&&!nm.trim()){setErr("Enter your name");return;}if(!em||!pw){setErr("Fill all fields");return;}if(pw.length<6){setErr("Min 6 chars");return;}setLd(true);try{if(isS){const c=await createUserWithEmailAndPassword(auth,em,pw);await setDoc(doc(db,"users",c.user.uid),{name:nm.trim(),cardLevels:{},stats:{totalMinutes:0,dailyLog:{},dailyTarget:25},lang:"en",showTutorial:true});}else await signInWithEmailAndPassword(auth,em,pw);}catch(e){setErr(e.code==="auth/invalid-credential"?"Invalid email/password.":e.code==="auth/email-already-in-use"?"Already registered.":e.message);}setLd(false);};const iS={width:"100%",padding:"14px 16px",borderRadius:14,border:`1.5px solid ${T.inputBd}`,background:T.inputBg,color:T.text,fontSize:16,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"};
return(<div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",boxSizing:"border-box"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{width:"100%",maxWidth:400}}>{onBack&&<button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,padding:"8px 14px",borderRadius:12,border:`1px solid ${T.pillBd}`,background:T.btnBg,color:T.sub,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer",marginBottom:28}}>← Back</button>}<div style={{textAlign:"center"}}><div style={{fontSize:15,letterSpacing:3,color:T.accent,fontWeight:700,marginBottom:6,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div><h1 style={{fontSize:30,fontWeight:800,margin:0,color:T.text}}>{isS?"Create your account":"Welcome back"}</h1>{isS&&<p style={{fontSize:14,color:T.muted,margin:"10px 0 0",lineHeight:1.5}}>Save your progress across devices and track your learning journey.</p>}<p style={{fontSize:15,color:T.sub,margin:"8px 0 24px"}}>{isS?"":"Log in to continue learning"}</p></div><div style={{display:"flex",flexDirection:"column",gap:12}}>{isS&&<input placeholder="Your name" value={nm} onChange={e=>setNm(e.target.value)} style={iS}/>}<input type="email" placeholder="Email" value={em} onChange={e=>setEm(e.target.value)} style={iS}/><PasswordInput value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password (min 6)" onKeyDown={e=>e.key==="Enter"&&sub()} T={T}/>{err&&<div style={{padding:"10px",borderRadius:12,background:"#E8505014",border:"1px solid #E8505030",color:"#C03040",fontSize:13,textAlign:"left"}}>{err}</div>}<button onClick={sub} disabled={ld} style={{padding:"15px",borderRadius:16,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent}CC)`,color:"#FFF",fontSize:17,fontFamily:"inherit",fontWeight:700,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"...":isS?"Create Account":"Log In"}</button><button onClick={()=>{setIsS(s=>!s);setErr("");}} style={{padding:"10px",borderRadius:12,border:`1px solid ${T.pillBd}`,background:"transparent",color:T.sub,fontSize:14,fontFamily:"inherit",cursor:"pointer"}}>{isS?"Have account? Log in":"New? Sign up"}</button></div></div></div>);}

function getLevel(cl,id){return cl[id]||{level:1,lastCorrect:null};}
function isDue(cl,id){const c=getLevel(cl,id);if(!c.lastCorrect||c.level<=1)return true;return Date.now()-new Date(c.lastCorrect).getTime()>=LVL_D[Math.min(c.level-1,4)];}
function lvlUp(cl,id){const c=getLevel(cl,id);return{...cl,[id]:{level:Math.min(c.level+1,5),lastCorrect:new Date().toISOString()}};}
function lvlDown(cl,id){const c=getLevel(cl,id);return{...cl,[id]:{level:Math.max(c.level-1,1),lastCorrect:c.lastCorrect}};}
function shuffleArr(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}

// ——— NAMASTE ANIMATION (FIXED: uses array for multi-byte emoji) ———
function NamasteAnim({name,T}){
  const[phase,setPhase]=useState(0);
  const EMOJIS=["👋","🙏","👋"];
  useEffect(()=>{const t1=setTimeout(()=>setPhase(1),600);const t2=setTimeout(()=>setPhase(2),1800);const t3=setTimeout(()=>setPhase(3),2800);return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};},[]);
  if(phase===3)return null;
  return(<div style={{position:"fixed",inset:0,zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.3)",backdropFilter:"blur(8px)",transition:"opacity .4s"}}>
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:72,transition:"all .4s ease",transform:phase===1?"scale(1.2)":"scale(1)"}}>{EMOJIS[phase]}</div>
      <div style={{fontSize:28,fontWeight:800,color:"#FFF",marginTop:12,textShadow:"0 2px 20px rgba(0,0,0,.3)"}}>Namaste, {name}!</div>
    </div>
  </div>);
}

export default function App(){
  const[user,setUser]=useState(null);const[userName,setUserName]=useState("");const[authLoading,setAuthLoading]=useState(true);
  const[activeCategory,setActiveCategory]=useState(null);const[idx,setIdx]=useState(0);const[flipped,setFlipped]=useState(false);
  const[cardLevels,setCardLevels]=useState({});const[anim,setAnim]=useState(false);const[dark,setDark]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(true);const[saving,setSaving]=useState(false);
  const[tab,setTab]=useState("practice");const[showList,setShowList]=useState(null);
  const[swipeHint,setSwipeHint]=useState(null);const[practiceMode,setPracticeMode]=useState(null);
  const[stats,setStats]=useState({totalMinutes:0,dailyLog:{},dailyTarget:25});
  const[showHint,setShowHint]=useState(false);const[todayFlips,setTodayFlips]=useState(0);
  const[showTutorial,setShowTutorial]=useState(false);const[lang,setLang]=useState("en");
  const[shuffled,setShuffled]=useState(false);const[shuffledCards,setShuffledCards]=useState([]);
  const[showNamaste,setShowNamaste]=useState(false);
  const[authMode,setAuthMode]=useState(null); // null=landing, "signup", "login"
  // New toggle states for card back info panels
  const[showLatin,setShowLatin]=useState(false);
  const[showGender,setShowGender]=useState(false);
  const[showPlural,setShowPlural]=useState(false);
  const lastActivity=useRef(Date.now());const sessionStart=useRef(Date.now());
  // Ref for tracking marked card to fix Due stuck bug
  const lastMarkedId=useRef(null);

  const{speak,stop,speaking,activeSpeed,supported}=useSpeech();
  const T=dark?TD:TL;const u=UI[lang]||UI.en;const today=new Date().toISOString().slice(0,10);
  const lvlNames=[u.new,u.reviewing,u.improving,u.strong,u.master];

  const knownSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=5).map(([k])=>+k)),[cardLevels]);
  const learningSet=useMemo(()=>new Set(Object.entries(cardLevels).filter(([,v])=>v.level>=2&&v.level<5).map(([k])=>+k)),[cardLevels]);
  const dueCards=useMemo(()=>ALL_CARDS.filter(c=>isDue(cardLevels,c.id)),[cardLevels]);

  const baseCards=useMemo(()=>{
    if(practiceMode==="learning")return ALL_CARDS.filter(c=>{const l=getLevel(cardLevels,c.id).level;return l>=2&&l<5&&isDue(cardLevels,c.id);});
    if(practiceMode==="due")return dueCards;
    if(activeCategory==="All")return ALL_CARDS;
    if(activeCategory)return ALL_CARDS.filter(c=>c.cat===activeCategory);
    return[];
  },[activeCategory,practiceMode,cardLevels,dueCards]);

  const cards=shuffled?shuffledCards:baseCards;
  const card=cards[idx]||cards[0];const color=CC[card?.cat]||"#C06080";
  const catName=c=>lang==="de"?(CAT_DE[c]||c):c;
  const cardFront=lang==="de"?(card?.frontDe||card?.front):card?.front;
  const cardHint=lang==="de"?(card?.hintDe||card?.hint):card?.hint;
  const exLang=lang==="de"?(card?.example?.de||card?.example?.en):card?.example?.en;
  const markActive=useCallback(()=>{lastActivity.current=Date.now();},[]);

  // Clamp idx when filtered list shrinks (prevents skip bug)
  useEffect(()=>{if(cards.length>0&&idx>=cards.length)setIdx(Math.max(0,cards.length-1));},[cards.length,idx]);

  // FIX: After marking a card in practiceMode, if the same card is still showing, advance
  useEffect(()=>{
    if(practiceMode&&lastMarkedId.current!==null&&cards.length>0){
      const currentCard=cards[idx]||cards[0];
      if(currentCard&&currentCard.id===lastMarkedId.current){
        // Card is still in the list after marking — advance
        lastMarkedId.current=null;
        setFlipped(false);setShowHint(false);setShowLatin(false);setShowGender(false);setShowPlural(false);
        setIdx(i=>{const n=i+1;return n>=cards.length?0:n;});
      } else {
        lastMarkedId.current=null;
      }
    }
  },[cardLevels,practiceMode,cards,idx]);

  // Reset info toggles when card changes
  useEffect(()=>{setShowLatin(false);setShowGender(false);setShowPlural(false);},[idx]);

  useEffect(()=>{const unsub=onAuthStateChanged(auth,async usr=>{setUser(usr);if(usr){const d=await loadData(usr.uid);if(d){setCardLevels(d.cardLevels||{});setUserName(d.name||"");setStats(d.stats||{totalMinutes:0,dailyLog:{},dailyTarget:25});setTodayFlips(d.stats?.dailyLog?.[today]||0);setLang(d.lang||"en");if(d.showTutorial)setShowTutorial(true);}setShowNamaste(true);}setAuthLoading(false);});return()=>unsub();},[]);

  useEffect(()=>{if(!user)return;const iv=setInterval(()=>{if(Date.now()-lastActivity.current<60000){const el=(Date.now()-sessionStart.current)/60000;if(el>0&&el<2)setStats(p=>({...p,totalMinutes:(p.totalMinutes||0)+el}));}sessionStart.current=Date.now();},30000);return()=>clearInterval(iv);},[user]);

  const saveTimeout=useRef(null);
  useEffect(()=>{if(!user)return;if(saveTimeout.current)clearTimeout(saveTimeout.current);saveTimeout.current=setTimeout(async()=>{setSaving(true);await saveData(user.uid,{name:userName,cardLevels,stats,lang,showTutorial:false});setSaving(false);},1000);return()=>{if(saveTimeout.current)clearTimeout(saveTimeout.current);};},[cardLevels,user,userName,stats,lang]);

  const prevFlipped=useRef(false);
  useEffect(()=>{if(flipped&&!prevFlipped.current){setTodayFlips(f=>f+1);setStats(p=>({...p,dailyLog:{...p.dailyLog,[today]:(p.dailyLog?.[today]||0)+1}}));if(autoSpeak&&supported&&card)setTimeout(()=>speak(card.back,.82,"normal"),400);}prevFlipped.current=flipped;},[flipped,card,autoSpeak,supported,speak,today]);

  const doFlip=useCallback(()=>{if(!anim){setFlipped(f=>!f);setShowHint(false);markActive();}},[anim,markActive]);
  const nav=useCallback(d=>{if(anim)return;setAnim(true);setFlipped(false);setShowHint(false);setShowLatin(false);setShowGender(false);setShowPlural(false);stop();markActive();setTimeout(()=>{setIdx(i=>{const n=i+d;return n<0?cards.length-1:n>=cards.length?0:n;});setAnim(false);},200);},[cards.length,anim,stop,markActive]);

  // DUE BUG FIX: track marked card id so useEffect can advance if card stays in list
  const markKnow=useCallback(()=>{if(!card)return;markActive();lastMarkedId.current=card.id;setCardLevels(p=>lvlUp(p,card.id));if(practiceMode){setFlipped(false);setShowHint(false);setShowLatin(false);setShowGender(false);setShowPlural(false);stop();}else nav(1);},[card,nav,markActive,practiceMode,stop]);
  const markLearn=useCallback(()=>{if(!card)return;markActive();lastMarkedId.current=card.id;setCardLevels(p=>lvlDown(p,card.id));if(practiceMode){setFlipped(false);setShowHint(false);setShowLatin(false);setShowGender(false);setShowPlural(false);stop();}else nav(1);},[card,nav,markActive,practiceMode,stop]);

  const onSwipeL=useCallback(()=>{setSwipeHint("left");setTimeout(()=>setSwipeHint(null),400);markLearn();},[markLearn]);
  const onSwipeR=useCallback(()=>{setSwipeHint("right");setTimeout(()=>setSwipeHint(null),400);markKnow();},[markKnow]);
  const swipe=useSwipe(onSwipeL,onSwipeR);
  const handleLogout=async()=>{stop();await signOut(auth);setAuthMode(null);};
  const pct=Math.round((knownSet.size/ALL_CARDS.length)*100);
  const handlePlay=(e,sp)=>{e.stopPropagation();markActive();if(speaking&&activeSpeed===sp.key){stop();return;}speak(card.back,sp.rate,sp.key);};
  const displayName=userName||user?.email?.split("@")[0]||"Learner";
  const jumpToCard=id=>{setPracticeMode(null);setActiveCategory("All");setShuffled(false);setFlipped(false);setShowHint(false);stop();const i=ALL_CARDS.findIndex(c=>c.id===id);if(i>=0)setIdx(i);setShowList(null);setTab("practice");};
  const exitPractice=()=>{setPracticeMode(null);setActiveCategory(null);setShuffled(false);setIdx(0);setFlipped(false);setShowHint(false);};
  const goBackToGrid=()=>{setActiveCategory(null);setShuffled(false);setIdx(0);setFlipped(false);setShowHint(false);stop();};
  const enterCategory=cat=>{setActiveCategory(cat);setIdx(0);setFlipped(false);setShowHint(false);
    const catCards=cat==="All"?ALL_CARDS:ALL_CARDS.filter(c=>c.cat===cat);
    setShuffledCards(shuffleArr(catCards));setShuffled(true);
  };
  const doShuffle=()=>{setShuffledCards(shuffleArr(baseCards));setShuffled(true);setIdx(0);setFlipped(false);};
  const dailyTarget=stats.dailyTarget||25;const targetPct=Math.min(Math.round((todayFlips/dailyTarget)*100),100);
  const cl=card?getLevel(cardLevels,card.id):{level:1};
  const speakEx=e=>{e.stopPropagation();markActive();if(card?.example)speak(card.example.hi,.2,"normal");};
  const closeTutorial=()=>{setShowTutorial(false);if(user)saveData(user.uid,{showTutorial:false});};
  const inCardView=activeCategory!==null||practiceMode;

  // Helper: does this card have gender/plural/genderForms info?
  const hasGenderInfo=card&&(card.gender||card.gf);
  const hasPluralInfo=card&&card.plural;
  const hasLatinInfo=card&&card.tl;

  // Toggle button style helper
  const toggleBtnStyle=(active)=>({
    padding:"5px 10px",borderRadius:10,
    border:`1.5px solid ${active?color+"60":T.pillBd}`,
    background:active?`${color}14`:T.speedBg,
    color:active?color:T.sub,
    cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600,
    display:"flex",alignItems:"center",gap:3
  });

  if(authLoading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgGrad,fontFamily:"'Outfit',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{textAlign:"center",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🇮🇳</div><div style={{fontSize:18,fontWeight:600}}>Loading...</div></div></div>);
  if(!user){
    if(authMode==="signup")return <AuthScreen T={TL} onBack={()=>setAuthMode(null)} initialMode="signup"/>;
    if(authMode==="login")return <AuthScreen T={TL} onBack={()=>setAuthMode(null)} initialMode="login"/>;
    return <LandingPage onStart={()=>setAuthMode("signup")} onLogin={()=>setAuthMode("login")}/>;
  }

  return(
    <div style={{minHeight:"100vh",background:T.bgGrad,fontFamily:"'Outfit',sans-serif",color:T.text,display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 14px 80px",boxSizing:"border-box",transition:"background .4s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes speakPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes barBounce{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes swL{0%{opacity:0;transform:translateX(20px)}50%{opacity:1}100%{opacity:0;transform:translateX(-20px)}}@keyframes swR{0%{opacity:0;transform:translateX(-20px)}50%{opacity:1}100%{opacity:0;transform:translateX(20px)}}@keyframes hintIn{from{opacity:0;max-height:0}to{opacity:1;max-height:200px}}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}`}</style>

      {showNamaste&&<NamasteAnim name={displayName} T={T}/>}
      {showTutorial&&<TutorialModal T={T} onDone={closeTutorial}/>}

      {showList&&<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",padding:20}} onClick={()=>setShowList(null)}><div onClick={e=>e.stopPropagation()} style={{background:T.overlayBg,borderRadius:24,padding:"24px 20px",width:"100%",maxWidth:440,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:20,fontWeight:800,color:T.text,margin:0}}>{showList==="known"?`⭐ ${u.mastered}`:`📖 ${u.learning}`} ({(showList==="known"?knownSet:learningSet).size})</h2><button onClick={()=>setShowList(null)} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${T.pillBd}`,background:T.btnBg,color:T.btnTx,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
        {ALL_CARDS.filter(c=>(showList==="known"?knownSet:learningSet).has(c.id)).map(c=>{const lv=getLevel(cardLevels,c.id);const front=lang==="de"?(c.frontDe||c.front):c.front;return(<button key={c.id} onClick={()=>jumpToCard(c.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",borderRadius:14,border:`1px solid ${T.pillBd}`,background:T.pillBg,marginBottom:6,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}><div><div style={{fontSize:15,fontWeight:700,color:T.text}}>{front}</div><div style={{fontSize:13,color:CC[c.cat],fontWeight:600,marginTop:1}}>{c.back} · {c.tl}</div></div><span style={{fontSize:10,fontWeight:700,color:LVL_C[lv.level-1],background:`${LVL_C[lv.level-1]}15`,padding:"2px 7px",borderRadius:6}}>Lv{lv.level}</span></button>);})}
      </div></div>}

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:560}}>
        {tab==="practice"&&<>
          <div style={{marginBottom:10}}><div style={{fontSize:12,letterSpacing:3,color:T.accent,fontWeight:700,marginBottom:2,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी सीखें</div><h1 style={{fontSize:22,fontWeight:800,margin:0,color:T.text}}>Namaste, {displayName}!</h1></div>
          <div style={{marginBottom:10,padding:"10px 14px",borderRadius:14,background:T.pillBg,border:`1px solid ${T.pillBd}`,boxShadow:T.catCardShadow}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{fontWeight:600,color:T.text}}>🎯 {todayFlips}/{dailyTarget} {u.flips}</span><span style={{fontWeight:700,color:targetPct>=100?"#40A050":T.accent}}>{targetPct>=100?u.done:`${targetPct}%`}</span></div><div style={{height:5,borderRadius:3,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${targetPct}%`,background:targetPct>=100?"linear-gradient(90deg,#40A050,#80B050)":"linear-gradient(90deg,#D06060,#C8A040)",transition:"width .4s"}}/></div></div>
          {practiceMode&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderRadius:12,background:"#C8A04014",border:"1.5px solid #C8A04030",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:"#C8A040"}}>🎯 {practiceMode==="learning"?u.pracLearn:u.pracDue}: {cards.length}</span><button onClick={exitPractice} style={{padding:"5px 10px",borderRadius:10,border:"1px solid #C8A04040",background:"transparent",color:"#C8A040",fontSize:11,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{u.exit}</button></div>}

          {!inCardView&&<>
            {/* ——— Top action: Browse All + Due ——— */}
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <button onClick={()=>enterCategory("All")} style={{flex:1,padding:"16px 14px",borderRadius:18,border:`1.5px solid ${T.accent}30`,background:`${T.accent}08`,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxShadow:T.catCardShadow}}>
                <span style={{fontSize:24}}>📚</span>
                <span style={{fontSize:15,fontWeight:700,color:T.text}}>{u.browseAll}</span>
                <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{ALL_CARDS.length} {lang==="de"?"Karten":"cards"} · 🔀</span>
              </button>
              {dueCards.length>0&&<button onClick={()=>{setPracticeMode("due");setShuffledCards(shuffleArr(dueCards));setShuffled(true);setIdx(0);}} style={{flex:1,padding:"16px 14px",borderRadius:18,border:"1.5px solid #D0606030",background:"#D0606008",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxShadow:T.catCardShadow}}>
                <span style={{fontSize:24}}>🔥</span>
                <span style={{fontSize:15,fontWeight:700,color:"#D06060"}}>{dueCards.length} {u.due}</span>
                <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{lang==="de"?"Jetzt üben":"Practice now"} · 🔀</span>
              </button>}
            </div>
            <div style={{fontSize:13,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,padding:"0 2px"}}>{u.cats}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
              {CATEGORIES.filter(c=>c!=="All").map(cat=>{const cc=CC[cat]||T.accent;const catCards=ALL_CARDS.filter(c=>c.cat===cat);const mastered=catCards.filter(c=>getLevel(cardLevels,c.id).level>=5).length;const due=catCards.filter(c=>isDue(cardLevels,c.id)).length;const pctCat=catCards.length?Math.round((mastered/catCards.length)*100):0;return(<button key={cat} onClick={()=>enterCategory(cat)} style={{padding:"16px 14px",borderRadius:18,border:`1px solid ${T.catCardBd}`,background:T.catCardBg,boxShadow:T.catCardShadow,cursor:"pointer",textAlign:"left",fontFamily:"inherit",display:"flex",flexDirection:"column",gap:6,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:cc}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:22}}>{CAT_EMOJI[cat]||"📁"}</span><span style={{fontSize:10,fontWeight:600,color:T.muted}}>{catCards.length}</span></div><div style={{fontSize:15,fontWeight:700,color:T.text}}>{catName(cat)}</div><div style={{height:4,borderRadius:2,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:`${pctCat}%`,background:cc}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.muted}}><span>{mastered}/{catCards.length} ⭐</span>{due>0&&<span style={{color:"#D06060",fontWeight:600}}>{due} {u.dueNow}</span>}</div></button>);})}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"10px 0",borderTop:`1px solid ${T.divider}`}}>{[{l:u.mastered,v:knownSet.size,c:"#40A050",cl:()=>setShowList("known")},{l:u.learning,v:learningSet.size,c:"#C8A040",cl:()=>setShowList("learning")},{l:u.due,v:dueCards.length,c:"#D06060",cl:()=>{setPracticeMode("due");setShuffledCards(shuffleArr(dueCards));setShuffled(true);setIdx(0);}}].map(s=>(<div key={s.l} onClick={s.cl} style={{textAlign:"center",padding:"8px 4px",borderRadius:12,background:T.pillBg,border:`1px solid ${T.pillBd}`,cursor:"pointer",boxShadow:T.catCardShadow}}><div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.muted,fontWeight:600,textTransform:"uppercase"}}>{s.l}</div></div>))}</div>
          </>}

          {inCardView&&cards.length>0&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><button onClick={practiceMode?exitPractice:goBackToGrid} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:12,border:`1px solid ${T.pillBd}`,background:T.pillBg,color:T.sub,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>← {u.back}</button><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,color,fontWeight:700}}>{!practiceMode&&activeCategory!=="All"?catName(activeCategory)+" · ":""}{idx+1}/{cards.length}</span><button onClick={doShuffle} style={{padding:"6px 12px",borderRadius:12,border:`1.5px solid ${T.accent}40`,background:`${T.accent}12`,color:T.accent,fontSize:12,fontFamily:"inherit",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>🔀 {u.shuffle}</button></div></div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,padding:"0 2px"}}><div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(l=>(<div key={l} style={{width:8,height:8,borderRadius:"50%",background:cl.level>=l?LVL_C[l-1]:T.dotBg}}/>))}</div><span style={{fontSize:12,fontWeight:700,color:LVL_C[cl.level-1]}}>{lvlNames[cl.level-1]}</span></div>

            <div {...swipe} onClick={doFlip} style={{perspective:1200,cursor:"pointer",marginBottom:8,height:450,position:"relative"}}>
              {swipeHint==="right"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(64,160,80,.12)",animation:"swR .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:44}}>✅</span></div>}
              {swipeHint==="left"&&<div style={{position:"absolute",inset:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:24,background:"rgba(200,160,64,.12)",animation:"swL .4s ease-out forwards",pointerEvents:"none"}}><span style={{fontSize:44}}>🔄</span></div>}
              <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0)",transition:"transform .65s cubic-bezier(.23,1,.32,1)"}}>
                {/* ——— FRONT SIDE ——— */}
                <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",borderRadius:24,background:T.cardFront,border:`1px solid ${color}18`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 22px",boxShadow:T.cardShadow}}>
                  <div style={{position:"absolute",top:14,right:16,fontSize:12,color:T.muted,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>{lang==="de"?"Deutsch":"English"}</div>
                  <div style={{fontSize:cardFront&&cardFront.length>20?26:42,fontWeight:800,textAlign:"center",lineHeight:1.25,color:T.text}}>{cardFront}</div>
                  <div style={{marginTop:14,width:"100%",maxWidth:360,textAlign:"center"}}>{!showHint?<button onClick={e=>{e.stopPropagation();setShowHint(true);markActive();}} style={{padding:"8px 18px",borderRadius:14,border:`1.5px solid ${T.hintBd}`,background:T.hintBg,color:T.hintTx,fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer",margin:"0 auto",display:"flex",alignItems:"center",gap:6}}>💡 {u.hint}</button>:<div style={{animation:"hintIn .3s ease-out",padding:"10px 16px",borderRadius:14,background:T.hintBg,border:`1.5px solid ${T.hintBd}`,fontSize:14,color:T.hintTx,lineHeight:1.5,fontWeight:500}} onClick={e=>e.stopPropagation()}>{cardHint}</div>}</div>
                  <div style={{marginTop:14,fontSize:13,color:T.faint}}>{u.flipHint}</div>
                </div>
                {/* ——— BACK SIDE ——— */}
                <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:24,background:dark?`linear-gradient(155deg,${color}10,#1A1620 25%,#161420)`:`linear-gradient(155deg,${color}06,#FFF 25%,#F8F6F3)`,border:`1px solid ${color}${dark?"28":"14"}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 14px",boxShadow:T.cardShadow,overflowY:"auto",justifyContent:"flex-start",paddingTop:32}}>
                  <div style={{position:"absolute",top:10,right:14,fontSize:11,color,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,opacity:.7,fontFamily:"'Noto Sans Devanagari',sans-serif"}}>हिन्दी</div>
                  {/* Hindi word */}
                  <div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:card?.back.length>14?28:46,fontWeight:700,textAlign:"center",color:T.text,lineHeight:1.3,whiteSpace:"pre-line"}}>{card?.back}</div>
                  {/* Audio controls */}
                  {supported&&<div onClick={e=>e.stopPropagation()} style={{marginTop:8,padding:"4px",borderRadius:14,background:T.speedBg,border:`1px solid ${T.speedBd}`,display:"flex",gap:4,width:"100%",maxWidth:400}}>{SPEEDS.map(sp=>{const isA=speaking&&activeSpeed===sp.key;return(<button key={sp.key} onClick={e=>handlePlay(e,sp)} style={{flex:1,padding:"8px",borderRadius:10,border:"1.5px solid",borderColor:isA?`${color}60`:"transparent",background:isA?T.speedActive:"transparent",color:isA?color:T.sub,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:4,animation:isA?"speakPulse 1.2s ease-in-out infinite":"none"}}>{isA?<div style={{display:"flex",gap:2,height:14}}>{[0,1,2,3].map(b=><div key={b} style={{width:3,height:14,borderRadius:2,background:color,animation:`barBounce 0.${5+b*2}s ease-in-out infinite`,animationDelay:`${b*.1}s`}}/>)}</div>:<span>{sp.emoji}</span>}{sp.label}</button>);})}</div>}
                  {/* ——— Toggle buttons row: Latin / Gender / Plural ——— */}
                  <div onClick={e=>e.stopPropagation()} style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap",justifyContent:"center"}}>
                    {hasLatinInfo&&<button onClick={()=>setShowLatin(v=>!v)} style={toggleBtnStyle(showLatin)}>🔤 {lang==="de"?"Latein":"Latin"}</button>}
                    {hasGenderInfo&&<button onClick={()=>setShowGender(v=>!v)} style={toggleBtnStyle(showGender)}>♂♀ {lang==="de"?"Geschlecht":"Gender"}</button>}
                    {hasPluralInfo&&<button onClick={()=>setShowPlural(v=>!v)} style={toggleBtnStyle(showPlural)}>1⇄2 {lang==="de"?"Singular/Plural":"Singular/Plural"}</button>}
                  </div>
                  {/* Latin transliteration (collapsible) */}
                  {showLatin&&hasLatinInfo&&<div style={{marginTop:5,padding:"5px 12px",borderRadius:10,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:14,color,fontWeight:500,width:"100%",maxWidth:400,textAlign:"center",animation:"hintIn .3s ease-out"}}>🔤 {card.tl}</div>}
                  {/* Gender info (collapsible) */}
                  {showGender&&hasGenderInfo&&<div style={{marginTop:5,padding:"5px 12px",borderRadius:10,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:13,color,fontWeight:500,width:"100%",maxWidth:400,textAlign:"center",animation:"hintIn .3s ease-out",lineHeight:1.5}}>
                    {card.gender&&<span>♂♀ {card.gender==="m"?(lang==="de"?"Maskulin (पुल्लिंग)":"Masculine (पुल्लिंग)"):(lang==="de"?"Feminin (स्त्रीलिंग)":"Feminine (स्त्रीलिंग)")}</span>}
                    {card.gf&&<span>{card.gender?" · ":""}✨ {card.gf}</span>}
                  </div>}
                  {/* Plural info (collapsible) */}
                  {showPlural&&hasPluralInfo&&<div style={{marginTop:5,padding:"5px 12px",borderRadius:10,background:T.pronBg,border:`1px solid ${T.pronBd}`,fontSize:13,color,fontWeight:500,width:"100%",maxWidth:400,textAlign:"center",animation:"hintIn .3s ease-out",lineHeight:1.5}}>
                    <span style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>1⇄2 {lang==="de"?"Einzahl":"Singular"}: {card.back} → {lang==="de"?"Mehrzahl":"Plural"}: {card.plural}</span>
                  </div>}
                  {/* German memory trick */}
                  <div style={{marginTop:5,padding:"6px 12px",borderRadius:10,background:T.trickBg,border:`1px solid ${T.trickBd}`,fontSize:13,color:T.trickTx,lineHeight:1.5,textAlign:"center",width:"100%",maxWidth:400,fontWeight:500}}>🇩🇪 {card?.trick}</div>
                  {/* Example sentence */}
                  {card?.example&&<div onClick={e=>e.stopPropagation()} style={{marginTop:5,padding:"8px 12px",borderRadius:10,background:T.exBg,border:`1px solid ${T.exBd}`,width:"100%",maxWidth:400}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,fontWeight:700,color:T.exTx}}>{u.example}</span>{supported&&<button onClick={speakEx} style={{padding:"3px 8px",borderRadius:8,border:`1px solid ${T.exBd}`,background:"transparent",color:T.exTx,fontSize:11,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{u.play}</button>}</div><div style={{fontFamily:"'Noto Sans Devanagari',sans-serif",fontSize:15,fontWeight:600,color:T.text,lineHeight:1.4}}>{card.example.hi}</div><div style={{fontSize:12,color:T.exTx,marginTop:1}}>{card.example.tl}</div><div style={{fontSize:12,color:T.muted,marginTop:1}}>{exLang}</div></div>}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:10}}><button onClick={()=>nav(-1)} style={{width:52,height:52,borderRadius:"50%",border:`2px solid ${T.btnBd}`,background:T.btnBg,color:T.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,fontFamily:"inherit",boxShadow:T.catCardShadow}}>‹</button><button onClick={markLearn} style={{padding:"12px 18px",borderRadius:16,border:`2px solid #C8A04040`,background:"#C8A04010",color:"#C8A040",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700}}>{u.still}</button><button onClick={markKnow} style={{padding:"12px 18px",borderRadius:16,border:`2px solid #40A05040`,background:"#40A05010",color:"#40A050",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700}}>{u.gotIt}</button><button onClick={()=>nav(1)} style={{width:52,height:52,borderRadius:"50%",border:`2px solid ${T.btnBd}`,background:T.btnBg,color:T.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,fontFamily:"inherit",boxShadow:T.catCardShadow}}>›</button></div>
          </>}
          {inCardView&&cards.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🎉</div><div style={{fontSize:18,fontWeight:600}}>{u.allDone}</div><button onClick={exitPractice} style={{marginTop:16,padding:"12px 24px",borderRadius:16,border:`1.5px solid ${T.accent}40`,background:`${T.accent}10`,color:T.accent,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{u.back}</button></div>}
        </>}

        {tab==="progress"&&<div>
          <h2 style={{fontSize:24,fontWeight:800,color:T.text,margin:"0 0 14px"}}>📊 {u.progress}</h2>
          <div style={{display:"flex",alignItems:"center",gap:18,padding:"18px 16px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:14,boxShadow:T.catCardShadow}}><div style={{position:"relative",width:80,height:80,flexShrink:0}}><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke={T.dotBg} strokeWidth="7"/><circle cx="40" cy="40" r="34" fill="none" stroke={T.accent} strokeWidth="7" strokeDasharray={`${pct*2.14} ${214-pct*2.14}`} strokeDashoffset="54" strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:T.accent}}>{pct}%</div></div><div><div style={{fontSize:13,fontWeight:600,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{u.mastery}</div><div style={{fontSize:18,fontWeight:700,color:T.text}}>✨ {knownSet.size}/{ALL_CARDS.length}</div><div style={{fontSize:13,color:T.sub,marginTop:3}}>⏱️ {Math.floor((stats.totalMinutes||0)/60)}h {Math.round((stats.totalMinutes||0)%60)}m</div></div></div>
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12,boxShadow:T.catCardShadow}}><div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📅 {u.week}</div><div style={{display:"flex",gap:5,alignItems:"flex-end",height:80}}>{Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const k=d.toISOString().slice(0,10);const c=(stats.dailyLog||{})[k]||0;const isT=k===today;const max=Math.max(...Object.values(stats.dailyLog||{1:1}),dailyTarget,1);return(<div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{fontSize:10,fontWeight:700,color:isT?T.accent:T.muted}}>{c}</div><div style={{width:"100%",borderRadius:5,background:isT?T.accent:T.barFill,opacity:isT?1:.3,height:`${Math.max((c/max)*55,3)}px`}}/><div style={{fontSize:9,color:isT?T.accent:T.muted,fontWeight:isT?700:500}}>{d.toLocaleDateString(lang==="de"?"de":"en",{weekday:"short"})}</div></div>);})}</div></div>
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:12,boxShadow:T.catCardShadow}}><div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>🏆 {u.levels}</div>{[1,2,3,4,5].map(lv=>{const ct=ALL_CARDS.filter(c=>{const l=getLevel(cardLevels,c.id).level;return lv===1?(l===1||!cardLevels[c.id]):l===lv;}).length;return(<div key={lv} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><div style={{width:70,fontSize:12,fontWeight:700,color:LVL_C[lv-1]}}>{lvlNames[lv-1]}</div><div style={{flex:1,height:6,borderRadius:3,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${(ct/ALL_CARDS.length)*100}%`,background:LVL_C[lv-1]}}/></div><div style={{width:24,fontSize:12,fontWeight:600,color:T.muted,textAlign:"right"}}>{ct}</div></div>);})}</div>
          <div style={{padding:"14px",borderRadius:20,background:T.pillBg,border:`1px solid ${T.pillBd}`,boxShadow:T.catCardShadow}}><div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:10}}>📂 {u.cats}</div>{Object.entries(CC).map(([cat,col])=>{const cc=ALL_CARDS.filter(c=>c.cat===cat);const m=cc.filter(c=>getLevel(cardLevels,c.id).level>=5).length;const cp=cc.length?Math.round((m/cc.length)*100):0;return(<div key={cat} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:col}}>{catName(cat)}</span><span style={{fontSize:11,color:T.muted}}>{m}/{cc.length}</span></div><div style={{height:5,borderRadius:3,background:T.dotBg,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,width:`${cp}%`,background:col}}/></div></div>);})}</div>
        </div>}

        {tab==="settings"&&<div>
          <h2 style={{fontSize:24,fontWeight:800,color:T.text,margin:"0 0 16px"}}>⚙️ {u.settings}</h2>
          <p style={{fontSize:14,color:T.sub,margin:"0 0 16px"}}>{displayName} · {user.email}</p>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8,boxShadow:T.catCardShadow}}><span style={{fontSize:15,fontWeight:700,color:T.text}}>🌐 {u.lang}</span><div style={{display:"flex",gap:5}}>{[{k:"en",l:"English"},{k:"de",l:"Deutsch"}].map(o=>(<button key={o.k} onClick={()=>setLang(o.k)} style={{padding:"7px 12px",borderRadius:12,border:`1.5px solid ${lang===o.k?T.accent+"44":T.pillBd}`,background:lang===o.k?`${T.accent}14`:T.btnBg,color:lang===o.k?T.accent:T.text,fontSize:13,fontFamily:"inherit",fontWeight:lang===o.k?700:500,cursor:"pointer"}}>{o.l}</button>))}</div></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8,boxShadow:T.catCardShadow}}><span style={{fontSize:15,fontWeight:700,color:T.text}}>🌓 {u.theme}</span><button onClick={()=>setDark(d=>!d)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${T.pillBd}`,background:T.btnBg,color:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{dark?"☀️ Light":"🌙 Dark"}</button></div>
          {supported&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8,boxShadow:T.catCardShadow}}><span style={{fontSize:15,fontWeight:700,color:T.text}}>🔊 {u.autoPlay}</span><button onClick={()=>setAutoSpeak(a=>!a)} style={{padding:"7px 14px",borderRadius:12,border:`1.5px solid ${autoSpeak?T.accent+"44":T.pillBd}`,background:autoSpeak?`${T.accent}14`:T.btnBg,color:autoSpeak?T.accent:T.text,fontSize:13,fontFamily:"inherit",fontWeight:600,cursor:"pointer"}}>{autoSpeak?"ON":"OFF"}</button></div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",borderRadius:16,background:T.pillBg,border:`1px solid ${T.pillBd}`,marginBottom:8,boxShadow:T.catCardShadow}}><div><div style={{fontSize:15,fontWeight:700,color:T.text}}>🎯 {u.target}</div><div style={{fontSize:12,color:T.muted}}>{dailyTarget}{u.perDay}</div></div><div style={{display:"flex",gap:5}}>{[15,25,40,60].map(n=>(<button key={n} onClick={()=>setStats(p=>({...p,dailyTarget:n}))} style={{padding:"6px 10px",borderRadius:10,border:`1.5px solid ${dailyTarget===n?T.accent+"44":T.pillBd}`,background:dailyTarget===n?`${T.accent}14`:"transparent",color:dailyTarget===n?T.accent:T.muted,fontSize:12,fontFamily:"inherit",fontWeight:700,cursor:"pointer"}}>{n}</button>))}</div></div>
          <button onClick={()=>setShowTutorial(true)} style={{width:"100%",padding:"14px",borderRadius:16,border:`1px solid ${T.pillBd}`,background:T.pillBg,color:T.text,fontSize:14,fontFamily:"inherit",fontWeight:600,cursor:"pointer",marginBottom:8,boxShadow:T.catCardShadow}}>📖 {u.replay}</button>
          <button onClick={handleLogout} style={{width:"100%",padding:"14px",borderRadius:16,border:`1px solid ${T.pillBd}`,background:T.pillBg,color:T.text,fontSize:15,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:16,boxShadow:T.catCardShadow}}>🚪 {u.logout}</button>
          <div style={{padding:"14px",borderRadius:16,border:"1.5px solid #D0606030",background:"#D0606008"}}><DeleteBtn T={T} u={u}/></div>
        </div>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:T.tabBg,borderTop:`1px solid ${T.tabBd}`,display:"flex",justifyContent:"center",backdropFilter:"blur(16px)"}}><div style={{display:"flex",maxWidth:560,width:"100%"}}>{[{k:"practice",i:"📚",l:u.practice},{k:"progress",i:"📊",l:u.progress},{k:"settings",i:"⚙️",l:u.settings}].map(t=>(<button key={t.k} onClick={()=>{setTab(t.k);if(t.k==="practice"&&!inCardView){setActiveCategory(null);setPracticeMode(null);}stop();}} style={{flex:1,padding:"10px 0 8px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",color:tab===t.k?T.accent:T.muted}}><span style={{fontSize:22}}>{t.i}</span><span style={{fontSize:11,fontWeight:tab===t.k?700:500}}>{t.l}</span>{tab===t.k&&<div style={{width:20,height:3,borderRadius:2,background:T.accent}}/>}</button>))}</div></div>
    </div>
  );
}

function DeleteBtn({T,u}){const[cd,setCd]=useState(false);const[dp,setDp]=useState("");const[de,setDe]=useState("");const[dl,setDl]=useState(false);const hd=async()=>{if(!cd){setCd(true);return;}if(!dp){setDe(u.pw);return;}setDl(true);try{const c=EmailAuthProvider.credential(auth.currentUser.email,dp);await reauthenticateWithCredential(auth.currentUser,c);await deleteDoc(doc(db,"users",auth.currentUser.uid));await deleteUser(auth.currentUser);}catch(e){setDe("Wrong password.");setDl(false);}};return(<><div style={{fontSize:14,fontWeight:700,color:"#C03040",marginBottom:4}}>⚠️ {u.deleteAcc}</div><div style={{fontSize:11,color:T.muted,marginBottom:8}}>{u.deleteWarn}</div>{cd&&<><PasswordInput value={dp} onChange={e=>setDp(e.target.value)} placeholder={u.pw} T={T} onKeyDown={e=>e.key==="Enter"&&hd()}/>{de&&<div style={{marginTop:6,fontSize:11,color:"#C03040"}}>{de}</div>}</>}<button onClick={hd} disabled={dl} style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:cd?"#C03040":"transparent",color:cd?"#FFF":"#C03040",fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700,cursor:dl?"wait":"pointer",marginTop:8,opacity:dl?.6:1}}>{dl?"...":cd?u.confirm:u.deleteAcc}</button>{cd&&<button onClick={()=>{setCd(false);setDe("");setDp("");}} style={{width:"100%",padding:"6px",border:"none",background:"transparent",color:T.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer",marginTop:4}}>{u.cancel}</button>}</>);}
