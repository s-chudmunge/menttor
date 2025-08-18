'use client';

import React, { useRef, useEffect } from 'react';

interface Vector {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

interface DiagramObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rectangle' | 'circle' | 'spring' | 'incline';
  label?: string;
  color?: string;
}

interface ProgrammaticDiagramProps {
  type: 'force_diagram' | 'velocity_diagram' | 'energy_diagram' | 'wave_diagram' | 'circuit_diagram' | 'http_flow';
  width?: number;
  height?: number;
  config?: {
    objects?: DiagramObject[];
    vectors?: Vector[];
    annotations?: { x: number; y: number; text: string }[];
    title?: string;
    [key: string]: any;
  };
}

const ProgrammaticDiagram: React.FC<ProgrammaticDiagramProps> = ({ 
  type, 
  width = 400, 
  height = 300, 
  config = {} 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Set default styles
    ctx.strokeStyle = '#374151';
    ctx.fillStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.font = '14px system-ui';

    switch (type) {
      case 'force_diagram':
        drawForceDiagram(ctx, width, height, config);
        break;
      case 'velocity_diagram':
        drawVelocityDiagram(ctx, width, height, config);
        break;
      case 'energy_diagram':
        drawEnergyDiagram(ctx, width, height, config);
        break;
      case 'wave_diagram':
        drawWaveDiagram(ctx, width, height, config);
        break;
      case 'circuit_diagram':
        drawCircuitDiagram(ctx, width, height, config);
        break;
      case 'http_flow':
        drawHttpFlowDiagram(ctx, width, height, config);
        break;
    }
  }, [type, width, height, config]);

  return (
    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-4">
      {config.title && (
        <h4 className="text-lg font-semibold text-gray-800 mb-3">{config.title}</h4>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded"
      />
    </div>
  );
};

// Force diagram (mass with forces)
const drawForceDiagram = (ctx: CanvasRenderingContext2D, width: number, height: number, config: any) => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw mass (box)
  ctx.fillStyle = '#60A5FA';
  ctx.fillRect(centerX - 25, centerY - 25, 50, 50);
  ctx.strokeRect(centerX - 25, centerY - 25, 50, 50);
  
  // Label mass
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('m', centerX, centerY + 5);
  
  // Draw forces as arrows
  const forces = config.forces || ['gravity', 'normal'];
  
  if (forces.includes('gravity')) {
    drawArrow(ctx, centerX, centerY + 25, centerX, centerY + 80, '#EF4444', 'Weight (mg)');
  }
  
  if (forces.includes('normal')) {
    drawArrow(ctx, centerX, centerY - 25, centerX, centerY - 80, '#10B981', 'Normal (N)');
  }
  
  if (forces.includes('friction')) {
    drawArrow(ctx, centerX - 25, centerY, centerX - 80, centerY, '#F59E0B', 'Friction (f)');
  }
  
  if (forces.includes('applied')) {
    drawArrow(ctx, centerX + 25, centerY, centerX + 80, centerY, '#8B5CF6', 'Applied (F)');
  }
};

// Velocity diagram
const drawVelocityDiagram = (ctx: CanvasRenderingContext2D, width: number, height: number, config: any) => {
  const startX = 50;
  const startY = height / 2;
  const endX = width - 50;
  
  // Draw trajectory
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(width / 2, startY - 100, endX, startY);
  ctx.stroke();
  
  // Draw velocity vectors at different points
  const points = [
    { x: startX + 50, y: startY - 20, vx: 60, vy: -30, label: 'v₁' },
    { x: width / 2, y: startY - 100, vx: 40, vy: 0, label: 'v₂' },
    { x: endX - 50, y: startY - 20, vx: 60, vy: 30, label: 'v₃' }
  ];
  
  points.forEach(point => {
    // Draw point
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw velocity vector
    drawArrow(ctx, point.x, point.y, point.x + point.vx, point.y + point.vy, '#2563EB', point.label);
  });
};

// Energy diagram
const drawEnergyDiagram = (ctx: CanvasRenderingContext2D, width: number, height: number, config: any) => {
  const barWidth = 60;
  const maxHeight = height - 100;
  const spacing = 100;
  const startX = 50;
  
  const energies = [
    { label: 'Kinetic', value: 0.8, color: '#EF4444' },
    { label: 'Potential', value: 0.6, color: '#10B981' },
    { label: 'Total', value: 1.0, color: '#8B5CF6' }
  ];
  
  energies.forEach((energy, index) => {
    const x = startX + index * spacing;
    const barHeight = energy.value * maxHeight;
    const y = height - 50 - barHeight;
    
    // Draw bar
    ctx.fillStyle = energy.color;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Label
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(energy.label, x + barWidth / 2, height - 30);
    ctx.fillText(`${(energy.value * 100).toFixed(0)}J`, x + barWidth / 2, y - 10);
  });
};

