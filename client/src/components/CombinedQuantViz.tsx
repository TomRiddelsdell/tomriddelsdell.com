import * as React from "react";
import { useEffect, useRef } from "react";

export default function CombinedQuantViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions with high resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Set up gradients and styles
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)'); // blue-500
    gradient.addColorStop(0.5, 'rgba(20, 184, 166, 0.6)'); // teal-500
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.5)'); // purple-500
    
    // Draw a stylized volatility surface
    drawVolatilitySurface(ctx, rect.width, rect.height, gradient);
    
    // Draw elegantly styled market network nodes
    drawMarketNetwork(ctx, rect.width, rect.height);
    
    // Draw subtle mathematical formulas
    drawQuantFormulas(ctx, rect.width, rect.height);
    
  }, []);
  
  // Function to draw a stylized volatility surface
  const drawVolatilitySurface = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    gradient: CanvasGradient
  ) => {
    ctx.save();
    
    const centerX = width * 0.5;
    const centerY = height * 0.4;
    const radiusX = width * 0.4;
    const radiusY = height * 0.3;
    
    // Draw multiple curves to create a 3D volatility surface effect
    for (let i = 0; i < 8; i++) {
      const offsetY = i * (height * 0.05);
      
      ctx.beginPath();
      ctx.moveTo(centerX - radiusX, centerY + offsetY);
      
      // Create a parametric curve
      for (let t = 0; t <= 20; t++) {
        const x = centerX - radiusX + (t / 20) * 2 * radiusX;
        const normalizedT = t / 20;
        const volatilityShape = Math.sin(normalizedT * Math.PI) * 0.5 + 0.2;
        const y = centerY + offsetY - volatilityShape * radiusY * (1 - 0.1 * i);
        
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = i === 0 ? '#3b82f6' : gradient; // First line blue, rest gradient
      ctx.lineWidth = i === 0 ? 1.5 : 0.8;
      ctx.stroke();
    }
    
    // Add subtle grid lines
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#64748b"; // slate-500
    
    // Horizontal grid lines
    for (let y = centerY - radiusY; y <= centerY + radiusY; y += radiusY/4) {
      ctx.beginPath();
      ctx.moveTo(centerX - radiusX, y);
      ctx.lineTo(centerX + radiusX, y);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  // Function to draw an elegant market network visualization
  const drawMarketNetwork = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) => {
    ctx.save();
    
    // Define node positions
    const nodes = [
      { x: width * 0.2, y: height * 0.7, r: 6, color: '#3b82f6' }, // blue-500
      { x: width * 0.35, y: height * 0.82, r: 4, color: '#8b5cf6' }, // purple-500
      { x: width * 0.5, y: height * 0.75, r: 7, color: '#14b8a6' }, // teal-500
      { x: width * 0.7, y: height * 0.68, r: 5, color: '#f59e0b' }, // amber-500
      { x: width * 0.85, y: height * 0.76, r: 6, color: '#ef4444' }, // red-500
      { x: width * 0.65, y: height * 0.88, r: 4, color: '#6366f1' }, // indigo-500
    ];
    
    // Draw connecting lines between nodes (edges)
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 0.5;
    
    // Connect major nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.3) { // Don't connect all nodes
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          
          // Gradients for lines
          const gradient = ctx.createLinearGradient(
            nodes[i].x, nodes[i].y, 
            nodes[j].x, nodes[j].y
          );
          gradient.addColorStop(0, nodes[i].color);
          gradient.addColorStop(1, nodes[j].color);
          
          ctx.strokeStyle = gradient;
          ctx.stroke();
        }
      }
    }
    
    // Draw the nodes (circles)
    ctx.globalAlpha = 0.8;
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      
      // Add a subtle glow effect
      const glowGradient = ctx.createRadialGradient(
        node.x, node.y, node.r * 0.5,
        node.x, node.y, node.r * 2
      );
      glowGradient.addColorStop(0, node.color);
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 2, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  // Function to add subtle mathematical formulas
  const drawQuantFormulas = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) => {
    ctx.save();
    
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(100, 116, 139, 0.7)'; // slate-500 with transparency
    
    // Draw subtle formula elements in varied positions
    ctx.fillText("dS = μSdt + σSdW", width * 0.1, height * 0.15);
    ctx.fillText("ρ = Σ(x-μx)(y-μy)/σxσy", width * 0.65, height * 0.2);
    
    ctx.restore();
  };

  return (
    <div className="w-full h-full min-h-[280px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      />
    </div>
  );
}