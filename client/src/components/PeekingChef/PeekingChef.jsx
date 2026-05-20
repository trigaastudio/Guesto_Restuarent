import React from 'react';

/**
 * PeekingChef – animated SVG cartoon chef.
 * Props:
 *   isHiding {boolean} – true when a password field is focused (hands cover eyes)
 */
const PeekingChef = ({ isHiding = false }) => {
  const leftHandTransform  = isHiding ? 'translate(28px, -32px) rotate(-35deg)' : 'translate(0,0) rotate(0deg)';
  const rightHandTransform = isHiding ? 'translate(-28px, -32px) rotate(35deg)'  : 'translate(0,0) rotate(0deg)';
  const handTransition = 'transform 0.45s cubic-bezier(0.34,1.4,0.64,1)';

  return (
    <div className="flex justify-center mb-5 select-none pointer-events-none" aria-hidden="true">
      <svg width="128" height="148" viewBox="0 0 128 148" xmlns="http://www.w3.org/2000/svg">

        {/* ── CHEF HAT ── */}
        <rect x="30" y="7"  width="68" height="52" rx="15" fill="white" stroke="#E0D5CC" strokeWidth="1.5"/>
        <rect x="16" y="50" width="96" height="17" rx="8"  fill="white" stroke="#E0D5CC" strokeWidth="1.5"/>
        {/* brand-red band */}
        <rect x="18" y="51" width="92" height="12" rx="6"  fill="#B91C1C"/>
        {/* gold accent stripe */}
        <rect x="18" y="57" width="92" height="3"  rx="1.5" fill="#DA9133" opacity="0.55"/>

        {/* ── EARS ── */}
        <circle cx="19"  cy="106" r="11" fill="#FFCBA4"/>
        <circle cx="109" cy="106" r="11" fill="#FFCBA4"/>
        <circle cx="19"  cy="106" r="6"  fill="#F5A87C"/>
        <circle cx="109" cy="106" r="6"  fill="#F5A87C"/>

        {/* ── FACE ── */}
        <circle cx="64" cy="107" r="46" fill="#FFCBA4"/>

        {/* rosy cheeks */}
        <ellipse cx="39"  cy="123" rx="13" ry="8" fill="#FF9999" opacity="0.22"/>
        <ellipse cx="89"  cy="123" rx="13" ry="8" fill="#FF9999" opacity="0.22"/>

        {/* ── EYEBROWS ── */}
        <path d="M42 88 Q52 82 62 88" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" fill="none"
              style={{ transform: isHiding ? 'translateY(-2px)' : 'none', transition: 'transform 0.3s' }}/>
        <path d="M66 88 Q76 82 86 88" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" fill="none"
              style={{ transform: isHiding ? 'translateY(-2px)' : 'none', transition: 'transform 0.3s' }}/>

        {/* ── EYES OPEN ── */}
        <g style={{ opacity: isHiding ? 0 : 1, transition: 'opacity 0.2s' }}>
          {/* left */}
          <ellipse cx="51" cy="102" rx="11.5" ry="12.5" fill="white"/>
          <circle  cx="52" cy="103" r="7"  fill="#2A2A2A"/>
          <circle  cx="55" cy="100" r="2.2" fill="white"/>
          {/* right */}
          <ellipse cx="77" cy="102" rx="11.5" ry="12.5" fill="white"/>
          <circle  cx="78" cy="103" r="7"  fill="#2A2A2A"/>
          <circle  cx="81" cy="100" r="2.2" fill="white"/>
        </g>

        {/* ── EYES CLOSED ── */}
        <g style={{ opacity: isHiding ? 1 : 0, transition: 'opacity 0.2s 0.15s' }}>
          <path d="M40 102 Q51 113 62 102" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <path d="M66 102 Q77 113 88 102" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </g>

        {/* ── NOSE ── */}
        <ellipse cx="64" cy="116" rx="5" ry="4" fill="#F5A87C"/>

        {/* ── MOUTH ── */}
        <g style={{ transition: 'd 0.3s' }}>
          {!isHiding
            ? <path d="M52 126 Q64 136 76 126" stroke="#C17B5A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            : <path d="M54 129 Q64 125 74 129" stroke="#C17B5A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          }
        </g>

        {/* ── LEFT HAND ── */}
        <g style={{ transform: leftHandTransform, transition: handTransition, transformBox: 'fill-box', transformOrigin: 'right top' }}>
          {/* palm */}
          <ellipse cx="20" cy="124" rx="11" ry="13" fill="#FFCBA4" stroke="#F5A87C" strokeWidth="1"/>
          {/* fingers */}
          <ellipse cx="11" cy="118" rx="5"  ry="8"  fill="#FFCBA4" stroke="#F5A87C" strokeWidth="1" transform="rotate(-20 11 118)"/>
          <ellipse cx="8"  cy="128" rx="5"  ry="7"  fill="#FFCBA4" stroke="#F5A87C" strokeWidth="1" transform="rotate(-5  8  128)"/>
        </g>

        {/* ── RIGHT HAND ── */}
        <g style={{ transform: rightHandTransform, transition: handTransition, transformBox: 'fill-box', transformOrigin: 'left top' }}>
          {/* palm */}
          <ellipse cx="108" cy="124" rx="11" ry="13" fill="#FFCBA4" stroke="#F5A87C" strokeWidth="1"/>
          {/* fingers */}
          <ellipse cx="117" cy="118" rx="5"  ry="8"  fill="#FFCBA4" stroke="#F5A87C" strokeWidth="1" transform="rotate(20 117 118)"/>
          <ellipse cx="120" cy="128" rx="5"  ry="7"  fill="#FFCBA4" stroke="#F5A87C" strokeWidth="1" transform="rotate(5  120 128)"/>
        </g>

      </svg>
    </div>
  );
};

export default PeekingChef;
