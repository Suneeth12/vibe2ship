import React from 'react';

interface DoubleBezelProps {
  children: React.ReactNode;
  className?: string;
}

export const DoubleBezel: React.FC<DoubleBezelProps> = ({ children, className = '' }) => {
  return (
    <div className={`double-bezel fade-in ${className}`}>
      {children}
    </div>
  );
};
export default DoubleBezel;
