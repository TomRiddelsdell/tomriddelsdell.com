import React from 'react';
import impliedVolImage from '../assets/impliedvol.jpeg';

export default function ImpliedVolDisplay() {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <img 
        src={impliedVolImage} 
        alt="Implied Volatility Surface" 
        className="w-full h-full object-contain"
        style={{ 
          maxHeight: '100%', 
          maxWidth: '100%',
          borderRadius: '0.5rem'
        }} 
      />
    </div>
  );
}