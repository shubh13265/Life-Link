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
  const [phase, setPhase] = useState<'video' | 'transition' | 'done'>('video');
  const [ripplePos, setRipplePos] = useState({ x: 50, y: 50 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skip if already seen this session
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) { onDone(); }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'video') return;
    // Capture click position for ripple origin
    const rect = e.currentTarget.getBoundingClientRect();
    setRipplePos({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    });
    setPhase('transition');
    // After transition animation completes, call onDone
    transitionTimer.current = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setPhase('done');
      onDone();
    }, 900);
  };

  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);

  if (phase === 'done') return null;

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        cursor: phase === 'video' ? 'pointer' : 'default',
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
          animation: phase === 'transition' ? 'llIntroZoom 0.9s ease forwards' : 'none',
          display: 'block',
        }}
      />

      {/* Subtle dark overlay to make hint text readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)',
        pointerEvents: 'none',
      }}/>

      {/* Glitch layer on transition */}
      {phase === 'transition' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'url(/intro.mp4)',
          animation: 'llGlitch1 0.4s steps(1) forwards',
          mixBlendMode: 'screen',
          opacity: 0.4,
        }}/>
      )}

      {/* Ripple burst at click point */}
      {phase === 'transition' && (
        <div style={{
          position: 'absolute',
          left: `${ripplePos.x}%`, top: `${ripplePos.y}%`,
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,0.9) 0%, rgba(45,212,191,0) 70%)',
          animation: 'llRipple 0.8s ease-out forwards',
          pointerEvents: 'none',
        }}/>
      )}

      {/* Scan line on transition */}
      {phase === 'transition' && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.9), transparent)',
          animation: 'llScanLine 0.5s linear forwards',
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(45,212,191,0.8)',
        }}/>
      )}

      {/* White flash overlay */}
      {phase === 'transition' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(45,212,191,0.15)',
          animation: 'llIntroFlash 0.9s ease forwards',
          pointerEvents: 'none',
        }}/>
      )}

      {/* "Click anywhere" hint — only during video */}
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
            Click anywhere to enter
          </p>
        </div>
      )}
    </div>
  );
}
