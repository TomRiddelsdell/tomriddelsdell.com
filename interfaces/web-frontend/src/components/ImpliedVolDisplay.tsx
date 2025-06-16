import React from 'react';
import impliedVolImage from '../assets/impliedvol.jpeg';

export default function ImpliedVolDisplay() {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        className="w-full h-full relative" 
      >
        {/* Enhanced glow effect behind the image - more vibrant on dark backgrounds */}
        <div
          className="absolute inset-0 z-0 opacity-70"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 200, 255, 0.7) 0%, rgba(0, 100, 200, 0.3) 40%, transparent 70%)',
            filter: 'blur(25px)',
          }}
        />
        
        {/* Main image with soft edges and transparency - better for dark backgrounds */}
        <div
          className="absolute inset-0 z-10 opacity-95"
          style={{ 
            background: `url(${impliedVolImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            mask: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.4) 75%, transparent 95%)',
            WebkitMask: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.4) 75%, transparent 95%)',
            filter: 'brightness(1.1) contrast(1.1)',
          }}
        />
      </div>
    </div>
  );
}