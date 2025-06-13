import React, { ReactNode } from 'react';

interface BackgroundSectionProps {
  children: ReactNode;
  className?: string;
  backgroundImage?: string;
  overlay?: 'light' | 'light-strong' | 'dark' | 'dark-strong' | 'none';
  fixed?: boolean;
}

/**
 * A reusable section component with background image support
 * This centralizes background styling for easier maintenance
 */
export default function BackgroundSection({
  children,
  className = '',
  backgroundImage,
  overlay = 'light',
  fixed = false,
}: BackgroundSectionProps) {
  // Determine the overlay gradient based on the overlay prop
  const getOverlay = () => {
    switch (overlay) {
      case 'light':
        return 'linear-gradient(to bottom, var(--overlay-light), var(--overlay-light))';
      case 'light-strong':
        return 'linear-gradient(to bottom, var(--overlay-light), var(--overlay-light-strong))';
      case 'dark':
        return 'linear-gradient(to bottom, var(--overlay-dark), var(--overlay-dark))';
      case 'dark-strong':
        return 'linear-gradient(to bottom, var(--overlay-dark), var(--overlay-dark-strong))';
      case 'none':
        return 'none';
      default:
        return 'linear-gradient(to bottom, var(--overlay-light), var(--overlay-light))';
    }
  };

  // Build the background style based on props
  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `${getOverlay()}, url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: fixed ? 'fixed' : 'scroll',
      }
    : {};

  return (
    <section
      className={`full-width-section ${className}`}
      style={backgroundStyle}
    >
      {children}
    </section>
  );
}