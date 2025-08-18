import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id: string;
}

// Initialize Mermaid once globally with optimized settings
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: false // Disable HTML labels to prevent parsing issues
  },
  sequence: {
    useMaxWidth: true
  }
});

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const renderDiagram = async () => {
      if (!containerRef.current || !chart) {
        setIsLoading(false);
        return;
      }

      try {
        // Clean the chart content
        const sanitizedChart = sanitizeChart(chart);
        const uniqueId = `mermaid-${id}-${Date.now()}`;

        // Clear any existing content
        containerRef.current.innerHTML = '';

        // Render the diagram
        const { svg } = await mermaid.render(uniqueId, sanitizedChart);
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setIsLoading(false);
        }
      } catch (renderError: any) {
        console.warn('Primary mermaid render failed, trying fallback:', renderError.message);
        
        // Try with fallback diagram
        try {
          const fallbackChart = createFallbackDiagram();
          const fallbackId = `mermaid-fallback-${id}-${Date.now()}`;
          const { svg } = await mermaid.render(fallbackId, fallbackChart);
          
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="text-center">
                <div class="text-amber-600 text-sm mb-2">⚠️ Simplified diagram (original had syntax issues)</div>
                ${svg}
              </div>
            `;
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
  }, [chart, id]);

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

  return (
    <div 
      ref={containerRef}
      className="flex justify-center items-center p-4 bg-gray-50 rounded-lg shadow-sm overflow-auto min-h-[200px]"
      style={{ maxWidth: '100%' }}
    />
  );
};

export default MermaidDiagram;