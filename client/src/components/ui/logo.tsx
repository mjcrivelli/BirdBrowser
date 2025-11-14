import React from 'react';

interface LogoProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="0" fill="#4CAF50" />
      <path d="M0 80C0 80 20 60 40 70C60 80 80 60 100 80V100H0V80Z" fill="#8BC34A" />
      <path d="M0 0V70C0 70 20 50 50 60C80 70 100 50 100 70V0H0Z" fill="#388E3C" />
      <circle cx="70" cy="30" r="10" fill="#FFEB3B" />
      <path d="M60 25C60 25 65 20 70 25C75 30 80 25 80 25" stroke="#FFEB3B" strokeWidth="2" />
    </svg>
  );
};

export default Logo;
