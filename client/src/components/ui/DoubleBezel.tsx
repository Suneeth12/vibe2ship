import React from 'react';
export const DoubleBezel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`double-bezel fade-in ${className}`}>{children}</div>
);
export default DoubleBezel;
