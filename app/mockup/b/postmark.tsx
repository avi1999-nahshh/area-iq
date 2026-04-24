/**
 * The Postmark — AreaIQ's signature mark. Circular franking-stamp treatment
 * evoking Indian Post cancellations + school-certificate grade seals. One
 * visual anchor that encodes three shareable facts: location, grade, superlative.
 */
interface PostmarkProps {
  pincode: string;
  archetype: string;
  grade: string;
  gradeColor?: string;      // color for the central letter grade
  superlative: string;      // "BENGALURU'S TOP AMENITY HUB"
  date: string;             // "APR · 2026"
  size?: number;            // pixel diameter
  rotate?: number;          // degrees of tilt
  className?: string;
}

export function Postmark({
  pincode,
  archetype,
  grade,
  gradeColor = "#0F1B2B",
  superlative,
  date,
  size = 260,
  rotate = -3.5,
  className = "",
}: PostmarkProps) {
  const r = size / 2;
  const outerR = r - 4;
  const ringR = outerR - 18;
  const innerR = ringR - 28;

  const upperText =
    `· ${archetype.toUpperCase()} · PINCODE ${pincode} · ${archetype.toUpperCase()} · PINCODE ${pincode} `;
  const lowerText = `· ${superlative.toUpperCase()} ·`;

  return (
    <div
      className={className}
      style={{
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(0 1px 0 rgba(15,27,43,0.05)) drop-shadow(0 0 22px rgba(217,110,26,0.08))",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {/* upper arc for text */}
          <path
            id={`pm-upper-${pincode}`}
            d={`M ${r - ringR + 10} ${r} A ${ringR - 10} ${ringR - 10} 0 1 1 ${r + ringR - 10} ${r}`}
            fill="none"
          />
          {/* lower arc for text */}
          <path
            id={`pm-lower-${pincode}`}
            d={`M ${r - innerR + 14} ${r + 6} A ${innerR - 6} ${innerR - 6} 0 0 0 ${r + innerR - 14} ${r + 6}`}
            fill="none"
          />
          {/* wavy cancel path */}
          <path
            id={`pm-cancel-${pincode}`}
            d={`M ${r - size * 0.58} ${r + size * 0.05}
                q ${size * 0.15} -${size * 0.08}, ${size * 0.3} 0
                t ${size * 0.3} 0
                t ${size * 0.3} 0
                t ${size * 0.3} 0`}
            fill="none"
          />
          {/* paper noise */}
          <filter id="paper-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="2" seed="7" />
            <feColorMatrix values="0 0 0 0 0.06  0 0 0 0 0.11  0 0 0 0 0.17  0 0 0 0.2 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        {/* outer hairline ring */}
        <circle cx={r} cy={r} r={outerR} fill="none" stroke="#0F1B2B" strokeWidth={2} />

        {/* inner dashed ring */}
        <circle
          cx={r} cy={r} r={ringR}
          fill="none" stroke="#0F1B2B" strokeWidth={1}
          strokeDasharray="2 3"
        />

        {/* inner solid ring */}
        <circle cx={r} cy={r} r={innerR} fill="none" stroke="#0F1B2B" strokeWidth={1} />

        {/* upper curving text — archetype + pincode */}
        <text
          fill="#0F1B2B"
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            fontSize: Math.round(size * 0.052),
            fontWeight: 600,
            letterSpacing: "0.14em",
          }}
        >
          <textPath href={`#pm-upper-${pincode}`} startOffset="0">
            {upperText}
          </textPath>
        </text>

        {/* grade letter — the center */}
        <text
          x={r}
          y={r + size * 0.09}
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontStyle: "italic",
            fontSize: Math.round(size * 0.42),
            fontWeight: 700,
            fill: gradeColor,
          }}
        >
          {grade}
        </text>

        {/* "GRADE" label under the letter */}
        <text
          x={r}
          y={r + size * 0.18}
          textAnchor="middle"
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            fontSize: Math.round(size * 0.038),
            fontWeight: 600,
            letterSpacing: "0.3em",
            fill: "#0F1B2B",
          }}
        >
          GRADE
        </text>

        {/* lower curving text — superlative */}
        <text
          fill="#D96E1A"
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            fontSize: Math.round(size * 0.048),
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          <textPath href={`#pm-lower-${pincode}`} startOffset="50%" textAnchor="middle">
            {lowerText}
          </textPath>
        </text>

        {/* date — tiny bottom tag */}
        <text
          x={r}
          y={r + outerR - 10}
          textAnchor="middle"
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
            fontSize: Math.round(size * 0.036),
            fontWeight: 500,
            letterSpacing: "0.2em",
            fill: "#0F1B2B",
            opacity: 0.6,
          }}
        >
          {date}
        </text>

        {/* cancel-mark (wavy diagonals) */}
        <g transform={`rotate(-18 ${r} ${r})`}>
          <use href={`#pm-cancel-${pincode}`} stroke="#D96E1A" strokeWidth={1.6} opacity={0.9} fill="none" />
          <use
            href={`#pm-cancel-${pincode}`}
            stroke="#D96E1A"
            strokeWidth={1.2}
            opacity={0.7}
            fill="none"
            transform={`translate(0 ${size * 0.06})`}
          />
          <use
            href={`#pm-cancel-${pincode}`}
            stroke="#D96E1A"
            strokeWidth={1}
            opacity={0.5}
            fill="none"
            transform={`translate(0 ${size * 0.12})`}
          />
          <text
            x={r}
            y={r + size * 0.005}
            textAnchor="middle"
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', 'Geist Mono', monospace",
              fontSize: Math.round(size * 0.055),
              fontWeight: 700,
              letterSpacing: "0.42em",
              fill: "#D96E1A",
            }}
          >
            AREAIQ
          </text>
        </g>

        {/* paper noise overlay — very subtle */}
        <rect x={0} y={0} width={size} height={size} filter="url(#paper-noise)" opacity={0.4} />
      </svg>
    </div>
  );
}
