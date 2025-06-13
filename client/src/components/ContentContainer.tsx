import React, { ReactNode } from 'react';

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * A consistent content container that maintains proper width and padding
 * This centralizes content layout for easier site-wide updates
 */
export default function ContentContainer({
  children,
  className = '',
}: ContentContainerProps) {
  return (
    <div className={`content-width ${className}`}>
      {children}
    </div>
  );
}