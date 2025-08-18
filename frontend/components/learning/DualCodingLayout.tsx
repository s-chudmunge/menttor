import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import SmartImage from './SmartImage';
import AIGeneratedDiagram from './AIGeneratedDiagram';
import ProgrammaticDiagram from './ProgrammaticDiagram';
import ConceptIllustration from './ConceptIllustration';

interface Props {
  data: { text: string; visual_url?: string; position: 'left' | 'right' };
  subject?: string;
  subtopic?: string;
  allowAIGeneration?: boolean;
}

const DualCodingLayout: React.FC<Props> = ({ data, subject, subtopic, allowAIGeneration = true }) => {
  const flexDirection = data.position === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row';
  
  // Extract key concepts from the text for intelligent visualization
  const extractConcepts = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Broad category detection (expandable for any subject)
    const patterns = {
      physics: ['force', 'newton', 'velocity', 'speed', 'energy', 'kinetic', 'potential', 'wave', 'frequency', 'momentum', 'acceleration', 'gravity', 'mass', 'motion', 'oscillation', 'amplitude', 'mechanics'],
      tech: ['http', 'api', 'endpoint', 'request', 'response', 'server', 'client', 'database', 'network', 'protocol', 'url', 'json', 'rest', 'get', 'post', 'put', 'delete'],
      programming: ['code', 'programming', 'function', 'variable', 'algorithm', 'data structure', 'array', 'object', 'class', 'method', 'loop', 'conditional', 'syntax'],
      chemistry: ['molecule', 'atom', 'element', 'compound', 'reaction', 'chemical', 'bond', 'electron', 'proton', 'neutron', 'periodic', 'solution'],
      biology: ['cell', 'organism', 'dna', 'protein', 'gene', 'evolution', 'species', 'ecosystem', 'photosynthesis', 'respiration', 'membrane'],
      math: ['equation', 'formula', 'variable', 'function', 'derivative', 'integral', 'graph', 'algebra', 'geometry', 'calculus', 'statistics', 'probability'],
      economics: ['market', 'supply', 'demand', 'price', 'cost', 'profit', 'revenue', 'economy', 'inflation', 'investment', 'trade'],
      history: ['war', 'revolution', 'empire', 'civilization', 'culture', 'society', 'government', 'politics', 'timeline', 'event']
    };

    // Find the most relevant category
    let bestMatch = { category: '', count: 0 };
    
    for (const [category, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matches > bestMatch.count) {
        bestMatch = { category, count: matches };
      }
    }

    // Return appropriate visualization type based on category
    if (bestMatch.count > 0) {
      switch (bestMatch.category) {
        case 'physics':
          // Determine specific physics diagram type
          if (lowerText.includes('force') || lowerText.includes('newton')) return { type: 'physics', subtype: 'force_diagram' };
          if (lowerText.includes('velocity') || lowerText.includes('speed')) return { type: 'physics', subtype: 'velocity_diagram' };
          if (lowerText.includes('energy')) return { type: 'physics', subtype: 'energy_diagram' };
          if (lowerText.includes('wave') || lowerText.includes('frequency')) return { type: 'physics', subtype: 'wave_diagram' };
          return { type: 'illustration', concept: 'physics' };
        
        case 'tech':
          if (lowerText.includes('http') && (lowerText.includes('request') || lowerText.includes('response'))) return { type: 'tech', subtype: 'http_flow' };
          return { type: 'illustration', concept: extractMainConcept(text, ['api', 'server', 'database', 'network', 'client']) };
        
        case 'programming':
          return { type: 'stock', query: 'programming computer code' };
        
        default:
          return { type: 'illustration', concept: bestMatch.category };
      }
    }

    // Fallback: extract main concept from text
    return { type: 'illustration', concept: extractMainConcept(text) };
  };

  // Helper function to extract the main concept from any text
  const extractMainConcept = (text: string, priorityWords: string[] = []) => {
    const words = text.toLowerCase().split(/\s+/);
    
    // Check priority words first
    for (const word of priorityWords) {
      if (words.some(w => w.includes(word))) {
        return word;
      }
    }
    
    // Extract meaningful words (longer than 3 characters, not common words)
    const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'this', 'that', 'with'];
    const meaningfulWords = words.filter(word => word.length > 3 && !stopWords.includes(word));
    
    // Return the first meaningful word or a combination
    if (meaningfulWords.length > 0) {
      return meaningfulWords.slice(0, 2).join(' ');
    }
    
    return 'concept';
  };

  const concept = extractConcepts(data.text);
  const hasValidImage = data.visual_url && data.visual_url.trim() !== '';

  const renderVisualization = () => {
    // If there's a valid image URL, use it first
    if (hasValidImage) {
      return (
        <SmartImage
          src={data.visual_url!}
          alt="Visual explanation"
          className="max-w-full h-auto mx-auto"
          fallbackText="Visual aid not available"
          showUrl={true}
        />
      );
    }

    // Only generate AI images if allowed (to limit to one per page)
    if (!allowAIGeneration) {
      return (
        <div className="flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg p-8 w-full h-48">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📚</div>
            <p className="text-sm">Visual content</p>
            <p className="text-xs text-gray-400">Limited to preserve resources</p>
          </div>
        </div>
      );
    }

    // Extract concept for AI generation
    const extractedConcept = extractMainConcept(data.text);
    const subjectForGeneration = subject || 'General Studies';
    
    // Generate AI diagram when allowed
    return (
      <AIGeneratedDiagram
        concept={extractedConcept}
        subject={subjectForGeneration}
        content={data.text}
        width={400}
        height={300}
        className="w-full"
      />
    );
  };

  return (
    <div className={`flex flex-col ${flexDirection} gap-6 my-8 border-l-4 border-blue-500 pl-6 bg-gray-50 py-6 pr-6`}>
      <div className="flex-1 prose max-w-none text-gray-800">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            div: ({ className, children, ...props }) => {
              if (className === 'math math-display') {
                return <div className="math-display my-4 text-center" {...props}>{children}</div>;
              }
              return <div className={className} {...props}>{children}</div>;
            },
            span: ({ className, children, ...props }) => {
              if (className === 'math math-inline') {
                return <span className="math-inline" {...props}>{children}</span>;
              }
              return <span className={className} {...props}>{children}</span>;
            },
          }}
        >
          {data.text}
        </ReactMarkdown>
      </div>
      <div className="flex-1 w-full lg:w-auto">
        {renderVisualization()}
      </div>
    </div>
  );
};

export default DualCodingLayout;
