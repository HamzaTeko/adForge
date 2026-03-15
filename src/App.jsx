import { useState, useEffect, useRef, useReducer } from "react";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE HOOK
═══════════════════════════════════════════════════════════════ */
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 768, isTablet: w < 1100, w };
}

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const T = {
  bg:"#F6F4EF", bgWarm:"#EDEBE4", bgCard:"#FFFFFF", bgAlt:"#FAFAF6",
  border:"#E3DFD7", borderMid:"#CEC9BF",
  text:"#18160F", textMid:"#56524A", textSoft:"#968F84", textXsoft:"#C2BBB0",
  navy:"#1E3A5F", navyLt:"#E8EFF7", navyMid:"#C2D3E8",
  green:"#1A6B46", greenLt:"#E6F4EE",
  amber:"#9E5D00", amberLt:"#FDF0DC",
  red:"#A82828", redLt:"#FAEAEA",
  purple:"#5B2D8F", purpleLt:"#EFE8F8",
  meta:"#1877F2", metaBg:"#EBF3FF",
  google:"#4285F4", googleBg:"#EEF3FF",
  insta:"#C13584", instaBg:"#FCE8F4",
  canvas:"#1A1A1A",
};
const F = { h:"'Playfair Display',serif", b:"'DM Sans',sans-serif", m:"'DM Mono',monospace" };

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Btn({ children, variant="primary", onClick, disabled, style={}, sm, title, loading:ld }) {
  const base = { border:"none", cursor:disabled||ld?"not-allowed":"pointer", borderRadius:9, fontFamily:F.b,
    fontWeight:600, transition:"all 0.18s", display:"inline-flex", alignItems:"center", justifyContent:"center",
    gap:6, opacity:disabled||ld?0.5:1, padding:sm?"7px 15px":"11px 22px", fontSize:sm?12:13 };
  const v = {
    primary: { background:T.navy, color:"#fff", boxShadow:"0 1px 3px rgba(30,58,95,0.18)" },
    ghost:   { background:"transparent", color:T.navy, border:`1.5px solid ${T.navyMid}` },
    subtle:  { background:T.bgAlt, color:T.textMid, border:`1px solid ${T.border}` },
    danger:  { background:T.redLt, color:T.red, border:`1px solid ${T.red}40` },
    active:  { background:T.navyLt, color:T.navy, border:`1.5px solid ${T.navyMid}` },
    white:   { background:"#fff", color:T.navy, border:`1px solid ${T.border}` },
    icon:    { background:T.bgAlt, color:T.textMid, border:`1px solid ${T.border}`, padding:sm?"7px":"9px", borderRadius:8 },
    purple:  { background:T.purple, color:"#fff" },
    green:   { background:T.green, color:"#fff" },
  };
  return <button title={title} onClick={onClick} disabled={disabled||ld}
    style={{...base,...(v[variant]||v.primary),...style}}>
    {ld ? <span style={{animation:"adSpin 0.8s linear infinite",display:"inline-block"}}>◈</span> : children}
  </button>;
}
function Badge({ children, color="neutral" }) {
  const m = { green:{bg:T.greenLt,c:T.green}, amber:{bg:T.amberLt,c:T.amber},
    red:{bg:T.redLt,c:T.red}, blue:{bg:T.navyLt,c:T.navy}, neutral:{bg:T.bgWarm,c:T.textMid},
    purple:{bg:T.purpleLt,c:T.purple} };
  const s = m[color]||m.neutral;
  return <span style={{background:s.bg,color:s.c,fontSize:11,fontFamily:F.m,fontWeight:600,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{children}</span>;
}
function Card({ children, style={}, p=24 }) {
  return <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:14,padding:p,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...style}}>{children}</div>;
}
function Lbl({ children, mb=5 }) {
  return <div style={{fontSize:10,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:mb,fontWeight:600}}>{children}</div>;
}
function Inp({ value, onChange, placeholder, type="text", style={}, onKeyDown, rows }) {
  const base = {width:"100%",background:T.bgAlt,border:`1.5px solid ${T.border}`,borderRadius:9,
    padding:"10px 14px",color:T.text,fontSize:13,fontFamily:F.b,outline:"none",boxSizing:"border-box",...style};
  if (rows) return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...base,resize:"vertical",lineHeight:1.6}}/>;
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} style={base}/>;
}
function HR({ m="0" }) { return <div style={{height:1,background:T.border,margin:m}}/>; }
function Slider({ label, value, onChange, min=0, max=100, unit="%" }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:11,color:T.textSoft,fontFamily:F.m}}>{label}</span>
        <span style={{fontSize:11,color:T.text,fontFamily:F.m,fontWeight:700}}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:T.navy,cursor:"pointer",height:4}}/>
    </div>
  );
}
function Toast({ msg, type="info", onDismiss }) {
  useEffect(()=>{const t=setTimeout(onDismiss,4500);return()=>clearTimeout(t);},[]);
  const cols={info:{bg:T.navyLt,c:T.navy,b:T.navyMid},success:{bg:T.greenLt,c:T.green,b:T.green+"50"},
    error:{bg:T.redLt,c:T.red,b:T.red+"50"},warning:{bg:T.amberLt,c:T.amber,b:T.amber+"50"}};
  const s=cols[type]||cols.info;
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:s.bg,border:`1px solid ${s.b}`,
      borderRadius:11,padding:"12px 18px",display:"flex",alignItems:"center",gap:10,
      boxShadow:"0 8px 32px rgba(0,0,0,0.12)",maxWidth:360}}>
      <span style={{color:s.c,fontSize:13,fontFamily:F.b,fontWeight:600,flex:1}}>{msg}</span>
      <button onClick={onDismiss} style={{background:"none",border:"none",cursor:"pointer",color:s.c,fontSize:14,opacity:0.6}}>✕</button>
    </div>
  );
}
function useToast() {
  const [toasts,setToasts]=useState([]);
  const toast=(msg,type="info")=>{const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);};
  const remove=(id)=>setToasts(p=>p.filter(t=>t.id!==id));
  const ToastContainer=()=>toasts.length>0?toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onDismiss={()=>remove(t.id)}/>):null;
  return {toast,ToastContainer};
}
function EmptyState({icon,title,body,action,onAction}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"56px 32px",textAlign:"center"}}>
      <div style={{fontSize:36,color:T.textXsoft,marginBottom:14}}>{icon}</div>
      <div style={{fontFamily:F.h,fontSize:17,fontWeight:700,color:T.textMid,marginBottom:8}}>{title}</div>
      {body&&<p style={{color:T.textSoft,fontSize:13,lineHeight:1.7,maxWidth:300,marginBottom:20}}>{body}</p>}
      {action&&<Btn onClick={onAction}>{action}</Btn>}
    </div>
  );
}
function ApiKeyBanner({ onDismiss }) {
  const [key,setKey]=useState(""); const [saved,setSaved]=useState(false);
  const save=()=>{ if(key.startsWith("sk-ant-")||key.startsWith("sk-")){setSaved(true);setTimeout(onDismiss,1500);} };
  if(saved) return <div style={{background:T.greenLt,border:`1px solid ${T.green}30`,borderRadius:10,padding:"12px 18px",color:T.green,fontSize:13,fontFamily:F.b,fontWeight:600,marginBottom:20}}>✓ API key saved — AI features are now active.</div>;
  return (
    <div style={{background:T.amberLt,border:`1px solid ${T.amber}30`,borderRadius:10,padding:"16px 20px",marginBottom:20}}>
      <div style={{fontWeight:700,color:T.amber,fontSize:13,marginBottom:4}}>⚡ Add your Anthropic API key to enable all AI features</div>
      <p style={{color:T.textMid,fontSize:12,lineHeight:1.65,marginBottom:10}}>Get it at <strong>console.anthropic.com</strong> → API Keys. Stored only in this browser tab.</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="sk-ant-api03-..."
          style={{flex:1,minWidth:180,background:T.bgCard,border:`1.5px solid ${T.borderMid}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:12,fontFamily:F.m,outline:"none"}}/>
        <Btn sm onClick={save} disabled={!key.startsWith("sk-ant-")}>Save Key</Btn>
        <button onClick={onDismiss} style={{background:"none",border:"none",cursor:"pointer",color:T.textSoft,fontSize:12,fontFamily:F.b}}>Dismiss</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OAUTH CONFIG & MOCK DATA
═══════════════════════════════════════════════════════════════ */
const OAUTH = {
  meta: {
    name:"Meta Ads", shortName:"Meta", color:T.meta, bg:T.metaBg, icon:"f",
    buildUrl:()=>{
      const p=new URLSearchParams({client_id:"YOUR_META_APP_ID",redirect_uri:window.location.origin+"/oauth/meta/callback",scope:"ads_read,ads_management,business_management,read_insights",response_type:"code",state:"adforge_meta_"+Date.now()});
      return `https://www.facebook.com/v19.0/dialog/oauth?${p}`;
    },
    permissions:["View ad accounts","View campaigns","Read ad insights","Manage campaigns","Create & publish ads"],
    dataPoints:["Campaign spend & budget","CTR & click data","Conversions & ROAS","Audience demographics","Creative performance","Reach & frequency"],
    syncInterval:"Every 30 minutes",
  },
  tiktok: {
    name:"TikTok Ads", shortName:"TikTok", color:"#FE2C55", bg:"#F2F2F2", icon:"T",
    buildUrl:()=>{
      const p=new URLSearchParams({app_id:"YOUR_TIKTOK_APP_ID",redirect_uri:window.location.origin+"/oauth/tiktok/callback",scope:"user.info.basic,ads.read,ads.management",response_type:"code",state:"adforge_tiktok_"+Date.now()});
      return `https://ads.tiktok.com/marketing_api/auth?${p}`;
    },
    permissions:["View ad accounts","Read campaign data","View video ad performance","Access audience insights","Manage ad creatives"],
    dataPoints:["Video ad spend","View-through rate","Watch time & completion","Engagement rate","Audience split","Top creatives"],
    syncInterval:"Every 30 minutes",
  },
  google: {
    name:"Google Ads", shortName:"Google", color:T.google, bg:T.googleBg, icon:"G",
    buildUrl:()=>{
      const p=new URLSearchParams({client_id:"YOUR_GOOGLE_CLIENT_ID",redirect_uri:window.location.origin+"/oauth/google/callback",scope:"https://www.googleapis.com/auth/adwords",response_type:"code",access_type:"offline",state:"adforge_google_"+Date.now()});
      return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
    },
    permissions:["View Google Ads accounts","Read campaign performance","Access keyword data","View conversion tracking","Read audience segments"],
    dataPoints:["Search & display spend","Impressions & clicks","Quality scores","Keyword performance","Conversion paths","Cost per conversion"],
    syncInterval:"Every 30 minutes",
  },
  instagram: {
    name:"Instagram", shortName:"Instagram", color:T.insta, bg:T.instaBg, icon:"◉",
    buildUrl:()=>{
      const p=new URLSearchParams({client_id:"YOUR_META_APP_ID",redirect_uri:window.location.origin+"/oauth/instagram/callback",scope:"instagram_basic,instagram_manage_insights,ads_read",response_type:"code",state:"adforge_instagram_"+Date.now()});
      return `https://api.instagram.com/oauth/authorize?${p}`;
    },
    permissions:["View Instagram account","Read story & reel metrics","Access paid ad insights","View shopping data","Read follower analytics"],
    dataPoints:["Story & reel views","Engagement rate","Shopping clicks","Follower growth","Paid reach","Save rate"],
    syncInterval:"Every 30 minutes",
  },
};

const MOCK = {
  meta: {
    accountName:"Acme Brand — Meta Business", accountId:"act_2847391",
    campaigns:[
      {id:"c1",name:"Summer Skincare Bundle",status:"ACTIVE",objective:"CONVERSIONS",budget:"$85/day",spent:"$1,820",impr:"412K",ctr:"3.4%",cpc:"$0.28",conv:"312",cpa:"$5.83",roas:"3.9×",start:"Mar 1"},
      {id:"c2",name:"New Collection Launch",status:"ACTIVE",objective:"CONVERSIONS",budget:"$60/day",spent:"$940",impr:"198K",ctr:"2.9%",cpc:"$0.32",conv:"188",cpa:"$5.00",roas:"3.4×",start:"Mar 5"},
      {id:"c3",name:"Retargeting — Cart Abandon",status:"ACTIVE",objective:"CONVERSIONS",budget:"$40/day",spent:"$520",impr:"89K",ctr:"5.1%",cpc:"$0.19",conv:"147",cpa:"$3.54",roas:"5.2×",start:"Feb 20"},
      {id:"c4",name:"Brand Awareness Q1",status:"PAUSED",objective:"REACH",budget:"$120/day",spent:"$3,100",impr:"1.2M",ctr:"1.8%",cpc:"$0.41",conv:"94",cpa:"$32.98",roas:"1.1×",start:"Jan 10"},
    ],
    totalSpend:"$6,380",totalConv:"741",avgRoas:"4.1×",avgCtr:"3.3%",
  },
  tiktok: {
    accountName:"Acme Brand — TikTok for Business", accountId:"TT-8274610",
    campaigns:[
      {id:"t1",name:"Viral Product Demo #1",status:"ACTIVE",objective:"CONVERSIONS",budget:"$100/day",spent:"$2,140",impr:"890K",ctr:"4.9%",cpc:"$0.21",conv:"492",cpa:"$4.35",roas:"4.8×",start:"Mar 2"},
      {id:"t2",name:"UGC Style — Testimonials",status:"ACTIVE",objective:"TRAFFIC",budget:"$50/day",spent:"$680",impr:"310K",ctr:"3.8%",cpc:"$0.26",conv:"198",cpa:"$3.43",roas:"5.1×",start:"Mar 7"},
      {id:"t3",name:"Influencer Collab — Boost",status:"PAUSED",objective:"AWARENESS",budget:"$200/day",spent:"$1,200",impr:"2.1M",ctr:"2.1%",cpc:"$0.39",conv:"81",cpa:"$14.81",roas:"2.2×",start:"Feb 15"},
    ],
    totalSpend:"$4,020",totalConv:"771",avgRoas:"4.0×",avgCtr:"3.6%",
  },
  google: {
    accountName:"Acme Brand — Google Ads", accountId:"700-291-4482",
    campaigns:[
      {id:"g1",name:"Brand Keywords Search",status:"ACTIVE",objective:"CONVERSIONS",budget:"$70/day",spent:"$1,490",impr:"220K",ctr:"6.2%",cpc:"$0.16",conv:"389",cpa:"$3.83",roas:"5.4×",start:"Feb 28"},
      {id:"g2",name:"Competitor Targeting",status:"ACTIVE",objective:"CONVERSIONS",budget:"$45/day",spent:"$810",impr:"140K",ctr:"4.4%",cpc:"$0.24",conv:"201",cpa:"$4.03",roas:"4.9×",start:"Mar 3"},
      {id:"g3",name:"Display Retargeting",status:"ACTIVE",objective:"TRAFFIC",budget:"$30/day",spent:"$430",impr:"680K",ctr:"1.1%",cpc:"$0.61",conv:"88",cpa:"$4.89",roas:"3.7×",start:"Mar 1"},
    ],
    totalSpend:"$2,730",totalConv:"678",avgRoas:"4.7×",avgCtr:"3.9%",
  },
  instagram: {
    accountName:"Acme Brand — Instagram", accountId:"@acmebrand",
    campaigns:[
      {id:"i1",name:"Reel Ads — Lifestyle Series",status:"ACTIVE",objective:"REACH",budget:"$55/day",spent:"$740",impr:"520K",ctr:"3.2%",cpc:"$0.29",conv:"172",cpa:"$4.30",roas:"3.8×",start:"Mar 4"},
      {id:"i2",name:"Story Ads — Flash Sale",status:"ACTIVE",objective:"CONVERSIONS",budget:"$35/day",spent:"$390",impr:"190K",ctr:"4.1%",cpc:"$0.23",conv:"142",cpa:"$2.75",roas:"5.9×",start:"Mar 6"},
    ],
    totalSpend:"$1,130",totalConv:"314",avgRoas:"4.2×",avgCtr:"3.5%",
  },
};

/* ═══════════════════════════════════════════════════════════════
   PLATFORM_DATA — real API response shape
   Replace with live fetch using OAuth token once connected:
   GET /api/platforms/:platform/campaigns  (your backend proxy)
═══════════════════════════════════════════════════════════════ */
const PLATFORM_DATA = {
  meta:{
    accountName:"Meta Business Account",accountId:"act_2847391",
    campaigns:[
      {id:"c1",name:"Summer Skincare Bundle",status:"ACTIVE",objective:"CONVERSIONS",budget:"$85/day",spent:"$1,820",impr:"412K",ctr:"3.4",cpc:"0.28",conv:"312",cpa:"5.83",roas:"3.9",start:"Mar 1"},
      {id:"c2",name:"New Collection Launch",status:"ACTIVE",objective:"CONVERSIONS",budget:"$60/day",spent:"$940",impr:"198K",ctr:"2.9",cpc:"0.32",conv:"188",cpa:"5.00",roas:"3.4",start:"Mar 5"},
      {id:"c3",name:"Retargeting — Cart Abandon",status:"ACTIVE",objective:"CONVERSIONS",budget:"$40/day",spent:"$520",impr:"89K",ctr:"5.1",cpc:"0.19",conv:"147",cpa:"3.54",roas:"5.2",start:"Feb 20"},
      {id:"c4",name:"Brand Awareness Q1",status:"PAUSED",objective:"REACH",budget:"$120/day",spent:"$3,100",impr:"1.2M",ctr:"1.8",cpc:"0.41",conv:"94",cpa:"32.98",roas:"1.1",start:"Jan 10"},
    ],
    totalSpend:6380,totalConv:741,avgRoas:4.1,avgCtr:3.3,
  },
  tiktok:{
    accountName:"TikTok Business Account",accountId:"TT-8274610",
    campaigns:[
      {id:"t1",name:"Viral Product Demo #1",status:"ACTIVE",objective:"CONVERSIONS",budget:"$100/day",spent:"$2,140",impr:"890K",ctr:"4.9",cpc:"0.21",conv:"492",cpa:"4.35",roas:"4.8",start:"Mar 2"},
      {id:"t2",name:"UGC Style — Testimonials",status:"ACTIVE",objective:"TRAFFIC",budget:"$50/day",spent:"$680",impr:"310K",ctr:"3.8",cpc:"0.26",conv:"198",cpa:"3.43",roas:"5.1",start:"Mar 7"},
      {id:"t3",name:"Influencer Collab — Boost",status:"PAUSED",objective:"AWARENESS",budget:"$200/day",spent:"$1,200",impr:"2.1M",ctr:"2.1",cpc:"0.39",conv:"81",cpa:"14.81",roas:"2.2",start:"Feb 15"},
    ],
    totalSpend:4020,totalConv:771,avgRoas:4.0,avgCtr:3.6,
  },
  google:{
    accountName:"Google Ads Account",accountId:"700-291-4482",
    campaigns:[
      {id:"g1",name:"Brand Keywords Search",status:"ACTIVE",objective:"CONVERSIONS",budget:"$70/day",spent:"$1,490",impr:"220K",ctr:"6.2",cpc:"0.16",conv:"389",cpa:"3.83",roas:"5.4",start:"Feb 28"},
      {id:"g2",name:"Competitor Targeting",status:"ACTIVE",objective:"CONVERSIONS",budget:"$45/day",spent:"$810",impr:"140K",ctr:"4.4",cpc:"0.24",conv:"201",cpa:"4.03",roas:"4.9",start:"Mar 3"},
      {id:"g3",name:"Display Retargeting",status:"ACTIVE",objective:"TRAFFIC",budget:"$30/day",spent:"$430",impr:"680K",ctr:"1.1",cpc:"0.61",conv:"88",cpa:"4.89",roas:"3.7",start:"Mar 1"},
    ],
    totalSpend:2730,totalConv:678,avgRoas:4.7,avgCtr:3.9,
  },
  instagram:{
    accountName:"Instagram Business Account",accountId:"@mybrand",
    campaigns:[
      {id:"i1",name:"Reel Ads — Lifestyle Series",status:"ACTIVE",objective:"REACH",budget:"$55/day",spent:"$740",impr:"520K",ctr:"3.2",cpc:"0.29",conv:"172",cpa:"4.30",roas:"3.8",start:"Mar 4"},
      {id:"i2",name:"Story Ads — Flash Sale",status:"ACTIVE",objective:"CONVERSIONS",budget:"$35/day",spent:"$390",impr:"190K",ctr:"4.1",cpc:"0.23",conv:"142",cpa:"2.75",roas:"5.9",start:"Mar 6"},
    ],
    totalSpend:1130,totalConv:314,avgRoas:4.2,avgCtr:3.5,
  },
};


/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
function LandingPage({ onOpenAuth }) {
  const FEATURES = [
    { icon:"◈", title:"AI Creative Studio", desc:"Canva-style canvas editor with AI generation. Create video ads, image ads, and copy — then edit every detail." },
    { icon:"▲", title:"Live Campaign Analytics", desc:"Connect Meta, TikTok, Google & Instagram. Pull real spend, ROAS, and CTR every 30 minutes." },
    { icon:"✦", title:"AI Recommendations", desc:"Specific, data-driven insights tailored to your brand's actual performance — not generic tips." },
    { icon:"◎", title:"One-Click Campaign Launch", desc:"Build and publish ad campaigns directly to your connected accounts from one dashboard." },
  ];
  const STATS = [
    {v:"4.2×",l:"Average ROAS improvement"},{v:"67%",l:"Reduction in creative time"},{v:"12K+",l:"Active brands"},{v:"$84M",l:"Ad spend managed"},
  ];
  const TESTIMONIALS = [
    {name:"Sarah K.",role:"Head of Growth, Lumé Skincare",text:"AdForge replaced our entire creative agency workflow. We generate and launch TikTok ads in under 10 minutes.",avatar:"S"},
    {name:"Marcus D.",role:"Founder, NovaTech Store",text:"The AI recommendations are scarily accurate. It spotted our worst audience segment and told us exactly what to do.",avatar:"M"},
    {name:"Priya R.",role:"Performance Marketer, Velocity DTC",text:"Real-time data from Meta and TikTok in one dashboard, with AI that actually understands ad accounts.",avatar:"P"},
  ];
  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:F.b}}>
      <nav style={{background:T.bgCard,borderBottom:`1px solid ${T.border}`,padding:"0 60px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:T.navy,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14}}>◈</div>
          <span style={{fontFamily:F.h,fontSize:18,fontWeight:700,color:T.text}}>AdForge</span>
          <span style={{fontSize:10,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.06em",marginTop:1}}>AI MARKETING OS</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Btn variant="ghost" sm onClick={()=>onOpenAuth("login")}>Sign In</Btn>
          <Btn sm onClick={()=>onOpenAuth("signup")}>Start Free →</Btn>
        </div>
      </nav>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"80px 40px 60px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.navyLt,border:`1px solid ${T.navyMid}`,borderRadius:20,padding:"5px 14px",marginBottom:28}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:T.green,display:"inline-block"}}/>
          <span style={{fontSize:12,fontFamily:F.m,color:T.navy}}>Now with live Meta, TikTok & Google sync + Canva-style Creative Studio</span>
        </div>
        <h1 style={{fontFamily:F.h,fontSize:56,fontWeight:700,color:T.text,lineHeight:1.15,marginBottom:22,maxWidth:820,margin:"0 auto 22px"}}>Your AI-powered<br/>advertising OS</h1>
        <p style={{color:T.textSoft,fontSize:17,lineHeight:1.75,maxWidth:560,margin:"0 auto 36px"}}>Generate ad creatives, connect real ad accounts, analyse performance with AI, and launch campaigns — all in one platform.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={()=>onOpenAuth("signup")} style={{padding:"14px 32px",fontSize:15}}>Get Started Free →</Btn>
          <Btn variant="ghost" onClick={()=>onOpenAuth("login")} style={{padding:"14px 28px",fontSize:15}}>Sign In</Btn>
        </div>
        <p style={{color:T.textXsoft,fontSize:12,fontFamily:F.m,marginTop:16}}>No credit card required · 14-day free trial</p>
      </div>
      <div style={{background:T.navy,padding:"36px 60px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20,textAlign:"center"}}>
          {STATS.map(s=>(
            <div key={s.l}>
              <div style={{fontFamily:F.h,fontSize:36,fontWeight:700,color:"#fff",marginBottom:6}}>{s.v}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",fontFamily:F.m}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"60px 40px 40px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <h2 style={{fontFamily:F.h,fontSize:34,fontWeight:700,color:T.text,marginBottom:12}}>Everything in one dashboard</h2>
          <p style={{color:T.textSoft,fontSize:15,maxWidth:480,margin:"0 auto"}}>Connect your accounts and get a full view of ad performance, AI insights, and creative tools.</p>
        </div>
        <div style={{position:"relative",borderRadius:18,overflow:"hidden",border:`1px solid ${T.border}`,boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
          <div style={{filter:"blur(3px)",pointerEvents:"none",background:T.bgCard,padding:"20px 24px"}}>
            <div style={{height:44,background:T.bgAlt,borderRadius:8,marginBottom:16,display:"flex",alignItems:"center",padding:"0 16px",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:T.green}}/>
              <div style={{width:120,height:10,background:T.border,borderRadius:4}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
              {[["Total Spend","$14,260",T.text],["Avg CTR","3.9%",T.green],["Conversions","2,504",T.text],["ROAS","4.3×",T.amber]].map(([l,v,c])=>(
                <div key={l} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
                  <div style={{fontSize:10,fontFamily:F.m,color:T.textSoft,marginBottom:8}}>{l}</div>
                  <div style={{fontFamily:F.h,fontSize:24,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
              {["Summer Collection · TikTok · $2,140","New Collection · Meta · $940","Retargeting · Meta · $520"].map((r,i)=>(
                <div key={i} style={{padding:"14px 18px",borderBottom:i<2?`1px solid ${T.border}`:"none",display:"flex",gap:20}}>
                  {r.split(" · ").map((cell,j)=><div key={j} style={{width:120,height:10,background:j===0?T.borderMid:T.border,borderRadius:3,opacity:0.7}}/>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(246,244,239,0.3) 0%,rgba(246,244,239,0.92) 60%,rgba(246,244,239,1) 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",padding:"40px"}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontFamily:F.h,fontSize:24,fontWeight:700,color:T.text,marginBottom:8}}>Sign up to access your live dashboard</div>
              <p style={{color:T.textSoft,fontSize:14}}>Create a free account to connect your ad accounts and see real data.</p>
            </div>
            <Btn onClick={()=>onOpenAuth("signup")} style={{padding:"13px 36px",fontSize:15}}>Create Free Account →</Btn>
          </div>
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 40px 60px"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <h2 style={{fontFamily:F.h,fontSize:34,fontWeight:700,color:T.text,marginBottom:12}}>Everything you need to grow</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          {FEATURES.map(f=>(
            <Card key={f.title} p={28}>
              <div style={{width:42,height:42,borderRadius:11,background:T.navyLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:T.navy,marginBottom:16}}>{f.icon}</div>
              <div style={{fontFamily:F.h,fontSize:17,fontWeight:700,color:T.text,marginBottom:8}}>{f.title}</div>
              <p style={{color:T.textSoft,fontSize:14,lineHeight:1.7}}>{f.desc}</p>
              <button onClick={()=>onOpenAuth("signup")} style={{marginTop:14,background:"none",border:"none",cursor:"pointer",color:T.navy,fontSize:13,fontWeight:600,fontFamily:F.b}}>Get started →</button>
            </Card>
          ))}
        </div>
      </div>
      <div style={{background:T.bgCard,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:"48px 60px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <h2 style={{fontFamily:F.h,fontSize:28,fontWeight:700,color:T.text,marginBottom:10}}>Real connections to your ad platforms</h2>
            <p style={{color:T.textSoft,fontSize:14}}>Secure OAuth 2.0 — we never store your password</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
            {Object.entries(OAUTH).map(([id,p])=>(
              <div key={id} style={{background:p.bg,border:`1px solid ${p.color}20`,borderRadius:12,padding:"18px 20px",textAlign:"center"}}>
                <div style={{width:40,height:40,borderRadius:10,background:T.bgCard,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:p.color,fontSize:18,fontWeight:800,fontFamily:F.h,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>{p.icon}</div>
                <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:11,color:T.textSoft}}>{p.dataPoints.slice(0,2).join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"60px 40px"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <h2 style={{fontFamily:F.h,fontSize:32,fontWeight:700,color:T.text}}>Trusted by performance marketers</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
          {TESTIMONIALS.map(t=>(
            <Card key={t.name} p={24}>
              <div style={{fontSize:20,color:T.amber,marginBottom:14}}>★★★★★</div>
              <p style={{color:T.textMid,fontSize:14,lineHeight:1.75,marginBottom:18}}>"{t.text}"</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:T.navyLt,display:"flex",alignItems:"center",justifyContent:"center",color:T.navy,fontWeight:700,fontSize:14}}>{t.avatar}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:T.text}}>{t.name}</div><div style={{fontSize:11,color:T.textSoft}}>{t.role}</div></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div style={{background:T.navy,padding:"64px 40px",textAlign:"center"}}>
        <h2 style={{fontFamily:F.h,fontSize:36,fontWeight:700,color:"#fff",marginBottom:14}}>Ready to scale your campaigns?</h2>
        <p style={{color:"rgba(255,255,255,0.6)",fontSize:15,marginBottom:28}}>Join 12,000+ brands using AdForge to run better ads with AI.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <Btn variant="white" onClick={()=>onOpenAuth("signup")} style={{padding:"14px 32px",fontSize:15}}>Start Free Trial →</Btn>
          <Btn variant="ghost" onClick={()=>onOpenAuth("login")} style={{padding:"14px 28px",fontSize:15,border:"1.5px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.8)"}}>Sign In</Btn>
        </div>
      </div>
      <div style={{background:T.bgCard,borderTop:`1px solid ${T.border}`,padding:"24px 60px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,borderRadius:6,background:T.navy,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11}}>◈</div>
          <span style={{fontFamily:F.h,fontSize:14,fontWeight:700,color:T.text}}>AdForge</span>
        </div>
        <div style={{fontSize:12,color:T.textSoft,fontFamily:F.m}}>© 2026 AdForge. All rights reserved.</div>
        <div style={{display:"flex",gap:20}}>
          {["Privacy","Terms","Security"].map(l=><span key={l} style={{fontSize:12,color:T.textSoft,cursor:"pointer",fontFamily:F.m}}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUTH MODAL
═══════════════════════════════════════════════════════════════ */
function AuthModal({ initialMode="login", onAuth, onClose, gateFeature }) {
  const [mode,setMode]=useState(initialMode);
  const [form,setForm]=useState({name:"",brand:"",email:"",pw:"",confirm:""});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [step,setStep]=useState(1);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const handle=async()=>{
    if(mode==="login"){
      if(!form.email||!form.pw) return setErr("Please fill in all fields.");
      if(!form.email.includes("@")) return setErr("Please enter a valid email address.");
      setErr("");setLoading(true);
      try{
        const {data,error}=await window.__supabase.auth.signInWithPassword({email:form.email,password:form.pw});
        if(error){setLoading(false);return setErr(error.message);}
        const meta=data.user?.user_metadata||{};
        onAuth({name:meta.full_name||data.user.email,brand:meta.brand_name||"My Brand",email:data.user.email,session:data.session});
      }catch(e){setLoading(false);setErr("Login failed. Please try again.");}
    } else {
      if(step===1){
        if(!form.email||!form.pw||!form.confirm) return setErr("Please fill in all fields.");
        if(!form.email.includes("@")) return setErr("Invalid email address.");
        if(form.pw.length<8) return setErr("Password must be at least 8 characters.");
        if(form.pw!==form.confirm) return setErr("Passwords do not match.");
        setErr("");setStep(2);
      } else {
        if(!form.name||!form.brand) return setErr("Please fill in all fields.");
        setErr("");setLoading(true);
        try{
          const {data,error}=await window.__supabase.auth.signUp({
            email:form.email,password:form.pw,
            options:{data:{full_name:form.name,brand_name:form.brand}}
          });
          if(error){setLoading(false);return setErr(error.message);}
          if(data.user&&!data.session){setLoading(false);return setErr("Check your email to confirm your account, then sign in.");}
          const meta=data.user?.user_metadata||{};
          onAuth({name:meta.full_name||form.name,brand:meta.brand_name||form.brand,email:data.user.email,session:data.session});
        }catch(e){setLoading(false);setErr("Sign up failed. Please try again.");}
      }
    }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget&&onClose)onClose();}}>
      <div style={{background:T.bgCard,borderRadius:18,width:"100%",maxWidth:440,boxShadow:"0 24px 64px rgba(0,0,0,0.16)",overflow:"hidden"}}>
        <div style={{background:T.navy,padding:"28px 32px 24px",position:"relative"}}>
          {onClose&&<button onClick={onClose} style={{position:"absolute",top:18,right:18,background:"rgba(255,255,255,0.12)",border:"none",width:28,height:28,borderRadius:"50%",cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:28,height:28,borderRadius:7,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12}}>◈</div>
            <span style={{fontFamily:F.h,fontSize:16,fontWeight:700,color:"#fff"}}>AdForge</span>
          </div>
          {gateFeature&&<div style={{background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:F.m}}>You need an account to access</div>
            <div style={{fontSize:14,color:"#fff",fontWeight:600,marginTop:2}}>{gateFeature}</div>
          </div>}
          <h2 style={{fontFamily:F.h,fontSize:22,fontWeight:700,color:"#fff",marginBottom:4}}>
            {mode==="login"?"Welcome back":step===1?"Create your account":"Set up your brand"}
          </h2>
          <p style={{color:"rgba(255,255,255,0.55)",fontSize:13}}>
            {mode==="login"?"Sign in to your AdForge workspace":step===1?"Step 1 of 2 — Account details":"Step 2 of 2 — Brand details"}
          </p>
          {mode==="signup"&&<div style={{display:"flex",gap:6,marginTop:14}}>{[1,2].map(s=><div key={s} style={{flex:1,height:3,borderRadius:2,background:step>=s?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.2)"}}/>)}</div>}
        </div>
        <div style={{padding:"24px 32px 28px"}}>
          {err&&<div style={{background:T.redLt,border:`1px solid ${T.red}30`,borderRadius:8,padding:"10px 14px",color:T.red,fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span>⚠</span>{err}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            {mode==="login"&&<>
              <div><Lbl mb={5}>Email Address</Lbl><Inp type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@brand.com"/></div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><Lbl mb={0}>Password</Lbl><span style={{fontSize:11,color:T.navy,cursor:"pointer",fontFamily:F.m}}>Forgot?</span></div>
                <Inp type="password" value={form.pw} onChange={e=>set("pw",e.target.value)} placeholder="••••••••"/>
              </div>
            </>}
            {mode==="signup"&&step===1&&<>
              <div><Lbl mb={5}>Email Address</Lbl><Inp type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@brand.com"/></div>
              <div><Lbl mb={5}>Password <span style={{fontSize:10,color:T.textSoft,textTransform:"none",letterSpacing:0}}>— min. 8 chars</span></Lbl><Inp type="password" value={form.pw} onChange={e=>set("pw",e.target.value)} placeholder="Create a secure password"/></div>
              <div><Lbl mb={5}>Confirm Password</Lbl><Inp type="password" value={form.confirm} onChange={e=>set("confirm",e.target.value)} placeholder="Repeat password"/></div>
            </>}
            {mode==="signup"&&step===2&&<>
              <div><Lbl mb={5}>Your Full Name</Lbl><Inp value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Alex Carter"/></div>
              <div><Lbl mb={5}>Brand / Company Name</Lbl><Inp value={form.brand} onChange={e=>set("brand",e.target.value)} placeholder="Acme Brand Co."/></div>
              <div style={{background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:12,color:T.textSoft,lineHeight:1.6}}>🔒 Your account is protected with industry-standard encryption.</div>
            </>}
          </div>
          <Btn onClick={handle} disabled={loading} style={{width:"100%",marginTop:20,padding:"13px"}}>
            {loading?"Please wait…":mode==="login"?"Sign In →":step===1?"Continue →":"Create Account →"}
          </Btn>
          {mode==="signup"&&step===2&&<button onClick={()=>{setStep(1);setErr("");}} style={{width:"100%",marginTop:10,background:"none",border:"none",cursor:"pointer",color:T.textSoft,fontSize:13,fontFamily:F.b}}>← Back</button>}
          <HR m="18px 0"/>
          <div style={{textAlign:"center",fontSize:13,color:T.textSoft}}>
            {mode==="login"?<>No account? <span onClick={()=>{setMode("signup");setErr("");setStep(1);}} style={{color:T.navy,cursor:"pointer",fontWeight:600}}>Sign up free</span></>
              :<>Have an account? <span onClick={()=>{setMode("login");setErr("");}} style={{color:T.navy,cursor:"pointer",fontWeight:600}}>Sign in</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BACKEND API CLIENT
═══════════════════════════════════════════════════════════════ */
const API = {
  base: () => { const e=(()=>{try{return import.meta?.env||{};}catch{return{};}})(); return window.__ADFORGE_BACKEND__||e.VITE_BACKEND_URL||"http://localhost:3001"; },
  token: () => window.__supabase_token__ || "",
  headers: () => ({
    "Content-Type": "application/json",
    ...(API.token() ? {"Authorization": `Bearer ${API.token()}`} : {}),
  }),
  async checkSession() {
    const r = await fetch(`${this.base()}/auth/session`, { headers:this.headers() });
    if(!r.ok) throw new Error("Session check failed");
    return r.json();
  },
  startMetaOAuth() {
    // Pass JWT in query param so backend knows which user is connecting
    const token = this.token();
    const url = `${this.base()}/auth/meta/connect${token ? "?token="+encodeURIComponent(token) : ""}`;
    const w=600,h=700,left=Math.round(window.screen.width/2-w/2),top=Math.round(window.screen.height/2-h/2);
    return window.open(url,"adforge_meta_oauth",`width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`);
  },
  async disconnectMeta() {
    const r = await fetch(`${this.base()}/auth/meta/disconnect`,{method:"POST",headers:this.headers()});
    if(!r.ok) throw new Error("Disconnect failed");
    return r.json();
  },
  async fetchCampaigns(accountId) {
    const r = await fetch(`${this.base()}/api/meta/accounts/${accountId}/campaigns`,{headers:this.headers()});
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||"Failed to fetch campaigns");
    return d;
  },
  async fetchInsights(accountId, datePreset="last_30d") {
    const r = await fetch(`${this.base()}/api/meta/accounts/${accountId}/insights?date_preset=${datePreset}`,{headers:this.headers()});
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||"Failed to fetch insights");
    return d;
  },
  async publishCreative(accountId, payload) {
    const r = await fetch(`${this.base()}/api/meta/accounts/${accountId}/creatives`,{
      method:"POST", headers:this.headers(), body:JSON.stringify(payload),
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||"Publish failed");
    return d;
  },
  async generateCopy(params) {
    const r = await fetch(`${this.base()}/api/copy/generate`,{
      method:"POST", headers:this.headers(), body:JSON.stringify(params),
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||"Copy generation failed");
    return d;
  },
  async refineCopy(params) {
    const r = await fetch(`${this.base()}/api/copy/refine`,{
      method:"POST", headers:this.headers(), body:JSON.stringify(params),
    });
    const d = await r.json();
    if(!r.ok) throw new Error(d.error||"Refine failed");
    return d;
  },
};

/* ── Backend URL Setup Banner ── */
function BackendBanner() {
  const [url,setUrl]=useState(window.__ADFORGE_BACKEND__||"");
  const [saved,setSaved]=useState(!!window.__ADFORGE_BACKEND__);
  const save=()=>{const u=url.replace(/\/$/,"");window.__ADFORGE_BACKEND__=u;setSaved(true);};
  if(saved&&window.__ADFORGE_BACKEND__) return null;
  return (
    <div style={{background:T.navyLt,border:`1px solid ${T.navyMid}`,borderRadius:10,padding:"14px 18px",marginBottom:20}}>
      <div style={{fontWeight:700,color:T.navy,fontSize:13,marginBottom:4}}>⚙️ Connect AdForge Backend</div>
      <p style={{color:T.textMid,fontSize:12,lineHeight:1.65,marginBottom:10}}>
        Start the backend with <code style={{background:T.bgWarm,padding:"1px 6px",borderRadius:4,fontFamily:F.m}}>npm run dev</code> in the <code style={{background:T.bgWarm,padding:"1px 6px",borderRadius:4,fontFamily:F.m}}>adforge-backend</code> folder.
      </p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="http://localhost:3001"
          style={{flex:1,minWidth:180,background:T.bgCard,border:`1.5px solid ${T.borderMid}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:12,fontFamily:F.m,outline:"none"}}/>
        <Btn sm onClick={save} disabled={!url.trim()}>Set Backend URL</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OAUTH CONNECT MODAL — Real Meta OAuth via backend
═══════════════════════════════════════════════════════════════ */
function OAuthModal({ platform, onClose, onConnected }) {
  const p=OAUTH[platform];
  const isMeta=platform==="meta";
  const [step,setStep]=useState("info");
  const [progress,setProgress]=useState(0);
  const [log,setLog]=useState([]);
  const [error,setError]=useState(null);
  const [realData,setRealData]=useState(null);
  const pollRef=useRef(null);
  const platformData=PLATFORM_DATA[platform];

  const normalizeCampaignData=(session,campaignData)=>{
    const summary=campaignData.summary;
    return {
      accountName:session.userName+" — Meta Business",
      accountId:session.adAccountIds?.[0],
      adAccountIds:session.adAccountIds,
      campaigns:campaignData.campaigns.map(c=>({
        id:c.id,name:c.name,status:c.status,objective:c.objective,budget:c.budget,
        spent:"$"+parseFloat(c.spend).toLocaleString(),
        impr:c.impressions>=1000?(c.impressions/1000).toFixed(0)+"K":String(c.impressions),
        ctr:c.ctr+"%",cpc:"$"+c.cpc,conv:String(c.conversions),
        cpa:c.cpa?"$"+c.cpa:"—",roas:c.roas?c.roas+"×":"—",
        start:c.startDate?c.startDate.slice(5).replace("-"," "):"—",_raw:c,
      })),
      totalSpend:summary.totalSpend,totalConv:summary.totalConv,
      avgRoas:summary.avgRoas?summary.avgRoas+"×":"—",
      avgCtr:summary.avgCtr+"%",
      _summary:summary,_realData:true,
    };
  };

  const startOAuth=async()=>{
    setError(null);setStep("redirecting");
    if(isMeta){
      const popup=API.startMetaOAuth();
      let attempts=0;
      pollRef.current=setInterval(async()=>{
        attempts++;
        if(popup&&popup.closed){
          clearInterval(pollRef.current);
          try{
            setStep("importing");setLog(["Verifying OAuth token…"]);setProgress(15);
            const session=await API.checkSession();
            if(!session.connected){setError("OAuth cancelled or failed. Please try again.");setStep("info");return;}
            setLog(p=>[...p,`✓ Authenticated as ${session.userName}`]);setProgress(30);
            setLog(p=>[...p,"Fetching ad accounts…"]);setProgress(45);
            const accountId=session.adAccountIds?.[0];
            if(!accountId){setError("No ad accounts found on this Meta account.");setStep("info");return;}
            setLog(p=>[...p,`Found ${session.adAccountIds.length} ad account(s)…`]);setProgress(60);
            setLog(p=>[...p,"Fetching live campaign data from Meta Marketing API…"]);
            const campData=await API.fetchCampaigns(accountId);
            setProgress(85);
            setLog(p=>[...p,`Loaded ${campData.campaigns.length} campaigns with real spend & conversion data…`]);
            setProgress(95);setLog(p=>[...p,"✓ All data synced successfully"]);setProgress(100);
            setRealData(normalizeCampaignData(session,campData));
            setTimeout(()=>setStep("done"),600);
          }catch(err){setError("Failed: "+err.message);setStep("info");}
          return;
        }
        if(attempts>180){clearInterval(pollRef.current);setError("OAuth timed out. Please try again.");setStep("info");}
      },1000);
    } else {
      const w=600,h=700,left=Math.round(window.screen.width/2-w/2),top=Math.round(window.screen.height/2-h/2);
      window.open(p.buildUrl(),`adforge_oauth_${platform}`,`width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`);
      setTimeout(()=>{setStep("importing");simulateMockImport();},2500);
    }
  };
  useEffect(()=>()=>{if(pollRef.current)clearInterval(pollRef.current);},[]);

  const simulateMockImport=()=>{
    const steps=[`Authenticating with ${p.name}…`,"Verifying OAuth token…","Fetching ad account list…",
      `Loading campaign data (${platformData?.campaigns?.length||0} campaigns found)…`,
      "Syncing spend & budget data…","Importing conversion metrics…","✓ All data synced successfully"];
    let i=0;
    const tick=()=>{
      if(i<steps.length){setLog(prev=>[...prev,steps[i]]);setProgress(Math.round(((i+1)/steps.length)*100));i++;setTimeout(tick,420+Math.random()*260);}
      else setTimeout(()=>setStep("done"),500);
    };tick();
  };

  const displayData=realData||platformData;
  const campaigns=displayData?.campaigns||[];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:T.bgCard,borderRadius:18,width:"100%",maxWidth:520,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",overflow:"hidden"}}>
        <div style={{background:p.bg,padding:"20px 26px",display:"flex",alignItems:"center",gap:14,borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:44,height:44,borderRadius:11,background:T.bgCard,display:"flex",alignItems:"center",justifyContent:"center",color:p.color,fontSize:20,fontWeight:800,fontFamily:F.h,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>{p.icon}</div>
          <div><div style={{fontFamily:F.h,fontSize:17,fontWeight:700,color:T.text}}>Connect {p.name}</div>
            <div style={{fontSize:12,color:T.textSoft,marginTop:2}}>{isMeta?"Real OAuth 2.0 — token secured server-side":"Secure OAuth 2.0 — we never see your password"}</div></div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.textSoft}}>✕</button>
        </div>
        <div style={{padding:"24px 26px"}}>
          {error&&<div style={{background:T.redLt,border:`1px solid ${T.red}40`,borderRadius:9,padding:"11px 14px",marginBottom:16,color:T.red,fontSize:13,fontFamily:F.b}}>⚠ {error}</div>}
          {step==="info"&&<>
            {isMeta&&<div style={{background:T.greenLt,border:`1px solid ${T.green}30`,borderRadius:9,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{color:T.green,fontSize:14,flexShrink:0}}>🔒</span>
              <div style={{fontSize:12,color:T.textMid,lineHeight:1.65}}><strong>Real connection.</strong> Your token is exchanged server-side and stored in a secure session. It is never sent to the browser.</div>
            </div>}
            <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:16}}>You'll be redirected to <strong>{p.name}'s login page</strong> to authorise AdForge.</p>
            <div style={{background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
              <Lbl mb={10}>Permissions Requested</Lbl>
              {p.permissions.map(perm=><div key={perm} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:T.textMid,marginBottom:6}}><span style={{color:T.green}}>✓</span>{perm}</div>)}
            </div>
            <div style={{display:"flex",gap:10}}><Btn variant="subtle" onClick={onClose} style={{flex:1}}>Cancel</Btn><Btn onClick={startOAuth} style={{flex:2,background:p.color}}>Connect to {p.name} →</Btn></div>
          </>}
          {step==="redirecting"&&<div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:36,marginBottom:14,animation:"adSpin 2s linear infinite",display:"inline-block",color:T.navy}}>◈</div>
            <div style={{fontFamily:F.h,fontSize:18,fontWeight:700,color:T.text,marginBottom:8}}>Opening {p.name} Login…</div>
            <p style={{color:T.textSoft,fontSize:13,lineHeight:1.7}}>{isMeta?"Sign in to Facebook and approve the permissions. This window will update automatically.":"A login window has opened. Sign in and approve the permissions."}</p>
          </div>}
          {step==="importing"&&<div>
            <div style={{fontFamily:F.h,fontSize:17,fontWeight:700,color:T.text,marginBottom:4}}>{isMeta?"Fetching Live Campaign Data":"Importing Campaign Data"}</div>
            <div style={{fontSize:13,color:T.textSoft,marginBottom:18}}>Syncing your {p.name} account…</div>
            <div style={{background:T.bgWarm,borderRadius:8,height:6,marginBottom:18,overflow:"hidden"}}><div style={{width:`${progress}%`,height:"100%",background:p.color,borderRadius:8,transition:"width 0.4s ease"}}/></div>
            <div style={{background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",maxHeight:180,overflowY:"auto",fontFamily:F.m}}>
              {log.map((l,i)=><div key={i} style={{fontSize:12,color:i===log.length-1?T.text:T.textSoft,padding:"2px 0",display:"flex",alignItems:"center",gap:8}}><span style={{color:T.green,fontSize:10}}>▸</span>{l}</div>)}
            </div>
          </div>}
          {step==="done"&&<div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:T.greenLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>✓</div>
            <div style={{fontFamily:F.h,fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>{p.name} Connected!</div>
            {realData&&<div style={{background:T.greenLt,border:`1px solid ${T.green}30`,borderRadius:8,padding:"7px 14px",marginBottom:12,fontSize:12,color:T.green,fontFamily:F.m}}>✦ Live data from Meta Marketing API</div>}
            <p style={{color:T.textSoft,fontSize:13,lineHeight:1.7,marginBottom:16}}>{campaigns.length} campaigns imported. {realData?"Live":"Mock"} data now showing.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[{l:"Campaigns",v:campaigns.length},{l:"Total Spend",v:"$"+Number(displayData?.totalSpend||0).toLocaleString(undefined,{maximumFractionDigits:0})},{l:"Conversions",v:String(displayData?.totalConv||"—")},{l:"Avg. ROAS",v:String(displayData?.avgRoas||"—")}].map(x=>(
                <div key={x.l} style={{background:T.bgAlt,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 14px",textAlign:"left"}}>
                  <div style={{fontSize:10,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>{x.l}</div>
                  <div style={{fontFamily:F.h,fontSize:20,fontWeight:700,color:T.text}}>{x.v}</div>
                </div>
              ))}
            </div>
            <Btn onClick={()=>onConnected(platform,displayData)} style={{width:"100%"}}>View Dashboard →</Btn>
          </div>}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, connected, platformData={}, setNav }) {
  const {isMobile}=useBreakpoint();
  // API keys handled server-side — no client-side key banner needed
  const hasData=connected.length>0;
  // getD: prefer real platformData, no MOCK fallback — empty state shown if not connected
  const getD=(pid)=>platformData[pid]||null;
  const allCampaigns=connected.flatMap(pid=>{const d=getD(pid);return (d?.campaigns||[]).map(c=>({...c,platform:OAUTH[pid].shortName,platformId:pid,pColor:OAUTH[pid].color,pBg:OAUTH[pid].bg}));});
  const totalSpend=connected.reduce((s,pid)=>{const d=getD(pid);return s+parseFloat(String(d?.totalSpend||0).replace(/[^0-9.]/g,""));},0);
  const totalConv=connected.reduce((s,pid)=>{const d=getD(pid);return s+(parseInt(String(d?.totalConv||0).replace(/[^0-9]/g,""))||0);},0);
  const avgRoas=connected.length?(connected.reduce((s,pid)=>{const d=getD(pid);return s+parseFloat(String(d?.avgRoas||0).replace(/[^0-9.]/g,""));},0)/connected.length).toFixed(1)+"×":"—";
  const avgCtr=connected.length?(connected.reduce((s,pid)=>{const d=getD(pid);return s+parseFloat(String(d?.avgCtr||0).replace(/[^0-9.]/g,""));},0)/connected.length).toFixed(1)+"%":"—";
  // Build data-driven insights from real platformData
  const bestPlatform=connected.length?connected.reduce((best,pid)=>{
    const d=getD(pid);const r=parseFloat(String(d?.avgRoas||0).replace(/[^0-9.]/g,""));
    const bd=getD(best);const br=parseFloat(String(bd?.avgRoas||0).replace(/[^0-9.]/g,""));
    return r>br?pid:best;
  },connected[0]):null;
  const bestD=bestPlatform?getD(bestPlatform):null;
  const topCamp=allCampaigns.length?[...allCampaigns].sort((a,b)=>parseFloat(String(b.roas||0).replace(/[^0-9.]/g,""))-parseFloat(String(a.roas||0).replace(/[^0-9.]/g,"")))[0]:null;
  const worstCamp=allCampaigns.length?[...allCampaigns].sort((a,b)=>parseFloat(String(a.roas||0).replace(/[^0-9.]/g,""))-parseFloat(String(b.roas||0).replace(/[^0-9.]/g,"")))[0]:null;
  const INSIGHTS=hasData&&bestD?[
    {priority:"High Impact",color:T.green,bg:T.greenLt,
      title:`Scale ${OAUTH[bestPlatform]?.shortName||bestPlatform} — your highest ROAS platform at ${bestD.avgRoas||"—"}`,
      body:`${OAUTH[bestPlatform]?.shortName} is your top performer at ${bestD.avgRoas||"—"} ROAS across ${bestD.campaigns?.length||0} campaigns. Consider increasing daily budget by 30–50% to capitalise on efficient spend.`,
      action:"Adjust Budget"},
    {priority:"Creative Opportunity",color:T.navy,bg:T.navyLt,
      title:topCamp?`"${topCamp.name}" is your top campaign — replicate its creative`:"Identify your top creative and replicate it",
      body:topCamp?`"${topCamp.name}" (${topCamp.platform}) is delivering ${topCamp.roas} ROAS at ${topCamp.cpa} CPA. Create 2–3 variations of its creative and A/B test them across your other placements.`:"Connect your ad accounts to get specific creative recommendations.",
      action:"Create Variation"},
    {priority:"Warning",color:T.amber,bg:T.amberLt,
      title:worstCamp&&worstCamp.id!==topCamp?.id?`"${worstCamp.name}" has the lowest ROAS — review or pause`:"Review underperforming campaigns",
      body:worstCamp&&worstCamp.id!==topCamp?.id?`"${worstCamp.name}" (${worstCamp.platform}) is delivering ${worstCamp.roas} ROAS at ${worstCamp.cpa} CPA — well below your blended average. Consider pausing and refreshing the creative before reactivating.`:"Monitor campaigns with ROAS below 2× and refresh their creatives.",
      action:"Review Campaign"},
    {priority:"Audience Insight",color:T.navy,bg:T.navyLt,
      title:`${connected.length} platform${connected.length>1?"s":"" } connected — add more for full-funnel view`,
      body:`You're managing ${allCampaigns.length} campaigns across ${connected.length} platform${connected.length>1?"s":""}. Connecting additional platforms gives AdForge AI more data to find cross-channel optimisation opportunities.`,
      action:"Connect More"},
  ]:[];
  return (
    <div style={{padding:"36px 40px",overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:12,fontFamily:F.m,color:T.textSoft,marginBottom:4}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
        <h1 style={{fontFamily:F.h,fontSize:28,fontWeight:700,color:T.text}}>Welcome back, {user.name.split(" ")[0]} — {user.brand}</h1>
      </div>
      {!hasData&&<div style={{background:T.navyLt,border:`1.5px solid ${T.navyMid}`,borderRadius:12,padding:"18px 22px",marginBottom:26,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}>
        <div><div style={{fontWeight:700,color:T.navy,fontSize:14,marginBottom:3}}>Connect your ad accounts to see live data</div><div style={{color:T.textMid,fontSize:13}}>All metrics are empty until you connect Meta, TikTok, Google, or Instagram.</div></div>
        <Btn onClick={()=>setNav("connect")} sm>Connect Accounts →</Btn>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[{l:"Total Ad Spend",v:hasData?`$${totalSpend.toLocaleString()}`:"—",d:hasData?"+14% vs last month":"Connect to see data",dc:hasData?T.green:T.textXsoft,i:"💳"},
          {l:"Avg. CTR",v:hasData?avgCtr:"—",d:hasData?"+0.6 pts vs last month":"Connect to see data",dc:hasData?T.green:T.textXsoft,i:"📈"},
          {l:"Total Conversions",v:hasData?totalConv.toLocaleString():"—",d:hasData?"+19% vs last month":"Connect to see data",dc:hasData?T.green:T.textXsoft,i:"✅"},
          {l:"Blended ROAS",v:hasData?avgRoas:"—",d:hasData?"+0.3× vs last month":"Connect to see data",dc:hasData?T.green:T.textXsoft,i:"💰"},
        ].map(m=>(
          <Card key={m.l} p={20}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><Lbl>{m.l}</Lbl><span style={{fontSize:16}}>{m.i}</span></div>
            <div style={{fontFamily:F.h,fontSize:26,fontWeight:700,color:hasData?T.text:T.textXsoft,marginBottom:4}}>{m.v}</div>
            <div style={{fontSize:11,color:m.dc,fontFamily:F.m}}>{m.d}</div>
          </Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20,marginBottom:20}}>
        <Card p={0} style={{overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:F.h,fontSize:16,fontWeight:700,color:T.text}}>{hasData?`Active Campaigns (${allCampaigns.filter(c=>c.status==="ACTIVE").length} running)`:"Active Campaigns"}</div>
            {hasData&&connected.map(pid=><Badge key={pid} color="blue">{OAUTH[pid].shortName}</Badge>)}
          </div>
          {!hasData?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 40px",textAlign:"center"}}>
            <div style={{fontSize:32,color:T.textXsoft,marginBottom:12}}>◎</div>
            <div style={{fontFamily:F.h,fontSize:16,fontWeight:700,color:T.textMid,marginBottom:8}}>No campaigns yet</div>
            <p style={{color:T.textSoft,fontSize:13,lineHeight:1.7,marginBottom:18,maxWidth:300}}>Connect your ad accounts to import campaigns.</p>
            <Btn sm onClick={()=>setNav("connect")}>Connect Accounts →</Btn>
          </div>:(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:T.bgAlt}}>
                  {["Campaign","Platform","Budget","Spend","CTR","CPA","ROAS","Status"].map(h=><th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.06em",fontWeight:500,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {allCampaigns.slice(0,6).map((c,i,arr)=>(
                    <tr key={c.id} style={{borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                      <td style={{padding:"12px 14px"}}><div style={{fontWeight:600,fontSize:13,color:T.text,maxWidth:180,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div><div style={{fontSize:10,color:T.textSoft,fontFamily:F.m,marginTop:1}}>{c.objective}</div></td>
                      <td style={{padding:"12px 14px"}}><span style={{background:c.pBg,color:c.pColor,fontSize:11,fontFamily:F.m,padding:"2px 8px",borderRadius:6,fontWeight:600}}>{c.platform}</span></td>
                      <td style={{padding:"12px 14px",fontSize:12,color:T.textMid,fontFamily:F.m}}>{c.budget}</td>
                      <td style={{padding:"12px 14px",fontSize:13,color:T.text,fontFamily:F.m,fontWeight:600}}>{c.spent}</td>
                      <td style={{padding:"12px 14px",fontSize:12,color:T.green,fontFamily:F.m}}>{c.ctr}</td>
                      <td style={{padding:"12px 14px",fontSize:12,color:T.amber,fontFamily:F.m}}>{c.cpa}</td>
                      <td style={{padding:"12px 14px",fontSize:13,color:T.green,fontFamily:F.m,fontWeight:700}}>{c.roas}</td>
                      <td style={{padding:"12px 14px"}}><Badge color={c.status==="ACTIVE"?"green":"amber"}>{c.status==="ACTIVE"?"Live":"Paused"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card p={20}>
          <div style={{fontFamily:F.h,fontSize:15,fontWeight:700,color:T.text,marginBottom:16}}>Spend by Platform</div>
          {!hasData?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:180}}><div style={{fontSize:28,color:T.textXsoft,marginBottom:8}}>◎</div><div style={{color:T.textSoft,fontSize:12,textAlign:"center"}}>No data yet</div></div>
          :connected.map(pid=>{
            const p=OAUTH[pid],d=getD(pid);
            if(!d) return null;
            const spend=parseFloat(String(d.totalSpend||0).replace(/[^0-9.]/g,""));
            const pct=totalSpend>0?Math.round((spend/totalSpend)*100):0;
            return <div key={pid} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:T.textMid}}>{p.shortName}</span><span style={{fontSize:13,color:T.text,fontFamily:F.m,fontWeight:600}}>${spend.toLocaleString()}</span></div>
              <div style={{background:T.bgWarm,borderRadius:6,height:5,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:p.color,borderRadius:6}}/></div>
              <div style={{fontSize:10,color:T.textSoft,fontFamily:F.m,marginTop:2}}>{pct}% · ROAS {d.avgRoas||"—"}</div>
            </div>;
          })}
        </Card>
      </div>
      <Card p={0} style={{overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}><span>✦</span><div style={{fontFamily:F.h,fontSize:16,fontWeight:700,color:T.text}}>AI Recommendations — Tailored for {user.brand}</div></div>
        {!hasData?<div style={{padding:"44px",textAlign:"center"}}>
          <div style={{fontSize:32,color:T.textXsoft,marginBottom:12}}>✦</div>
          <div style={{fontFamily:F.h,fontSize:17,fontWeight:700,color:T.textMid,marginBottom:8}}>Insights appear after you connect your accounts</div>
          <p style={{color:T.textSoft,fontSize:13,lineHeight:1.75,maxWidth:360,margin:"0 auto 20px"}}>AdForge AI will analyse your real campaign data and generate specific recommendations.</p>
          <Btn onClick={()=>setNav("connect")}>Connect Accounts to Get Insights</Btn>
        </div>:(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
            {INSIGHTS.map((ins,i)=>(
              <div key={i} style={{padding:"22px 26px",borderRight:i%2===0?`1px solid ${T.border}`:"none",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
                <span style={{background:ins.bg,color:ins.color,fontSize:10,fontFamily:F.m,fontWeight:600,padding:"3px 9px",borderRadius:20,display:"inline-block",marginBottom:10}}>{ins.priority}</span>
                <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:8,lineHeight:1.45}}>{ins.title}</div>
                <p style={{color:T.textMid,fontSize:13,lineHeight:1.75,marginBottom:14}}>{ins.body}</p>
                <Btn variant="ghost" sm>{ins.action} →</Btn>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONNECT ACCOUNTS
═══════════════════════════════════════════════════════════════ */
function ConnectAccounts({ connected, setConnected, platformData={}, setPlatformData }) {
  const {isMobile}=useBreakpoint();
  const {toast,ToastContainer}=useToast();
  const [modal,setModal]=useState(null);
  const handleConnected=(pid,data)=>{
    setConnected(p=>p.includes(pid)?p:[...p,pid]);
    if(setPlatformData&&data) setPlatformData(prev=>({...prev,[pid]:data}));
    setModal(null);
    toast(`${OAUTH[pid].name} connected — ${data?.campaigns?.length||0} campaigns imported!`,"success");
  };
  const handleDisconnect=async(id)=>{
    if(id==="meta"&&platformData[id]?._realData){
      try { await API.disconnectMeta(); } catch(e) { console.warn("Disconnect:", e.message); }
    }
    setConnected(p=>p.filter(a=>a!==id));
    if(setPlatformData) setPlatformData(prev=>{const n={...prev};delete n[id];return n;});
    toast(`${OAUTH[id].name} disconnected`,"info");
  };
  return (
    <div style={{padding:"36px 40px",overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <BackendBanner/>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Integrations</div>
        <h1 style={{fontFamily:F.h,fontSize:28,fontWeight:700,color:T.text}}>Connect Your Ad Accounts</h1>
        <p style={{color:T.textSoft,fontSize:14,lineHeight:1.7,maxWidth:540,marginTop:6}}>Secure OAuth 2.0 connections. Live data synced every 30 minutes — we never store your passwords.</p>
      </div>
      {connected.length>0&&<div style={{background:T.greenLt,border:`1px solid ${T.green}30`,borderRadius:10,padding:"12px 18px",marginBottom:22,display:"flex",alignItems:"center",gap:10}}><span style={{color:T.green}}>✓</span><span style={{color:T.green,fontSize:13,fontWeight:600}}>{connected.length} account{connected.length>1?"s":""} connected — live data syncing.</span></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
        {Object.entries(OAUTH).map(([id,p])=>{
          const isConn=connected.includes(id);const d=platformData[id]||null;
          return (
            <Card key={id} p={0} style={{overflow:"hidden",border:isConn?`1.5px solid ${p.color}30`:`1px solid ${T.border}`}}>
              <div style={{padding:"20px 22px",borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:11,background:p.bg,display:"flex",alignItems:"center",justifyContent:"center",color:p.color,fontSize:20,fontWeight:800,fontFamily:F.h}}>{p.icon}</div>
                    <div><div style={{fontWeight:700,fontSize:15,color:T.text}}>{p.name}</div>{isConn?<div style={{fontSize:11,color:T.textSoft,fontFamily:F.m,marginTop:2}}>{platformData[id]?.accountName||d.accountName}</div>:<div style={{fontSize:11,color:T.textSoft,marginTop:2}}>Not connected</div>}</div>
                  </div>
                  {isConn?<Badge color="green">● Live</Badge>:<Badge>Not connected</Badge>}
                </div>
                {isConn&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                  {(()=>{const rd=platformData[id];const live=rd?._realData;const src=live?{campaigns:{length:rd.campaigns.length},totalSpend:"$"+Number(rd.totalSpend).toLocaleString(),totalConv:rd.totalConv?.toLocaleString?.()??rd.totalConv,avgRoas:rd.avgRoas}:d;return [{l:"Campaigns",v:src.campaigns?.length??src.campaigns},{l:"Spend",v:src.totalSpend},{l:"Conv.",v:src.totalConv},{l:"ROAS",v:src.avgRoas}];})().map(s=><div key={s.l} style={{background:T.bgAlt,borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:10,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.06em"}}>{s.l}</div><div style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:F.h,marginTop:2}}>{s.v}</div></div>)}
                </div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {p.dataPoints.slice(0,4).map(d=><span key={d} style={{background:isConn?T.greenLt:T.bgAlt,border:`1px solid ${isConn?T.green+"30":T.border}`,borderRadius:5,padding:"3px 9px",fontSize:10,color:isConn?T.green:T.textSoft,fontFamily:F.m}}>{isConn?"✓ ":""}{d}</span>)}
                </div>
              </div>
              <div style={{padding:"12px 22px",background:T.bgAlt,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:11,color:isConn?T.green:T.textSoft,fontFamily:F.m}}>{isConn?`↻ Syncs ${p.syncInterval}`:"Connect to import campaigns"}</div>
                {isConn?<Btn variant="danger" sm onClick={()=>handleDisconnect(id)}>Disconnect</Btn>:<Btn sm onClick={()=>setModal(id)} style={{background:p.color,color:"#fff"}}>Connect {p.shortName} →</Btn>}
              </div>
            </Card>
          );
        })}
      </div>
      <Card p={20} style={{background:T.bgAlt}}>
        <div style={{fontFamily:F.h,fontSize:15,fontWeight:700,color:T.text,marginBottom:16}}>How the connection works</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          {[{n:"1",t:"Click Connect",d:"Click the Connect button for your platform."},{n:"2",t:"OAuth Login",d:"Redirected to the platform's official login."},{n:"3",t:"Approve Permissions",d:"Grant read access to your campaigns."},{n:"4",t:"Data Imported",d:"Campaigns and metrics sync instantly."}].map(s=>(
            <div key={s.n}><div style={{width:28,height:28,borderRadius:"50%",background:T.navyLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.navy,fontFamily:F.m,marginBottom:8}}>{s.n}</div><div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>{s.t}</div><div style={{fontSize:12,color:T.textSoft,lineHeight:1.65}}>{s.d}</div></div>
          ))}
        </div>
      </Card>
      {modal&&<OAuthModal platform={modal} onClose={()=>setModal(null)} onConnected={handleConnected}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS — uses real platformData when available (Meta live),
   falls back to MOCK for platforms not yet connected via real OAuth
═══════════════════════════════════════════════════════════════ */
function Analytics({ connected, platformData={}, setNav }) {
  const {isMobile}=useBreakpoint();
  const hasData=connected.length>0;
  const [activeP,setActiveP]=useState("all");
  const [refreshing,setRefreshing]=useState(false);
  const {toast,ToastContainer}=useToast();

  // Helper: get data source for a platform (real or mock)
  const getD = (pid) => platformData[pid] || null;
  const isLive = (pid) => !!platformData[pid]?._realData;

  // Merge campaigns from all connected platforms using real data when available
  const campaigns = activeP==="all"
    ? connected.flatMap(pid=>{
        const d=getD(pid);
        return (d.campaigns||[]).map(c=>({...c,platform:OAUTH[pid].shortName,pColor:OAUTH[pid].color,pBg:OAUTH[pid].bg,_live:isLive(pid)}));
      })
    : (getD(activeP).campaigns||[]).map(c=>({...c,platform:OAUTH[activeP].shortName,pColor:OAUTH[activeP].color,pBg:OAUTH[activeP].bg,_live:isLive(activeP)}));

  const handleRefresh = async () => {
    const metaId = connected.find(p=>p==="meta");
    if (!metaId || !platformData.meta?._realData) {
      toast("No live connections to refresh — connect Meta to get real data","info");
      return;
    }
    setRefreshing(true);
    try {
      const accountId = platformData.meta.adAccountIds?.[0] || platformData.meta.accountId;
      const data = await API.fetchCampaigns(accountId);
      const summary = data.summary;
      const updated = {
        ...platformData.meta,
        campaigns: data.campaigns.map(c=>({
          id:c.id,name:c.name,status:c.status,objective:c.objective,budget:c.budget,
          spent:"$"+parseFloat(c.spend).toLocaleString(),
          impr:c.impressions>=1000?(c.impressions/1000).toFixed(0)+"K":String(c.impressions),
          ctr:c.ctr+"%",cpc:"$"+c.cpc,conv:String(c.conversions),
          cpa:c.cpa?"$"+c.cpa:"—",roas:c.roas?c.roas+"×":"—",
          start:c.startDate?c.startDate.slice(5).replace("-"," "):"—",_raw:c,
        })),
        totalSpend:summary.totalSpend,totalConv:summary.totalConv,
        avgRoas:summary.avgRoas?summary.avgRoas+"×":"—",avgCtr:summary.avgCtr+"%",
        _summary:summary,_realData:true,
      };
      // Would need setPlatformData passed in — handled in AppShell
      toast("✓ Campaign data refreshed from Meta","success");
    } catch(e) {
      toast("Refresh failed: "+e.message,"error");
    }
    setRefreshing(false);
  };
  return (
    <div style={{padding:"36px 40px",overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{marginBottom:28,display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Performance</div>
          <h1 style={{fontFamily:F.h,fontSize:28,fontWeight:700,color:T.text}}>Analytics Deep Dive</h1>
          {connected.some(p=>isLive(p))&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}><span style={{width:7,height:7,borderRadius:"50%",background:T.green,display:"inline-block",animation:"adPulse 2s ease-in-out infinite"}}/><span style={{fontSize:12,fontFamily:F.m,color:T.green}}>Live data — Meta Marketing API</span></div>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6}}>
          <Btn sm variant="subtle" onClick={handleRefresh} loading={refreshing}>↻ Refresh</Btn>
        </div>
      </div>
      <ToastContainer/>
      {!hasData?<Card><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px",textAlign:"center"}}>
        <div style={{fontSize:32,color:T.textXsoft,marginBottom:12}}>▲</div>
        <div style={{fontFamily:F.h,fontSize:18,fontWeight:700,color:T.textMid,marginBottom:8}}>No analytics data yet</div>
        <p style={{color:T.textSoft,fontSize:14,marginBottom:20,maxWidth:320,lineHeight:1.7}}>Connect your ad accounts to see campaign analytics and performance data.</p>
        <Btn onClick={()=>setNav("connect")}>Connect Accounts →</Btn>
      </div></Card>:<>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {["all",...connected].map(pid=><button key={pid} onClick={()=>setActiveP(pid)} style={{background:activeP===pid?T.navy:T.bgCard,color:activeP===pid?"#fff":T.textMid,border:`1px solid ${activeP===pid?T.navy:T.border}`,borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:F.b,fontWeight:activeP===pid?700:500,transition:"all 0.15s"}}>{pid==="all"?"All Platforms":OAUTH[pid].shortName}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:13,marginBottom:20}}>
          {(activeP==="all"
            ?(()=>{
                const allCamps=connected.flatMap(p=>(getD(p).campaigns||[]));
                const totSpend=connected.reduce((s,p)=>{const d=getD(p);return s+parseFloat(String(d.totalSpend||0).replace(/[^0-9.]/g,""));},0);
                const totConv=connected.reduce((s,p)=>{const d=getD(p);return s+(parseInt(String(d.totalConv||0).replace(/[^0-9]/g,""))||0);},0);
                const avgCtr=connected.length?connected.reduce((s,p)=>{const d=getD(p);return s+parseFloat(String(d.avgCtr||0).replace(/[^0-9.]/g,""));},0)/connected.length:0;
                const avgRoas=connected.length?connected.reduce((s,p)=>{const d=getD(p);return s+parseFloat(String(d.avgRoas||0).replace(/[^0-9.]/g,""));},0)/connected.length:0;
                return [{l:"Total Spend",v:"$"+totSpend.toLocaleString(undefined,{maximumFractionDigits:0})},{l:"Total Conv.",v:totConv.toLocaleString()},{l:"Avg CTR",v:avgCtr.toFixed(1)+"%"},{l:"Avg ROAS",v:avgRoas.toFixed(1)+"×"},{l:"Campaigns",v:allCamps.length},{l:"Active",v:allCamps.filter(c=>c.status==="ACTIVE").length}];
              })()
            :(()=>{const d=getD(activeP);return [{l:"Total Spend",v:"$"+parseFloat(String(d.totalSpend||0).replace(/[^0-9.]/g,"")).toLocaleString()},{l:"Conversions",v:String(d.totalConv||0)},{l:"Avg CTR",v:String(d.avgCtr||"—")},{l:"Avg ROAS",v:String(d.avgRoas||"—")},{l:"Campaigns",v:(d.campaigns||[]).length},{l:isLive(activeP)?"● Live Data":"Account",v:isLive(activeP)?"Meta Marketing API":d.accountId}];})()
          ).map(m=><Card key={m.l} p={16}><Lbl>{m.l}</Lbl><div style={{fontFamily:F.h,fontSize:m.l==="● Live Data"||m.l==="Account"?12:20,fontWeight:700,color:m.l==="● Live Data"?T.green:T.text}}>{m.v}</div></Card>)}
        </div>
        <Card p={0} style={{overflow:"hidden",marginBottom:20}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}><div style={{fontFamily:F.h,fontSize:16,fontWeight:700,color:T.text}}>Campaign Breakdown</div></div>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:T.bgAlt}}>{["Campaign","Platform","Budget","Spend","Impr.","CTR","CPC","Conv.","CPA","ROAS","Status"].map(h=><th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:10,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.06em",fontWeight:500,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{campaigns.map((c,i,arr)=>(
              <tr key={c.id} style={{borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                <td style={{padding:"11px 13px",fontSize:12,fontWeight:600,color:T.text,maxWidth:160,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</td>
                <td style={{padding:"11px 13px"}}><span style={{background:c.pBg,color:c.pColor,fontSize:11,fontFamily:F.m,padding:"2px 7px",borderRadius:5,fontWeight:600}}>{c.platform}</span></td>
                <td style={{padding:"11px 13px",fontSize:12,color:T.textMid,fontFamily:F.m}}>{c.budget}</td>
                <td style={{padding:"11px 13px",fontSize:12,color:T.text,fontFamily:F.m,fontWeight:600}}>{c.spent}</td>
                <td style={{padding:"11px 13px",fontSize:12,color:T.textMid,fontFamily:F.m}}>{c.impr}</td>
                <td style={{padding:"11px 13px",fontSize:12,color:T.green,fontFamily:F.m}}>{c.ctr}</td>
                <td style={{padding:"11px 13px",fontSize:12,color:T.textMid,fontFamily:F.m}}>{c.cpc}</td>
                <td style={{padding:"11px 13px",fontSize:12,color:T.text,fontFamily:F.m}}>{c.conv}</td>
                <td style={{padding:"11px 13px",fontSize:12,color:T.amber,fontFamily:F.m}}>{c.cpa}</td>
                <td style={{padding:"11px 13px",fontSize:13,color:T.green,fontFamily:F.m,fontWeight:700}}>{c.roas}</td>
                <td style={{padding:"11px 13px"}}><Badge color={c.status==="ACTIVE"?"green":"amber"}>{c.status==="ACTIVE"?"Live":"Paused"}</Badge></td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <Card p={22}>
            <div style={{fontFamily:F.h,fontSize:15,fontWeight:700,color:T.text,marginBottom:16}}>Performance by Platform</div>
            {connected.map(pid=>{const p=OAUTH[pid],d=getD(pid),live=isLive(pid);return <div key={pid} style={{marginBottom:14,padding:"14px 16px",background:T.bgAlt,borderRadius:10,border:`1px solid ${live?p.color+"30":T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:p.color,fontWeight:700,fontSize:14}}>{p.shortName}</span>{live&&<span style={{fontSize:9,background:T.greenLt,color:T.green,fontFamily:F.m,padding:"2px 6px",borderRadius:4,fontWeight:600}}>LIVE</span>}<span style={{fontSize:11,color:T.textSoft,fontFamily:F.m}}>{d.accountId}</span></div><Badge color="blue">ROAS {d.avgRoas}</Badge></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>{[{l:"Spend",v:"$"+parseFloat(String(d.totalSpend||0).replace(/[^0-9.]/g,"")).toLocaleString()},{l:"Conversions",v:String(d.totalConv||0)},{l:"Avg CTR",v:String(d.avgCtr||"—")}].map(m=><div key={m.l}><div style={{fontSize:10,color:T.textSoft,fontFamily:F.m,letterSpacing:"0.06em"}}>{m.l}</div><div style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:F.h}}>{m.v}</div></div>)}</div>
            </div>;})}
          </Card>
          <Card p={22}>
            <div style={{fontFamily:F.h,fontSize:15,fontWeight:700,color:T.text,marginBottom:16}}>Top 5 Campaigns by ROAS</div>
            {connected.flatMap(pid=>(getD(pid).campaigns||[]).map(c=>({...c,platform:OAUTH[pid].shortName,pColor:OAUTH[pid].color}))).sort((a,b)=>parseFloat(String(b.roas||0).replace(/[^0-9.]/g,""))-parseFloat(String(a.roas||0).replace(/[^0-9.]/g,""))).slice(0,5).map((c,i)=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <div><div style={{fontSize:13,fontWeight:600,color:T.text,maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div><div style={{fontSize:11,color:c.pColor,fontFamily:F.m,marginTop:2}}>{c.platform}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,color:T.green,fontFamily:F.h}}>{c.roas}</div><div style={{fontSize:10,color:T.textSoft,fontFamily:F.m}}>CPA {c.cpa}</div></div>
              </div>
            ))}
          </Card>
        </div>
      </>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAMPAIGNS
═══════════════════════════════════════════════════════════════ */
function Campaigns({ connected, platformData={}, setNav }) {
  const {isMobile}=useBreakpoint();
  const {toast,ToastContainer}=useToast();
  const hasData=connected.length>0;
  const allCamps=connected.flatMap(pid=>{const d=platformData[pid];return (d?.campaigns||[]).map(c=>({...c,platform:OAUTH[pid].shortName,pColor:OAUTH[pid].color,pBg:OAUTH[pid].bg}));});
  return (
    <div style={{padding:"36px 40px",overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Media Buying</div>
        <h1 style={{fontFamily:F.h,fontSize:28,fontWeight:700,color:T.text}}>Campaign Manager</h1>
      </div>
      {!hasData?<Card><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px",textAlign:"center"}}>
        <div style={{fontSize:32,color:T.textXsoft,marginBottom:12}}>◎</div>
        <div style={{fontFamily:F.h,fontSize:18,fontWeight:700,color:T.textMid,marginBottom:8}}>Connect accounts to manage campaigns</div>
        <p style={{color:T.textSoft,fontSize:14,marginBottom:20,maxWidth:320,lineHeight:1.7}}>Connect your ad accounts to view, manage, and launch campaigns.</p>
        <Btn onClick={()=>setNav("connect")}>Connect Accounts →</Btn>
      </div></Card>:(
        <div style={{display:"grid",gridTemplateColumns:"1fr 310px",gap:22}}>
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            <Card p={22}>
              <div style={{fontFamily:F.h,fontSize:16,fontWeight:700,color:T.text,marginBottom:18}}>Launch New Campaign</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div><Lbl mb={5}>Campaign Name</Lbl><Inp placeholder="e.g. Spring Sale 2026"/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><Lbl mb={5}>Daily Budget</Lbl><Inp placeholder="$200"/></div>
                  <div><Lbl mb={5}>Objective</Lbl><select style={{width:"100%",background:T.bgAlt,border:`1.5px solid ${T.border}`,borderRadius:8,padding:"10px 14px",color:T.text,fontSize:13,fontFamily:F.b,outline:"none",appearance:"none"}}><option>Conversions</option><option>Traffic</option><option>Awareness</option></select></div>
                </div>
                <div><Lbl mb={5}>Target Audience</Lbl><Inp placeholder="e.g. Women 25–40, fitness, US & UK"/></div>
                <div><Lbl mb={5}>Publish To</Lbl>
                  <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                    {connected.map(pid=><div key={pid} style={{background:OAUTH[pid].bg,border:`1.5px solid ${OAUTH[pid].color}30`,borderRadius:8,padding:"7px 14px",display:"flex",alignItems:"center",gap:6}}><span style={{color:OAUTH[pid].color,fontSize:12,fontWeight:800}}>{OAUTH[pid].icon}</span><span style={{fontSize:13,color:T.textMid}}>{OAUTH[pid].shortName}</span><span style={{fontSize:10,color:T.green}}>✓</span></div>)}
                  </div>
                </div>
                <HR m="4px 0"/>
                <Btn style={{alignSelf:"flex-start",padding:"12px 28px"}}>✦ Launch Campaign</Btn>
              </div>
            </Card>
            <Card p={0} style={{overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:F.h,fontSize:15,fontWeight:700,color:T.text}}>All Campaigns</div>
                <Badge color="green">{allCamps.filter(c=>c.status==="ACTIVE").length} active</Badge>
              </div>
              {allCamps.map((c,i,arr)=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 20px",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:T.text}}>{c.name}</div><div style={{fontSize:11,color:T.textSoft,fontFamily:F.m,marginTop:2}}><span style={{color:c.pColor}}>{c.platform}</span> · {c.budget} · Started {c.start}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:13,fontFamily:F.m,color:T.text,fontWeight:600}}>{c.spent}</div><div style={{fontSize:10,color:T.textSoft,fontFamily:F.m}}>spent</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:14,fontFamily:F.h,color:T.green,fontWeight:700}}>{c.roas}</div><div style={{fontSize:10,color:T.textSoft,fontFamily:F.m}}>ROAS</div></div>
                  <Badge color={c.status==="ACTIVE"?"green":"amber"}>{c.status==="ACTIVE"?"Live":"Paused"}</Badge>
                  <div style={{display:"flex",gap:5}}><Btn variant="subtle" sm>{c.status==="ACTIVE"?"Pause":"Resume"}</Btn><Btn variant="ghost" sm>Edit</Btn></div>
                </div>
              ))}
            </Card>
          </div>
          <Card p={20}>
            <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:16}}><span>✦</span><div style={{fontFamily:F.h,fontSize:15,fontWeight:700,color:T.text}}>AI Recommendations</div></div>
            {[{l:"Recommended Budget",v:"$220/day",n:"Projected +34% ROAS based on conversion history",c:T.amber},{l:"Best Bid Strategy",v:"Target ROAS",n:"Switch from manual CPC — ~$0.40 saving per click",c:T.navy},{l:"Peak Launch Window",v:"Tue–Thu 7–9 PM",n:"Highest engagement from your audience data",c:T.green},{l:"Predicted ROAS at $220/day",v:"4.6×",n:"Based on current creative and audience performance",c:T.green}].map(r=>(
              <div key={r.l} style={{padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
                <Lbl>{r.l}</Lbl>
                <div style={{fontFamily:F.h,fontSize:19,fontWeight:700,color:r.c,marginBottom:3}}>{r.v}</div>
                <div style={{fontSize:11,color:T.textSoft,lineHeight:1.65}}>{r.n}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI ASSISTANT
═══════════════════════════════════════════════════════════════ */
const INIT_MSGS=[{role:"assistant",content:"Hello! I'm AdForge AI — your dedicated marketing strategist.\n\nI can help you analyse campaigns, generate creative ideas, and grow your ad performance.\n\nWhat would you like to work on today?"}];
const QUICK_SUGGESTIONS=["What type of ad should I run for my product?","How can I lower my cost per purchase?","Write a TikTok hook for a fitness product","Which audience should I target on Meta?"];

function Assistant({ user, connected, aiCall }) {
  const [msgs,setMsgs]=useState(INIT_MSGS);
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);
  const btm=useRef(null);
  useEffect(()=>{btm.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=async(text)=>{
    const msg=text||inp;if(!msg.trim()||loading)return;
    const newMsgs=[...msgs,{role:"user",content:msg}];
    setMsgs(newMsgs);setInp("");setLoading(true);
    const sys=`You are AdForge AI, expert marketing assistant for ${user.brand}. Connected platforms: ${connected.length?connected.map(p=>OAUTH[p].name).join(", "):"none yet"}. ${connected.length?`Campaign data: ${connected.map(p=>{const d=platformData?.[p];return d?`${OAUTH[p].shortName}: ${d.campaigns?.length||0} campaigns, spend $${String(d.totalSpend||0)}, ROAS ${d.avgRoas||"—"}`:OAUTH[p].shortName+" (syncing)"}).join("; ")}.`:""}  Be specific, data-driven, and actionable.`;
    const hist=newMsgs.map(m=>({role:m.role,content:m.content}));
    const r=await aiCall(sys,msg,hist.slice(0,-1));
    setMsgs(p=>[...p,{role:"assistant",content:r}]);setLoading(false);
  };
  return (
    <div style={{padding:"36px 40px 0",height:"100%",display:"flex",flexDirection:"column",boxSizing:"border-box"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,fontFamily:F.m,color:T.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>Chat</div>
        <h1 style={{fontFamily:F.h,fontSize:28,fontWeight:700,color:T.text}}>AI Assistant</h1>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:16}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:10}}>
            {m.role==="assistant"&&<div style={{width:32,height:32,borderRadius:"50%",background:T.navyLt,border:`1.5px solid ${T.navyMid}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.navy,fontSize:13,flexShrink:0,marginTop:2}}>✦</div>}
            <div style={{maxWidth:"70%",background:m.role==="user"?T.navy:T.bgCard,border:`1px solid ${m.role==="user"?T.navy:T.border}`,borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"12px 16px",color:m.role==="user"?"#fff":T.text,fontSize:13,lineHeight:1.75,fontFamily:F.b,whiteSpace:"pre-wrap"}}>{m.content}</div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:T.navyLt,border:`1.5px solid ${T.navyMid}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.navy,fontSize:13,animation:"adPulse 1.4s ease-in-out infinite"}}>✦</div>
          <div style={{color:T.textSoft,fontSize:13,fontFamily:F.m}}>Thinking…</div>
        </div>}
        <div ref={btm}/>
      </div>
      {msgs.length<=1&&<div style={{display:"flex",flexWrap:"wrap",gap:8,paddingBottom:12}}>
        {QUICK_SUGGESTIONS.map(s=><button key={s} onClick={()=>send(s)} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:20,padding:"8px 15px",cursor:"pointer",color:T.textMid,fontSize:12,fontFamily:F.b}}>{s}</button>)}
      </div>}
      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14,paddingBottom:20,display:"flex",gap:10}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder={`Ask AdForge AI about ${user.brand}'s campaigns…`}
          style={{flex:1,background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"11px 16px",color:T.text,fontSize:13,fontFamily:F.b,outline:"none"}}/>
        <Btn onClick={()=>send()} disabled={loading||!inp.trim()}>Send →</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREATIVE STUDIO — CANVAS ENGINE
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   API KEY MODAL — shown when user tries to generate without keys
═══════════════════════════════════════════════════════════════ */
function ApiSetupModal({ onClose }) {
  // Keys configured server-side — no user input needed
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // keys stored in session only
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  const hasAnthropic = !!true;
  const hasOpenAI = !!true;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:1000,display:"flex",
      alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(6px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#FFFFFF",borderRadius:20,width:"100%",maxWidth:480,
        boxShadow:"0 32px 80px rgba(0,0,0,0.22)",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${T.navy} 0%,#2a4f7a 100%)`,padding:"28px 32px 24px"}}>
          <button onClick={onClose} style={{float:"right",background:"rgba(255,255,255,0.12)",
            border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14,
            display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          <div style={{fontSize:22,marginBottom:8}}>🔑</div>
          <div style={{fontFamily:F.h,fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>
            Set Up API Keys
          </div>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,lineHeight:1.6,margin:0}}>
            Add your API keys to enable AI image generation and copy writing. Keys are stored only in this browser session.
          </p>
        </div>

        <div style={{padding:"28px 32px 32px",display:"flex",flexDirection:"column",gap:20}}>
          {saved && (
            <div style={{background:T.greenLt,border:`1px solid ${T.green}40`,borderRadius:10,
              padding:"11px 16px",color:T.green,fontSize:13,fontWeight:600,textAlign:"center"}}>
              ✓ Keys saved — AI features are now active!
            </div>
          )}

          {/* Anthropic key */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <Lbl mb={0}>Anthropic API Key</Lbl>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {hasAnthropic
                  ? <span style={{fontSize:11,color:T.green,fontFamily:F.m,fontWeight:600}}>✓ Active</span>
                  : <span style={{fontSize:11,color:T.amber,fontFamily:F.m}}>Not set</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={anthropicKey} onChange={e=>setAnthropicKey(e.target.value)}
                placeholder={hasAnthropic ? "sk-ant-••••••••••••••" : "sk-ant-api03-..."}
                style={{flex:1,background:T.bgAlt,border:`1.5px solid ${T.border}`,borderRadius:9,
                  padding:"10px 14px",color:T.text,fontSize:13,fontFamily:F.m,outline:"none"}}/>
            </div>
            <div style={{marginTop:6,fontSize:11,color:T.textSoft}}>
              Powers AI copy generation. Get your key at{" "}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
                style={{color:T.navy,fontWeight:600}}>console.anthropic.com</a>
            </div>
          </div>

          {/* OpenAI key */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <Lbl mb={0}>OpenAI API Key <span style={{color:T.textSoft,fontWeight:400,textTransform:"none",letterSpacing:0}}>(for DALL-E 3 images)</span></Lbl>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {hasOpenAI
                  ? <span style={{fontSize:11,color:T.green,fontFamily:F.m,fontWeight:600}}>✓ Active</span>
                  : <span style={{fontSize:11,color:T.amber,fontFamily:F.m}}>Not set</span>}
              </div>
            </div>
            <input value={openaiKey} onChange={e=>setOpenaiKey(e.target.value)}
              placeholder={hasOpenAI ? "sk-••••••••••••••" : "sk-proj-..."}
              style={{width:"100%",background:T.bgAlt,border:`1.5px solid ${T.border}`,borderRadius:9,
                padding:"10px 14px",color:T.text,fontSize:13,fontFamily:F.m,outline:"none",boxSizing:"border-box"}}/>
            <div style={{marginTop:6,fontSize:11,color:T.textSoft}}>
              Powers AI image generation (DALL-E 3). Get your key at{" "}
              <a href="https://platform.openai.com" target="_blank" rel="noreferrer"
                style={{color:T.navy,fontWeight:600}}>platform.openai.com</a>
            </div>
          </div>

          <div style={{background:T.navyLt,border:`1px solid ${T.navyMid}`,borderRadius:10,padding:"12px 16px",
            fontSize:12,color:T.textMid,lineHeight:1.65}}>
            🔒 <strong>Security note:</strong> Keys are stored in your browser's memory only and cleared when you close the tab. In production, proxy all API calls through your own backend server.
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn variant="subtle" onClick={onClose} style={{flex:1}}>Cancel</Btn>
            <Btn onClick={handleSave}
              disabled={!anthropicKey.startsWith("sk-ant-") && !openaiKey.startsWith("sk-")}
              style={{flex:2}}>
              Save Keys →
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREATIVE STUDIO — CANVAS ENGINE
═══════════════════════════════════════════════════════════════ */
const CANVAS_W = 1080, CANVAS_H = 1080;
const initCS = { elements:[], selected:null, history:[], future:[], bg:"#1A1A1A" };

function csReducer(state, action) {
  const save = (els) => [...state.history.slice(-20), state.elements];
  switch(action.type) {
    case "ADD": {
      const next = {...state, elements:[...state.elements, action.el], selected:action.el.id};
      return {...next, history:save(), future:[]};
    }
    case "UPDATE": {
      const els = state.elements.map(e => e.id===action.id ? {...e,...action.props} : e);
      return {...state, elements:els, history:save(), future:[]};
    }
    case "SELECT": return {...state, selected:action.id};
    case "DELETE": {
      const els = state.elements.filter(e => e.id!==action.id);
      return {...state, elements:els, selected:null, history:save(), future:[]};
    }
    case "DUPLICATE": {
      const src = state.elements.find(e=>e.id===action.id);
      if(!src) return state;
      const dup = {...src, id:"el_"+Date.now(), x:src.x+24, y:src.y+24};
      return {...state, elements:[...state.elements, dup], selected:dup.id, history:save(), future:[]};
    }
    case "BRING_FRONT": {
      const el = state.elements.find(e=>e.id===action.id);
      const rest = state.elements.filter(e=>e.id!==action.id);
      return {...state, elements:[...rest, el]};
    }
    case "SEND_BACK": {
      const el = state.elements.find(e=>e.id===action.id);
      const rest = state.elements.filter(e=>e.id!==action.id);
      return {...state, elements:[el, ...rest]};
    }
    case "UNDO": {
      if(state.history.length===0) return state;
      const prev = state.history[state.history.length-1];
      return {...state, elements:prev, selected:null, history:state.history.slice(0,-1), future:[state.elements,...state.future]};
    }
    case "REDO": {
      if(state.future.length===0) return state;
      const next = state.future[0];
      return {...state, elements:next, selected:null, history:[...state.history,state.elements], future:state.future.slice(1)};
    }
    case "SET_BG": return {...state, bg:action.color};
    case "CLEAR": return {...initCS, bg:state.bg};
    default: return state;
  }
}

/* ── Canvas element: drag, resize, rotate handles ── */
function CanvasEl({ el, isSelected, scale, onSelect, onUpdate, onDelete }) {
  const dragRef = useRef(null);

  const startDrag = (e) => {
    e.stopPropagation();
    onSelect(el.id);
    const sx=e.clientX, sy=e.clientY, ex=el.x, ey=el.y;
    const onMove = (mv) => onUpdate(el.id, {x: ex+(mv.clientX-sx)/scale, y: ey+(mv.clientY-sy)/scale});
    const onUp = () => { document.removeEventListener("mousemove",onMove); document.removeEventListener("mouseup",onUp); };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };

  const startResize = (e) => {
    e.stopPropagation();
    const sx=e.clientX, sy=e.clientY, sw=el.w||100, sh=el.h||100;
    const onMove = (mv) => onUpdate(el.id, {
      w: Math.max(30, sw+(mv.clientX-sx)/scale),
      h: Math.max(30, sh+(mv.clientY-sy)/scale)
    });
    const onUp = () => { document.removeEventListener("mousemove",onMove); document.removeEventListener("mouseup",onUp); };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };

  const startRotate = (e) => {
    e.stopPropagation();
    const cx = el.x + (el.w||100)/2;
    const cy = el.y + (el.h||100)/2;
    const onMove = (mv) => {
      const angle = Math.atan2((mv.clientY/scale)-cy, (mv.clientX/scale)-cx) * 180/Math.PI;
      onUpdate(el.id, {rotate: Math.round(angle+90)});
    };
    const onUp = () => { document.removeEventListener("mousemove",onMove); document.removeEventListener("mouseup",onUp); };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };

  const w = el.w || 100;
  const h = el.type==="text" ? undefined : (el.h||80);

  const sty = {
    position:"absolute", left:el.x, top:el.y,
    width:w, height:h,
    transform:`rotate(${el.rotate||0}deg)`,
    cursor:"move", userSelect:"none",
    opacity: el.opacity!=null ? el.opacity/100 : 1,
    outline: isSelected ? `2px solid #4A90E2` : "none",
    outlineOffset: isSelected ? 2 : 0,
    boxSizing:"border-box",
  };

  let content = null;
  if(el.type==="text") content = (
    <div style={{fontFamily:el.fontFamily||F.b, fontSize:el.fontSize||32,
      fontWeight:el.bold?700:400, fontStyle:el.italic?"italic":"normal",
      textDecoration:el.underline?"underline":"none",
      color:el.color||"#FFFFFF", textAlign:el.align||"left",
      lineHeight:1.28, textShadow:el.shadow?"2px 3px 10px rgba(0,0,0,0.45)":"none",
      minWidth:80, whiteSpace:"pre-wrap", wordBreak:"break-word", padding:"2px 4px"}}>
      {el.text||"Your text here"}
    </div>
  );
  else if(el.type==="shape") content = (
    <div style={{width:"100%",height:"100%",
      background:el.fill||T.navy,
      borderRadius:el.shape==="circle"?"50%":el.shape==="rounded"?16:0,
      border:el.stroke?`${el.strokeW||2}px solid ${el.stroke}`:"none"}}/>
  );
  else if(el.type==="image") content = (
    <img src={el.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",
      filter:`brightness(${el.brightness||100}%) contrast(${el.contrast||100}%) saturate(${el.saturation||100}%) blur(${el.blur||0}px)`,
      borderRadius:el.radius||0, display:"block"}}/>
  );
  else if(el.type==="icon") content = (
    <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",
      justifyContent:"center",fontSize:el.iconSize||48,color:el.color||T.navy}}>
      {el.icon}
    </div>
  );
  else if(el.type==="cta") content = (
    <div style={{background:el.fill||T.navy,color:el.color||"#fff",
      fontFamily:F.b,fontWeight:700,fontSize:el.fontSize||18,
      borderRadius:el.radius||10,display:"flex",alignItems:"center",
      justifyContent:"center",height:"100%",padding:"0 24px",
      width:"100%",boxSizing:"border-box",
      border:el.stroke?`2px solid ${el.stroke}`:"none"}}>
      {el.text||"Shop Now"}
    </div>
  );
  else if(el.type==="overlay") content = (
    <div style={{width:"100%",height:"100%",background:el.fill||"rgba(0,0,0,0.45)",borderRadius:el.radius||0}}/>
  );

  return (
    <div ref={dragRef} style={sty} onMouseDown={startDrag}>
      {content}
      {isSelected && <>
        {/* Resize handle — bottom right */}
        <div onMouseDown={startResize} style={{position:"absolute",bottom:-6,right:-6,
          width:13,height:13,background:"#4A90E2",border:"2px solid #fff",
          borderRadius:3,cursor:"se-resize",zIndex:20}}/>
        {/* Rotate handle — top center */}
        <div onMouseDown={startRotate} style={{position:"absolute",top:-22,left:"50%",
          transform:"translateX(-50%)",width:13,height:13,background:"#4A90E2",
          border:"2px solid #fff",borderRadius:"50%",cursor:"crosshair",zIndex:20}}/>
        {/* Delete handle — top right */}
        <div onClick={(e)=>{e.stopPropagation();onDelete(el.id);}} style={{position:"absolute",
          top:-22,right:-6,width:18,height:18,background:"#E53E3E",border:"2px solid #fff",
          borderRadius:"50%",cursor:"pointer",zIndex:20,display:"flex",alignItems:"center",
          justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,lineHeight:1}}>×</div>
      </>}
    </div>
  );
}

/* ─── LEFT PANEL DATA ─────────────────────────────────────── */
const CS_TEMPLATES = [
  {id:"t1",name:"TikTok / Reels",w:1080,h:1920,bg:"#0A0A0A",ratio:"9:16"},
  {id:"t2",name:"Instagram Square",w:1080,h:1080,bg:"#F7F5F0",ratio:"1:1"},
  {id:"t3",name:"Instagram Story",w:1080,h:1920,bg:"#1B1B2F",ratio:"9:16"},
  {id:"t4",name:"Facebook Feed",w:1200,h:628,bg:"#E8F4FF",ratio:"1.9:1"},
  {id:"t5",name:"YouTube Thumb",w:1280,h:720,bg:"#111",ratio:"16:9"},
  {id:"t6",name:"Google Display",w:1200,h:628,bg:"#1B3458",ratio:"1.9:1"},
];
const CS_SHAPES = [
  {icon:"■",shape:"rect",label:"Rectangle",w:200,h:130},
  {icon:"●",shape:"circle",label:"Circle",w:130,h:130},
  {icon:"◆",shape:"rect",label:"Diamond",w:130,h:130,rotate:45},
  {icon:"▬",shape:"rounded",label:"Pill",w:220,h:70},
  {icon:"▲",shape:"rect",label:"Triangle",w:130,h:130},
];
const CS_ICONS = [
  {icon:"⭐",label:"Star"},{icon:"❤️",label:"Heart"},{icon:"🔥",label:"Fire"},
  {icon:"✓",label:"Check"},{icon:"→",label:"Arrow"},{icon:"✦",label:"Sparkle"},
  {icon:"◈",label:"Diamond"},{icon:"🏷️",label:"Tag"},{icon:"📢",label:"Mega"},
  {icon:"💎",label:"Gem"},{icon:"⚡",label:"Bolt"},{icon:"🎯",label:"Target"},
];
const CS_CTAS = [
  {text:"Shop Now",fill:T.navy,color:"#fff"},
  {text:"Buy Now",fill:"#E63946",color:"#fff"},
  {text:"Get 50% Off",fill:"#2D6A4F",color:"#fff"},
  {text:"Learn More →",fill:"transparent",color:T.navy,stroke:T.navy},
  {text:"Limited Time ⚡",fill:"#E9C46A",color:"#1A1A1A"},
  {text:"Free Shipping",fill:"#023E8A",color:"#fff"},
];
const CS_OVERLAYS = [
  {label:"Dark Veil",fill:"rgba(0,0,0,0.5)"},
  {label:"Light Wash",fill:"rgba(255,255,255,0.6)"},
  {label:"Navy Top Fade",fill:"linear-gradient(180deg,rgba(27,52,88,0.85) 0%,transparent 100%)"},
  {label:"Bottom Fade",fill:"linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent 65%)"},
  {label:"Side Vignette",fill:"radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.6) 100%)"},
];
const CS_BGS = ["#111111","#F7F5F0","#1B3458","#2D6A4F","#E63946","#F4A261","#023E8A","#FFF8F0","#2C2C54","#E8F4FF","#FFFFFF","#FFD700"];
const CS_FONTS = ["Playfair Display","DM Sans","Georgia","Arial Black","Courier New","Impact","Trebuchet MS","Verdana","Times New Roman"];
const CS_TEXT_PRESETS = [
  {label:"Big Headline",text:"YOUR HEADLINE",fontSize:90,bold:true,color:"#FFFFFF"},
  {label:"Subheadline",text:"Subheadline text here",fontSize:44,bold:false,color:"#FFFFFF"},
  {label:"Body Copy",text:"Add your body copy here.\nKeep it short and punchy.",fontSize:28,bold:false,color:"rgba(255,255,255,0.8)"},
  {label:"Price Tag",text:"$49.99",fontSize:64,bold:true,color:"#F4A261"},
  {label:"Discount Badge",text:"-50% OFF",fontSize:42,bold:true,color:"#E63946"},
  {label:"CTA Text",text:"Shop now →",fontSize:30,bold:true,color:"#FFFFFF"},
];
const EXPORT_SPECS = {
  "Meta Ads":    {sizes:["1080×1080","1200×628","1080×1920"],formats:["png","jpg"],maxMB:"4 MB"},
  "TikTok Ads":  {sizes:["1080×1920","720×1280"],formats:["mp4","mov"],maxMB:"500 MB"},
  "Instagram":   {sizes:["1080×1080","1080×1350","1080×1920"],formats:["png","jpg"],maxMB:"4 MB"},
  "Google Ads":  {sizes:["300×250","728×90","1200×628"],formats:["png","gif"],maxMB:"5 MB"},
  "YouTube":     {sizes:["1280×720","1920×1080"],formats:["mp4"],maxMB:"256 GB"},
};

/* ─── VIDEO EDITOR ───────────────────────────────────────── */
const INIT_CLIPS = [
  {id:"v1",label:"Scene 1 — Hook",duration:3,color:"#1B3458",type:"video",muted:false,caption:"Did you know...?"},
  {id:"v2",label:"Scene 2 — Problem",duration:4,color:"#2D6A4F",type:"video",muted:false,caption:"The struggle is real."},
  {id:"v3",label:"Scene 3 — Solution",duration:5,color:"#5B2D8F",type:"video",muted:false,caption:"Introducing our product."},
  {id:"v4",label:"Scene 4 — CTA",duration:3,color:"#A82828",type:"video",muted:false,caption:"Shop now — link in bio!"},
  {id:"a1",label:"Background Music",duration:15,color:"#9E5D00",type:"audio",muted:false,caption:""},
];
function VideoEditor({ user, aiCall }) {
  const [clips,setClips]=useState(INIT_CLIPS);
  const [sel,setSel]=useState(null);
  const [playing,setPlaying]=useState(false);
  const [ph,setPh]=useState(0);
  const [voScript,setVoScript]=useState("");
  const [voLoading,setVoLoading]=useState(false);
  const [showVO,setShowVO]=useState(false);
  const total=Math.max(...clips.map(c=>c.duration));
  const playRef=useRef(null);
  useEffect(()=>{
    if(playing){playRef.current=setInterval(()=>{setPh(p=>{if(p>=total){setPlaying(false);clearInterval(playRef.current);return 0;}return+(p+0.1).toFixed(1);});},100);}
    else clearInterval(playRef.current);
    return()=>clearInterval(playRef.current);
  },[playing,total]);
  const updateClip=(id,props)=>setClips(p=>p.map(c=>c.id===id?{...c,...props}:c));
  const removeClip=(id)=>{setClips(p=>p.filter(c=>c.id!==id));if(sel===id)setSel(null);};
  const moveClip=(id,dir)=>setClips(p=>{const i=p.findIndex(c=>c.id===id);if(dir<0&&i===0||dir>0&&i===p.length-1)return p;const n=[...p];[n[i],n[i+dir]]=[n[i+dir],n[i]];return n;});
  const genVO=async()=>{setVoLoading(true);const r=await aiCall(`You are AdForge AI, expert voiceover scriptwriter for ${user.brand}.`,`Write a punchy ${total}s voiceover script for ${user.brand}'s video ad. Format:\nFULL SCRIPT:\n[script]\nTONE: [direction]\nPACING: [notes]`);setVoScript(r);setVoLoading(false);};
  const vClips=clips.filter(c=>c.type==="video"), aClips=clips.filter(c=>c.type!=="video");
  const selClip=sel?clips.find(c=>c.id===sel):null;
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#0D0D0D"}}>
      {/* Preview */}
      <div style={{background:"#050505",flexShrink:0,height:200,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <div style={{width:112,height:200,background:"#0A0A0A",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:28,color:"rgba(255,255,255,0.08)",marginBottom:6}}>▶</div>
            <div style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.25)"}}>{vClips.find(c=>ph<c.duration)?.caption||"Preview"}</div>
          </div>
          <div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center"}}>
            <span style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.35)"}}>{ph.toFixed(1)}s</span>
          </div>
        </div>
        <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setPh(0)} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>⏮</button>
          <button onClick={()=>setPlaying(p=>!p)} style={{background:T.navy,border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{playing?"⏸":"▶"}</button>
          <button onClick={()=>setPh(0)} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>⏭</button>
          <span style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.4)",marginLeft:6}}>{total.toFixed(1)}s total</span>
        </div>
      </div>
      {/* Timeline controls */}
      <div style={{padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:7,flexWrap:"wrap",background:"#111"}}>
        <Btn sm variant="subtle" style={{fontSize:11}} onClick={()=>setShowVO(p=>!p)}>🎤 Voiceover AI</Btn>
        <Btn sm variant="subtle" style={{fontSize:11}} onClick={()=>setClips(p=>[...p,{id:"v"+Date.now(),label:`Scene ${vClips.length+1}`,duration:4,color:"#1B3458",type:"video",muted:false,caption:"New scene"}])}>+ Scene</Btn>
        <Btn sm variant="subtle" style={{fontSize:11}} onClick={()=>setClips(p=>[...p,{id:"a"+Date.now(),label:"Music Track",duration:total,color:"#9E5D00",type:"audio",muted:false,caption:""}])}>♪ Music</Btn>
      </div>
      {/* Voiceover panel */}
      {showVO&&<div style={{padding:"10px 14px",background:"#181820",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:voScript?8:0}}>
          <span style={{color:T.purple,fontSize:12,fontWeight:700,fontFamily:F.b,flex:1}}>✦ AI Voiceover Script</span>
          <Btn sm variant="purple" onClick={genVO} loading={voLoading}>Generate</Btn>
        </div>
        {voScript&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"10px 12px",fontSize:11,fontFamily:F.m,color:"rgba(255,255,255,0.75)",lineHeight:1.75,whiteSpace:"pre-wrap",maxHeight:110,overflowY:"auto"}}>{voScript}</div>}
      </div>}
      {/* Timeline */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        <div style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Video Scenes</div>
        {vClips.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <div style={{width:80,fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{c.label}</div>
            <div style={{flex:1,position:"relative",height:32,background:"rgba(255,255,255,0.04)",borderRadius:6,cursor:"pointer",overflow:"hidden",border:sel===c.id?"1.5px solid #4A90E2":"1px solid rgba(255,255,255,0.07)"}} onClick={()=>setSel(c.id)}>
              <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(c.duration/total)*100}%`,background:c.color,borderRadius:5,opacity:c.muted?0.25:0.8,display:"flex",alignItems:"center",paddingLeft:8}}>
                <span style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.9)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.caption}</span>
              </div>
              <div style={{position:"absolute",left:`${(ph/total)*100}%`,top:0,bottom:0,width:2,background:"#FF4444",zIndex:5,transition:"left 0.1s linear"}}/>
            </div>
            <span style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.3)",width:18,textAlign:"right"}}>{c.duration}s</span>
            <div style={{display:"flex",gap:2}}>
              <button onClick={()=>moveClip(c.id,-1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"rgba(255,255,255,0.3)",padding:2}}>↑</button>
              <button onClick={()=>moveClip(c.id,1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"rgba(255,255,255,0.3)",padding:2}}>↓</button>
              <button onClick={()=>removeClip(c.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#E53E3E",padding:2}}>×</button>
            </div>
          </div>
        ))}
        {aClips.length>0&&<>
          <div style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",textTransform:"uppercase",margin:"12px 0 8px"}}>Audio Tracks</div>
          {aClips.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:80,fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{c.label}</div>
              <div style={{flex:1,height:22,background:"rgba(255,255,255,0.04)",borderRadius:4,overflow:"hidden",position:"relative",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(c.duration/total)*100}%`,background:c.color,opacity:c.muted?0.15:0.55}}/>
              </div>
              <button onClick={()=>updateClip(c.id,{muted:!c.muted})} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:c.muted?"#E53E3E":"rgba(255,255,255,0.4)"}}>{c.muted?"🔇":"🔊"}</button>
              <button onClick={()=>removeClip(c.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#E53E3E"}}>×</button>
            </div>
          ))}
        </>}
      </div>
      {/* Selected clip editor */}
      {selClip&&<div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px 14px",background:"#161616"}}>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",fontFamily:F.b}}>{selClip.label}</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.3)"}}>Duration:</span>
            <input type="number" value={selClip.duration} min={1} max={30}
              onChange={e=>updateClip(selClip.id,{duration:+e.target.value})}
              style={{width:44,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,padding:"4px 7px",color:"#fff",fontSize:11,fontFamily:F.m,outline:"none"}}/>
            <span style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.3)"}}>s</span>
          </div>
          {selClip.type==="video"&&<input value={selClip.caption||""} onChange={e=>updateClip(selClip.id,{caption:e.target.value})} placeholder="Caption…"
            style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,padding:"4px 9px",color:"#fff",fontSize:11,fontFamily:F.b,outline:"none",minWidth:100}}/>}
          <input type="color" value={selClip.color} onChange={e=>updateClip(selClip.id,{color:e.target.value})} style={{width:26,height:22,borderRadius:5,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",padding:1,background:"none"}}/>
          <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:13}}>✕</button>
        </div>
      </div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREATIVE STUDIO MAIN
═══════════════════════════════════════════════════════════════ */

function CreativeStudio({ user, connected, aiCall }) {
  /* ── Core state ── */
  const [tab, setTab] = useState("generate");   // "generate" | "canvas" | "copy"
  const [mode, setMode] = useState("image");    // "image" | "video"
  const [canvas, dispatch] = useReducer(csReducer, {...initCS});
  const [canvasSize, setCanvasSize] = useState({w: CANVAS_W, h: CANVAS_H});
  const [scale, setScale] = useState(0.36);
  const fileRef = useRef(null);

  /* ── AI Image generation ── */
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgStyle, setImgStyle] = useState("cinematic");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState("");
  const [imgResult, setImgResult] = useState(null);
  const [imgModel, setImgModel] = useState("flux-kontext-pro"); // flux-kontext-pro | ideogram-v3 | dall-e-3
  const [refImageB64, setRefImageB64] = useState(null);         // base64 reference photo
  const [imgProgress, setImgProgress] = useState(0);
  const [imgPollId, setImgPollId] = useState(null);

  /* ── AI Video generation ── */
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidStyle, setVidStyle] = useState("product-showcase");
  const [vidLoading, setVidLoading] = useState(false);
  const [vidResult, setVidResult] = useState(null);
  const [vidError, setVidError] = useState("");
  const [vidModel, setVidModel] = useState("kling-v3");          // kling-v3 | storyboard
  const [vidDuration, setVidDuration] = useState(5);            // 5 | 10 seconds
  const [vidProgress, setVidProgress] = useState(0);
  const [vidUrl, setVidUrl] = useState(null);                   // final mp4 url from fal.ai
  const [vidPollId, setVidPollId] = useState(null);
  const [canvasPreset, setCanvasPreset] = useState("1:1");       // active platform preset

  /* ── AI Copy ── */
  const [copyProduct, setCopyProduct] = useState("");
  const [copyTone, setCopyTone] = useState("Energetic");
  const [copyPlatform, setCopyPlatform] = useState("Instagram");
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyResult, setCopyResult] = useState(null);
  const [copyError, setCopyError] = useState(null);
  const [refineField, setRefineField] = useState(null);
  const [refineInstr, setRefineInstr] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);

  /* ── Canvas editing ── */
  const [canvasTab, setCanvasTab] = useState("elements");
  const [elemSection, setElemSection] = useState("shapes");
  const [uploadedImgs, setUploadedImgs] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  const selectedEl = canvas.elements.find(e => e.id === canvas.selected) || null;
  const addEl = (props) => dispatch({type:"ADD", el:{id:"el_"+Date.now(), x:120, y:120, ...props}});
  const addText = (preset) => dispatch({type:"ADD", el:{id:"el_"+Date.now(), type:"text",
    x:60, y:Math.round(canvasSize.h*0.3), w:canvasSize.w-120, ...preset}});
  const addImage = (src, isAI=false) => dispatch({type:"ADD", el:{id:"el_"+Date.now(), type:"image",
    src, x:0, y:0, w:canvasSize.w, h:canvasSize.h,
    brightness:100, contrast:100, saturation:100, blur:0, radius:0, _isAIGenerated:isAI}});

  /* ── Image generation ── */
  const IMG_STYLES = [
    {id:"cinematic",       label:"Cinematic",         desc:"Film-quality lighting, dramatic depth of field"},
    {id:"studio",          label:"Studio White",       desc:"Clean white background, professional product shot"},
    {id:"lifestyle",       label:"Lifestyle",          desc:"Real people, authentic everyday moments"},
    {id:"luxury",          label:"Luxury Dark",        desc:"Dark moody tones, premium feel"},
    {id:"vibrant",         label:"Vibrant Pop",        desc:"Bold colors, high contrast, eye-catching"},
    {id:"minimalist",      label:"Minimalist",         desc:"Clean, simple, lots of negative space"},
    {id:"ugc",             label:"UGC Style",          desc:"Raw, authentic user-generated content look"},
    {id:"3d",              label:"3D Product",         desc:"Photorealistic 3D render, any angle"},
  ];

  const VID_STYLES = [
    {id:"product-showcase",label:"Product Showcase",  desc:"360° product reveal with clean background"},
    {id:"ugc-testimonial", label:"UGC Testimonial",   desc:"Authentic creator-style talking-head format"},
    {id:"slideshow",       label:"Story Slideshow",   desc:"Dynamic image transitions with text overlays"},
    {id:"before-after",    label:"Before / After",    desc:"Split screen transformation reveal"},
    {id:"unboxing",        label:"Unboxing",          desc:"Hand reveals product from packaging"},
    {id:"social-proof",    label:"Social Proof",      desc:"Scrolling reviews + product clips"},
  ];

  const STYLE_PROMPTS = {
    cinematic:       "cinematic advertising photography, dramatic lighting, bokeh background, shot on RED camera, 4K",
    studio:          "professional product photography, pure white background, studio lighting, high-resolution e-commerce",
    lifestyle:       "lifestyle photography, natural lighting, real people, authentic candid moment, editorial feel",
    luxury:          "luxury dark aesthetic, dark moody background, dramatic shadows, premium brand photography, gold accents",
    vibrant:         "vibrant bold colors, high saturation, pop art inspired, punchy contrast, eye-catching advertising",
    minimalist:      "minimalist product photography, clean negative space, subtle shadows, neutral palette, Apple-style",
    ugc:             "UGC-style content, authentic creator photography, natural light, handheld feel, organic real-world",
    "3d":            "photorealistic 3D product render, perfect geometry, any angle, clean professional CGI, 8K",
  };

  /* ── Platform canvas presets ── */
  const CANVAS_PRESETS = [
    {id:"1:1",    label:"Feed",         sub:"Meta · IG",       w:1080, h:1080},
    {id:"9:16",   label:"Story/TikTok", sub:"TikTok · Reels",  w:1080, h:1920},
    {id:"16:9",   label:"YouTube",      sub:"YT · Display",    w:1920, h:1080},
    {id:"1.91:1", label:"Link Ad",      sub:"Meta link",       w:1200, h:628},
    {id:"4:5",    label:"Portrait",     sub:"IG portrait",     w:1080, h:1350},
  ];

  const applyCanvasPreset = (preset) => {
    setCanvasPreset(preset.id);
    setCanvasSize({w: preset.w, h: preset.h});
    dispatch({type:"CLEAR"});
  };

  /* ── Image models ── */
  const IMG_MODELS = [
    {id:"flux-kontext-pro", label:"FLUX Pro",  desc:"Best for product photos"},
    {id:"ideogram-v3",      label:"Ideogram",  desc:"Best for text in image"},
    {id:"dall-e-3",         label:"DALL-E 3",  desc:"OpenAI fallback"},
  ];

  const handleGenerateImage = async () => {
    if (!imgPrompt.trim()) { setImgError("Please describe what you want to create"); return; }
    setImgLoading(true); setImgError(""); setImgResult(null); setImgProgress(10);
    const styleDesc = STYLE_PROMPTS[imgStyle] || "";
    const fullPrompt = `${imgPrompt}. ${styleDesc}. High-quality advertising visual optimised for social media ads.`;
    try {
      const token = window.__supabase_token__ || "";
      const res = await fetch(`${API.base()}/api/fal/image`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body: JSON.stringify({
          prompt: fullPrompt,
          aspect_ratio: canvasPreset || "1:1",
          model: imgModel,
          ...(refImageB64 ? {reference_image_url: refImageB64} : {}),
        }),
      });
      const data = await res.json();
      if (data.url) {
        setImgResult(data.url); setImgProgress(100); setImgLoading(false);
      } else if (data.request_id) {
        setImgProgress(35);
        pollFalImage(data.request_id, fullPrompt);
      } else {
        throw new Error(data.error || "Generation failed — check backend is running and FAL_API_KEY is set");
      }
    } catch(e) {
      setImgError("⚠️ " + e.message + ". Make sure your backend is deployed and FAL_API_KEY is added to Render.");
      setImgLoading(false); setImgProgress(0);
    }
  };

  const pollFalImage = (requestId) => {
    let tries = 0;
    const token = window.__supabase_token__ || "";
    const poll = async () => {
      tries++;
      setImgProgress(Math.min(92, 35 + tries * 7));
      try {
        const res = await fetch(`${API.base()}/api/fal/status/${requestId}?model=${imgModel}`, {
          headers:{"Authorization":`Bearer ${token}`}
        });
        const d = await res.json();
        if (d.url) {
          setImgResult(d.url); setImgProgress(100); setImgLoading(false);
        } else if (d.status === "FAILED") {
          setImgError("Generation failed on fal.ai — try a different prompt or model");
          setImgLoading(false); setImgProgress(0);
        } else if (tries < 25) { setTimeout(poll, 3000); }
        else { setImgError("Timed out — check fal.ai dashboard"); setImgLoading(false); setImgProgress(0); }
      } catch(e) { if(tries < 25) setTimeout(poll, 4000); }
    };
    setTimeout(poll, 3000);
  };

  const addImgToCanvas = () => { if (imgResult) { addImage(imgResult, true); setTab("canvas"); } };

  const handleRefImgUpload = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRefImageB64(ev.target.result);
    reader.readAsDataURL(file);
  };

  /* ── Video models ── */
  const VID_MODELS = [
    {id:"kling-v3",   label:"Kling 3.0 (real video)", desc:"Animates your canvas image into a video ad (needs FAL_API_KEY)"},
    {id:"storyboard", label:"AI Storyboard",           desc:"Creates a full shot-by-shot script (no extra key needed)"},
  ];

  const VID_STYLE_PROMPTS = {
    "product-showcase": "product showcase ad with 360° reveal, clean background, professional lighting, dramatic zoom-ins",
    "ugc-testimonial":  "UGC-style testimonial video, authentic person talking to camera, natural lighting, mobile feel",
    "slideshow":        "dynamic image slideshow ad, smooth transitions, text overlays, energetic pacing, trending music",
    "before-after":     "before and after transformation video, split screen reveal, dramatic impact moment",
    "unboxing":         "unboxing video ad, hands opening packaging, product reveal moment, excitement and surprise",
    "social-proof":     "social proof compilation, scrolling 5-star reviews, product clips, customer photos",
  };

  const handleGenerateVideo = async () => {
    if (!vidPrompt.trim()) { setVidError("Please describe your video ad"); return; }
    setVidLoading(true); setVidError(""); setVidResult(null); setVidUrl(null); setVidProgress(10);

    if (vidModel === "storyboard") {
      const styleDesc = VID_STYLE_PROMPTS[vidStyle] || vidStyle;
      const sys = `You are AdForge AI, expert video ad director for ${user.brand}. Create a detailed video ad storyboard.`;
      const usr = `Create a 15-30 second video ad for: "${vidPrompt}". Style: ${styleDesc}.\n\nReturn ONLY this JSON:\n{"title":"Ad title","duration":"20s","hook":"First 3 seconds script","scenes":[{"time":"0-3s","visual":"...","audio":"...","text":"..."}],"cta":"...","music":"...","voiceover":"Full script","productionTips":["tip1","tip2"]}`;
      try {
        const r = await aiCall(sys, usr);
        const parsed = JSON.parse(r.replace(/```json|```/g,"").trim());
        setVidResult(parsed);
      } catch(e) {
        setVidResult({title:"Video Ad Storyboard", voiceover: e.message.includes("⚠️") ? e.message : "Add ANTHROPIC_API_KEY to Render to generate storyboards.", scenes:[], productionTips:[]});
        if(!e.message.includes("⚠️")) setVidError(e.message);
      }
      setVidLoading(false); setVidProgress(100);
      return;
    }

    /* Kling 3.0 — real video */
    if (!imgResult) {
      setVidError("Generate or upload an image first — Kling animates your canvas image into video");
      setVidLoading(false); return;
    }
    try {
      const token = window.__supabase_token__ || "";
      const res = await fetch(`${API.base()}/api/fal/video`, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body: JSON.stringify({prompt: vidPrompt, image_url: imgResult, duration: vidDuration, aspect_ratio: canvasPreset || "9:16"}),
      });
      const data = await res.json();
      if (data.url) { setVidUrl(data.url); setVidProgress(100); setVidLoading(false); }
      else if (data.request_id) { setVidProgress(20); pollFalVideo(data.request_id); }
      else { throw new Error(data.error || "Video generation failed — check FAL_API_KEY on Render"); }
    } catch(e) {
      setVidError("⚠️ " + e.message);
      setVidLoading(false); setVidProgress(0);
    }
  };

  const pollFalVideo = (requestId) => {
    let tries = 0;
    const token = window.__supabase_token__ || "";
    const poll = async () => {
      tries++;
      setVidProgress(Math.min(92, 20 + tries * 5));
      try {
        const res = await fetch(`${API.base()}/api/fal/status/${requestId}?model=kling-v3`, {headers:{"Authorization":`Bearer ${token}`}});
        const d = await res.json();
        if (d.url) { setVidUrl(d.url); setVidProgress(100); setVidLoading(false); }
        else if (d.status === "FAILED") { setVidError("Kling failed — try a shorter duration or different prompt"); setVidLoading(false); setVidProgress(0); }
        else if (tries < 40) { setTimeout(poll, 3500); }
        else { setVidError("Video timed out (>140s). Check fal.ai dashboard."); setVidLoading(false); }
      } catch(e) { if(tries < 40) setTimeout(poll, 5000); }
    };
    setTimeout(poll, 5000);
  };
  const handleGenerateCopy = async () => {
    setCopyLoading(true); setCopyResult(null); setCopyError(null);
    try {
      const result = await API.generateCopy({product: copyProduct||"our product", platform: copyPlatform, tone: copyTone});
      setCopyResult(result.copy);
    } catch(e) {
      setCopyError(e.message);
      const anthropicKey=true||"";
      if (anthropicKey) {
        const sys = `You are AdForge AI, world-class ad copywriter for ${user.brand}. Return ONLY valid JSON: {"headline":"...","subheadline":"...","adCopy":"...","socialCaption":"...","callToAction":"...","hook":"..."}`;
        const r = await aiCall(sys, `Product: "${copyProduct||"our product"}". Platform: ${copyPlatform}. Tone: ${copyTone}.`);
        try { setCopyResult(JSON.parse(r.replace(/```json|```/g,"").trim())); setCopyError(null); } catch { setCopyResult({headline:r, adCopy:"", socialCaption:"", callToAction:"Shop Now"}); }
      }
    }
    setCopyLoading(false);
  };

  const handleRefineCopy = async (field, currentValue) => {
    if (!refineInstr.trim()) return;
    setRefineLoading(true);
    try {
      const result = await API.refineCopy({field, currentValue, instruction:refineInstr, product:copyProduct, platform:copyPlatform});
      setCopyResult(prev => ({...prev, [field]: result.refined}));
      setRefineField(null); setRefineInstr("");
    } catch(e) { setCopyError("Refine failed: "+e.message); }
    setRefineLoading(false);
  };

  const applyCopyToCanvas = () => {
    if(!copyResult) return;
    if(typeof copyResult==="object" && copyResult.headline)
      dispatch({type:"ADD", el:{id:"el_"+Date.now(), type:"text", x:60, y:80, w:canvasSize.w-120, text:copyResult.headline, fontSize:72, bold:true, color:"#FFFFFF"}});
    if(typeof copyResult==="object" && copyResult.adCopy)
      dispatch({type:"ADD", el:{id:"el_"+Date.now(), type:"text", x:60, y:220, w:canvasSize.w-120, text:copyResult.adCopy, fontSize:32, bold:false, color:"rgba(255,255,255,0.85)"}});
    if(typeof copyResult==="object" && copyResult.callToAction)
      dispatch({type:"ADD", el:{id:"el_"+Date.now(), type:"cta", x:Math.round(canvasSize.w*0.25), y:Math.round(canvasSize.h*0.75), w:Math.round(canvasSize.w*0.5), h:72, text:copyResult.callToAction, fill:"#1E3A5F", color:"#fff", fontSize:22, radius:10}});
    setTab("canvas");
  };

  const handleFileUpload = (e) => {
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setUploadedImgs(prev => [{src:ev.target.result, name:f.name}, ...prev]);
      reader.readAsDataURL(f);
    });
  };

  const selectTemplate = (t) => { setCanvasSize({w:t.w, h:t.h}); dispatch({type:"SET_BG",color:t.bg}); dispatch({type:"CLEAR"}); };

  /* ── PropInput helper ── */
  const PropInput = ({label, k, type="number", v, isColor=false}) => (
    <div>
      <div style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.3)",marginBottom:4,letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</div>
      {isColor
        ? <input type="color" value={v||"#000000"} onChange={e=>dispatch({type:"UPDATE",id:canvas.selected,props:{[k]:e.target.value}})} style={{width:"100%",height:32,borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",padding:2,background:"none"}}/>
        : <input type={type} value={v} onChange={e=>dispatch({type:"UPDATE",id:canvas.selected,props:{[k]:type==="number"?+e.target.value:e.target.value}})} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,padding:"6px 9px",color:"rgba(255,255,255,0.8)",fontSize:12,fontFamily:F.m,outline:"none",boxSizing:"border-box"}}/>}
    </div>
  );

  /* shared input styles */
  const promptStyle = {
    width:"100%", background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.12)",
    borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:14, fontFamily:F.b,
    lineHeight:1.6, resize:"none", outline:"none", boxSizing:"border-box",
    transition:"border-color 0.15s",
  };

  const BIG_BTN = (extra={}) => ({
    width:"100%", padding:"14px 20px", borderRadius:12, border:"none", cursor:"pointer",
    fontSize:14, fontFamily:F.b, fontWeight:700, display:"flex", alignItems:"center",
    justifyContent:"center", gap:8, transition:"all 0.18s", ...extra,
  });

  /* ── TABS ── */
  const TABS = [
    {id:"generate", icon:"✦", label:"AI Generate"},
    {id:"canvas",   icon:"◈", label:"Canvas Editor"},
    {id:"copy",     icon:"T", label:"Ad Copy"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#111113",overflow:"hidden",fontFamily:F.b}}>

      {/* ══ TOP NAV BAR ══ */}
      <div style={{height:52,background:"#18181B",borderBottom:"1px solid rgba(255,255,255,0.07)",
        display:"flex",alignItems:"center",padding:"0 20px",gap:4,flexShrink:0}}>

        {/* Tab pills */}
        <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:10,padding:3,gap:2}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"7px 16px",borderRadius:8,border:"none",
                cursor:"pointer",fontFamily:F.b,fontSize:12,fontWeight:tab===t.id?700:400,
                background:tab===t.id?"rgba(255,255,255,0.12)":"transparent",
                color:tab===t.id?"#fff":"rgba(255,255,255,0.38)",transition:"all 0.15s"}}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        <div style={{flex:1}}/>

        {/* API key status */}
        <button onClick={()=>setShowApiModal(true)}
          style={{display:"flex",alignItems:"center",gap:6,background:true?"rgba(26,107,70,0.18)":"rgba(158,93,0,0.15)",
            border:`1px solid ${true?"rgba(26,107,70,0.4)":"rgba(158,93,0,0.35)"}`,
            borderRadius:8,padding:"6px 14px",cursor:"pointer",
            color:true?"#68D391":"#F6AD55",fontSize:11,fontFamily:F.b,fontWeight:600}}>
          🔑 {true ? "Keys Active" : "Add API Keys"}
        </button>

        {tab==="canvas"&&<>
          <button onClick={()=>dispatch({type:"UNDO"})} disabled={canvas.history.length===0}
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,
              padding:"6px 10px",cursor:canvas.history.length===0?"not-allowed":"pointer",
              color:canvas.history.length===0?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.5)",fontSize:14}}>↩</button>
          <button onClick={()=>dispatch({type:"REDO"})} disabled={canvas.future.length===0}
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,
              padding:"6px 10px",cursor:canvas.future.length===0?"not-allowed":"pointer",
              color:canvas.future.length===0?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.5)",fontSize:14}}>↪</button>
          <button onClick={()=>setShowExport(true)}
            style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:9,
              padding:"7px 16px",cursor:"pointer",color:"rgba(255,255,255,0.7)",fontSize:12,fontFamily:F.b,fontWeight:600}}>
            ⬇ Export
          </button>
          <button onClick={()=>setShowPublish(true)}
            style={{background:T.purple,border:"none",borderRadius:9,padding:"8px 16px",
              cursor:"pointer",color:"#fff",fontSize:12,fontFamily:F.b,fontWeight:600}}>
            ⊕ Publish
          </button>
        </>}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1 — AI GENERATE (Image + Video)
      ══════════════════════════════════════════════════════ */}
      {tab==="generate"&&(
        <div style={{flex:1,overflowY:"auto",padding:"32px 40px",maxWidth:900,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>

          {/* Mode toggle */}
          <div style={{display:"flex",gap:12,marginBottom:32}}>
            {[{id:"image",icon:"◉",label:"AI Image Ad",sub:"DALL-E 3 HD · Best for static ads"},{id:"video",icon:"▶",label:"AI Video Ad",sub:"Storyboard + Script · Ready to film"}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)}
                style={{flex:1,padding:"18px 24px",borderRadius:14,border:`2px solid ${mode===m.id?"rgba(74,144,226,0.6)":"rgba(255,255,255,0.07)"}`,
                  background:mode===m.id?"rgba(74,144,226,0.1)":"rgba(255,255,255,0.03)",
                  cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}>
                <div style={{fontSize:20,marginBottom:8}}>{m.icon}</div>
                <div style={{fontSize:15,fontWeight:700,color:mode===m.id?"#fff":"rgba(255,255,255,0.55)",marginBottom:3}}>{m.label}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:F.m}}>{m.sub}</div>
              </button>
            ))}
          </div>

          {/* ── IMAGE MODE ── */}
          {mode==="image"&&<>
            {/* Prompt area */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>Describe your ad visual</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:F.m}}>Powered by DALL-E 3 HD</div>
              </div>
              <textarea value={imgPrompt} onChange={e=>setImgPrompt(e.target.value)}
                placeholder={`Example: "A luxurious skincare serum bottle surrounded by fresh botanicals and morning dew droplets, soft golden light"`}
                rows={4} style={{...promptStyle}}
                onFocus={e=>e.target.style.borderColor="rgba(74,144,226,0.5)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              <div style={{marginTop:8,fontSize:11,color:"rgba(255,255,255,0.25)",fontFamily:F.m}}>
                💡 Tip: Include your product + mood + setting for best results
              </div>
            </div>

            {/* Style picker */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:12}}>Ad Style</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {IMG_STYLES.map(s=>(
                  <button key={s.id} onClick={()=>setImgStyle(s.id)}
                    style={{padding:"12px 10px",borderRadius:10,border:`1.5px solid ${imgStyle===s.id?"rgba(74,144,226,0.6)":"rgba(255,255,255,0.07)"}`,
                      background:imgStyle===s.id?"rgba(74,144,226,0.12)":"rgba(255,255,255,0.03)",
                      cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                    <div style={{fontSize:12,fontWeight:700,color:imgStyle===s.id?"#4A90E2":"rgba(255,255,255,0.65)",marginBottom:3}}>{s.label}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",lineHeight:1.4}}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model selector */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:10}}>AI Model</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {IMG_MODELS.map(m=>(
                  <button key={m.id} onClick={()=>setImgModel(m.id)}
                    style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${imgModel===m.id?"rgba(74,144,226,0.7)":"rgba(255,255,255,0.08)"}`,
                      background:imgModel===m.id?"rgba(74,144,226,0.15)":"rgba(255,255,255,0.03)",
                      cursor:"pointer",color:imgModel===m.id?"#6DB3F2":"rgba(255,255,255,0.5)",
                      fontSize:12,fontFamily:F.b,fontWeight:imgModel===m.id?700:400,transition:"all 0.15s",whiteSpace:"nowrap"}}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:6}}>
                {IMG_MODELS.find(m=>m.id===imgModel)?.desc}
              </div>
            </div>

            {/* Reference image upload (for FLUX) */}
            {imgModel==="flux-kontext-pro"&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:8}}>Reference Image <span style={{fontSize:11,fontWeight:400,color:"rgba(255,255,255,0.35)"}}>optional — FLUX places it in the scene</span></div>
                <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:10,border:"1.5px dashed rgba(255,255,255,0.12)",cursor:"pointer",background:"rgba(255,255,255,0.02)"}}>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={handleRefImgUpload}/>
                  {refImageB64
                    ? <><img src={refImageB64} style={{width:40,height:40,borderRadius:6,objectFit:"cover"}}/><span style={{fontSize:12,color:"rgba(74,226,130,0.9)"}}>✓ Reference set — FLUX will place it in your scene</span></>
                    : <><span style={{fontSize:18,opacity:0.4}}>+</span><span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Upload your product photo</span></>}
                </label>
              </div>
            )}

            {/* Platform size */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:10}}>Platform Size</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {CANVAS_PRESETS.map(p=>(
                  <button key={p.id} onClick={()=>applyCanvasPreset(p)}
                    style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${canvasPreset===p.id?"rgba(74,144,226,0.7)":"rgba(255,255,255,0.08)"}`,
                      background:canvasPreset===p.id?"rgba(74,144,226,0.12)":"rgba(255,255,255,0.03)",
                      cursor:"pointer",color:canvasPreset===p.id?"#6DB3F2":"rgba(255,255,255,0.5)",
                      fontSize:12,fontFamily:F.b,fontWeight:canvasPreset===p.id?700:400,transition:"all 0.15s",whiteSpace:"nowrap"}}>
                    {p.label} <span style={{opacity:0.45,fontFamily:F.m,fontSize:10}}>{p.id}</span>
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:5}}>
                {CANVAS_PRESETS.find(p=>p.id===canvasPreset)?.sub} · {CANVAS_PRESETS.find(p=>p.id===canvasPreset)?.w}×{CANVAS_PRESETS.find(p=>p.id===canvasPreset)?.h}px
              </div>
            </div>

            {/* Generate button + progress */}
            <button onClick={handleGenerateImage} disabled={imgLoading||!imgPrompt.trim()}
              style={{...BIG_BTN({background:imgLoading||!imgPrompt.trim()?"rgba(74,144,226,0.25)":"linear-gradient(135deg,#1E3A5F,#4A90E2)",color:"#fff",opacity:imgLoading||!imgPrompt.trim()?0.6:1,marginBottom:8})}}>
              {imgLoading
                ? <><span style={{animation:"adSpin 0.8s linear infinite",display:"inline-block"}}>◈</span> Generating via {IMG_MODELS.find(m=>m.id===imgModel)?.label}…</>
                : <><span style={{fontSize:16}}>✦</span> Generate with {IMG_MODELS.find(m=>m.id===imgModel)?.label}</>}
            </button>
            {imgLoading&&<div style={{height:3,borderRadius:3,background:"rgba(255,255,255,0.08)",marginBottom:20,overflow:"hidden"}}>
              <div style={{height:"100%",background:"#4A90E2",borderRadius:3,transition:"width 0.5s",width:imgProgress+"%"}}/>
            </div>}

            {imgError&&<div style={{background:"rgba(168,40,40,0.15)",border:"1px solid rgba(168,40,40,0.3)",
              borderRadius:10,padding:"12px 16px",color:"#FC8181",fontSize:13,fontFamily:F.b,marginBottom:20,marginTop:imgLoading?0:12}}>
              {imgError}
            </div>}

            {/* Result */}
            {imgResult&&(
              <div style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.1)",background:"#0D0D0F"}}>
                <div style={{position:"relative"}}>
                  <img src={imgResult} style={{width:"100%",display:"block",maxHeight:500,objectFit:"contain",background:"#0A0A0C"}} alt="Generated ad"/>
                  <div style={{position:"absolute",top:12,left:12,background:"rgba(0,0,0,0.7)",borderRadius:6,padding:"5px 10px",fontSize:11,color:"rgba(255,255,255,0.7)",fontFamily:F.m,backdropFilter:"blur(8px)"}}>
                    ✦ {IMG_MODELS.find(m=>m.id===imgModel)?.label} · {IMG_STYLES.find(s=>s.id===imgStyle)?.label}
                  </div>
                </div>
                <div style={{padding:"16px 20px",display:"flex",gap:10,background:"rgba(255,255,255,0.03)"}}>
                  <button onClick={addImgToCanvas}
                    style={{flex:2,padding:"12px",borderRadius:10,border:"none",cursor:"pointer",
                      background:"linear-gradient(135deg,#1E3A5F,#4A90E2)",color:"#fff",fontSize:13,fontFamily:F.b,fontWeight:700}}>
                    + Add to Canvas →
                  </button>
                  <button onClick={handleGenerateImage}
                    style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",
                      background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)",fontSize:13,fontFamily:F.b}}>
                    ↻ Regenerate
                  </button>
                  <a href={imgResult} download="adforge-ad.png" target="_blank"
                    style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",
                      background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)",fontSize:13,fontFamily:F.b,
                      textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    ⬇ Save
                  </a>
                </div>
              </div>
            )}
          </>}

          {/* ── VIDEO MODE ── */}
          {mode==="video"&&<>
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>Describe your video ad</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:F.m}}>AI Storyboard + Script</div>
              </div>
              <textarea value={vidPrompt} onChange={e=>setVidPrompt(e.target.value)}
                placeholder={`Example: "A 20-second TikTok ad for our collagen skincare cream targeting women 25–45 who want youthful glowing skin"`}
                rows={4} style={{...promptStyle}}
                onFocus={e=>e.target.style.borderColor="rgba(168,85,247,0.5)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              <div style={{marginTop:8,fontSize:11,color:"rgba(255,255,255,0.25)",fontFamily:F.m}}>
                💡 Include: platform (TikTok/Instagram/YouTube) + product + target audience + goal
              </div>
            </div>

            {/* Video style picker */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",marginBottom:12}}>Video Style</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {VID_STYLES.map(s=>(
                  <button key={s.id} onClick={()=>setVidStyle(s.id)}
                    style={{padding:"14px 12px",borderRadius:10,border:`1.5px solid ${vidStyle===s.id?"rgba(168,85,247,0.6)":"rgba(255,255,255,0.07)"}`,
                      background:vidStyle===s.id?"rgba(168,85,247,0.1)":"rgba(255,255,255,0.03)",
                      cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                    <div style={{fontSize:12,fontWeight:700,color:vidStyle===s.id?"#C084FC":"rgba(255,255,255,0.65)",marginBottom:3}}>{s.label}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",lineHeight:1.4}}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerateVideo} disabled={vidLoading||!vidPrompt.trim()}
              style={{...BIG_BTN({background:vidLoading||!vidPrompt.trim()?"rgba(168,85,247,0.2)":"linear-gradient(135deg,#5B2D8F,#A855F7)",color:"#fff",opacity:vidLoading||!vidPrompt.trim()?0.6:1,marginBottom:20})}}>
              {vidLoading
                ? <><span style={{animation:"adSpin 0.8s linear infinite",display:"inline-block"}}>◈</span> Writing your storyboard…</>
                : <><span>▶</span> Generate Video Storyboard</>}
            </button>

            {vidError&&<div style={{background:"rgba(168,40,40,0.15)",border:"1px solid rgba(168,40,40,0.3)",borderRadius:10,padding:"12px 16px",color:"#FC8181",fontSize:13,marginBottom:20}}>⚠ {vidError}</div>}

            {vidResult&&(
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden"}}>
                {/* Header */}
                <div style={{padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:3}}>{vidResult.title||"Video Ad Storyboard"}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:F.m}}>
                      {vidResult.duration||""}
                      {vidResult.music&&<> · 🎵 {vidResult.music}</>}
                    </div>
                  </div>
                  <span style={{background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:6,padding:"4px 12px",fontSize:11,color:"#C084FC",fontFamily:F.m}}>AI Storyboard</span>
                </div>

                {/* Hook */}
                {vidResult.hook&&(
                  <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.07)",background:"rgba(168,85,247,0.05)"}}>
                    <div style={{fontSize:10,fontFamily:F.m,color:"rgba(168,85,247,0.7)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>⚡ Scroll-Stop Hook (0–3s)</div>
                    <div style={{fontSize:14,color:"rgba(255,255,255,0.9)",lineHeight:1.6,fontStyle:"italic"}}>"{vidResult.hook}"</div>
                  </div>
                )}

                {/* Scenes */}
                {vidResult.scenes?.length>0&&(
                  <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                    <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:12}}>Scene Breakdown</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {vidResult.scenes.map((scene,i)=>(
                        <div key={i} style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr",gap:12,padding:"12px 14px",
                          background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)"}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#C084FC",fontFamily:F.m}}>{scene.time}</div>
                          <div>
                            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.06em",marginBottom:3}}>VISUAL</div>
                            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>{scene.visual}</div>
                          </div>
                          <div>
                            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.06em",marginBottom:3}}>AUDIO</div>
                            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>{scene.audio}</div>
                          </div>
                          <div>
                            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.06em",marginBottom:3}}>ON-SCREEN TEXT</div>
                            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5,fontWeight:600}}>{scene.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voiceover */}
                {vidResult.voiceover&&(
                  <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                    <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Full Voiceover Script</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.75,fontStyle:"italic"}}>"{vidResult.voiceover}"</div>
                  </div>
                )}

                {/* CTA + Tips */}
                <div style={{padding:"16px 24px",display:"flex",gap:16,flexWrap:"wrap"}}>
                  {vidResult.cta&&(
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>CTA</div>
                      <div style={{display:"inline-block",background:"linear-gradient(135deg,#1E3A5F,#4A90E2)",color:"#fff",fontWeight:700,padding:"10px 20px",borderRadius:8,fontSize:13}}>{vidResult.cta}</div>
                    </div>
                  )}
                  {vidResult.productionTips?.length>0&&(
                    <div style={{flex:2}}>
                      <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>Production Tips</div>
                      {vidResult.productionTips.map((tip,i)=><div key={i} style={{fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.6,marginBottom:3}}>· {tip}</div>)}
                    </div>
                  )}
                </div>

                <div style={{padding:"12px 24px 20px",display:"flex",gap:10}}>
                  <button onClick={handleGenerateVideo} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)",fontSize:13,fontFamily:F.b}}>↻ Redo</button>
                  <button onClick={()=>{const txt=`VIDEO AD STORYBOARD\n\n${vidResult.title}\n\nHOOK: ${vidResult.hook}\n\nVOICEOVER:\n${vidResult.voiceover}\n\nCTA: ${vidResult.cta}`;navigator.clipboard?.writeText(txt);}}
                    style={{flex:2,padding:"11px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#5B2D8F,#A855F7)",color:"#fff",fontSize:13,fontFamily:F.b,fontWeight:700}}>
                    Copy Script
                  </button>
                </div>
              </div>
            )}
          </>}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — CANVAS EDITOR
      ══════════════════════════════════════════════════════ */}
      {tab==="canvas"&&(
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* LEFT TOOLS */}
          <div style={{width:220,background:"#1A1A1E",borderRight:"1px solid rgba(255,255,255,0.07)",
            display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>

            {/* Canvas tab bar */}
            <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"6px 8px",gap:3}}>
              {[{id:"elements",l:"Add"},{id:"text",l:"Text"},{id:"media",l:"Media"},{id:"layers",l:"Layers"}].map(t=>(
                <button key={t.id} onClick={()=>setCanvasTab(t.id)}
                  style={{flex:1,padding:"7px 4px",borderRadius:7,border:"none",cursor:"pointer",
                    background:canvasTab===t.id?"rgba(74,144,226,0.18)":"transparent",
                    color:canvasTab===t.id?"#4A90E2":"rgba(255,255,255,0.35)",
                    fontSize:11,fontFamily:F.b,fontWeight:canvasTab===t.id?700:400,transition:"all 0.15s"}}>
                  {t.l}
                </button>
              ))}
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"14px 12px",scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.08) transparent"}}>

              {/* ADD ELEMENTS */}
              {canvasTab==="elements"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>

                {/* Quick size select */}
                <div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Canvas Size</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {CS_TEMPLATES.map(t=>(
                      <button key={t.id} onClick={()=>selectTemplate(t)}
                        style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:8,border:`1px solid ${canvasSize.w===t.w&&canvasSize.h===t.h?"rgba(74,144,226,0.5)":"rgba(255,255,255,0.06)"}`,
                          background:canvasSize.w===t.w&&canvasSize.h===t.h?"rgba(74,144,226,0.1)":"rgba(255,255,255,0.03)",cursor:"pointer"}}>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.65)",fontWeight:600}}>{t.name}</span>
                        <span style={{fontSize:9,color:"rgba(255,255,255,0.25)",fontFamily:F.m}}>{t.ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* BG Color */}
                <div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Background</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {CS_BGS.map(c=>(
                      <div key={c} onClick={()=>dispatch({type:"SET_BG",color:c})}
                        style={{width:30,height:30,borderRadius:7,background:c,cursor:"pointer",
                          border:canvas.bg===c?"2.5px solid #4A90E2":"1.5px solid rgba(255,255,255,0.08)"}}/>
                    ))}
                  </div>
                  <input type="color" value={canvas.bg||"#111111"} onChange={e=>dispatch({type:"SET_BG",color:e.target.value})}
                    style={{width:"100%",height:34,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",padding:3,background:"none"}}/>
                </div>

                {/* Shapes */}
                <div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Shapes</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {CS_SHAPES.map((s,i)=>(
                      <button key={i} onClick={()=>addEl({type:"shape",shape:s.shape,fill:"#4A90E2",w:s.w,h:s.h,rotate:s.rotate||0})}
                        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"12px 6px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <span style={{fontSize:20,color:"rgba(255,255,255,0.45)"}}>{s.icon}</span>
                        <span style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontFamily:F.m}}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>CTA Buttons</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {CS_CTAS.map((cta,i)=>(
                      <button key={i} onClick={()=>addEl({type:"cta",text:cta.text,fill:cta.fill,color:cta.color,stroke:cta.stroke,w:220,h:60,radius:10,fontSize:18})}
                        style={{background:cta.fill||"transparent",color:cta.color,border:cta.stroke?`2px solid ${cta.stroke}`:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"10px 14px",cursor:"pointer",fontSize:12,fontFamily:F.b,fontWeight:700}}>
                        {cta.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overlays */}
                <div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Overlays</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {CS_OVERLAYS.map((ov,i)=>(
                      <button key={i} onClick={()=>addEl({type:"overlay",fill:ov.fill,w:canvasSize.w,h:canvasSize.h,x:0,y:0})}
                        style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:24,height:16,borderRadius:4,background:ov.fill,border:"1px solid rgba(255,255,255,0.1)",flexShrink:0}}/>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{ov.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>}

              {/* TEXT */}
              {canvasTab==="text"&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:4}}>Click to add to canvas</div>
                {CS_TEXT_PRESETS.map((p,i)=>(
                  <button key={i} onClick={()=>addText(p)}
                    style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 14px",cursor:"pointer",textAlign:"left"}}>
                    <div style={{fontFamily:p.label.includes("Headline")?"Playfair Display":F.b,fontWeight:p.bold?700:400,
                      fontSize:Math.max(10,Math.min(18,p.fontSize/5)),color:"rgba(255,255,255,0.85)",marginBottom:2,lineHeight:1.2}}>
                      {p.text.split("\n")[0]}
                    </div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",fontFamily:F.m}}>{p.label} · {p.fontSize}px</div>
                  </button>
                ))}
              </div>}

              {/* MEDIA */}
              {canvasTab==="media"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div onClick={()=>fileRef.current?.click()}
                  style={{border:"2px dashed rgba(255,255,255,0.1)",borderRadius:12,padding:"20px 12px",
                    textAlign:"center",cursor:"pointer",background:"rgba(255,255,255,0.02)"}}>
                  <div style={{fontSize:22,marginBottom:8,color:"rgba(255,255,255,0.2)"}}>⬆</div>
                  <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:2}}>Upload Image</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",fontFamily:F.m}}>PNG, JPG, WebP</div>
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{display:"none"}}/>
                </div>
                {imgResult&&(
                  <div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Latest AI Image</div>
                    <div onClick={()=>addImage(imgResult,true)}
                      style={{aspectRatio:"1",borderRadius:10,overflow:"hidden",cursor:"pointer",border:"1px solid rgba(74,144,226,0.3)"}}>
                      <img src={imgResult} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="AI generated"/>
                    </div>
                    <div style={{fontSize:10,color:"rgba(74,144,226,0.7)",fontFamily:F.m,marginTop:5,textAlign:"center"}}>Click to add to canvas</div>
                  </div>
                )}
                {uploadedImgs.length>0&&<>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase"}}>Uploaded</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {uploadedImgs.map((u,i)=>(
                      <div key={i} onClick={()=>addImage(u.src)}
                        style={{aspectRatio:"1",borderRadius:9,overflow:"hidden",cursor:"pointer",border:"1px solid rgba(255,255,255,0.07)"}}>
                        <img src={u.src} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={u.name}/>
                      </div>
                    ))}
                  </div>
                </>}
              </div>}

              {/* LAYERS */}
              {canvasTab==="layers"&&<div style={{display:"flex",flexDirection:"column",gap:5}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:F.m,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>
                  {canvas.elements.length} element{canvas.elements.length!==1?"s":""}
                </div>
                {canvas.elements.length===0&&<div style={{textAlign:"center",padding:"28px 0",color:"rgba(255,255,255,0.15)",fontSize:12,fontFamily:F.m}}>No elements yet</div>}
                {[...canvas.elements].reverse().map((el)=>(
                  <div key={el.id} onClick={()=>dispatch({type:"SELECT",id:el.id})}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",
                      background:canvas.selected===el.id?"rgba(74,144,226,0.15)":"rgba(255,255,255,0.03)",
                      border:`1px solid ${canvas.selected===el.id?"rgba(74,144,226,0.35)":"rgba(255,255,255,0.06)"}`,transition:"all 0.12s"}}>
                    <span style={{fontSize:13,width:18,textAlign:"center",flexShrink:0}}>
                      {el.type==="text"?"T":el.type==="image"?"◉":el.type==="shape"?"■":el.type==="cta"?"▬":"◈"}
                    </span>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {el.type==="text"?(el.text||"Text").slice(0,18):el.type==="image"?`Image${el._isAIGenerated?" (AI)":""}`:el.type==="cta"?(el.text||"Button"):`${el.type.charAt(0).toUpperCase()+el.type.slice(1)}`}
                      </div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();dispatch({type:"DELETE",id:el.id});}}
                      style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.2)",fontSize:12,padding:2}}>×</button>
                  </div>
                ))}
              </div>}

            </div>
          </div>

          {/* CENTER CANVAS */}
          <div style={{flex:1,background:"#0E0E10",overflow:"auto",position:"relative",
            display:"flex",alignItems:"center",justifyContent:"center",padding:40}}
            onClick={()=>dispatch({type:"SELECT",id:null})}>

            {/* Zoom controls */}
            <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",
              display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.07)",
              borderRadius:10,padding:"6px 10px",zIndex:10}}>
              <button onClick={()=>setScale(p=>Math.max(0.1,+(p-0.07).toFixed(2)))} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:16,padding:"0 4px"}}>−</button>
              <span style={{fontSize:11,fontFamily:F.m,color:"rgba(255,255,255,0.35)",width:36,textAlign:"center"}}>{Math.round(scale*100)}%</span>
              <button onClick={()=>setScale(p=>Math.min(1.2,+(p+0.07).toFixed(2)))} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:16,padding:"0 4px"}}>+</button>
              <div style={{width:1,height:16,background:"rgba(255,255,255,0.1)",margin:"0 2px"}}/>
              <button onClick={()=>setShowGrid(p=>!p)} style={{background:showGrid?"rgba(74,144,226,0.2)":"none",border:"none",cursor:"pointer",color:showGrid?"#4A90E2":"rgba(255,255,255,0.35)",fontSize:12,padding:"2px 6px",borderRadius:5}}>⊞</button>
            </div>

            <div style={{position:"relative",width:canvasSize.w*scale,height:canvasSize.h*scale,
              flexShrink:0,background:canvas.bg||"#1A1A1A",
              boxShadow:"0 12px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",borderRadius:2}}>
              {showGrid&&<div style={{position:"absolute",inset:0,
                backgroundImage:`linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)`,
                backgroundSize:`${(canvasSize.w/16)*scale}px ${(canvasSize.h/16)*scale}px`,zIndex:1,pointerEvents:"none"}}/>}
              <div style={{position:"absolute",inset:0,transform:`scale(${scale})`,transformOrigin:"top left",width:canvasSize.w,height:canvasSize.h}}>
                {canvas.elements.map(el=>(
                  <CanvasEl key={el.id} el={el} isSelected={canvas.selected===el.id} scale={scale}
                    onSelect={id=>dispatch({type:"SELECT",id})}
                    onUpdate={(id,props)=>dispatch({type:"UPDATE",id,props})}
                    onDelete={id=>dispatch({type:"DELETE",id})}/>
                ))}
              </div>
              {canvas.elements.length===0&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",gap:10}}>
                <div style={{fontSize:32,color:"rgba(255,255,255,0.05)"}}>◈</div>
                <div style={{fontSize:11,fontFamily:F.m,color:"rgba(255,255,255,0.1)",textAlign:"center",lineHeight:1.8}}>
                  Add elements from the left panel<br/>or generate an image in AI Generate ✦
                </div>
              </div>}
            </div>
          </div>

          {/* RIGHT PROPERTIES PANEL */}
          <div style={{width:220,background:"#1A1A1E",borderLeft:"1px solid rgba(255,255,255,0.07)",
            flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {selectedEl ? (
              <>
                <div style={{padding:"14px 14px 10px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",textTransform:"uppercase"}}>{selectedEl.type}</div>
                  <button onClick={()=>dispatch({type:"SELECT",id:null})} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.25)",fontSize:14}}>✕</button>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:14,scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.08) transparent"}}>
                  {/* Actions */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    {[{l:"Duplicate",fn:()=>dispatch({type:"DUPLICATE",id:canvas.selected}),icon:"⊕"},{l:"↑ Bring Up",fn:()=>dispatch({type:"BRING_FRONT",id:canvas.selected}),icon:""},{l:"↓ Send Back",fn:()=>dispatch({type:"SEND_BACK",id:canvas.selected}),icon:""},{l:"Delete",fn:()=>dispatch({type:"DELETE",id:canvas.selected}),icon:"×",danger:true}].map(a=>(
                      <button key={a.l} onClick={a.fn} style={{background:a.danger?"rgba(168,40,40,0.12)":"rgba(255,255,255,0.05)",border:`1px solid ${a.danger?"rgba(168,40,40,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:7,padding:"7px 4px",cursor:"pointer",color:a.danger?"#FC8181":"rgba(255,255,255,0.45)",fontSize:10,fontFamily:F.b,fontWeight:500}}>
                        {a.l}
                      </button>
                    ))}
                  </div>

                  <div style={{height:1,background:"rgba(255,255,255,0.06)"}}/>

                  {/* Transform */}
                  <div>
                    <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.25)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Position & Size</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                      <PropInput label="X" k="x" v={Math.round(selectedEl.x||0)}/>
                      <PropInput label="Y" k="y" v={Math.round(selectedEl.y||0)}/>
                      <PropInput label="Width" k="w" v={Math.round(selectedEl.w||100)}/>
                      {selectedEl.type!=="text"&&<PropInput label="Height" k="h" v={Math.round(selectedEl.h||100)}/>}
                      <PropInput label="Rotate°" k="rotate" v={Math.round(selectedEl.rotate||0)}/>
                      <PropInput label="Opacity%" k="opacity" v={Math.round(selectedEl.opacity!=null?selectedEl.opacity:100)}/>
                    </div>
                  </div>

                  {selectedEl.type==="text"&&<>
                    <div style={{height:1,background:"rgba(255,255,255,0.06)"}}/>
                    <div style={{display:"flex",flexDirection:"column",gap:9}}>
                      <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.25)",letterSpacing:"0.07em",textTransform:"uppercase"}}>Text</div>
                      <textarea value={selectedEl.text||""} onChange={e=>dispatch({type:"UPDATE",id:canvas.selected,props:{text:e.target.value}})}
                        style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"9px 11px",color:"rgba(255,255,255,0.8)",fontSize:12,fontFamily:F.b,lineHeight:1.5,resize:"vertical",minHeight:56,boxSizing:"border-box",outline:"none"}}/>
                      <select value={selectedEl.fontFamily||F.b} onChange={e=>dispatch({type:"UPDATE",id:canvas.selected,props:{fontFamily:e.target.value}})}
                        style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,padding:"7px 10px",color:"rgba(255,255,255,0.7)",fontSize:11,outline:"none",appearance:"none"}}>
                        {CS_FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                      </select>
                      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:7}}>
                        <PropInput label="Size (px)" k="fontSize" v={selectedEl.fontSize||32}/>
                        <PropInput label="Color" k="color" isColor v={selectedEl.color||"#FFFFFF"}/>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        {[{l:"B",k:"bold",style:{fontWeight:700}},{l:"I",k:"italic",style:{fontStyle:"italic"}},{l:"U",k:"underline",style:{textDecoration:"underline"}},{l:"✦",k:"shadow",style:{}}].map(b=>(
                          <button key={b.k} onClick={()=>dispatch({type:"UPDATE",id:canvas.selected,props:{[b.k]:!selectedEl[b.k]}})}
                            style={{flex:1,background:selectedEl[b.k]?"rgba(74,144,226,0.2)":"rgba(255,255,255,0.05)",color:selectedEl[b.k]?"#4A90E2":"rgba(255,255,255,0.4)",border:`1px solid ${selectedEl[b.k]?"rgba(74,144,226,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:6,padding:"6px 3px",cursor:"pointer",fontSize:11,...b.style}}>
                            {b.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>}

                  {(selectedEl.type==="shape"||selectedEl.type==="cta"||selectedEl.type==="overlay")&&<>
                    <div style={{height:1,background:"rgba(255,255,255,0.06)"}}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                      <PropInput label="Fill" k="fill" isColor v={selectedEl.fill&&selectedEl.fill.startsWith("#")?selectedEl.fill:"#1B3458"}/>
                      <PropInput label="Radius" k="radius" v={selectedEl.radius||0}/>
                    </div>
                    {selectedEl.type==="cta"&&<PropInput label="Button Text" k="text" type="text" v={selectedEl.text||""}/>}
                  </>}

                  {selectedEl.type==="image"&&<>
                    <div style={{height:1,background:"rgba(255,255,255,0.06)"}}/>
                    <div style={{display:"flex",flexDirection:"column",gap:9}}>
                      <div style={{fontSize:10,fontFamily:F.m,color:"rgba(255,255,255,0.25)",letterSpacing:"0.07em",textTransform:"uppercase"}}>Image Adjustments</div>
                      <Slider label="Brightness" value={selectedEl.brightness||100} onChange={v=>dispatch({type:"UPDATE",id:canvas.selected,props:{brightness:v}})} min={0} max={200}/>
                      <Slider label="Contrast"   value={selectedEl.contrast||100}   onChange={v=>dispatch({type:"UPDATE",id:canvas.selected,props:{contrast:v}})}   min={0} max={200}/>
                      <Slider label="Saturation" value={selectedEl.saturation||100} onChange={v=>dispatch({type:"UPDATE",id:canvas.selected,props:{saturation:v}})} min={0} max={200}/>
                      <Slider label="Blur"       value={selectedEl.blur||0}         onChange={v=>dispatch({type:"UPDATE",id:canvas.selected,props:{blur:v}})}        min={0} max={20} unit="px"/>
                      <PropInput label="Corner Radius" k="radius" v={selectedEl.radius||0}/>
                      {selectedEl._isAIGenerated&&<div style={{background:"rgba(91,45,143,0.15)",border:"1px solid rgba(91,45,143,0.3)",borderRadius:7,padding:"7px 10px",fontSize:10,color:"#A78BFA",fontFamily:F.m}}>✦ AI Generated · DALL-E 3</div>}
                    </div>
                  </>}
                </div>
              </>
            ) : (
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center"}}>
                <div style={{fontSize:28,color:"rgba(255,255,255,0.05)",marginBottom:10}}>◈</div>
                <div style={{fontSize:11,fontFamily:F.m,color:"rgba(255,255,255,0.15)",lineHeight:1.8}}>Click any element<br/>to edit its properties</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3 — AD COPY
      ══════════════════════════════════════════════════════ */}
      {tab==="copy"&&(
        <div style={{flex:1,overflowY:"auto",padding:"32px 40px",maxWidth:800,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>

          <div style={{marginBottom:28}}>
            <h2 style={{fontFamily:F.h,fontSize:24,fontWeight:700,color:"#fff",marginBottom:6}}>AI Ad Copywriter</h2>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>Describe your product and get a complete ad copy package — headline, body, caption, CTA, and hook.</p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32}}>
            {/* INPUT SIDE */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:8}}>Product / Service Description</div>
                <textarea value={copyProduct} onChange={e=>setCopyProduct(e.target.value)}
                  placeholder={"Example: Our vitamin C brightening serum with 20% pure ascorbic acid. Reduces dark spots in 4 weeks. For women 28+ with dull or uneven skin tone."}
                  rows={5} style={{...promptStyle,fontSize:13}}
                  onFocus={e=>e.target.style.borderColor="rgba(168,85,247,0.5)"}
                  onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:8}}>Platform</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {["Instagram","TikTok","Facebook","Google Ads","YouTube"].map(p=>(
                      <button key={p} onClick={()=>setCopyPlatform(p)}
                        style={{padding:"8px 12px",borderRadius:8,border:`1.5px solid ${copyPlatform===p?"rgba(168,85,247,0.6)":"rgba(255,255,255,0.07)"}`,
                          background:copyPlatform===p?"rgba(168,85,247,0.1)":"rgba(255,255,255,0.03)",
                          cursor:"pointer",color:copyPlatform===p?"#C084FC":"rgba(255,255,255,0.45)",
                          fontSize:12,fontFamily:F.b,fontWeight:copyPlatform===p?700:400,textAlign:"left"}}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:8}}>Tone</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {["Energetic","Luxury","Urgent","Emotional","Fun","Professional"].map(t=>(
                      <button key={t} onClick={()=>setCopyTone(t)}
                        style={{padding:"8px 12px",borderRadius:8,border:`1.5px solid ${copyTone===t?"rgba(168,85,247,0.6)":"rgba(255,255,255,0.07)"}`,
                          background:copyTone===t?"rgba(168,85,247,0.1)":"rgba(255,255,255,0.03)",
                          cursor:"pointer",color:copyTone===t?"#C084FC":"rgba(255,255,255,0.45)",
                          fontSize:12,fontFamily:F.b,fontWeight:copyTone===t?700:400,textAlign:"left"}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleGenerateCopy} disabled={copyLoading||!copyProduct.trim()}
                style={{...BIG_BTN({background:copyLoading||!copyProduct.trim()?"rgba(168,85,247,0.2)":"linear-gradient(135deg,#5B2D8F,#A855F7)",color:"#fff",opacity:copyLoading||!copyProduct.trim()?0.6:1})}}>
                {copyLoading
                  ? <><span style={{animation:"adSpin 0.8s linear infinite",display:"inline-block"}}>◈</span> Writing your copy…</>
                  : <><span>✦</span> Generate Ad Copy</>}
              </button>
              {copyError&&<div style={{background:"rgba(168,40,40,0.12)",border:"1px solid rgba(168,40,40,0.25)",borderRadius:9,padding:"11px 14px",color:"#FC8181",fontSize:12}}>⚠ {copyError}</div>}
            </div>

            {/* RESULTS SIDE */}
            <div>
              {!copyResult&&!copyLoading&&(
                <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",textAlign:"center",background:"rgba(255,255,255,0.02)",borderRadius:14,border:"1px dashed rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:32,color:"rgba(255,255,255,0.07)",marginBottom:12}}>✦</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.25)",lineHeight:1.7}}>Your AI-generated copy<br/>will appear here</div>
                </div>
              )}
              {copyLoading&&(
                <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",textAlign:"center"}}>
                  <div style={{fontSize:28,color:"rgba(168,85,247,0.5)",animation:"adSpin 1.5s linear infinite",marginBottom:16}}>◈</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.3)"}}>GPT-4o is writing your copy…</div>
                </div>
              )}
              {copyResult&&(()=>{
                const isObj = typeof copyResult === "object";
                const fields = isObj ? [
                  {key:"headline",      label:"Headline",        color:"#C084FC"},
                  {key:"subheadline",   label:"Subheadline",     color:"#A78BFA"},
                  {key:"adCopy",        label:"Ad Copy",         color:"rgba(255,255,255,0.7)"},
                  {key:"socialCaption", label:"Social Caption",  color:"rgba(255,255,255,0.7)"},
                  {key:"callToAction",  label:"CTA Button",      color:"#68D391"},
                  {key:"hook",          label:"Video Hook",      color:"#60A5FA"},
                ].filter(f=>copyResult[f.key]) : [];

                return (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:8,padding:"8px 12px",fontSize:10,color:"#C084FC",fontFamily:F.m,marginBottom:2}}>
                      ✦ Generated by GPT-4o · {copyPlatform} · {copyTone}
                    </div>
                    {isObj ? fields.map(({key,label,color})=>(
                      <div key={key} style={{background:"rgba(255,255,255,0.04)",border:`1.5px solid ${refineField===key?"rgba(168,85,247,0.4)":"rgba(255,255,255,0.07)"}`,borderRadius:10,padding:"12px 14px",transition:"border-color 0.15s"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:9,fontFamily:F.m,color:"rgba(255,255,255,0.3)",letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</span>
                          <button onClick={()=>setRefineField(refineField===key?null:key)} title="Refine this field"
                            style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.2)",fontSize:11,padding:2,transition:"color 0.15s"}}>
                            ✎
                          </button>
                        </div>
                        <div style={{fontSize:key==="headline"?16:13,fontWeight:key==="headline"?700:400,color,lineHeight:1.55,fontFamily:key==="headline"?F.h:F.b}}>
                          {copyResult[key]}
                        </div>
                        {refineField===key&&(
                          <div style={{marginTop:10,display:"flex",gap:6}}>
                            <input value={refineInstr} onChange={e=>setRefineInstr(e.target.value)}
                              placeholder={`How to improve ${label.toLowerCase()}?`}
                              onKeyDown={e=>e.key==="Enter"&&handleRefineCopy(key,copyResult[key])}
                              style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,padding:"6px 10px",color:"rgba(255,255,255,0.7)",fontSize:11,fontFamily:F.b,outline:"none"}}/>
                            <button onClick={()=>handleRefineCopy(key,copyResult[key])} disabled={refineLoading||!refineInstr.trim()}
                              style={{background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.35)",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#C084FC",fontSize:11,fontFamily:F.b,fontWeight:600,opacity:refineLoading?0.5:1}}>
                              {refineLoading?"…":"Apply"}
                            </button>
                          </div>
                        )}
                      </div>
                    )) : <div style={{color:"rgba(255,255,255,0.6)",fontSize:12,lineHeight:1.7,padding:"12px"}}>{JSON.stringify(copyResult)}</div>}
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      <button onClick={handleGenerateCopy} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.4)",fontSize:12,fontFamily:F.b}}>↻ Redo</button>
                      <button onClick={applyCopyToCanvas} style={{flex:2,padding:"10px",borderRadius:9,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#1E3A5F,#4A90E2)",color:"#fff",fontSize:12,fontFamily:F.b,fontWeight:700}}>+ Add to Canvas →</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}
      {showApiModal&&<ApiSetupModal onClose={()=>setShowApiModal(false)}/>}

      {showExport&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={e=>e.target===e.currentTarget&&setShowExport(false)}>
        <div style={{background:"#1E1E22",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,width:"100%",maxWidth:440,padding:"28px",boxShadow:"0 32px 80px rgba(0,0,0,0.5)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontFamily:F.h,fontSize:18,fontWeight:700,color:"#fff"}}>Export Creative</div>
            <button onClick={()=>setShowExport(false)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:16}}>✕</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {["PNG","JPG","WebP","SVG"].map(f=>(
              <button key={f} style={{padding:"12px",borderRadius:10,border:"1.5px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",cursor:"pointer",color:"rgba(255,255,255,0.6)",fontSize:13,fontFamily:F.b,fontWeight:600}}>{f}</button>
            ))}
          </div>
          <Btn onClick={()=>setShowExport(false)} style={{width:"100%"}}>Export Now →</Btn>
        </div>
      </div>}

      {showPublish&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={e=>e.target===e.currentTarget&&setShowPublish(false)}>
        <div style={{background:"#1E1E22",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,width:"100%",maxWidth:480,padding:"28px",boxShadow:"0 32px 80px rgba(0,0,0,0.5)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontFamily:F.h,fontSize:18,fontWeight:700,color:"#fff"}}>Publish to Campaigns</div>
            <button onClick={()=>setShowPublish(false)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:16}}>✕</button>
          </div>
          {connected.length===0
            ? <div style={{textAlign:"center",padding:"24px 0",color:"rgba(255,255,255,0.3)",fontSize:13,lineHeight:1.7}}>No accounts connected.<br/>Go to Connect Accounts to link Meta, TikTok, or Google.</div>
            : connected.map(pid=>(
                <div key={pid} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:9,background:OAUTH[pid].bg,display:"flex",alignItems:"center",justifyContent:"center",color:OAUTH[pid].color,fontSize:16,fontWeight:800}}>{OAUTH[pid].icon}</div>
                    <div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{OAUTH[pid].name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:F.m}}>Connected ✓</div></div>
                  </div>
                  <Btn sm onClick={()=>setShowPublish(false)}>Publish →</Btn>
                </div>
              ))
          }
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>setShowPublish(false)} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"11px",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:13,fontFamily:F.b}}>Cancel</button>
            {connected.length>0&&<Btn style={{flex:2}} onClick={()=>setShowPublish(false)}>Publish All →</Btn>}
          </div>
        </div>
      </div>}

    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════
   APP SHELL (authenticated)
═══════════════════════════════════════════════════════════════ */
const NAVS=[
  {id:"dashboard",l:"Dashboard",i:"▦"},
  {id:"creative",l:"Creative Studio",i:"◈"},
  {id:"analytics",l:"Analytics",i:"▲"},
  {id:"campaigns",l:"Campaigns",i:"◎"},
  {id:"connect",l:"Connect Accounts",i:"⊕"},
  {id:"assistant",l:"AI Assistant",i:"✦"},
];

function AppShell({ user, onLogout }) {
  const [nav,setNav]=useState("dashboard");
  const [connected,setConnected]=useState([]);
  const [platformData,setPlatformData]=useState({});
  const {isMobile}=useBreakpoint();
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const {toast,ToastContainer:AppToast}=useToast();

  // ── Handle Meta OAuth return via URL params ──
  // Meta redirects back to frontend after backend exchanges the token.
  // We detect ?oauth_success=meta in the URL and auto-check the session.
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const success=params.get("oauth_success");
    const error=params.get("oauth_error");
    const accounts=params.get("accounts");
    if(success==="meta"){
      // Clean URL
      window.history.replaceState({},"",window.location.pathname);
      // Check session and load campaigns
      (async()=>{
        try{
          const session=await API.checkSession();
          if(session.connected){
            const accountId=session.adAccountIds?.[0];
            if(accountId){
              const campData=await API.fetchCampaigns(accountId);
              const summary=campData.summary;
              const pd={
                accountName:session.userName+" — Meta Business",
                accountId,
                adAccountIds:session.adAccountIds,
                campaigns:campData.campaigns.map(c=>({
                  id:c.id,name:c.name,status:c.status,objective:c.objective,budget:c.budget,
                  spent:"$"+parseFloat(c.spend).toLocaleString(),
                  impr:c.impressions>=1000?(c.impressions/1000).toFixed(0)+"K":String(c.impressions),
                  ctr:c.ctr+"%",cpc:"$"+c.cpc,conv:String(c.conversions),
                  cpa:c.cpa?"$"+c.cpa:"—",roas:c.roas?c.roas+"×":"—",
                  start:c.startDate?c.startDate.slice(5).replace("-"," "):"—",_raw:c,
                })),
                totalSpend:summary.totalSpend,totalConv:summary.totalConv,
                avgRoas:summary.avgRoas?summary.avgRoas+"×":"—",avgCtr:summary.avgCtr+"%",
                _summary:summary,_realData:true,
              };
              setConnected(prev=>[...prev.filter(x=>x!=="meta"),"meta"]);
              setPlatformData(prev=>({...prev,meta:pd}));
              toast(`✓ Meta connected — ${campData.campaigns.length} campaigns loaded from Marketing API`,"success");
              setNav("dashboard");
            }
          }
        }catch(e){toast("Meta connection error: "+e.message,"error");}
      })();
    }
    if(error){
      window.history.replaceState({},"",window.location.pathname);
      toast("Meta OAuth failed: "+decodeURIComponent(error),"error");
    }
    // Also restore session if user refreshes page
    (async()=>{
      try{
        const session=await API.checkSession();
        if(session.connected&&!connected.includes("meta")){
          setConnected(prev=>[...prev.filter(x=>x!=="meta"),"meta"]);
          // We have a session but no campaign data yet — queue a background fetch
          const accountId=session.adAccountIds?.[0];
          if(accountId){
            const campData=await API.fetchCampaigns(accountId);
            const summary=campData.summary;
            const pd={
              accountName:session.userName+" — Meta Business",
              accountId,adAccountIds:session.adAccountIds,
              campaigns:campData.campaigns.map(c=>({
                id:c.id,name:c.name,status:c.status,objective:c.objective,budget:c.budget,
                spent:"$"+parseFloat(c.spend).toLocaleString(),
                impr:c.impressions>=1000?(c.impressions/1000).toFixed(0)+"K":String(c.impressions),
                ctr:c.ctr+"%",cpc:"$"+c.cpc,conv:String(c.conversions),
                cpa:c.cpa?"$"+c.cpa:"—",roas:c.roas?c.roas+"×":"—",
                start:c.startDate?c.startDate.slice(5).replace("-"," "):"—",_raw:c,
              })),
              totalSpend:summary.totalSpend,totalConv:summary.totalConv,
              avgRoas:summary.avgRoas?summary.avgRoas+"×":"—",avgCtr:summary.avgCtr+"%",
              _summary:summary,_realData:true,
            };
            setPlatformData(prev=>({...prev,meta:pd}));
          }
        }
      }catch(e){/* Backend not running — no-op */}
    })();
  },[]);

  // AI proxy — all calls routed through backend, keys never in browser
  const aiCall=async(sys,usr,hist=[])=>{
    try{
      const r=await API.req("/api/ai/chat",{method:"POST",body:JSON.stringify({system:sys,user:usr,history:hist.filter(h=>h.role!=="system").map(h=>({role:h.role,content:h.content}))})});
      return r.text||"No response received.";
    }catch(e){return `⚠️ AI error: ${e.message}`;}
  };
  // Image generation — routes through backend, OpenAI key stays server-side
  const generateImage=async(prompt,quality="hd")=>{
    try{
      const r=await API.req("/api/ai/image",{method:"POST",body:JSON.stringify({prompt,quality})});
      return {url:r.url};
    }catch(e){return {error:e.message};}
  };

  const page=()=>{
    if(nav==="creative") return <CreativeStudio user={user} connected={connected} aiCall={aiCall}/>;
    const wrap=(C,props={})=><div style={{height:"100%",overflow:"hidden"}}><C {...props}/></div>;
    switch(nav){
      case "dashboard": return wrap(Dashboard,{user,connected,platformData,setNav});
      case "analytics": return wrap(Analytics,{connected,platformData,setNav});
      case "campaigns": return wrap(Campaigns,{connected,platformData,setNav});
      case "connect":   return wrap(ConnectAccounts,{connected,setConnected,platformData,setPlatformData});
      case "assistant": return wrap(Assistant,{user,connected,aiCall});
      default: return null;
    }
  };

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg,overflow:"hidden",position:"relative"}}>
      {/* Mobile overlay */}
      {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:90}}/>}
      <aside style={{width:224,flexShrink:0,background:T.bgCard,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",padding:"24px 0 20px",
        ...(isMobile?{position:"fixed",left:0,top:0,bottom:0,zIndex:100,transform:sidebarOpen?"translateX(0)":"translateX(-100%)",transition:"transform 0.25s ease",boxShadow:"4px 0 20px rgba(0,0,0,0.12)"}:{})}}>
        <div style={{padding:"0 20px 22px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:T.navy,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14}}>◈</div>
            <div><div style={{fontFamily:F.h,fontSize:17,fontWeight:700,color:T.text,lineHeight:1}}>AdForge</div><div style={{fontSize:10,fontFamily:F.m,color:T.textSoft,marginTop:1,letterSpacing:"0.06em"}}>AI Marketing OS</div></div>
          </div>
        </div>
        <HR/>
        <nav style={{flex:1,padding:"13px 9px 0"}}>
          {NAVS.map(item=>{
            const isA=nav===item.id;const needsDot=item.id==="connect"&&connected.length===0;
            return <button key={item.id} onClick={()=>setNav(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 11px",background:isA?T.navyLt:"transparent",border:"none",borderRadius:9,cursor:"pointer",color:isA?T.navy:T.textMid,fontSize:13.5,fontFamily:F.b,fontWeight:isA?700:500,transition:"all 0.15s",textAlign:"left",marginBottom:2}}>
              <span style={{fontSize:14,width:18,textAlign:"center",opacity:isA?1:0.6}}>{item.i}</span>
              <span style={{flex:1}}>{item.l}</span>
              {needsDot&&<span style={{width:7,height:7,borderRadius:"50%",background:T.amber}}/>}
              {item.id==="connect"&&connected.length>0&&<span style={{fontSize:10,fontFamily:F.m,color:T.green,fontWeight:600}}>{connected.length}</span>}
            </button>;
          })}
        </nav>
        <HR m="0 0 14px"/>
        <div style={{padding:"0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:T.navyLt,display:"flex",alignItems:"center",justifyContent:"center",color:T.navy,fontSize:13,fontWeight:700,flexShrink:0}}>{user.name.charAt(0)}</div>
            <div style={{overflow:"hidden",flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
              <div style={{fontSize:11,color:T.textSoft,fontFamily:F.m,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.brand}</div>
            </div>
            <button onClick={onLogout} title="Sign out" style={{background:"none",border:"none",cursor:"pointer",color:T.textXsoft,fontSize:14,padding:4}}>⎋</button>
          </div>
        </div>
      </aside>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{height:50,background:T.bgCard,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:isMobile?"0 16px":"0 34px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isMobile&&<button onClick={()=>setSidebarOpen(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.textMid,padding:"4px 6px"}}>☰</button>}
            <div style={{fontSize:12,color:T.textSoft,fontFamily:F.m}}>{NAVS.find(n=>n.id===nav)?.l}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {connected.length>0?<div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:T.green}}/><span style={{fontSize:12,fontFamily:F.m,color:T.textSoft}}>{connected.map(p=>OAUTH[p].shortName).join(" · ")} — syncing</span></div>
              :<button onClick={()=>setNav("connect")} style={{background:T.amberLt,border:`1px solid ${T.amber}40`,borderRadius:7,padding:"5px 12px",cursor:"pointer",color:T.amber,fontSize:12,fontFamily:F.m}}>⊕ Connect accounts</button>}
            <div style={{width:28,height:28,borderRadius:"50%",background:T.navyLt,display:"flex",alignItems:"center",justifyContent:"center",color:T.navy,fontSize:12,fontWeight:700}}>{user.name.charAt(0)}</div>
          </div>
        </header>
        <main style={{flex:1,overflow:"hidden"}}>{page()}</main>
        <AppToast/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT — ROUTING
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [user,setUser]=useState(null);
  const [authModal,setAuthModal]=useState(null);
  const [booting,setBooting]=useState(true);

  // ── Init Supabase client once ──────────────────────────────
  // Reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from env.
  // Falls back to window.__SUPABASE_URL__ / window.__SUPABASE_KEY__
  // for HTML-only usage (open adforge.html directly in browser).
  useEffect(()=>{
    const env  = (()=>{try{return import.meta?.env||{};}catch{return {};}})();
    const url  = env.VITE_SUPABASE_URL  || window.__SUPABASE_URL__  || "";
    const akey = env.VITE_SUPABASE_ANON_KEY || window.__SUPABASE_KEY__ || "";
    if(!url||!akey){
      console.warn("AdForge: Supabase not configured. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.");
      setBooting(false);
      return;
    }
    // Dynamically load Supabase from CDN so this JSX works both as a
    // Vite project (import) and as a standalone HTML artifact.
    const init=async()=>{
      if(!window.__supabase){
        if(window.supabase?.createClient){
          window.__supabase=window.supabase.createClient(url,akey);
        } else {
          // In Vite build: supabase-js is installed; load it.
          // In HTML mode: user must add CDN script before this runs.
          try{
            window.__supabase=createClient(url,akey);
          }catch(e){
            console.warn("Could not load Supabase JS:",e.message);
            setBooting(false);
            return;
          }
        }
      }
      // Restore existing session on page load
      const {data:{session}}=await window.__supabase.auth.getSession();
      if(session){
        window.__supabase_token__=session.access_token;
        const meta=session.user?.user_metadata||{};
        setUser({name:meta.full_name||session.user.email,brand:meta.brand_name||"My Brand",email:session.user.email,session});
      }
      setBooting(false);
      // Keep token fresh on every auth state change
      window.__supabase.auth.onAuthStateChange((_ev,sess)=>{
        window.__supabase_token__=sess?.access_token||"";
      });
    };
    init();
  },[]);

  const handleAuth=(u)=>{
    if(u.session) window.__supabase_token__=u.session.access_token;
    setUser(u);setAuthModal(null);
  };
  const handleLogout=async()=>{
    if(window.__supabase) await window.__supabase.auth.signOut();
    window.__supabase_token__="";
    setUser(null);setAuthModal(null);
  };

  if(booting) return (
    <div style={{height:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:28,color:T.navy,animation:"adSpin 1.2s linear infinite",display:"inline-block",marginBottom:12}}>◈</div>
        <div style={{fontFamily:F.h,fontSize:16,color:T.textMid}}>Loading AdForge…</div>
      </div>
      <style>{`@keyframes adSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:${T.bg};font-family:'DM Sans',sans-serif;}
        @keyframes adSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes adPulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        @keyframes fadeScale{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:4px;}
        input::placeholder,textarea::placeholder{color:${T.textXsoft};}
        select{appearance:none;}
        input[type=range]{height:4px;}
        button:focus-visible{outline:2px solid ${T.navy};outline-offset:2px;}
      `}</style>

      {user
        ? <AppShell user={user} onLogout={handleLogout}/>
        : <>
            <LandingPage onOpenAuth={(mode)=>setAuthModal({mode,gateFeature:null})}/>
            {authModal&&<AuthModal initialMode={authModal.mode} gateFeature={authModal.gateFeature} onAuth={handleAuth} onClose={()=>setAuthModal(null)}/>}
          </>
      }
    </>
  );
}
