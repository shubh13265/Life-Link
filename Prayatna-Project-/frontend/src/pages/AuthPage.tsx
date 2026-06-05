import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heart, Phone, User, Mail, Building2, Car, ChevronRight,
  ChevronLeft, Shield, Eye, EyeOff, CheckCircle2, Loader2,
  Ambulance, Stethoscope, Users, ArrowRight, Lock, RefreshCw,
  Zap, MapPin, Navigation, X, AlertTriangle
} from 'lucide-react';
import NeuronCanvas from '../components/NeuronCanvas';

// Inject login page keyframes once
const LOGIN_STYLE = `
@keyframes llOrb { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-24px) scale(1.07)} }
@keyframes llSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes llFadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes llPing { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
@keyframes llFloat2 { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-14px) rotate(6deg)} 66%{transform:translateY(8px) rotate(-4deg)} }
`;
if (typeof document !== 'undefined' && !document.getElementById('ll-auth-styles')) {
  const el = document.createElement('style'); el.id = 'll-auth-styles'; el.textContent = LOGIN_STYLE; document.head.appendChild(el);
}

const PARTICLES = Array.from({length:22},(_,i)=>({
  x: Math.random()*100, y: Math.random()*100,
  size: 1+Math.random()*2.5,
  delay: Math.random()*6, dur: 4+Math.random()*5,
  opacity: 0.06+Math.random()*0.12,
}));

const ICONS_BG = [
  {Icon: Heart, x:8, y:12, delay:'0s', size:22},
  {Icon: Stethoscope, x:88, y:18, delay:'1.2s', size:20},
  {Icon: Ambulance, x:6, y:72, delay:'2.1s', size:24},
  {Icon: Building2, x:90, y:68, delay:'0.7s', size:20},
  {Icon: Shield, x:50, y:6, delay:'1.8s', size:18},
  {Icon: Users, x:50, y:88, delay:'0.4s', size:18},
];

const API = 'http://localhost:5000';

type Role = 'patient' | 'ambulance_driver' | 'hospital_admin';
type Step = 'role' | 'info' | 'otp' | 'login_phone' | 'login_otp';

interface FormData {
  name: string;
  email: string;
  phone: string;
  otp: string;
  // ambulance driver extras
  agencyName: string;
  vehicleNumber: string;
  licenseNumber: string;
  // hospital admin extras
  hospitalName: string;
  hospitalCity: string;
}

const ROLES = [
  {
    id: 'patient' as Role,
    label: 'Patient / General User',
    desc: 'Access hospital info, book appointments & request SOS',
    icon: Users,
    color: 'from-teal-500 to-emerald-500',
    border: 'border-teal-500/50',
    glow: 'shadow-teal-500/20',
    bg: 'bg-teal-950/30',
  },
  {
    id: 'hospital_admin' as Role,
    label: 'Hospital Admin',
    desc: 'Manage hospital resources, beds, inventory & emergencies',
    icon: Building2,
    color: 'from-violet-500 to-purple-500',
    border: 'border-violet-500/50',
    glow: 'shadow-violet-500/20',
    bg: 'bg-violet-950/30',
  },
  {
    id: 'ambulance_driver' as Role,
    label: 'Ambulance Driver',
    desc: 'Receive & respond to emergency SOS dispatch requests',
    icon: Ambulance,
    color: 'from-rose-500 to-orange-500',
    border: 'border-rose-500/50',
    glow: 'shadow-rose-500/20',
    bg: 'bg-rose-950/30',
  },
];

