'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
  id: string;
}

// Dynamic mermaid loading to prevent SSR issues
let mermaidInstance: any = null;

const initializeMermaid = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!mermaidInstance) {
    try {
      const mermaidModule = await import('mermaid');
      mermaidInstance = mermaidModule.default;
      
      // Initialize Mermaid once globally with optimized settings
      mermaidInstance.initialize({ 
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        fontFamily: 'inherit',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        },
        sequence: {
          useMaxWidth: true
        },
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#3b82f6',
          lineColor: '#6b7280',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f3f4f6'
        }
      });
      
      console.log('Mermaid initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mermaid:', error);
      return null;
    }
  }
  
  return mermaidInstance;
};

// Clean and sanitize chart content
const sanitizeChart = (chart: string): string => {
  if (!chart || typeof chart !== 'string') {
    return 'graph TD\n    A[Start] --> B[End]';
  }

  let sanitized = chart.trim();

  // Remove problematic characters and normalize
  sanitized = sanitized
    // Remove HTML tags that might break parsing
    .replace(/<[^>]*>/g, '')
    // Fix node labels - remove parentheses and quotes, keep only alphanumeric and spaces
    .replace(/\[([^\]]+)\]/g, (match, label) => {
      const clean = label
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 30); // Limit length
      return `[${clean}]`;
    })
    // Fix edge labels - simplify them
    .replace(/--\s*([^-\n]+?)\s*-->/g, (match, label) => {
      const clean = label
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 20);
      return clean ? `-- ${clean} -->` : '-->';
    })
    // Ensure proper line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Validate basic structure
  if (!sanitized.includes('graph') && !sanitized.includes('flowchart') && !sanitized.includes('sequenceDiagram')) {
    // Add basic graph structure if missing
    sanitized = `graph TD\n${sanitized}`;
  }

  return sanitized;
};

// Create a simple fallback diagram
const createFallbackDiagram = (): string => {
  return `graph TD
    A[Start] --> B[Process]
    B --> C[Decision]
    C --> D[End]`;
};

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, id }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setSvgContent('');

    const renderDiagram = async () => {
      if (!chart) {
        setIsLoading(false);
        return;
      }

      try {
        // Initialize mermaid dynamically
        const mermaid = await initializeMermaid();
        if (!mermaid) {
          throw new Error('Failed to load Mermaid library');
        }

        // Clean the chart content
        const sanitizedChart = sanitizeChart(chart);
        const uniqueId = `mermaid-${id}-${Date.now()}`;

        // Render the diagram
        console.log('Attempting to render Mermaid chart:', sanitizedChart);
        const { svg } = await mermaid.render(uniqueId, sanitizedChart);
        console.log('Mermaid render successful, SVG length:', svg.length);
        
        if (isMounted) {
          setSvgContent(svg);
          setIsLoading(false);
        }
      } catch (renderError: any) {
        console.warn('Primary mermaid render failed, trying fallback:', renderError.message);
        
        // Try with fallback diagram
        try {
          const mermaid = await initializeMermaid();
          if (!mermaid) {
            throw new Error('Failed to load Mermaid library for fallback');
          }

          const fallbackChart = createFallbackDiagram();
          const fallbackId = `mermaid-fallback-${id}-${Date.now()}`;
          const { svg } = await mermaid.render(fallbackId, fallbackChart);
          
          if (isMounted) {
            setSvgContent(svg);
            setIsLoading(false);
          }
        } catch (fallbackError: any) {
          console.error('Fallback diagram also failed:', fallbackError.message);
          if (isMounted) {
            setError(renderError.message);
            setIsLoading(false);
          }
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(renderDiagram, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart, id, isClient]);

  // Show loading state for SSR
  if (!isClient) {
    return (
      <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Initializing diagram...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-2">📊</div>
          <h3 className="text-red-800 font-semibold mb-2">Diagram Error</h3>
          <p className="text-red-700 text-sm mb-3">Unable to render the diagram due to syntax issues.</p>
          <details className="text-left bg-white border border-red-200 rounded p-3 text-xs">
            <summary className="cursor-pointer text-red-600 font-medium">Show Error Details</summary>
            <p className="mt-2 text-gray-700">{error}</p>
          </details>
        </div>
      </div>
    );
  }

  if (svgContent) {
    return (
      <div className="my-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div 
          className="w-full overflow-auto mermaid-container flex justify-center items-center"
          style={{ minHeight: '200px' }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        <style jsx global>{`
          .mermaid-container svg {
            max-width: 800px !important;
            max-height: 600px !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 0 auto !important;
            transform: scale(0.8) !important;
            transform-origin: center !important;
          }
          .mermaid-container g[class*="node"] rect,
          .mermaid-container g[class*="node"] circle,
          .mermaid-container g[class*="node"] ellipse,
          .mermaid-container g[class*="node"] polygon {
            fill: #ffffff !important;
            stroke: #3b82f6 !important;
            stroke-width: 2px !important;
          }
          .mermaid-container g[class*="node"] text {
            fill: #1f2937 !important;
            font-family: inherit !important;
            font-size: 14px !important;
          }
          .mermaid-container g[class*="edge"] path {
            stroke: #6b7280 !important;
            stroke-width: 2px !important;
            fill: none !important;
          }
          .mermaid-container g[class*="edge"] polygon {
            fill: #6b7280 !important;
            stroke: #6b7280 !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <div className="text-center text-gray-500">
        <div className="text-2xl mb-2">📊</div>
        <p>No diagram content</p>
      </div>
    </div>
  );
};

export default MermaidDiagram;