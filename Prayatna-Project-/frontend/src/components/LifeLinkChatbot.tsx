import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Stethoscope, ChevronDown } from 'lucide-react';

// ─── Inject keyframe animations once ──────────────────────────────────────────
const STYLE = `
@keyframes llFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes llRing1  { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
@keyframes llRing2  { 0%{transform:scale(1);opacity:.45} 100%{transform:scale(2.8);opacity:0} }
@keyframes llRing3  { 0%{transform:scale(1);opacity:.3} 100%{transform:scale(3.4);opacity:0} }
@keyframes llGlow   { 0%,100%{box-shadow:0 0 18px 4px rgba(45,212,191,.55),0 8px 32px rgba(0,0,0,.5)}
                      50%{box-shadow:0 0 32px 10px rgba(45,212,191,.85),0 8px 40px rgba(0,0,0,.5)} }
@keyframes llBubble { 0%{opacity:0;transform:scale(.8) translateY(6px)} 15%{opacity:1;transform:scale(1) translateY(0)}
                      80%{opacity:1;transform:scale(1) translateY(0)} 100%{opacity:0;transform:scale(.9) translateY(-4px)} }
@keyframes llBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
`;
if (typeof document !== 'undefined' && !document.getElementById('ll-chatbot-styles')) {
  const el = document.createElement('style');
  el.id = 'll-chatbot-styles';
  el.textContent = STYLE;
  document.head.appendChild(el);
}

