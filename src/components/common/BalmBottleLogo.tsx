import React from 'react';

interface BalmBottleLogoProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const BalmBottleLogo: React.FC<BalmBottleLogoProps> = ({ size = 32, className = '', style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        {/* Amber Glass Body Gradient */}
        <linearGradient id="amberGlass" x1="8" y1="18" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="45%" stopColor="#B45309" />
          <stop offset="80%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>

        {/* Golden Metallic Cap Gradient */}
        <linearGradient id="goldCap" x1="12" y1="6" x2="36" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="25%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Glass Highlight */}
        <linearGradient id="glassReflection" x1="12" y1="20" x2="18" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Drop Shadow */}
      <ellipse cx="24" cy="45" rx="14" ry="2.5" fill="#000000" fillOpacity="0.18" />

      {/* Amber Jar Body (30ml squat jar profile) */}
      <rect
        x="10"
        y="17"
        width="28"
        height="26"
        rx="5"
        fill="url(#amberGlass)"
        stroke="#78350F"
        strokeWidth="1.2"
      />

      {/* White Apothecary Label */}
      <rect
        x="13"
        y="23"
        width="22"
        height="15"
        rx="2"
        fill="#FFFBEB"
        stroke="#D97706"
        strokeWidth="0.8"
      />
      {/* Label details */}
      <line x1="16" y1="27" x2="32" y2="27" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="31" x2="30" y2="31" stroke="#B45309" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="24" cy="35" r="1.2" fill="#D97706" />

      {/* Vertical Glass Specular Highlight */}
      <path
        d="M13 20C13 18.5 14 18 16 18C15 22 15 38 16 41C14 41 13 40 13 39V20Z"
        fill="url(#glassReflection)"
      />

      {/* Neck ring */}
      <rect
        x="13.5"
        y="14"
        width="21"
        height="4"
        rx="1"
        fill="#92400E"
      />

      {/* Golden Cap with Ridges */}
      <rect
        x="11"
        y="6"
        width="26"
        height="9"
        rx="2"
        fill="url(#goldCap)"
        stroke="#92400E"
        strokeWidth="1"
      />
      {/* Cap ridges */}
      <line x1="15" y1="7" x2="15" y2="14" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="19" y1="7" x2="19" y2="14" stroke="#FDE68A" strokeWidth="0.8" strokeOpacity="0.8" />
      <line x1="24" y1="7" x2="24" y2="14" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="29" y1="7" x2="29" y2="14" stroke="#FDE68A" strokeWidth="0.8" strokeOpacity="0.8" />
      <line x1="33" y1="7" x2="33" y2="14" stroke="#78350F" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
};
