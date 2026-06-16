type GardariamCrestProps = {
  className?: string;
  withBanner?: boolean;
};

/**
 * Placeholder crest — stand-in until the user supplies the definitive
 * artwork. Heraldic shield split burgundy/charcoal with two interlocking
 * dragons (Mariam = red, Javi = dark) in a heart-infinity twist.
 */
export default function GardariamCrest({
  className,
  withBanner = true,
}: GardariamCrestProps) {
  return (
    <svg
      viewBox="0 0 320 380"
      className={className}
      role="img"
      aria-label="Escudo del Imperio Gardariam"
    >
      <defs>
        <linearGradient id="gc-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d27a" />
          <stop offset="50%" stopColor="#c89028" />
          <stop offset="100%" stopColor="#8a6a28" />
        </linearGradient>
        <linearGradient id="gc-burgundy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b1a2a" />
          <stop offset="100%" stopColor="#4a0f18" />
        </linearGradient>
        <linearGradient id="gc-charcoal" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d2740" />
          <stop offset="100%" stopColor="#070b17" />
        </linearGradient>
        <radialGradient id="gc-glow" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="rgba(240,197,66,0.35)" />
          <stop offset="100%" stopColor="rgba(240,197,66,0)" />
        </radialGradient>
        <clipPath id="gc-shield-clip">
          <path d="M160,46 L256,72 L256,168 Q256,256 160,318 Q64,256 64,168 L64,72 Z" />
        </clipPath>
      </defs>

      {/* Ambient glow */}
      <circle cx="160" cy="150" r="150" fill="url(#gc-glow)" />

      {/* Laurel + stars */}
      <g opacity="0.85">
        <path
          d="M122,30 Q108,18 98,28 M126,24 Q114,10 102,18 M130,20 Q120,4 106,10"
          stroke="url(#gc-gold)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M198,30 Q212,18 222,28 M194,24 Q206,10 218,18 M190,20 Q200,4 214,10"
          stroke="url(#gc-gold)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        {[-18, 0, 18].map((dx) => (
          <path
            key={dx}
            d={`M${160 + dx},6 l3.4,7.2 7.8,0.8 -5.8,5.4 1.6,7.8 -6.8,-4 -6.8,4 1.6,-7.8 -5.8,-5.4 7.8,-0.8 Z`}
            fill="url(#gc-gold)"
          />
        ))}
      </g>

      {/* Shield outer frame */}
      <path
        d="M160,38 L262,66 L262,168 Q262,262 160,328 Q58,262 58,168 L58,66 Z"
        fill="url(#gc-gold)"
        stroke="#3a2a10"
        strokeWidth="1.5"
      />
      <path
        d="M160,46 L256,72 L256,168 Q256,256 160,318 Q64,256 64,168 L64,72 Z"
        fill="#0a0e1a"
      />

      {/* Shield contents, clipped */}
      <g clipPath="url(#gc-shield-clip)">
        <rect x="64" y="46" width="98" height="272" fill="url(#gc-burgundy)" />
        <rect x="160" y="46" width="98" height="272" fill="url(#gc-charcoal)" />

        {/* Central divider */}
        <rect x="158" y="46" width="4" height="272" fill="url(#gc-gold)" opacity="0.7" />

        {/* Dragon — red (Mariam), curling from upper-left down to center */}
        <path
          d="M92,84 Q70,120 96,150 Q118,176 100,206 Q88,228 112,246 Q130,260 160,256"
          fill="none"
          stroke="#c2304a"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M92,84 Q70,120 96,150 Q118,176 100,206 Q88,228 112,246 Q130,260 160,256"
          fill="none"
          stroke="url(#gc-gold)"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* red dragon head */}
        <path
          d="M92,84 L78,68 L96,72 L108,58 L104,78 L118,82 L100,92 Z"
          fill="#c2304a"
          stroke="url(#gc-gold)"
          strokeWidth="1.4"
        />
        {/* red dragon wing */}
        <path
          d="M100,140 Q70,128 56,148 Q80,150 92,166 Q86,148 100,140 Z"
          fill="#8b1a2a"
          stroke="url(#gc-gold)"
          strokeWidth="1.2"
          opacity="0.92"
        />

        {/* Dragon — dark (Javi), curling from upper-right down to center */}
        <path
          d="M228,84 Q250,120 224,150 Q202,176 220,206 Q232,228 208,246 Q190,260 160,256"
          fill="none"
          stroke="#1c2638"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M228,84 Q250,120 224,150 Q202,176 220,206 Q232,228 208,246 Q190,260 160,256"
          fill="none"
          stroke="url(#gc-gold)"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* dark dragon head */}
        <path
          d="M228,84 L242,68 L224,72 L212,58 L216,78 L202,82 L220,92 Z"
          fill="#1c2638"
          stroke="url(#gc-gold)"
          strokeWidth="1.4"
        />
        {/* dark dragon wing */}
        <path
          d="M220,140 Q250,128 264,148 Q240,150 228,166 Q234,148 220,140 Z"
          fill="#0d1322"
          stroke="url(#gc-gold)"
          strokeWidth="1.2"
          opacity="0.92"
        />

        {/* Heart/infinity knot where tails meet */}
        <circle cx="160" cy="256" r="17" fill="#0a0e1a" stroke="url(#gc-gold)" strokeWidth="2" />
        <text
          x="160"
          y="262"
          textAnchor="middle"
          fontFamily="Cinzel, serif"
          fontSize="14"
          fontWeight="700"
          fill="url(#gc-gold)"
        >
          J·M
        </text>
      </g>

      {/* Banner */}
      {withBanner && (
        <g>
          <path
            d="M40,332 L280,332 L300,352 L270,352 L270,372 L160,360 L50,372 L50,352 L20,352 Z"
            fill="url(#gc-gold)"
            stroke="#3a2a10"
            strokeWidth="1.2"
          />
          <text
            x="160"
            y="356"
            textAnchor="middle"
            fontFamily="Cinzel, serif"
            fontSize="30"
            fontWeight="700"
            fill="#1a1206"
            letterSpacing="2"
          >
            GARDARIAM
          </text>
        </g>
      )}
    </svg>
  );
}