// ─── Knowledge Base ────────────────────────────────────────────────────────────
interface QA { keywords: string[]; answer: string; }
const KB: QA[] = [
  { keywords:['what is lifelink','what is this platform','about lifelink','about this','tell me about','purpose','overview','introduction'], answer:`**LifeLink** is a real-time healthcare resource coordination platform connecting three key actors:\n\n🏥 **Hospitals** — manage beds, oxygen, ambulances & incoming requests\n🚑 **Ambulance Drivers** — receive SOS dispatches, navigate to patients, notify hospitals\n👤 **Public / Patients** — book beds, find nearby hospitals, request appointments\n\nEverything is synchronized live using WebSocket technology.` },
  { keywords:['doctor','which role','i am a doctor','i am doctor','role for doctor','what role','select role','my role','which portal'], answer:`If you are a **Doctor**, log in under the **Hospital Admin** role.\n\nDoctors can:\n✅ View & manage incoming patient requests\n✅ Accept/reject bed bookings and appointments\n✅ Update the hospital's resource inventory\n✅ Manage inter-hospital resource sharing\n\nAsk your hospital admin for the login credentials.` },
  { keywords:['patient','i am patient','public portal','book bed','find hospital','appointment'], answer:`As a **Patient / Public User**, use the **Public Portal** to:\n\n🏥 Browse nearby hospitals and their live availability\n🛏️ Book a hospital bed or ICU slot\n📅 Schedule a doctor appointment\n🚨 Send an SOS emergency request\n\nSelect **"Patient"** when logging in.` },
  { keywords:['ambulance','driver','ambulance driver','i drive','i am driver'], answer:`**Ambulance Drivers** get a dedicated portal with:\n\n🗺️ Live map of emergency SOS calls\n📡 Real-time GPS tracking\n🏥 Nearest hospitals with live resource counts\n📞 One-tap hospital notification\n🧭 Google Maps turn-by-turn navigation\n\nSelect **"Ambulance Driver"** when logging in.` },
  { keywords:['hospital admin','hospital portal','i manage','i run hospital','admin'], answer:`**Hospital Admins** get a full dashboard:\n\n📊 Live inventory (beds, ICU, oxygen, ambulances)\n📋 Accept/reject patient bed & appointment requests\n🚑 Respond to ambulance arrival notifications\n🔄 Share resources with other hospitals\n👤 Update hospital profile & CSV bulk import\n\nSelect **"Hospital Admin"** when logging in.` },
  { keywords:['login','sign in','how to login','otp','phone','credentials','log in'], answer:`**Logging in is simple:**\n\n1. Enter your registered phone number\n2. Click "Send OTP"\n3. OTP appears in the **amber Dev Mode banner**\n4. Enter OTP and select your role\n\n📌 Demo phones: AIIMS → 1234567899, Apollo → 9000000001, Safdarjung → 9000000002` },
  { keywords:['resource sharing','share resource','inter hospital','request oxygen','borrow','lend'], answer:`**Inter-Hospital Resource Sharing:**\n\n1. Hospital Dashboard → **Resource Sharing** tab\n2. **Browse** all hospitals with live inventory\n3. Click **Request** → pick resource, quantity & note\n4. Target hospital is notified instantly via WebSocket\n5. They **Agree** or **Deny** with a message\n6. See responses in your **Outgoing** tab` },
  { keywords:['inventory','beds','oxygen','icu','ventilator','update inventory','resources'], answer:`Update **Resource Inventory** from the Dashboard tab:\n\n🛏️ General Beds · 🫀 ICU Beds · 💨 Oxygen Cylinders · 🔬 Ventilators · 🚑 Ambulances\n\nChanges **broadcast live** to Public & Ambulance portals instantly — no refresh needed.` },
  { keywords:['csv','upload csv','bulk import','import profile','csv template'], answer:`**CSV Import for Hospital Profile:**\n\n1. Dashboard → **👤 Profile icon** (top right)\n2. Click **Download Template** — pre-filled with your current data\n3. Edit in Excel / Google Sheets\n4. **Upload CSV** → profile updates in under 2 seconds!` },
  { keywords:['real time','live','socket','websocket','instant','sync'], answer:`LifeLink uses **Socket.io WebSockets** for real-time sync:\n\n⚡ Inventory updates appear instantly across all portals\n🚨 SOS emergencies broadcast to all ambulances live\n📋 Resource requests and responses are instant\n🚑 Ambulance notifications reach hospital dashboards immediately` },
  { keywords:['google map','navigation','navigate','maps','directions','route'], answer:`**Navigation in the Ambulance Portal:**\n\n1. Find a hospital in the right panel\n2. Click **Nav** → Google Maps opens with turn-by-turn directions from your GPS\n3. The **"Open Maps"** button in the nav banner also opens Google Maps directly\n\nThe in-app map also shows a live amber route overlay.` },
  { keywords:['profile','update profile','hospital profile','edit hospital'], answer:`**Updating Hospital Profile:**\n\n1. Click **👤 icon** (top-right of Hospital Dashboard)\n2. Profile panel slides open with live DB data\n3. Click **✏️ Edit** → update any field\n4. **Save Profile** to persist changes\n\nOr use CSV Import for bulk updates!` },
  { keywords:['sos','emergency','send sos','emergency request','critical'], answer:`**Sending an SOS Emergency:**\n\n1. Log in as a **Patient** on the Public Portal\n2. Click the **🚨 SOS Emergency** button\n3. Broadcast to ALL active ambulance drivers in real-time\n4. Nearest driver accepts dispatch\n5. Track ambulance live on map\n\n⚠️ Use SOS only for genuine emergencies.` },
  { keywords:['bed booking','book a bed','reserve bed','get admitted'], answer:`**Booking a Hospital Bed:**\n\n1. Log in as **Patient** → Public Portal\n2. Browse hospitals — each card shows live bed availability\n3. Click **Book Bed** on your chosen hospital\n4. Fill in name, phone, reason\n5. Hospital receives it instantly; you're notified on accept/reject` },
  { keywords:['hi','hello','hey','hii','namaste','good morning','good evening'], answer:`👋 Hello! I'm **LifeLink Assistant** — your guide to this platform.\n\nAsk me:\n• "What is this platform for?"\n• "I am a doctor — which role?"\n• "How does ambulance dispatch work?"\n• "How to share resources between hospitals?"` },
  { keywords:['thank','thanks','thank you','great','awesome','perfect','helpful'], answer:`You're welcome! 😊 Feel free to ask anything else about LifeLink. I'm here 24/7!` },
  { keywords:['contact','phone number','call','support','help'], answer:`You can call any hospital from the **Ambulance Portal** — every hospital card has a **📞 Call** button that uses your device's phone dialer.\n\nFor platform support, contact the LifeLink admin through your institution.` },
];

const DEFAULT = `I'm not sure about that. Try asking:\n• Roles (patient, doctor, ambulance driver)\n• How to book a bed or send SOS\n• Resource sharing between hospitals\n• How to update inventory or profile\n• Google Maps navigation`;

function getResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  let best = { score: 0, answer: DEFAULT };
  for (const qa of KB) {
    const score = qa.keywords.reduce((a, kw) => a + (lower.includes(kw) ? kw.split(' ').length : 0), 0);
    if (score > best.score) best = { score, answer: qa.answer };
  }
  return best.answer;
}

function MsgText({ text }: { text: string }) {
  return (
    <span>
      {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p.split('\n').map((line, j, arr) => (
              <React.Fragment key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
            ))
      )}
    </span>
  );
}

const QUICK = ['What is LifeLink?', 'I am a doctor — which role?', 'How does ambulance dispatch work?', 'How to share resources?', 'How to book a bed?'];
const BUBBLES = ['👋 Need help?', '🩺 Ask me anything!', '💡 How can I help?', '🏥 Explore LifeLink!'];
interface Msg { role: 'bot' | 'user'; text: string; ts: Date; }

