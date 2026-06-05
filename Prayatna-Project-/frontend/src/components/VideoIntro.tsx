import { useState, useRef, useEffect } from 'react';

// Inject intro animations
const INTRO_STYLE = `
@keyframes llIntroFlash {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  60%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes llIntroZoom {
  0%   { transform: scale(1);    opacity: 1; filter: brightness(1); }
  40%  { transform: scale(1.08); opacity: 1; filter: brightness(2.5); }
  100% { transform: scale(1.18); opacity: 0; filter: brightness(4); }
}
@keyframes llRipple {
  0%   { transform: translate(-50%,-50%) scale(0); opacity: .9; }
  100% { transform: translate(-50%,-50%) scale(6); opacity: 0; }
}
@keyframes llScanLine {
  0%   { top: -4px; }
  100% { top: 100%; }
}
@keyframes llGlitch1 {
  0%,100%{ clip-path:inset(0 0 98% 0); transform:translateX(0); }
  20%    { clip-path:inset(8% 0 55% 0); transform:translateX(-6px); }
  40%    { clip-path:inset(50% 0 20% 0); transform:translateX(6px); }
  60%    { clip-path:inset(20% 0 65% 0); transform:translateX(-3px); }
  80%    { clip-path:inset(70% 0 5% 0);  transform:translateX(4px); }
}
@keyframes llFadeInApp {
  0%   { opacity: 0; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes llPulseHint {
  0%,100% { opacity: 0.5; transform: scale(1); }
  50%     { opacity: 1;   transform: scale(1.06); }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('ll-intro-styles')) {
  const el = document.createElement('style');
  el.id = 'll-intro-styles';
  el.textContent = INTRO_STYLE;
  document.head.appendChild(el);
}

const SESSION_KEY = 'll_intro_done';

interface Props { onDone: () => void; }

export default function VideoIntro({ onDone }: Props) {
  const [phase, setPhase] = useState<'video' | 'text' | 'done'>('video');
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skip if already seen this session
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) { onDone(); }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phase === 'video') {
        setPhase('text');
        transitionTimer.current = setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, '1');
          setPhase('done');
          onDone();
        }, 4000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, onDone]);

  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);

  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* ── VIDEO ── */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          display: 'block',
          filter: phase === 'text' ? 'brightness(0.3) blur(4px)' : 'none',
          transition: 'filter 0.5s ease',
        }}
      />

      {/* Subtle dark overlay to make hint text readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)',
        pointerEvents: 'none',
      }}/>

      {/* 3D Text Reveal */}
      {phase === 'text' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          animation: 'llFadeInApp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }}>
          <h1 style={{
            fontFamily: 'Impact, sans-serif',
            fontSize: '5vw',
            color: '#fff',
            margin: 0,
            textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15)',
            letterSpacing: '4px',
            textAlign: 'center',
          }}>WELCOME TO TRUTHLENS</h1>
          <h2 style={{
            fontFamily: 'sans-serif',
            fontSize: '3vw',
            color: '#ff4444',
            margin: '20px 0 0 0',
            textShadow: '0 1px 0 #aa2222, 0 2px 0 #992222, 0 3px 0 #882222, 0 4px 0 #771111, 0 5px 0 #661111, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25)',
            textAlign: 'center',
            fontWeight: 900
          }}>“ झूठ का परदा फास ”</h2>
        </div>
      )}

      {/* "Press Enter" hint — only during video */}
      {phase === 'video' && (
        <div style={{
          position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          pointerEvents: 'none',
        }}>
          {/* Pulsing ring */}
          <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid rgba(45,212,191,0.5)',
              animation: 'llPulseHint 1.8s ease-in-out infinite',
            }}/>
            <div style={{
              position: 'absolute', inset: 6, borderRadius: '50%',
              border: '1.5px solid rgba(45,212,191,0.8)',
              animation: 'llPulseHint 1.8s ease-in-out infinite 0.4s',
            }}/>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2dd4bf' }}/>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 700,
            letterSpacing: 3, textTransform: 'uppercase',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            animation: 'llPulseHint 2.2s ease-in-out infinite',
          }}>
            Press ENTER to continue
          </p>
        </div>
      )}
    </div>
  );
}
