'use client';

import React from 'react';

interface ConceptIllustrationProps {
  concept: string;
  width?: number;
  height?: number;
  className?: string;
}

const ConceptIllustration: React.FC<ConceptIllustrationProps> = ({ 
  concept, 
  width = 300, 
  height = 200, 
  className = '' 
}) => {
  const normalizedConcept = concept.toLowerCase().trim();

  const renderIllustration = () => {
    // Map concept patterns to illustrations, but always have a fallback
    const conceptMappings = {
      'http': () => <HttpRequestIllustration width={width} height={height} />,
      'request': () => <HttpRequestIllustration width={width} height={height} />,
      'api': () => <ApiIllustration width={width} height={height} />,
      'server': () => <ClientServerIllustration width={width} height={height} />,
      'client': () => <ClientServerIllustration width={width} height={height} />,
      'database': () => <DatabaseIllustration width={width} height={height} />,
      'data': () => <DatabaseIllustration width={width} height={height} />,
      'network': () => <NetworkIllustration width={width} height={height} />,
      'connection': () => <NetworkIllustration width={width} height={height} />,
      'security': () => <SecurityIllustration width={width} height={height} />,
      'auth': () => <SecurityIllustration width={width} height={height} />,
      'force': () => <ForceIllustration width={width} height={height} />,
      'physics': () => <ForceIllustration width={width} height={height} />,
      'wave': () => <WaveIllustration width={width} height={height} />,
      'frequency': () => <WaveIllustration width={width} height={height} />,
      'energy': () => <EnergyIllustration width={width} height={height} />,
      'flow': () => <ProcessFlowIllustration width={width} height={height} />,
      'process': () => <ProcessFlowIllustration width={width} height={height} />
    };

    // Find the best matching illustration
    for (const [keyword, renderFunc] of Object.entries(conceptMappings)) {
      if (normalizedConcept.includes(keyword)) {
        return renderFunc();
      }
    }

    // Always fallback to generic illustration for any concept
    return <GenericIllustration concept={concept} width={width} height={height} />;
  };

  return (
    <div className={`${className} flex justify-center items-center bg-white border border-gray-200 rounded-lg p-4`}>
      {renderIllustration()}
    </div>
  );
};

// HTTP Request Illustration
const HttpRequestIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    {/* Background */}
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Client */}
    <rect x="20" y="70" width="60" height="60" rx="8" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    <text x="50" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Client</text>
    
    {/* Server */}
    <rect x="220" y="70" width="60" height="60" rx="8" fill="#10b981" stroke="#047857" strokeWidth="2" />
    <text x="250" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Server</text>
    
    {/* Request Arrow */}
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
      </marker>
    </defs>
    <line x1="85" y1="85" x2="215" y2="85" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowhead)" />
    <text x="150" y="75" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">HTTP Request</text>
    
    {/* Response Arrow */}
    <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
    </marker>
    <line x1="215" y1="115" x2="85" y2="115" stroke="#22c55e" strokeWidth="3" markerEnd="url(#arrowhead2)" />
    <text x="150" y="135" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">HTTP Response</text>
    
    {/* Method Labels */}
    <rect x="110" y="50" width="80" height="20" rx="4" fill="#fef3c7" stroke="#f59e0b" />
    <text x="150" y="63" textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="bold">GET, POST, PUT, DELETE</text>
  </svg>
);

// API Illustration
const ApiIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Central API Gateway */}
    <circle cx="150" cy="100" r="40" fill="#6366f1" stroke="#4f46e5" strokeWidth="3" />
    <text x="150" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">API</text>
    <text x="150" y="108" textAnchor="middle" fill="white" fontSize="10">Gateway</text>
    
    {/* Connected Services */}
    <rect x="20" y="40" width="50" height="30" rx="4" fill="#f59e0b" />
    <text x="45" y="58" textAnchor="middle" fill="white" fontSize="10">Auth</text>
    
    <rect x="20" y="85" width="50" height="30" rx="4" fill="#10b981" />
    <text x="45" y="103" textAnchor="middle" fill="white" fontSize="10">Database</text>
    
    <rect x="20" y="130" width="50" height="30" rx="4" fill="#ef4444" />
    <text x="45" y="148" textAnchor="middle" fill="white" fontSize="10">Cache</text>
    
    <rect x="230" y="85" width="50" height="30" rx="4" fill="#22c55e" />
    <text x="255" y="103" textAnchor="middle" fill="white" fontSize="10">Client</text>
    
    {/* Connection Lines */}
    <line x1="70" y1="55" x2="110" y2="85" stroke="#374151" strokeWidth="2" />
    <line x1="70" y1="100" x2="110" y2="100" stroke="#374151" strokeWidth="2" />
    <line x1="70" y1="145" x2="110" y2="115" stroke="#374151" strokeWidth="2" />
    <line x1="190" y1="100" x2="230" y2="100" stroke="#374151" strokeWidth="2" />
  </svg>
);

