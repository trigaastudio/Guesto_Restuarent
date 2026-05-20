import React, { useState, useEffect, useRef } from 'react';

/**
 * WatchingCat – simple SVG cat that tracks the mouse cursor.
 *
 * Props:
 *   isHiding     {boolean} – true → eyes shut (password field)
 *   activeField  {string}  – name of the currently focused input field
 */
const WatchingCat = ({ isHiding = false, activeField = '' }) => {
  const svgRef = useRef(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  // Eye centers in SVG coordinate space
  const L = { x: 33, y: 55 };
  const R = { x: 63, y: 55 };
  const MAX_TRAVEL = 4.5;

  useEffect(() => {
    // Password → look straight down (shy)
    if (isHiding) {
      setPupil({ x: 0, y: MAX_TRAVEL });
      return;
    }

    // Typing in a visible field → look slightly down toward form
    if (activeField) {
      setPupil({ x: 0, y: MAX_TRAVEL * 0.7 });
      return;
    }

    // Default → follow mouse
    const onMove = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      // Use average of the two eye centers as focal point
      const eyeCX = rect.left + (rect.width * 0.5);
      const eyeCY = rect.top  + (rect.height * 0.52);

      const dx = e.clientX - eyeCX;
      const dy = e.clientY - eyeCY;
      const dist  = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const factor = Math.min(dist / 160, 1);

      setPupil({
        x: Math.cos(angle) * MAX_TRAVEL * factor,
        y: Math.sin(angle) * MAX_TRAVEL * factor,
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isHiding, activeField]);

  // Smooth pupil motion via CSS transition on the <g> element
  const pupilStyle = {
    transform: `translate(${pupil.x}px, ${pupil.y}px)`,
    transition: 'transform 0.12s ease-out',
  };

  return (
    <div
      className="flex justify-center mb-4 select-none pointer-events-none"
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        width="96"
        height="100"
        viewBox="0 0 96 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Cat ears ── */}
        <polygon points="10,42 20,16 34,40" fill="#FFCBA4" />
        <polygon points="62,40 76,16 86,42" fill="#FFCBA4" />
        {/* inner ear */}
        <polygon points="15,40 20,22 30,39" fill="#F5A47C" opacity="0.55" />
        <polygon points="66,39 76,22 81,40" fill="#F5A47C" opacity="0.55" />

        {/* ── Head ── */}
        <circle cx="48" cy="58" r="36" fill="#FFCBA4" />

        {/* ── Rosy cheeks ── */}
        <ellipse cx="24" cy="70" rx="10" ry="6.5" fill="#FF9999" opacity="0.22" />
        <ellipse cx="72" cy="70" rx="10" ry="6.5" fill="#FF9999" opacity="0.22" />

        {/* ── Eyebrows (raise when hiding) ── */}
        <path
          d="M22 42 Q33 36 44 42"
          stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" fill="none"
          style={{ transform: isHiding ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform 0.3s' }}
        />
        <path
          d="M52 42 Q63 36 74 42"
          stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" fill="none"
          style={{ transform: isHiding ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform 0.3s' }}
        />

        {/* ── Eyes OPEN ── */}
        <g style={{ opacity: isHiding ? 0 : 1, transition: 'opacity 0.18s' }}>
          {/* Left eye white */}
          <circle cx={L.x} cy={L.y} r="11.5" fill="white" />
          {/* Right eye white */}
          <circle cx={R.x} cy={R.y} r="11.5" fill="white" />

          {/* Pupils – move together */}
          <g style={pupilStyle}>
            {/* Left pupil */}
            <circle cx={L.x} cy={L.y} r="6.5" fill="#1C1C2E" />
            <circle cx={L.x + 2} cy={L.y - 2} r="2" fill="white" />
            {/* Right pupil */}
            <circle cx={R.x} cy={R.y} r="6.5" fill="#1C1C2E" />
            <circle cx={R.x + 2} cy={R.y - 2} r="2" fill="white" />
          </g>
        </g>

        {/* ── Eyes CLOSED ── */}
        <g style={{ opacity: isHiding ? 1 : 0, transition: 'opacity 0.18s 0.1s' }}>
          <path
            d="M22 55 Q33 65 44 55"
            stroke="#8B5E3C" strokeWidth="2.8" strokeLinecap="round"
            fill="#FFCBA4"
          />
          <path
            d="M52 55 Q63 65 74 55"
            stroke="#8B5E3C" strokeWidth="2.8" strokeLinecap="round"
            fill="#FFCBA4"
          />
        </g>

        {/* ── Nose ── */}
        <path d="M46 67 L48 70 L50 67 Q48 65 46 67Z" fill="#D4847A" />

        {/* ── Whiskers ── */}
        <line x1="8"  y1="67" x2="30" y2="68" stroke="#C0A090" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
        <line x1="8"  y1="72" x2="30" y2="71" stroke="#C0A090" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
        <line x1="66" y1="68" x2="88" y2="67" stroke="#C0A090" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
        <line x1="66" y1="71" x2="88" y2="72" stroke="#C0A090" strokeWidth="1" opacity="0.5" strokeLinecap="round" />

        {/* ── Mouth ── */}
        <path
          d={isHiding ? 'M42 76 Q48 74 54 76' : 'M42 76 Q48 82 54 76'}
          stroke="#C17B5A" strokeWidth="2" strokeLinecap="round" fill="none"
          style={{ transition: 'd 0.3s' }}
        />
      </svg>
    </div>
  );
};

export default WatchingCat;