export default function LifeLinkChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'bot', text: `👋 Hi! I'm **LifeLink Assistant** — your AI guide.\n\nAsk me anything about roles, features, navigation, or how to get started!`, ts: new Date() }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const [bubble, setBubble] = useState<string | null>(null);
  // Draggable position
  const [pos, setPos] = useState({ x: window.innerWidth - 88, y: window.innerHeight - 96 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Periodic tooltip bubble
  useEffect(() => {
    if (open) { setBubble(null); return; }
    const show = () => {
      setBubble(BUBBLES[Math.floor(Math.random() * BUBBLES.length)]);
      setTimeout(() => setBubble(null), 3200);
    };
    const first = setTimeout(show, 4000);
    const interval = setInterval(show, 12000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  // Dragging logic
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const nx = dragStart.current.bx + (e.clientX - dragStart.current.mx);
      const ny = dragStart.current.by + (e.clientY - dragStart.current.my);
      setPos({ x: Math.max(24, Math.min(window.innerWidth - 80, nx)), y: Math.max(24, Math.min(window.innerHeight - 80, ny)) });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  const send = (text: string) => {
    const t = text.trim(); if (!t) return;
    setInput(''); setShowQuick(false);
    setMessages(p => [...p, { role: 'user', text: t, ts: new Date() }]);
    setTyping(true);
    setTimeout(() => { setTyping(false); setMessages(p => [...p, { role: 'bot', text: getResponse(t), ts: new Date() }]); }, 700 + Math.random() * 400);
  };

  // Chat window position: open left of button, clamped to viewport
  const chatLeft = Math.min(pos.x - 368, window.innerWidth - 380);
  const chatTop = Math.max(8, pos.y - 520);

  return (
    <>
      {/* ── Floating Button ── */}
      <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, userSelect: 'none' }}>
        {/* Radar rings — only when closed */}
        {!open && !dragging && (
          <>
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'rgba(45,212,191,.35)',animation:'llRing1 2.4s ease-out infinite' }} />
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'rgba(45,212,191,.25)',animation:'llRing2 2.4s ease-out infinite .5s' }} />
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'rgba(45,212,191,.15)',animation:'llRing3 2.4s ease-out infinite 1s' }} />
          </>
        )}

        {/* Tooltip bubble */}
        {bubble && !open && (
          <div style={{ position:'absolute',bottom:'calc(100% + 10px)',left:'50%',transform:'translateX(-50%)',
            background:'linear-gradient(135deg,#0a2822,#0c3028)',border:'1px solid rgba(45,212,191,.5)',
            borderRadius:14,padding:'7px 14px',whiteSpace:'nowrap',boxShadow:'0 8px 24px rgba(0,0,0,.5)',
            animation:'llBubble 3.2s ease forwards',pointerEvents:'none',color:'#5eead4',fontWeight:700,fontSize:12 }}>
            {bubble}
            <div style={{ position:'absolute',bottom:-6,left:'50%',
              width:10,height:10,background:'#0c3028',border:'1px solid rgba(45,212,191,.4)',
              borderTop:'none',borderLeft:'none',transform:'translateX(-50%) rotate(45deg)' }} />
          </div>
        )}

        <button
          ref={btnRef}
          onMouseDown={onMouseDown}
          onClick={() => { if (!dragging) setOpen(o => !o); }}
          title="LifeLink Assistant"
          style={{
            width: 60, height: 60, borderRadius: '50%', border: 'none', cursor: dragging ? 'grabbing' : 'grab',
            background: open ? 'linear-gradient(135deg,#dc2626,#991b1b)' : 'linear-gradient(135deg,#14b8a6,#0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            animation: open || dragging ? 'none' : 'llFloat 3s ease-in-out infinite, llGlow 2.5s ease-in-out infinite',
            transition: 'background .3s',
          }}
        >
          {open
            ? <X style={{ width: 24, height: 24, color: 'white' }} />
            : (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:2 }}>
                <Stethoscope style={{ width: 22, height: 22, color: 'white' }} />
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,.85)', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>ASK ME</span>
              </div>
            )
          }
          {/* Live pulse dot */}
          {!open && <span style={{ position:'absolute',top:4,right:4,width:10,height:10,background:'#4ade80',borderRadius:'50%',border:'2px solid #0d9488',animation:'llBounce 1.2s ease-in-out infinite' }} />}
        </button>
      </div>

      {/* ── Chat Window ── */}
      {open && (
        <div style={{
          position: 'fixed', left: Math.max(8, chatLeft), top: chatTop, zIndex: 9998,
          width: 360, maxHeight: 540, display: 'flex', flexDirection: 'column', borderRadius: 20,
          overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.65), 0 0 0 1px rgba(45,212,191,.25)',
          background: 'linear-gradient(180deg,#0a2822 0%,#071e1a 100%)',
        }}>
          {/* Header */}
          <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'rgba(10,40,34,.9)',borderBottom:'1px solid rgba(45,212,191,.2)',flexShrink:0 }}>
            <div style={{ width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#14b8a6,#0d9488)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(45,212,191,.4)',flexShrink:0 }}>
              <Stethoscope style={{ width:18,height:18,color:'white' }} />
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ color:'white',fontWeight:800,fontSize:14,margin:0,lineHeight:1.3 }}>LifeLink Assistant</p>
              <p style={{ color:'#4ade80',fontSize:10,margin:0,display:'flex',alignItems:'center',gap:4 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'#4ade80',display:'inline-block',animation:'llBounce 1.2s ease-in-out infinite' }} />
                Online · Healthcare AI Guide
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'none',border:'none',color:'rgba(94,234,212,.7)',cursor:'pointer',padding:4,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <ChevronDown style={{ width:20,height:20 }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1,overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:10,minHeight:0,maxHeight:340 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex',gap:8,justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                {m.role==='bot' && (
                  <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#14b8a6,#0d9488)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2 }}>
                    <Stethoscope style={{ width:13,height:13,color:'white' }} />
                  </div>
                )}
                <div style={{
                  maxWidth:'82%',padding:'10px 12px',borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
                  fontSize:11,lineHeight:1.65,
                  background:m.role==='user'?'linear-gradient(135deg,#14b8a6,#0d9488)':'rgba(12,46,40,1)',
                  border:m.role==='user'?'none':'1px solid rgba(45,212,191,.25)',
                  color:m.role==='user'?'white':'rgba(204,251,241,1)',
                }}>
                  <MsgText text={m.text} />
                  <div style={{ fontSize:9,marginTop:4,opacity:.5,textAlign:m.role==='user'?'right':'left' }}>
                    {m.ts.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display:'flex',gap:8,justifyContent:'flex-start' }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#14b8a6,#0d9488)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Stethoscope style={{ width:13,height:13,color:'white' }} />
                </div>
                <div style={{ background:'rgba(12,46,40,1)',border:'1px solid rgba(45,212,191,.25)',padding:'12px 16px',borderRadius:'18px 18px 18px 4px',display:'flex',alignItems:'center',gap:5 }}>
                  {[0,150,300].map(d => <span key={d} style={{ width:7,height:7,background:'#14b8a6',borderRadius:'50%',display:'block',animation:`llBounce 1s ease-in-out infinite`,animationDelay:`${d}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          {showQuick && (
            <div style={{ padding:'8px 14px 6px',flexShrink:0 }}>
              <p style={{ color:'rgba(94,234,212,.5)',fontSize:9,textTransform:'uppercase',letterSpacing:1.5,fontWeight:800,marginBottom:6,margin:'0 0 6px 0' }}>Suggested Questions</p>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {QUICK.map(q => (
                  <button key={q} onClick={() => send(q)} style={{ fontSize:10,padding:'5px 10px',background:'rgba(45,212,191,.1)',border:'1px solid rgba(45,212,191,.3)',color:'#5eead4',borderRadius:20,cursor:'pointer',fontWeight:700,transition:'all .2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(45,212,191,.25)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='rgba(45,212,191,.1)')}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 12px',borderTop:'1px solid rgba(45,212,191,.2)',display:'flex',gap:8,alignItems:'center',background:'rgba(7,30,26,1)',flexShrink:0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input);} }}
              placeholder="Ask about LifeLink..."
              style={{ flex:1,background:'rgba(10,40,34,.8)',border:'1px solid rgba(45,212,191,.3)',borderRadius:14,padding:'9px 14px',color:'white',fontSize:12,outline:'none',fontFamily:'inherit' }}
              onFocus={e=>(e.target.style.borderColor='rgba(45,212,191,.7)')}
              onBlur={e=>(e.target.style.borderColor='rgba(45,212,191,.3)')}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()||typing}
              style={{ width:38,height:38,borderRadius:12,background:input.trim()&&!typing?'#14b8a6':'rgba(45,212,191,.25)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:input.trim()&&!typing?'pointer':'not-allowed',transition:'background .2s',flexShrink:0 }}>
              <Send style={{ width:16,height:16,color:'white' }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
