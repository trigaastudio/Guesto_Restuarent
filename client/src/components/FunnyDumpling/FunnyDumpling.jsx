import React, { useState, useEffect, useRef } from 'react';

/**
 * FunnyDumpling – A 3D-shaded, realistic dumpling chef.
 * Optimizations:
 * - Uses hardware-accelerated translate3d for buttery smooth mobile rendering.
 * - Added touchmove support for mobile screens so eyes follow dragging fingers.
 * - Added a gentle random idle look-around when no mouse/touch movement is detected,
 *   preventing the character from feeling "stuck" on mobile.
 * - Scaled down slightly on mobile screens via CSS media queries.
 */
const FunnyDumpling = ({ isHiding = false, activeField = '' }) => {
  const svgRef = useRef(null);
  const [posX, setPosX] = useState(0);
  const [direction, setDirection] = useState(1);
  const [waddle, setWaddle] = useState(false);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [isTouched, setIsTouched] = useState(false);
  
  const lastMoveTime = useRef(Date.now());
  const MAX_PUPIL_TRAVEL = 4;
  const WALKING_BOUNDS = 80; // Slightly narrower walking bounds for mobile safety

  // Handle slow walking physics
  useEffect(() => {
    if (activeField || isHiding || isTouched) {
      return;
    }

    let localDir = direction;
    const interval = setInterval(() => {
      setPosX(prev => {
        const step = 4;
        const next = prev + localDir * step;
        
        if (next > WALKING_BOUNDS) {
          localDir = -1;
          setDirection(-1);
          return WALKING_BOUNDS;
        }
        if (next < -WALKING_BOUNDS) {
          localDir = 1;
          setDirection(1);
          return -WALKING_BOUNDS;
        }
        return next;
      });
      setWaddle(w => !w);
    }, 140);

    return () => clearInterval(interval);
  }, [activeField, isHiding, direction, isTouched]);

  // Handle pointer movements (mouse + touch) & idle look-around
  useEffect(() => {
    if (isHiding || isTouched) {
      setPupil({ x: 0, y: MAX_PUPIL_TRAVEL });
      return;
    }

    if (activeField) {
      setPupil({ x: 0, y: MAX_PUPIL_TRAVEL * 0.8 });
      return;
    }

    const updatePupilPosition = (clientX, clientY) => {
      if (!svgRef.current) return;
      lastMoveTime.current = Date.now();
      
      const rect = svgRef.current.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = clientX - center.x;
      const dy = clientY - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const factor = Math.min(dist / 180, 1);

      setPupil({
        x: Math.cos(angle) * MAX_PUPIL_TRAVEL * factor,
        y: Math.sin(angle) * MAX_PUPIL_TRAVEL * factor
      });
    };

    const handleMouseMove = (e) => {
      updatePupilPosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        updatePupilPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Idle look-around interval: if no move for 1.8s, look at random directions gently
    const idleInterval = setInterval(() => {
      if (Date.now() - lastMoveTime.current > 1800) {
        const randomAngle = Math.random() * Math.PI * 2;
        const randomFactor = 0.3 + Math.random() * 0.7; // random strength
        setPupil({
          x: Math.cos(randomAngle) * MAX_PUPIL_TRAVEL * randomFactor,
          y: Math.sin(randomAngle) * MAX_PUPIL_TRAVEL * randomFactor
        });
      }
    }, 1200);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      clearInterval(idleInterval);
    };
  }, [isHiding, activeField, isTouched]);

  const isWalking = !activeField && !isHiding && !isTouched;
  const scaleX = isWalking ? (direction > 0 ? 1 : -1) : 1;

  // 3D Parallax offset calculations
  const faceOffsetX = isTouched ? 0 : pupil.x * 1.4;
  const faceOffsetY = isTouched ? -1 : pupil.y * 1.1;
  const hatOffsetX = isTouched ? 0 : -pupil.x * 0.7;
  const hatOffsetY = isTouched ? -2 : -pupil.y * 0.5;

  return (
    <div 
      className="absolute bottom-0 left-1/2 select-none pointer-events-auto z-30 cursor-pointer will-change-transform scale-75 sm:scale-100 origin-bottom"
      onMouseEnter={() => setIsTouched(true)}
      onMouseLeave={() => setIsTouched(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
      style={{
        transform: `translate3d(calc(-50% + ${posX}px), 0, 0)`,
        transition: isWalking ? 'transform 140ms linear' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
      }}
    >
      <svg
        ref={svgRef}
        width="110"
        height="90"
        viewBox="0 0 110 90"
        xmlns="http://www.w3.org/2000/svg"
        className={isTouched ? 'animate-dumpling-hop' : ''}
        style={{
          transform: `scaleX(${scaleX}) translate3d(0, ${isWalking && waddle ? '-2px' : '0px'}, 0) rotate(${isWalking ? (waddle ? '3deg' : '-3deg') : '0deg'})`,
          transition: 'transform 140ms ease-in-out',
          transformOrigin: '55px 80px'
        }}
      >
        <defs>
          <radialGradient id="dumplingBodyGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#FFFBF7" />
            <stop offset="85%" stopColor="#F5EADE" />
            <stop offset="100%" stopColor="#E6D3BF" />
          </radialGradient>
          <radialGradient id="hatGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="80%" stopColor="#F0F0F0" />
            <stop offset="100%" stopColor="#D6D6D6" />
          </radialGradient>
          <radialGradient id="feetGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFAE4A" />
            <stop offset="100%" stopColor="#C47715" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse 
          cx="55" 
          cy="82" 
          rx={isTouched ? "23" : (isWalking && waddle ? "25" : "29")} 
          ry="3.5" 
          fill="rgba(0,0,0,0.18)" 
          style={{ transition: 'rx 140ms ease-in-out, ry 140ms ease-in-out' }}
        />

        {/* Feet */}
        <g 
          style={{
            transform: isTouched ? 'translate3d(0, 1px, 0)' : (isWalking ? (waddle ? 'rotate(12deg) translate3d(0, -2px, 0)' : 'rotate(-8deg)') : 'none'),
            transformOrigin: '42px 76px',
            transition: 'transform 140ms ease-in-out'
          }}
        >
          <ellipse cx="42" cy="80" rx="9.5" ry="6" fill="url(#feetGrad)" stroke="#8C4D00" strokeWidth="1" />
        </g>
        
        <g 
          style={{
            transform: isTouched ? 'translate3d(0, 1px, 0)' : (isWalking ? (waddle ? 'rotate(-8deg)' : 'rotate(12deg) translate3d(0, -2px, 0)') : 'none'),
            transformOrigin: '68px 76px',
            transition: 'transform 140ms ease-in-out'
          }}
        >
          <ellipse cx="68" cy="80" rx="9.5" ry="6" fill="url(#feetGrad)" stroke="#8C4D00" strokeWidth="1" />
        </g>

        {/* Chef Hat */}
        <g 
          style={{
            transform: `translate3d(${hatOffsetX}px, ${hatOffsetY + (isWalking && waddle ? 1 : 2)}px, 0) rotate(${isTouched ? '14deg' : (isWalking ? (waddle ? '12deg' : '8deg') : '10deg')})`,
            transition: isWalking ? 'transform 140ms ease-in-out' : 'transform 0.15s ease-out',
            transformOrigin: '55px 24px'
          }}
        >
          <rect x="47" y="11" width="16" height="11" rx="3" fill="url(#hatGrad)" stroke="#B91C1C" strokeWidth="1.5" />
          <circle cx="49" cy="8" r="6" fill="url(#hatGrad)" stroke="#B91C1C" strokeWidth="1.5" />
          <circle cx="55" cy="5" r="7.5" fill="url(#hatGrad)" stroke="#B91C1C" strokeWidth="1.5" />
          <circle cx="61" cy="8" r="6" fill="url(#hatGrad)" stroke="#B91C1C" strokeWidth="1.5" />
          <line x1="47" y1="17" x2="63" y2="17" stroke="#B91C1C" strokeWidth="1.5" />
        </g>

        {/* Body */}
        <path
          d="M 25,75 
             C 18,52 32,26 55,26 
             C 78,26 92,52 85,75 
             C 85,82 25,82 25,75 Z"
          fill="url(#dumplingBodyGrad)"
          stroke="#9E7D5C"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <path d="M 46,26 C 48,31 49,34 49,34" stroke="#C4A88E" strokeWidth="2" strokeLinecap="round" />
        <path d="M 55,26 C 55,31 55,35 55,35" stroke="#C4A88E" strokeWidth="2" strokeLinecap="round" />
        <path d="M 64,26 C 62,31 61,34 61,34" stroke="#C4A88E" strokeWidth="2" strokeLinecap="round" />

        {/* Face Group */}
        <g
          style={{
            transform: `translate3d(${faceOffsetX}px, ${faceOffsetY}px, 0)`,
            transition: isWalking ? 'transform 140ms ease-in-out' : 'transform 0.12s ease-out'
          }}
        >
          <ellipse cx="34" cy="65" rx="8" ry="5.5" fill="#FFA3A3" opacity="0.4" />
          <ellipse cx="76" cy="65" rx="8" ry="5.5" fill="#FFA3A3" opacity="0.4" />

          {isTouched ? (
            <g>
              <path d="M 33,52 Q 43,44 53,52" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 57,52 Q 67,44 77,52" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 45,61 C 45,74 65,74 65,61 Z" fill="#B91C1C" />
              <path d="M 49,67 C 52,71 58,71 61,67" fill="#FFA3A3" />
            </g>
          ) : isHiding ? (
            <g>
              <path d="M 33,53 Q 43,61 53,53" stroke="#8A6E53" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 57,53 Q 67,61 77,53" stroke="#8A6E53" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <circle cx="55" cy="65" r="4" fill="#B91C1C" />
            </g>
          ) : (
            <g>
              <circle cx="43" cy="51" r="11.5" fill="#FFFFFF" stroke="#8A6E53" strokeWidth="1.5" />
              <circle cx="67" cy="51" r="11.5" fill="#FFFFFF" stroke="#8A6E53" strokeWidth="1.5" />
              <circle cx={43 + pupil.x * 0.8} cy={51 + pupil.y * 0.8} r="5" fill="#1C1C2E" />
              <circle cx={43 + pupil.x * 0.8 + 1.5} cy={51 + pupil.y * 0.8 - 1.5} r="1.5" fill="#FFFFFF" />
              <circle cx={67 + pupil.x * 0.8} cy={51 + pupil.y * 0.8} r="5" fill="#1C1C2E" />
              <circle cx={67 + pupil.x * 0.8 + 1.5} cy={51 + pupil.y * 0.8 - 1.5} r="1.5" fill="#FFFFFF" />
              <path d="M 50,63 Q 55,68 60,63" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
          )}
        </g>

        {/* Arms */}
        {isTouched ? (
          <g>
            <path d="M 26,65 C 16,58 20,48 28,52" stroke="#9E7D5C" strokeWidth="2" fill="url(#dumplingBodyGrad)" strokeLinecap="round" />
            <path d="M 84,65 C 94,58 90,48 82,52" stroke="#9E7D5C" strokeWidth="2" fill="url(#dumplingBodyGrad)" strokeLinecap="round" />
          </g>
        ) : isHiding ? (
          <g>
            <path d="M 23,68 C 23,58 35,49 38,51" stroke="#9E7D5C" strokeWidth="2" fill="url(#dumplingBodyGrad)" strokeLinecap="round" />
            <path d="M 87,68 C 87,58 75,49 72,51" stroke="#9E7D5C" strokeWidth="2" fill="url(#dumplingBodyGrad)" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M 26,65 C 15,65 15,71 25,72" stroke="#9E7D5C" strokeWidth="2" fill="url(#dumplingBodyGrad)" strokeLinecap="round" />
            <path d="M 84,65 C 95,65 95,71 85,72" stroke="#9E7D5C" strokeWidth="2" fill="url(#dumplingBodyGrad)" strokeLinecap="round" />
          </g>
        )}
      </svg>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hop {
          0%, 100% { transform: scaleX(1) translate3d(0,0,0); }
          40% { transform: scaleX(0.97) translate3d(0,-9px,0); }
          50% { transform: scaleX(1.02) translate3d(0,-10px,0); }
          60% { transform: scaleX(0.97) translate3d(0,-9px,0); }
        }
        .animate-dumpling-hop {
          animation: hop 0.5s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default FunnyDumpling;