function InputField({
  label, icon: Icon, type = 'text', value, onChange, placeholder, maxLength
}: {
  label: string; icon: any; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; maxLength?: number;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-teal-300/70 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/60" />
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-[#051510] border border-teal-800/40 rounded-xl pl-10 pr-10 py-3 text-white placeholder-teal-700/50 text-sm focus:outline-none focus:border-teal-500/70 focus:ring-1 focus:ring-teal-500/30 transition-all"
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600 hover:text-teal-400 transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Location Permission Modal ──────────────────────────────────────────────
function LocationModal({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<'asking' | 'granted' | 'denied' | 'waiting'>('waiting');

  const request = useCallback(() => {
    setStatus('asking');
    navigator.geolocation.getCurrentPosition(
      () => { setStatus('granted'); setTimeout(onDone, 900); },
      () => { setStatus('denied');  setTimeout(onDone, 1400); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onDone]);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(4,21,18,0.92)',
      backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      animation:'llFadeUp 0.4s ease both',
    }}>
      <div style={{
        background:'rgba(7,24,20,0.97)',
        border:'1px solid rgba(45,212,191,0.25)',
        borderRadius:24,
        padding:'36px 32px',
        maxWidth:360,
        width:'90%',
        textAlign:'center',
        boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(45,212,191,0.08)',
        position:'relative',
      }}>
        {/* top accent */}
        <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:2,borderRadius:2,background:'linear-gradient(90deg,transparent,#2dd4bf,#059669,transparent)'}} />

        {/* icon */}
        <div style={{
          width:72,height:72,borderRadius:20,
          background:'linear-gradient(135deg,#2dd4bf22,#05966922)',
          border:'1px solid rgba(45,212,191,0.3)',
          display:'flex',alignItems:'center',justifyContent:'center',
          margin:'0 auto 20px',
          position:'relative',
        }}>
          {status === 'granted'
            ? <CheckCircle2 style={{width:32,height:32,color:'#2dd4bf'}} />
            : status === 'denied'
            ? <AlertTriangle style={{width:32,height:32,color:'#fb923c'}} />
            : status === 'asking'
            ? <Navigation style={{width:32,height:32,color:'#2dd4bf',animation:'llSpin 1.5s linear infinite'}} />
            : <MapPin style={{width:32,height:32,color:'#2dd4bf'}} />}
          {status === 'asking' && (
            <div style={{position:'absolute',inset:-6,borderRadius:26,border:'2px solid rgba(45,212,191,0.4)',animation:'llPing 1.2s ease-out infinite'}} />
          )}
        </div>

        {status === 'waiting' && (
          <>
            <h2 style={{color:'white',fontWeight:900,fontSize:20,margin:'0 0 8px',letterSpacing:-0.5}}>
              Enable Live Location
            </h2>
            <p style={{color:'rgba(45,212,191,0.6)',fontSize:13,lineHeight:1.6,margin:'0 0 24px'}}>
              LifeLink needs your <strong style={{color:'rgba(45,212,191,0.9)'}}>live location</strong> to dispatch
              emergency services and provide accurate ETA updates. Your location is only shared
              during active emergencies.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={request} style={{
                width:'100%',padding:'13px 0',borderRadius:14,border:'none',cursor:'pointer',
                background:'linear-gradient(135deg,#2dd4bf,#059669)',
                color:'white',fontWeight:800,fontSize:14,
                boxShadow:'0 8px 32px rgba(45,212,191,0.3)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              }}>
                <Navigation style={{width:16,height:16}} /> Allow Location Access
              </button>
              <button onClick={onDone} style={{
                width:'100%',padding:'11px 0',borderRadius:14,border:'1px solid rgba(45,212,191,0.15)',cursor:'pointer',
                background:'transparent',color:'rgba(45,212,191,0.45)',fontWeight:600,fontSize:13,
              }}>
                Skip for now
              </button>
            </div>
          </>
        )}

        {status === 'asking' && (
          <>
            <h2 style={{color:'white',fontWeight:900,fontSize:20,margin:'0 0 8px'}}>Requesting Location…</h2>
            <p style={{color:'rgba(45,212,191,0.6)',fontSize:13}}>Please allow location access in your browser prompt.</p>
          </>
        )}

        {status === 'granted' && (
          <>
            <h2 style={{color:'#2dd4bf',fontWeight:900,fontSize:20,margin:'0 0 8px'}}>Location Enabled ✓</h2>
            <p style={{color:'rgba(45,212,191,0.6)',fontSize:13}}>Live tracking is now active. Entering LifeLink…</p>
          </>
        )}

        {status === 'denied' && (
          <>
            <h2 style={{color:'#fb923c',fontWeight:900,fontSize:20,margin:'0 0 8px'}}>Location Denied</h2>
            <p style={{color:'rgba(251,146,60,0.7)',fontSize:13,marginBottom:16}}>
              Some features may be limited without location. You can enable it later in browser settings.
            </p>
            <button onClick={onDone} style={{
              padding:'11px 28px',borderRadius:14,border:'1px solid rgba(251,146,60,0.3)',cursor:'pointer',
              background:'rgba(251,146,60,0.1)',color:'#fb923c',fontWeight:700,fontSize:13,
            }}>Continue Anyway</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthPage({ onAuth }: { onAuth: (user: any) => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null); // user pending location permission

  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', otp: '',
    agencyName: '', vehicleNumber: '', licenseNumber: '',
    hospitalName: '', hospitalCity: '',
  });

  const set = (k: keyof FormData) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedRole = ROLES.find(r => r.id === role);

  const startCountdown = () => {
    setCountdown(20);
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const sendOtp = async (phoneNum: string) => {
    if (!phoneNum || phoneNum.length !== 10) { setError('Enter a valid 10-digit phone number'); return; }
    setError(''); setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNum }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Failed to send OTP'); }
      else {
        setOtpSent(true);
        startCountdown();
        if (d.otp) setDevOtp(d.otp); // dev mode OTP
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleRegisterOtp = async () => {
    if (!form.otp || form.otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const body: any = {
        phone: form.phone, otp: form.otp, name: form.name,
        email: form.email || undefined, userType: role,
      };
      if (role === 'ambulance_driver') {
        body.agencyName = form.agencyName;
        body.vehicleNumber = form.vehicleNumber;
        body.licenseNumber = form.licenseNumber;
      }
      if (role === 'hospital_admin') {
        body.hospitalName = form.hospitalName;
      }
      const r = await fetch(`${API}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Registration failed'); }
      else {
        sessionStorage.setItem('lifelink_token', d.data.token);
        sessionStorage.setItem('lifelink_user', JSON.stringify(d.data));
        setPendingUser(d.data); // show location modal first
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleLoginOtp = async () => {
    if (!form.otp || form.otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, otp: form.otp }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || 'Login failed'); }
      else {
        sessionStorage.setItem('lifelink_token', d.data.token);
        sessionStorage.setItem('lifelink_user', JSON.stringify(d.data));
        setPendingUser(d.data); // show location modal first
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const switchMode = (m: 'register' | 'login') => {
    setMode(m); setStep(m === 'register' ? 'role' : 'login_phone');
    setError(''); setOtpSent(false); setDevOtp('');
    setForm({ name: '', email: '', phone: '', otp: '', agencyName: '', vehicleNumber: '', licenseNumber: '', hospitalName: '', hospitalCity: '' });
  };

  // â”€â”€ Step: Role selection â”€â”€
  const renderRoleStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-teal-400/70 text-sm">I am registering as aâ€¦</p>
      </div>
      {ROLES.map(r => (
        <button
          key={r.id}
          onClick={() => { setRole(r.id); setStep('info'); setError(''); }}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${r.border} ${r.bg} hover:shadow-lg ${r.glow} transition-all duration-300 group hover:scale-[1.02]`}
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <r.icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-white font-bold text-sm">{r.label}</p>
            <p className="text-teal-400/60 text-xs mt-0.5">{r.desc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-600 group-hover:text-teal-400 transition-colors flex-shrink-0" />
        </button>
      ))}
    </div>
  );

  // â”€â”€ Step: Info form â”€â”€
  const renderInfoStep = () => (
    <div className="space-y-4">
      <button onClick={() => { setStep('role'); setError(''); }} className="flex items-center gap-2 text-teal-400/70 hover:text-teal-300 text-sm transition-colors mb-2">
        <ChevronLeft className="w-4 h-4" /> Change Role
      </button>

      {selectedRole && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedRole.border} ${selectedRole.bg} mb-4`}>
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedRole.color} flex items-center justify-center`}>
            <selectedRole.icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">{selectedRole.label}</span>
        </div>
      )}

      <InputField label="Full Name" icon={User} value={form.name} onChange={set('name')} placeholder="Enter your full name" />
      <InputField label="Email (Optional)" icon={Mail} type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
      <InputField label="Phone Number" icon={Phone} type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile number" maxLength={10} />

      {role === 'ambulance_driver' && (
        <>
          <InputField label="Agency / Company Name" icon={Building2} value={form.agencyName} onChange={set('agencyName')} placeholder="e.g. City Ambulance Services" />
          <InputField label="Vehicle Number" icon={Car} value={form.vehicleNumber} onChange={set('vehicleNumber')} placeholder="e.g. DL-01-AM-1234" />
          <InputField label="License Number" icon={Shield} value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="Driving license number" />
        </>
      )}

      {role === 'hospital_admin' && (
        <>
          <InputField label="Hospital Name" icon={Building2} value={form.hospitalName} onChange={set('hospitalName')} placeholder="e.g. City Medical Center" />
          <InputField label="City" icon={Stethoscope} value={form.hospitalCity} onChange={set('hospitalCity')} placeholder="e.g. New Delhi" />
        </>
      )}

      {error && <p className="text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 rounded-lg px-3 py-2">{error}</p>}

      <button
        onClick={async () => {
          if (!form.name.trim()) { setError('Name is required'); return; }
          if (!form.phone || form.phone.length !== 10) { setError('Enter valid 10-digit phone number'); return; }
          if (role === 'hospital_admin' && !form.hospitalName.trim()) { setError('Hospital name is required'); return; }
          await sendOtp(form.phone);
          if (form.phone.length === 10) setStep('otp');
        }}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/20 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Send OTP</>}
      </button>
    </div>
  );

  // â”€â”€ Step: OTP (register) â”€â”€
  const renderOtpStep = () => (
    <div className="space-y-4">
      <button onClick={() => { setStep('info'); setError(''); }} className="flex items-center gap-2 text-teal-400/70 hover:text-teal-300 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-3">
          <Phone className="w-7 h-7 text-teal-400" />
        </div>
        <p className="text-white font-semibold">OTP sent to</p>
        <p className="text-teal-300 font-bold text-lg">+91 {form.phone}</p>
        {devOtp && (
          <div className="mt-2 space-y-2">
            <p className="text-amber-400 text-xs bg-amber-950/30 border border-amber-700/30 rounded-lg px-3 py-1.5">
              🛠 Dev Mode OTP: <strong>{devOtp}</strong>
            </p>
            <button
              onClick={() => set('otp')(devOtp)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 hover:border-amber-400/50 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5" /> Auto-fill OTP
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-teal-300/70 uppercase tracking-wider">Enter 6-Digit OTP</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={form.otp}
          onChange={e => set('otp')(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
          placeholder="_ _ _ _ _ _"
          className="w-full bg-[#051510] border border-teal-800/40 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-teal-500/70 focus:ring-1 focus:ring-teal-500/30 transition-all"
        />
      </div>

      {error && <p className="text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 rounded-lg px-3 py-2">{error}</p>}

      <button onClick={handleRegisterOtp} disabled={loading || form.otp.length !== 6}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/20 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Verify & Register</>}
      </button>

      <button onClick={() => { sendOtp(form.phone); setForm(f => ({ ...f, otp: '' })); }}
        disabled={countdown > 0 || loading}
        className="w-full py-2 text-teal-400/70 hover:text-teal-300 text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
        <RefreshCw className="w-3 h-3" />
        {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
      </button>
    </div>
  );

  // ——— Login Steps ———
  const renderLoginPhoneStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-teal-400/70 text-sm">Enter your registered phone number</p>
      </div>
      <InputField label="Phone Number" icon={Phone} type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile number" maxLength={10} />
      {error && <p className="text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 rounded-lg px-3 py-2">{error}</p>}
      <button
        onClick={async () => { await sendOtp(form.phone); if (form.phone.length === 10) setStep('login_otp'); }}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/20 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Send OTP</>}
      </button>
    </div>
  );

  const renderLoginOtpStep = () => (
    <div className="space-y-4">
      <button onClick={() => { setStep('login_phone'); setError(''); }} className="flex items-center gap-2 text-teal-400/70 hover:text-teal-300 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-7 h-7 text-teal-400" />
        </div>
        <p className="text-white font-semibold">OTP sent to</p>
        <p className="text-teal-300 font-bold text-lg">+91 {form.phone}</p>
        {devOtp && (
          <div className="mt-2 space-y-2">
            <p className="text-amber-400 text-xs bg-amber-950/30 border border-amber-700/30 rounded-lg px-3 py-1.5">
              🛠 Dev Mode OTP: <strong>{devOtp}</strong>
            </p>
            <button
              onClick={() => set('otp')(devOtp)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 hover:border-amber-400/50 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5" /> Auto-fill OTP
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-teal-300/70 uppercase tracking-wider">Enter 6-Digit OTP</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={form.otp}
          onChange={e => set('otp')(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
          placeholder="_ _ _ _ _ _"
          className="w-full bg-[#051510] border border-teal-800/40 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-teal-500/70 focus:ring-1 focus:ring-teal-500/30 transition-all"
        />
      </div>
      {error && <p className="text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 rounded-lg px-3 py-2">{error}</p>}
      <button onClick={handleLoginOtp} disabled={loading || form.otp.length !== 6}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/20 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Verify & Sign In</>}
      </button>
      <button onClick={() => { sendOtp(form.phone); setForm(f => ({ ...f, otp: '' })); }}
        disabled={countdown > 0 || loading}
        className="w-full py-2 text-teal-400/70 hover:text-teal-300 text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
        <RefreshCw className="w-3 h-3" />
        {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
      </button>
    </div>
  );

  const stepContent = () => {
    if (mode === 'login') {
      return step === 'login_phone' ? renderLoginPhoneStep() : renderLoginOtpStep();
    }
    if (step === 'role') return renderRoleStep();
    if (step === 'info') return renderInfoStep();
    return renderOtpStep();
  };

  const stepLabel = () => {
    if (mode === 'login') return step === 'login_phone' ? 'Enter Phone' : 'Verify OTP';
    if (step === 'role') return 'Select Role';
    if (step === 'info') return 'Your Details';
    return 'Verify OTP';
  };

  const [mouse, setMouse] = useState({x:50,y:50});
  const [tilt, setTilt] = useState({x:0,y:0});
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const nx = (e.clientX/window.innerWidth)*100;
    const ny = (e.clientY/window.innerHeight)*100;
    setMouse({x:nx,y:ny});
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      const cx = e.clientX - r.left - r.width/2;
      const cy = e.clientY - r.top - r.height/2;
      setTilt({x:(cy/r.height)*-8, y:(cx/r.width)*8});
    }
  };
  const onMouseLeave = () => setTilt({x:0,y:0});

  return (
    <>
    {pendingUser && (
      <LocationModal onDone={() => { setPendingUser(null); onAuth(pendingUser); }} />
    )}
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{background:'#041512'}}
      onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>

      {/* Neuron network canvas */}
      <NeuronCanvas />

      {/* Deep radial vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(4,21,18,0.85) 100%)', zIndex:1}}/>

      {/* Content */}
      <div className="w-full max-w-[440px] relative" style={{zIndex:2, animation:'llFadeUp 0.7s ease both'}}>

        {/* Brand */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-3">
            <div style={{width:56,height:56,borderRadius:18,background:'linear-gradient(135deg,#2dd4bf 0%,#059669 100%)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(45,212,191,0.45)',position:'relative'}}>
              <Heart style={{width:26,height:26,color:'white',fill:'white'}}/>
              <div style={{position:'absolute',inset:-1,borderRadius:19,background:'linear-gradient(135deg,rgba(45,212,191,0.6),transparent)',zIndex:-1}}/>
            </div>
            <div className="text-left">
              <h1 style={{fontSize:30,fontWeight:900,color:'white',margin:0,letterSpacing:-1,textShadow:'0 0 60px rgba(45,212,191,0.4)'}}>LifeLink</h1>
              <p style={{fontSize:10,color:'rgba(45,212,191,0.6)',margin:0,fontWeight:700,letterSpacing:3,textTransform:'uppercase'}}>Emergency Response Network</p>
            </div>
          </div>
        </div>

        {/* Animated gradient border card */}
        <div style={{padding:1.5,borderRadius:28,background:'linear-gradient(135deg,rgba(45,212,191,0.5),rgba(16,185,129,0.2),rgba(45,212,191,0.4))',boxShadow:'0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(45,212,191,0.08)'}}>
          <div
            ref={cardRef}
            style={{
              background:'rgba(7,20,17,0.92)',
              backdropFilter:'blur(32px)',
              borderRadius:27,
              overflow:'hidden',
              transform:`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition:'transform 0.18s ease',
              position:'relative',
            }}
          >
            {/* Inner shimmer */}
            <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at ${50+tilt.y*4}% ${50+tilt.x*-4}%, rgba(45,212,191,0.07) 0%, transparent 55%)`,pointerEvents:'none',zIndex:0,transition:'background 0.18s'}}/>
            {/* Top accent line */}
            <div style={{height:2,background:'linear-gradient(90deg,transparent,rgba(45,212,191,0.8),rgba(16,185,129,0.8),transparent)',position:'relative',zIndex:1}}/>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid rgba(45,212,191,0.1)',position:'relative',zIndex:1}}>
              {(['register','login'] as const).map(m=>(
                <button key={m} onClick={()=>switchMode(m)}
                  style={{
                    flex:1,padding:'14px 0',fontSize:13,fontWeight:800,border:'none',cursor:'pointer',transition:'all 0.2s',
                    color:mode===m?'#2dd4bf':'rgba(45,212,191,0.35)',
                    background:mode===m?'rgba(45,212,191,0.07)':'transparent',
                    borderBottom:mode===m?'2px solid #2dd4bf':'2px solid transparent',
                  }}>
                  {m==='register'?'Create Account':'Sign In'}
                </button>
              ))}
            </div>

            {/* Step dots */}
            <div style={{padding:'14px 24px 8px',display:'flex',alignItems:'center',gap:8,position:'relative',zIndex:1}}>
              {mode==='register'&&(
                <div style={{display:'flex',alignItems:'center',gap:6,flex:1}}>
                  {['role','info','otp'].map((s,i)=>(
                    <React.Fragment key={s}>
                      <div style={{width:8,height:8,borderRadius:'50%',transition:'all 0.3s',
                        background:step===s?'#2dd4bf':['role','info','otp'].indexOf(step)>i?'#0d9488':'rgba(45,212,191,0.15)',
                        boxShadow:step===s?'0 0 10px rgba(45,212,191,0.8)':'none',
                        transform:step===s?'scale(1.4)':'scale(1)'}}/>
                      {i<2&&<div style={{flex:1,height:1,background:['role','info','otp'].indexOf(step)>i?'rgba(45,212,191,0.5)':'rgba(45,212,191,0.1)'}}/>}
                    </React.Fragment>
                  ))}
                </div>
              )}
              <span style={{fontSize:9,fontWeight:800,color:'rgba(45,212,191,0.4)',textTransform:'uppercase',letterSpacing:2,marginLeft:'auto'}}>{stepLabel()}</span>
            </div>

            {/* Form content */}
            <div style={{padding:'8px 24px 28px',position:'relative',zIndex:1}}>
              {stepContent()}
            </div>
          </div>
        </div>

        <p style={{textAlign:'center',color:'rgba(45,212,191,0.2)',fontSize:11,marginTop:20}}>
          Secured with OTP &middot; LifeLink &copy; 2026
        </p>
      </div>
    </div>
    </>
  );
}

