import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function Container({ 
  children, 
  className = '',
  fullWidth = false
}: ContainerProps) {
  // If fullWidth is true, the container takes up the entire width
  // Otherwise, it's constrained to a maximum width with proper centering
  return (
    <div 
      className={`${fullWidth ? 'w-full' : 'max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8'} ${className}`}
    >
      {children}
    </div>
  );
}