// Client-Server Illustration
const ClientServerIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Multiple Clients */}
    <rect x="20" y="30" width="40" height="30" rx="4" fill="#3b82f6" />
    <text x="40" y="48" textAnchor="middle" fill="white" fontSize="9">Client 1</text>
    
    <rect x="20" y="80" width="40" height="30" rx="4" fill="#3b82f6" />
    <text x="40" y="98" textAnchor="middle" fill="white" fontSize="9">Client 2</text>
    
    <rect x="20" y="130" width="40" height="30" rx="4" fill="#3b82f6" />
    <text x="40" y="148" textAnchor="middle" fill="white" fontSize="9">Client 3</text>
    
    {/* Network Cloud */}
    <ellipse cx="150" cy="100" rx="60" ry="35" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" strokeDasharray="5,5" />
    <text x="150" y="105" textAnchor="middle" fill="#6b7280" fontSize="12">Internet</text>
    
    {/* Server */}
    <rect x="240" y="75" width="50" height="50" rx="6" fill="#10b981" />
    <rect x="245" y="80" width="40" height="8" rx="2" fill="#047857" />
    <rect x="245" y="92" width="40" height="8" rx="2" fill="#047857" />
    <rect x="245" y="104" width="40" height="8" rx="2" fill="#047857" />
    <text x="265" y="140" textAnchor="middle" fill="#047857" fontSize="10" fontWeight="bold">Server</text>
    
    {/* Connection Lines */}
    <line x1="60" y1="45" x2="90" y2="80" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,3" />
    <line x1="60" y1="95" x2="90" y2="95" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,3" />
    <line x1="60" y1="145" x2="90" y2="120" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,3" />
    <line x1="210" y1="100" x2="240" y2="100" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,3" />
  </svg>
);

// Database Illustration
const DatabaseIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Database Cylinder */}
    <ellipse cx="150" cy="60" rx="50" ry="15" fill="#10b981" />
    <rect x="100" y="60" width="100" height="80" fill="#10b981" />
    <ellipse cx="150" cy="140" rx="50" ry="15" fill="#059669" />
    
    {/* Database Lines */}
    <ellipse cx="150" cy="80" rx="50" ry="15" fill="none" stroke="#047857" strokeWidth="2" />
    <ellipse cx="150" cy="100" rx="50" ry="15" fill="none" stroke="#047857" strokeWidth="2" />
    <ellipse cx="150" cy="120" rx="50" ry="15" fill="none" stroke="#047857" strokeWidth="2" />
    
    {/* Label */}
    <text x="150" y="170" textAnchor="middle" fill="#047857" fontSize="14" fontWeight="bold">Database</text>
    
    {/* Data Icons */}
    <circle cx="130" cy="70" r="3" fill="#ecfdf5" />
    <circle cx="150" cy="70" r="3" fill="#ecfdf5" />
    <circle cx="170" cy="70" r="3" fill="#ecfdf5" />
    
    <circle cx="130" cy="90" r="3" fill="#ecfdf5" />
    <circle cx="150" cy="90" r="3" fill="#ecfdf5" />
    <circle cx="170" cy="90" r="3" fill="#ecfdf5" />
  </svg>
);

// Network Illustration
const NetworkIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Network Nodes */}
    <circle cx="60" cy="60" r="20" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    <circle cx="240" cy="60" r="20" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    <circle cx="60" cy="140" r="20" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    <circle cx="240" cy="140" r="20" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    <circle cx="150" cy="100" r="25" fill="#10b981" stroke="#047857" strokeWidth="3" />
    
    {/* Connection Lines */}
    <line x1="80" y1="60" x2="125" y2="85" stroke="#6b7280" strokeWidth="2" />
    <line x1="220" y1="60" x2="175" y2="85" stroke="#6b7280" strokeWidth="2" />
    <line x1="80" y1="140" x2="125" y2="115" stroke="#6b7280" strokeWidth="2" />
    <line x1="220" y1="140" x2="175" y2="115" stroke="#6b7280" strokeWidth="2" />
    
    {/* Labels */}
    <text x="150" y="105" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Hub</text>
    <text x="150" y="175" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">Network Topology</text>
  </svg>
);

// Security Illustration
const SecurityIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Shield */}
    <path d="M150 40 L130 50 L130 110 Q130 130 150 140 Q170 130 170 110 L170 50 Z" fill="#10b981" stroke="#047857" strokeWidth="2" />
    
    {/* Lock Icon */}
    <rect x="140" y="80" width="20" height="25" rx="3" fill="#ecfdf5" stroke="#047857" strokeWidth="1" />
    <path d="M145 80 Q145 70 155 70 Q165 70 165 80" fill="none" stroke="#047857" strokeWidth="2" />
    
    {/* Key */}
    <circle cx="150" cy="92" r="3" fill="#047857" />
    
    {/* Checkmark */}
    <path d="M140 95 L148 103 L160 85" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    <text x="150" y="170" textAnchor="middle" fill="#047857" fontSize="14" fontWeight="bold">Security</text>
  </svg>
);

