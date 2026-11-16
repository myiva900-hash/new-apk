import React from 'react';

interface MyvLogoProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

export const MyvLogo: React.FC<MyvLogoProps> = ({ className = '', size = 36 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Mutiganda Yvan VPN Logo"
    >
      <img
        src="/assets/aistudio/file_00000000934c81f59744ee543b91f879_57c5a25f.png"
        alt="Mutiganda Yvan VPN Logo"
        className="w-full h-full object-contain rounded-full drop-shadow-sm select-none"
      />
    </div>
  );
};
