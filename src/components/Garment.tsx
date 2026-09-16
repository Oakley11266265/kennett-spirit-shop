import type { Colorway, GarmentType } from '@/data/catalog';
import { cn } from '@/lib/utils';

/**
 * Garment flats.
 * -----------------------------------------------------------------------
 * Deliberately drawn technical sketches — not photographs, and not
 * AI-generated product shots. Until the real BSN photography is imported,
 * inventing photo-real product images would misrepresent what Kennett sells.
 * A lookbook-style flat reads as an intentional design choice, keeps the page
 * weightless, and swaps for real imagery by setting `product.image`.
 *
 * Built in layers (hood → sleeves → torso → trims → mark) so each silhouette
 * reads correctly instead of being one ambiguous blob.
 */

export type MarkStyle = 'block-k' | 'demon-head' | 'wordmark' | 'class-year';

function ChestMark({ style, color, y = 0 }: { style: MarkStyle; color: string; y?: number }) {
  switch (style) {
    case 'demon-head':
      return (
        <g fill={color} transform={`translate(100 ${118 + y})`}>
          <path d="M-26-14c-7-8-10-16-9-25 7 6 14 9 21 10 3-6 8-9 14-9s11 3 14 9c7-1 14-4 21-10 1 9-2 17-9 25 5 6 7 13 7 20 0 15-14 26-33 26s-33-11-33-26c0-7 2-14 7-20z" />
          <path d="M-12 6c4 3 8 3 12 0" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="-11" cy="-6" r="3.5" fill="#fff" fillOpacity="0.85" />
          <circle cx="11" cy="-6" r="3.5" fill="#fff" fillOpacity="0.85" />
        </g>
      );
    case 'wordmark':
      return (
        <text
          x="100"
          y={122 + y}
          textAnchor="middle"
          fill={color}
          fontFamily="'Barlow Condensed', sans-serif"
          fontSize="27"
          fontWeight="700"
          letterSpacing="1.5"
        >
          KENNETT
        </text>
      );
    case 'class-year':
      return (
        <g>
          <text
            x="100"
            y={110 + y}
            textAnchor="middle"
            fill={color}
            fontFamily="'Barlow Condensed', sans-serif"
            fontSize="14"
            fontWeight="600"
            letterSpacing="3"
          >
            CLASS OF
          </text>
          <text
            x="100"
            y={138 + y}
            textAnchor="middle"
            fill={color}
            fontFamily="Anton, sans-serif"
            fontSize="30"
            letterSpacing="1"
          >
            2026
          </text>
        </g>
      );
    default:
      return (
        <text
          x="100"
          y={136 + y}
          textAnchor="middle"
          fill={color}
          fontFamily="Anton, sans-serif"
          fontSize="54"
        >
          K
        </text>
      );
  }
}

