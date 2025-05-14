import React from 'react';
import impliedVolImage from '../assets/impliedvol.jpeg';

export default function ImpliedVolDisplay() {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        className="w-full h-full relative" 
      >
        {/* Subtle glow effect behind the image */}
        <div
          className="absolute inset-0 z-0 opacity-40"
          style={{
            background: 'radial-gradient(circle at center, rgba(100, 200, 255, 0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        
        {/* Main image with soft edges and transparency */}
        <div
          className="absolute inset-0 z-10 opacity-85"
          style={{ 
            background: `url(${impliedVolImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            mask: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.3) 80%, transparent 95%)',
            WebkitMask: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.3) 80%, transparent 95%)',
          }}
        />
      </div>
    </div>
  );
}