// Wave diagram
const drawWaveDiagram = (ctx: CanvasRenderingContext2D, width: number, height: number, config: any) => {
  const amplitude = height / 4;
  const wavelength = width / 3;
  const centerY = height / 2;
  
  // Draw wave
  ctx.beginPath();
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 3;
  
  for (let x = 0; x <= width; x += 2) {
    const y = centerY + amplitude * Math.sin((2 * Math.PI * x) / wavelength);
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Draw amplitude arrows
  drawArrow(ctx, 20, centerY, 20, centerY - amplitude, '#EF4444', 'A');
  drawArrow(ctx, 20, centerY, 20, centerY + amplitude, '#EF4444');
  
  // Draw wavelength
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, height - 30);
  ctx.lineTo(wavelength, height - 30);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('λ', wavelength / 2, height - 15);
};

// Circuit diagram
const drawCircuitDiagram = (ctx: CanvasRenderingContext2D, width: number, height: number, config: any) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const circuitWidth = 200;
  const circuitHeight = 120;
  
  // Draw circuit box
  ctx.strokeRect(centerX - circuitWidth / 2, centerY - circuitHeight / 2, circuitWidth, circuitHeight);
  
  // Draw battery
  const batteryX = centerX - circuitWidth / 2 + 20;
  const batteryY = centerY;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(batteryX, batteryY - 15);
  ctx.lineTo(batteryX, batteryY + 15);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(batteryX + 10, batteryY - 25);
  ctx.lineTo(batteryX + 10, batteryY + 25);
  ctx.stroke();
  
  // Draw resistor
  const resistorX = centerX + circuitWidth / 2 - 40;
  const resistorY = centerY;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(resistorX + i * 8, resistorY + (i % 2 ? -10 : 10));
  }
  ctx.stroke();
  
  // Draw wires
  ctx.beginPath();
  // Top wire
  ctx.moveTo(batteryX + 10, centerY - circuitHeight / 2);
  ctx.lineTo(resistorX, centerY - circuitHeight / 2);
  ctx.lineTo(resistorX, resistorY);
  // Bottom wire
  ctx.moveTo(batteryX, centerY + circuitHeight / 2);
  ctx.lineTo(resistorX + 32, centerY + circuitHeight / 2);
  ctx.lineTo(resistorX + 32, resistorY);
  ctx.stroke();
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('V', batteryX + 5, batteryY + 35);
  ctx.fillText('R', resistorX + 16, resistorY + 25);
};

// HTTP flow diagram
const drawHttpFlowDiagram = (ctx: CanvasRenderingContext2D, width: number, height: number, config: any) => {
  const clientX = 50;
  const serverX = width - 100;
  const y1 = height / 3;
  const y2 = (2 * height) / 3;
  
  // Draw client
  ctx.fillStyle = '#60A5FA';
  ctx.fillRect(clientX - 30, y1 - 20, 60, 40);
  ctx.strokeRect(clientX - 30, y1 - 20, 60, 40);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('Client', clientX, y1 + 5);
  
  // Draw server
  ctx.fillStyle = '#10B981';
  ctx.fillRect(serverX - 30, y1 - 20, 60, 40);
  ctx.strokeRect(serverX - 30, y1 - 20, 60, 40);
  ctx.fillStyle = '#000';
  ctx.fillText('Server', serverX, y1 + 5);
  
  // Draw request arrow
  drawArrow(ctx, clientX + 30, y1, serverX - 30, y1, '#EF4444', 'HTTP Request');
  
  // Draw response arrow
  drawArrow(ctx, serverX - 30, y2, clientX + 30, y2, '#8B5CF6', 'HTTP Response');
  
  // Add method labels
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui';
  ctx.fillText('GET /data', (clientX + serverX) / 2, y1 - 10);
  ctx.fillText('200 OK', (clientX + serverX) / 2, y2 + 20);
};

// Helper function to draw arrows
const drawArrow = (
  ctx: CanvasRenderingContext2D, 
  fromX: number, 
  fromY: number, 
  toX: number, 
  toY: number, 
  color: string, 
  label?: string
) => {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  
  // Draw arrow line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  // Draw arrowhead
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const arrowLength = 10;
  
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle - Math.PI / 6),
    toY - arrowLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle + Math.PI / 6),
    toY - arrowLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  
  // Draw label
  if (label) {
    ctx.fillStyle = color;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    // Offset label to avoid overlapping with arrow
    const offsetX = -15 * Math.sin(angle);
    const offsetY = 15 * Math.cos(angle);
    
    ctx.fillText(label, midX + offsetX, midY + offsetY);
  }
};

export default ProgrammaticDiagram;