export function Garment({
  type,
  colorway,
  mark = 'block-k',
  className,
}: {
  type: GarmentType;
  colorway: Colorway;
  mark?: MarkStyle;
  className?: string;
}) {
  const body = colorway.body;
  const line = 'rgba(0,0,0,0.22)';
  const shade = 'rgba(0,0,0,0.13)';
  const stroke = { stroke: line, strokeWidth: 1.4, fill: 'none' as const, strokeLinecap: 'round' as const };

  /* ---- shared pieces ---- */
  const longSleeves = (
    <>
      <path d="M72 62 56 70 24 150q-2 6 4 8l20 8q6 2 8-4l20-52z" fill={body} />
      <path d="M128 62l16 8 32 80q2 6-4 8l-20 8q-6 2-8-4l-20-52z" fill={body} />
      <path d="M26 152l24 10" {...stroke} />
      <path d="M174 152l-24 10" {...stroke} />
    </>
  );

  const shortSleeves = (
    <>
      <path d="M74 60 58 68 42 108q-2 5 3 7l18 7q5 2 7-3l14-40z" fill={body} />
      <path d="M126 60l16 8 16 40q2 5-3 7l-18 7q-5 2-7-3l-14-40z" fill={body} />
      <path d="M44 110l22 9" {...stroke} />
      <path d="M156 110l-22 9" {...stroke} />
    </>
  );

  const torso = (
    <path d="M74 58h52l12 10 4 138q0 6-6 6H64q-6 0-6-6l4-138z" fill={body} />
  );

  const shapes: Record<GarmentType, React.ReactNode> = {
    hoodie: (
      <>
        {/* hood sits behind the shoulders */}
        <path d="M74 60q0-38 26-38t26 38q-12 10-26 10T74 60z" fill={body} />
        <path d="M74 60q0-38 26-38t26 38" stroke={line} strokeWidth="1.4" fill="none" />
        <path d="M78 58q0-30 22-30t22 30" fill={shade} />
        {longSleeves}
        {torso}
        {/* neck opening */}
        <path d="M82 60q18 16 36 0" {...stroke} />
        {/* drawstrings */}
        <path d="M91 64l-2 34" {...stroke} />
        <path d="M109 64l2 34" {...stroke} />
        <circle cx="89" cy="99" r="2.6" fill={line} />
        <circle cx="111" cy="99" r="2.6" fill={line} />
        {/* kangaroo pocket */}
        <path d="M72 152h56v26q0 4-4 4H76q-4 0-4-4z" fill={shade} />
        <path d="M72 152h56" {...stroke} />
        {/* ribbed hem */}
        <path d="M60 192h80" {...stroke} />
      </>
    ),
    crew: (
      <>
        {longSleeves}
        {torso}
        {/* ribbed collar */}
        <path d="M80 58q20 18 40 0 0 10-20 10t-20-10z" fill={shade} />
        <path d="M80 58q20 18 40 0" {...stroke} />
        <path d="M60 192h80" {...stroke} />
      </>
    ),
    tee: (
      <>
        {shortSleeves}
        {torso}
        <path d="M82 58q18 16 36 0 0 8-18 8t-18-8z" fill={shade} />
        <path d="M82 58q18 16 36 0" {...stroke} />
        <path d="M60 196h80" {...stroke} />
      </>
    ),
    longsleeve: (
      <>
        {longSleeves}
        {torso}
        <path d="M82 58q18 16 36 0 0 8-18 8t-18-8z" fill={shade} />
        <path d="M82 58q18 16 36 0" {...stroke} />
        <path d="M60 196h80" {...stroke} />
      </>
    ),
    jacket: (
      <>
        {longSleeves}
        {torso}
        {/* stand collar */}
        <path d="M78 58h44l-4 14H82z" fill={shade} />
        <path d="M78 58h44" {...stroke} />
        {/* quarter zip */}
        <path d="M100 58v54" stroke={line} strokeWidth="2.6" fill="none" />
        <rect x="96.5" y="106" width="7" height="12" rx="2.5" fill={line} />
        <path d="M60 192h80" {...stroke} />
      </>
    ),
    cap: (
      <>
        {/* crown */}
        <path d="M44 138q0-62 56-62t56 62z" fill={body} />
        {/* panel seams */}
        <path d="M100 76v62" {...stroke} />
        <path d="M72 84q-6 30-6 54" {...stroke} />
        <path d="M128 84q6 30 6 54" {...stroke} />
        {/* brim */}
        <path d="M40 138q60-12 120 0 4 16-12 22H52q-16-6-12-22z" fill={body} />
        <path d="M40 138q60-12 120 0" {...stroke} />
        <path d="M46 152q54-8 108 0" {...stroke} />
        {/* button */}
        <circle cx="100" cy="78" r="4" fill={shade} />
      </>
    ),
    short: (
      <>
        {/* waistband */}
        <path d="M54 62h92v18H54z" fill={shade} />
        <path d="M54 80h92" {...stroke} />
        {/* legs */}
        <path d="M54 62h92l-8 116q-1 6-7 6h-20q-6 0-7-6l-4-56-4 56q-1 6-7 6H69q-6 0-7-6z" fill={body} />
        <path d="M54 62h92" {...stroke} />
        <path d="M54 80h92" {...stroke} />
        <path d="M100 128v56" {...stroke} />
      </>
    ),
  };

  // Caps carry a smaller mark, centred on the crown rather than the chest.
  const isCap = type === 'cap';
  const isShort = type === 'short';

  return (
    <svg
      viewBox="0 0 200 240"
      role="img"
      aria-label={`${colorway.name} ${type}`}
      className={cn('block h-full w-full', className)}
    >
      <g>{shapes[type]}</g>

      {/* soft light from the upper left — sells volume without a photograph */}
      <ellipse cx="80" cy="96" rx="30" ry="44" fill="#fff" opacity="0.06" />

      {isCap ? (
        <g transform="translate(100 118) scale(0.52) translate(-100 -118)">
          <ChestMark style={mark} color={colorway.mark} y={-8} />
        </g>
      ) : isShort ? (
        <g transform="translate(70 140) scale(0.4) translate(-100 -118)">
          <ChestMark style={mark} color={colorway.mark} />
        </g>
      ) : (
        <ChestMark style={mark} color={colorway.mark} />
      )}
    </svg>
  );
}
