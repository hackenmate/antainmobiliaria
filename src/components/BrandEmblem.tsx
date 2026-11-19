interface BrandEmblemProps {
  size?: number;
  className?: string;
}

/**
 * Circular vector emblem faithfully matching the Realty Anta Terra logo:
 * Andean leaf, mountain ridge, gabled residence with doorway, and terraced hills
 * in Deep Forest (#183E29), Olive (#6D7D43), Ochre (#C49642) & Terracotta (#B86B43).
 */
export function BrandEmblem({ size = 34, className = '' }: BrandEmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="anta-terra-hills-clip">
          <circle cx="32" cy="34" r="24" />
        </clipPath>
      </defs>

      {/* Stylized Andean Leaf (left) */}
      <path
        d="M15.5 34.5C11.5 28.5 11.2 19.5 15.2 11.5C19.8 18.2 20.6 26.8 17.8 34.5Z"
        fill="#6D7D43"
      />
      <path
        d="M15.3 15.5C15.8 22.5 16.4 28.5 17.1 34"
        stroke="var(--bg)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Mountain Ridge Outline */}
      <path
        d="M18.5 34L26.5 21.5L38.2 35.5"
        stroke="var(--accent)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gabled Residence Roof & Doorway */}
      <path
        d="M32.5 27.5L42.5 17.5L52.5 27.5V34.5"
        stroke="#8E7F6B"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="40.5" y="27.5" width="4" height="6.5" rx="2" fill="#8E7F6B" />

      {/* Layered Terraced Hills inside circular emblem */}
      <g clipPath="url(#anta-terra-hills-clip)">
        {/* Mineral Ochre upper-right terrace */}
        <path
          d="M32 45C38.5 38.5 46.5 35.5 57 35.5V43.5C47.5 43.5 40 46 34.5 51Z"
          fill="#C49642"
        />
        {/* Terracotta Clay lower-right terrace */}
        <path
          d="M35.5 53.5C41.5 46.5 48.5 43 57.5 43V60H33Z"
          fill="#B86B43"
        />
        {/* Deep Forest Green lower-left hill */}
        <path
          d="M7 41.5C19.5 41.5 29.5 47 36.5 59H7Z"
          fill="#183E29"
        />
        {/* Olive Terraced Ribbon sweeping across */}
        <path
          d="M7 36.5C19 35.5 30 41.5 40 56.5"
          stroke="var(--bg)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M7 36.5C19 35.5 29.5 41.5 39 56"
          stroke="#6D7D43"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
