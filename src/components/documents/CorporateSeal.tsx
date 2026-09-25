import React from 'react';

interface CorporateSealProps {
  size?: number;
  className?: string;
}

export const CorporateSeal: React.FC<CorporateSealProps> = ({ size = 110, className = '' }) => {
  return (
    <div
      className={`inline-block select-none relative ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title="Bismillah Multitrade Corporation"
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="w-full h-full text-blue-900"
        style={{ filter: 'drop-shadow(0 1px 1px rgba(30, 58, 138, 0.15))' }}
      >
        <defs>
          {/* Top circular text path */}
          <path
            id="topSealPath"
            d="M 30 100 A 70 70 0 1 1 170 100"
            fill="none"
          />
        </defs>

        {/* Outer concentric decorative circles */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="100" r="91" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.8" />

        {/* Outer ring text: Arched BISMILLAH MULTITRADE CORPORATION */}
        <text
          fill="currentColor"
          fontSize="9.8"
          fontWeight="900"
          letterSpacing="1.8"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          <textPath href="#topSealPath" xlinkHref="#topSealPath" startOffset="50%" textAnchor="middle">
            BISMILLAH MULTITRADE CORPORATION
          </textPath>
        </text>

        {/* Center: Clean BISMILLAH MULTITRADE CORPORATION text with no other words */}
        <text
          x="100"
          y="96"
          textAnchor="middle"
          fill="currentColor"
          fontSize="10"
          fontWeight="900"
          letterSpacing="1"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          BISMILLAH
        </text>
        <text
          x="100"
          y="110"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8.5"
          fontWeight="800"
          letterSpacing="1.2"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          MULTITRADE
        </text>
        <text
          x="100"
          y="123"
          textAnchor="middle"
          fill="currentColor"
          fontSize="7.5"
          fontWeight="800"
          letterSpacing="1"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          CORPORATION
        </text>
      </svg>
    </div>
  );
};
