import React from 'react';

export default function VolatilitySurfaceViz() {
  // Generate points for a volatility surface
  const generateSurfacePoints = () => {
    const points = [];
    const rows = 12;
    const cols = 12;
    const amplitude = 30;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x = j * 20;
        const z = i * 20;
        
        // Create the volatility smile effect
        const baseY = Math.pow((j - cols/2), 2) * 0.4;
        
        // Add time dimension effect (term structure)
        const timeEffect = Math.sqrt(i+1) * 5;
        
        // Add some randomness for realism
        const noise = Math.sin(i*j) * 5;
        
        const y = baseY + timeEffect + noise;
        
        points.push({ x, y, z });
      }
    }
    
    return points;
  };
  
  const renderSurface = () => {
    const points = generateSurfacePoints();
    const svgWidth = 300;
    const svgHeight = 200;
    
    // Transformations for isometric view
    const transformPoint = (p: { x: number, y: number, z: number }) => {
      // Scale down to fit in our SVG
      const scale = 1.5;
      
      // Isometric projection
      const isoX = (p.x - p.z) * 0.7 / scale;
      const isoY = (p.x + p.z) * 0.4 / scale - p.y / scale;
      
      // Center in the SVG
      return {
        x: isoX + svgWidth / 2,
        y: isoY + svgHeight / 2.5
      };
    };
    
    const lines = [];
    const rows = 12;
    const cols = 12;
    
    // Create grid lines along x-axis
    for (let i = 0; i < rows; i++) {
      let pathData = '';
      for (let j = 0; j < cols; j++) {
        const point = points[i * cols + j];
        const { x, y } = transformPoint(point);
        
        if (j === 0) {
          pathData += `M${x},${y}`;
        } else {
          pathData += ` L${x},${y}`;
        }
      }
      lines.push(
        <path 
          key={`row-${i}`} 
          d={pathData} 
          fill="none" 
          stroke="rgba(14, 165, 233, 0.5)" 
          strokeWidth="1" 
        />
      );
    }
    
    // Create grid lines along z-axis
    for (let j = 0; j < cols; j++) {
      let pathData = '';
      for (let i = 0; i < rows; i++) {
        const point = points[i * cols + j];
        const { x, y } = transformPoint(point);
        
        if (i === 0) {
          pathData += `M${x},${y}`;
        } else {
          pathData += ` L${x},${y}`;
        }
      }
      lines.push(
        <path 
          key={`col-${j}`} 
          d={pathData} 
          fill="none" 
          stroke="rgba(45, 212, 191, 0.5)" 
          strokeWidth="1" 
        />
      );
    }
    
    return (
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="opacity-70 hover:opacity-100 transition-opacity duration-300"
      >
        <g>
          {lines}
        </g>
        {/* X-axis label */}
        <text x={svgWidth - 60} y={svgHeight - 30} fill="currentColor" fontSize="10" opacity="0.8">Strike</text>
        {/* Y-axis label */}
        <text x="25" y="25" fill="currentColor" fontSize="10" opacity="0.8">Volatility</text>
        {/* Z-axis label */}
        <text x="20" y={svgHeight - 30} fill="currentColor" fontSize="10" opacity="0.8">Time</text>
      </svg>
    );
  };
  
  return (
    <div className="flex flex-col items-center">
      {renderSurface()}
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
        Volatility Surface Analysis
      </div>
    </div>
  );
}