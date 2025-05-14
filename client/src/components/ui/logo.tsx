import React from 'react';
import logoPath from "../../assets/logo.png";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', withText = true }) => {
  const sizes = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
  };

  return (
    <div className="flex items-center">
      <img src={logoPath} alt="DCS Logo" className={`${sizes[size]}`} />
      {withText && (
        <div className="ml-2 text-primary font-bold">
          <h1 className={size === 'sm' ? "text-xl" : size === 'md' ? "text-2xl" : "text-3xl"}>DCS</h1>
          {size !== 'sm' && (
            <p className={size === 'md' ? "text-xs" : "text-sm"}>Debt Collection Services</p>
          )}
        </div>
      )}
    </div>
  );
};