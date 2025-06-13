import React, { useEffect, useRef } from 'react';

interface Node {
  id: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface Edge {
  source: string;
  target: string;
  strength: number;
}

export default function MarketNetworkViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    // Create nodes (representing market entities)
    const nodes: Node[] = [
      { id: 'equity', radius: 12, x: 150, y: 100, vx: 0, vy: 0, color: 'rgba(59, 130, 246, 0.8)' },
      { id: 'bond', radius: 10, x: 220, y: 150, vx: 0, vy: 0, color: 'rgba(45, 212, 191, 0.8)' },
      { id: 'forex', radius: 8, x: 100, y: 170, vx: 0, vy: 0, color: 'rgba(168, 85, 247, 0.8)' },
      { id: 'commodity', radius: 9, x: 180, y: 80, vx: 0, vy: 0, color: 'rgba(251, 146, 60, 0.8)' },
      { id: 'crypto', radius: 7, x: 80, y: 110, vx: 0, vy: 0, color: 'rgba(236, 72, 153, 0.8)' },
      { id: 'derivative', radius: 10, x: 130, y: 200, vx: 0, vy: 0, color: 'rgba(132, 204, 22, 0.8)' },
    ];
    
    // Create edges (market correlations/relationships)
    const edges: Edge[] = [
      { source: 'equity', target: 'bond', strength: 0.7 },
      { source: 'equity', target: 'forex', strength: 0.5 },
      { source: 'equity', target: 'commodity', strength: 0.6 },
      { source: 'equity', target: 'crypto', strength: 0.3 },
      { source: 'bond', target: 'forex', strength: 0.8 },
      { source: 'bond', target: 'derivative', strength: 0.9 },
      { source: 'forex', target: 'commodity', strength: 0.7 },
      { source: 'crypto', target: 'derivative', strength: 0.4 },
      { source: 'commodity', target: 'derivative', strength: 0.7 },
    ];
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Helper to get node by id
    const getNode = (id: string): Node | undefined => nodes.find(n => n.id === id);
    
    // Physics constants
    const repulsionForce = 200;
    const attractionForce = 0.05;
    const edgeLength = 100;
    const damping = 0.8;
    
    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply forces and update positions
      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Repulsion force (inverse square law)
          const force = repulsionForce / (distance * distance);
          
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }
      
      // Attraction along edges
      for (const edge of edges) {
        const source = getNode(edge.source);
        const target = getNode(edge.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Spring force
          const displacement = distance - edgeLength;
          const force = displacement * attractionForce * edge.strength;
          
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      }
      
      // Update positions and apply damping
      for (const node of nodes) {
        node.vx *= damping;
        node.vy *= damping;
        
        node.x += node.vx;
        node.y += node.vy;
        
        // Boundary constraints
        if (node.x < node.radius) {
          node.x = node.radius;
          node.vx = -node.vx * 0.5;
        } else if (node.x > canvas.width - node.radius) {
          node.x = canvas.width - node.radius;
          node.vx = -node.vx * 0.5;
        }
        
        if (node.y < node.radius) {
          node.y = node.radius;
          node.vy = -node.vy * 0.5;
        } else if (node.y > canvas.height - node.radius) {
          node.y = canvas.height - node.radius;
          node.vy = -node.vy * 0.5;
        }
      }
      
      // Draw edges
      ctx.lineWidth = 1;
      
      for (const edge of edges) {
        const source = getNode(edge.source);
        const target = getNode(edge.target);
        
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(156, 163, 175, ${edge.strength * 0.6})`;
          ctx.stroke();
        }
      }
      
      // Draw nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={200} 
        className="opacity-80 hover:opacity-100 transition-opacity duration-300"
      />
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
        Market Correlation Network
      </div>
    </div>
  );
}