// Force Illustration
const ForceIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Mass */}
    <rect x="125" y="75" width="50" height="50" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
    <text x="150" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">m</text>
    
    {/* Force Arrows */}
    <defs>
      <marker id="force-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
      </marker>
    </defs>
    
    {/* Applied Force */}
    <line x1="75" y1="100" x2="120" y2="100" stroke="#ef4444" strokeWidth="3" markerEnd="url(#force-arrow)" />
    <text x="50" y="95" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">F</text>
    
    {/* Weight */}
    <line x1="150" y1="130" x2="150" y2="170" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#force-arrow)" />
    <text x="165" y="155" fill="#f59e0b" fontSize="12" fontWeight="bold">mg</text>
    
    {/* Normal Force */}
    <line x1="150" y1="70" x2="150" y2="30" stroke="#10b981" strokeWidth="3" markerEnd="url(#force-arrow)" />
    <text x="165" y="45" fill="#10b981" fontSize="12" fontWeight="bold">N</text>
    
    <text x="150" y="190" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">Force Diagram</text>
  </svg>
);

// Wave Illustration
const WaveIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Wave */}
    <path d="M20 100 Q60 50 100 100 T180 100 T260 100" fill="none" stroke="#3b82f6" strokeWidth="3" />
    
    {/* Amplitude Arrows */}
    <defs>
      <marker id="wave-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
      </marker>
    </defs>
    <line x1="30" y1="100" x2="30" y2="50" stroke="#ef4444" strokeWidth="2" markerEnd="url(#wave-arrow)" />
    <line x1="30" y1="100" x2="30" y2="150" stroke="#ef4444" strokeWidth="2" markerEnd="url(#wave-arrow)" />
    <text x="45" y="75" fill="#ef4444" fontSize="12" fontWeight="bold">A</text>
    
    {/* Wavelength */}
    <line x1="60" y1="170" x2="180" y2="170" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
    <text x="120" y="185" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">λ</text>
    
    <text x="150" y="25" textAnchor="middle" fill="#374151" fontSize="14" fontWeight="bold">Wave Properties</text>
  </svg>
);

// Energy Illustration
const EnergyIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Energy Bars */}
    <rect x="50" y="60" width="40" height="100" fill="#ef4444" />
    <text x="70" y="175" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">Kinetic</text>
    
    <rect x="130" y="80" width="40" height="80" fill="#10b981" />
    <text x="150" y="175" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">Potential</text>
    
    <rect x="210" y="40" width="40" height="120" fill="#22c55e" />
    <text x="230" y="175" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">Total</text>
    
    {/* Energy Values */}
    <text x="70" y="50" textAnchor="middle" fill="#ef4444" fontSize="12">80J</text>
    <text x="150" y="70" textAnchor="middle" fill="#10b981" fontSize="12">60J</text>
    <text x="230" y="30" textAnchor="middle" fill="#22c55e" fontSize="12">140J</text>
    
    <text x="150" y="195" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">Energy Distribution</text>
  </svg>
);

// Process Flow Illustration
const ProcessFlowIllustration: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Flow Steps */}
    <rect x="20" y="80" width="60" height="40" rx="6" fill="#3b82f6" />
    <text x="50" y="103" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Start</text>
    
    <rect x="120" y="80" width="60" height="40" rx="6" fill="#10b981" />
    <text x="150" y="103" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Process</text>
    
    <rect x="220" y="80" width="60" height="40" rx="6" fill="#ef4444" />
    <text x="250" y="103" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">End</text>
    
    {/* Arrows */}
    <defs>
      <marker id="flow-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
      </marker>
    </defs>
    <line x1="85" y1="100" x2="115" y2="100" stroke="#6b7280" strokeWidth="2" markerEnd="url(#flow-arrow)" />
    <line x1="185" y1="100" x2="215" y2="100" stroke="#6b7280" strokeWidth="2" markerEnd="url(#flow-arrow)" />
    
    <text x="150" y="50" textAnchor="middle" fill="#374151" fontSize="14" fontWeight="bold">Process Flow</text>
  </svg>
);

// Generic Illustration
const GenericIllustration: React.FC<{ concept: string; width: number; height: number }> = ({ concept, width, height }) => (
  <svg width={width} height={height} viewBox="0 0 300 200">
    <rect width="300" height="200" fill="#f8fafc" />
    
    {/* Generic shapes representing the concept */}
    <circle cx="100" cy="70" r="25" fill="#3b82f6" fillOpacity="0.7" />
    <rect x="150" y="45" width="50" height="50" rx="8" fill="#10b981" fillOpacity="0.7" />
    <polygon points="250,45 275,95 225,95" fill="#ef4444" fillOpacity="0.7" />
    
    {/* Connection lines */}
    <line x1="125" y1="70" x2="150" y2="70" stroke="#6b7280" strokeWidth="2" strokeDasharray="4,4" />
    <line x1="200" y1="70" x2="225" y2="70" stroke="#6b7280" strokeWidth="2" strokeDasharray="4,4" />
    
    {/* Concept label */}
    <text x="150" y="140" textAnchor="middle" fill="#374151" fontSize="14" fontWeight="bold">{concept}</text>
    <text x="150" y="160" textAnchor="middle" fill="#6b7280" fontSize="12">Educational Concept</text>
  </svg>
);

export default ConceptIllustration;