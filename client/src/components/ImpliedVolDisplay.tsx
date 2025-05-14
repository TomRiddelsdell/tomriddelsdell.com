import React from 'react';
import impliedVolImage from '../assets/impliedvol.jpeg';

export default function ImpliedVolDisplay() {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        className="w-full h-full" 
        style={{ 
          background: `url(${impliedVolImage})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))',
          transform: 'scale(0.98)',
          transition: 'transform 0.3s ease'
        }}
      />
    </div>
  );
}