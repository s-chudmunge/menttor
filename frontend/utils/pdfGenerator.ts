import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LearningContent } from '../types/learning';

interface PDFOptions {
  content: LearningContent;
  subject?: string;
  subtopic?: string;
  goal?: string;
}

export async function generateLearnPagePDF(options: PDFOptions): Promise<void> {
  const { content, subject, subtopic, goal } = options;
  
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    let yPosition = margin;
    
    // Add header with logo and branding
    await addPDFHeader(pdf, pageWidth, margin);
    yPosition += 35;
    
    // Add title section with better formatting
    if (subtopic) {
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      const title = subtopic;
      const titleLines = pdf.splitTextToSize(title, contentWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += (titleLines.length * 10) + 8;
      
      // Add a subtle line under the title
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 12;
    }
    
    // Add metadata section with better styling
    if (subject || goal) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      if (subject) {
        pdf.text(`Subject: ${subject}`, margin, yPosition);
        yPosition += 7;
      }
      
      if (goal) {
        const goalLines = pdf.splitTextToSize(`Learning Goal: ${goal}`, contentWidth);
        pdf.text(goalLines, margin, yPosition);
        yPosition += (goalLines.length * 7) + 8;
      }
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition += 5;
    
    // Process content blocks with improved spacing and page management
    for (let i = 0; i < content.length; i++) {
      const block = content[i];
      
      // Estimate space needed for this block
      const estimatedHeight = await estimateBlockHeight(pdf, block, contentWidth);
      
      // Check if we need a new page (with better space calculation)
      if (yPosition + estimatedHeight > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin + 10;
      }
      
      // Add the content block
      const newYPosition = await addContentBlock(pdf, block, yPosition, margin, contentWidth, pageWidth, pageHeight);
      yPosition = newYPosition;
      
      // Add spacing between blocks (but not too much)
      if (i < content.length - 1) {
        yPosition += 8;
      }
    }
    
    // Add footer to all pages
    const totalPages = pdf.internal.pages.length - 1; // Subtract 1 because first element is null
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addPDFFooter(pdf, pageWidth, pageHeight, margin, i, totalPages);
    }
    
    // Download the PDF
    const filename = `${subtopic || 'learning-content'}.pdf`;
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

async function addPDFHeader(pdf: jsPDF, pageWidth: number, margin: number): Promise<void> {
  // Add logo (you'll need to add the logo as base64 or load it)
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(139, 92, 246); // Purple color for Menttor branding
  pdf.text('Menttor', margin, margin + 10);
  
  // Add tagline
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Learning the Way you want to', margin, margin + 20);
  
  // Add line separator
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, margin + 25, pageWidth - margin, margin + 25);
}

function addPDFFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, currentPage: number, totalPages: number): void {
  const footerY = pageHeight - margin;
  
  // Add separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, footerY - 15, pageWidth - margin, footerY - 15);
  
  // Add page number
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin - 30, footerY - 5);
  
  // Add links
  const links = [
    { text: 'Explore', url: '/explore' },
    { text: 'Library', url: '/library' },
    { text: 'Home', url: '/' },
  ];
  
  let linkX = margin;
  links.forEach((link, index) => {
    if (index > 0) {
      pdf.text(' | ', linkX, footerY - 5);
      linkX += 10;
    }
    
    pdf.setTextColor(139, 92, 246); // Purple color for links
    pdf.textWithLink(link.text, linkX, footerY - 5, { url: link.url });
    linkX += pdf.getTextWidth(link.text) + 5;
  });
}


// Helper function to estimate block height
async function estimateBlockHeight(pdf: jsPDF, block: any, contentWidth: number): Promise<number> {
  switch (block.type) {
    case 'heading':
      const fontSize = block.data.level === 1 ? 18 : block.data.level === 2 ? 16 : 14;
      pdf.setFontSize(fontSize);
      const headingLines = pdf.splitTextToSize(block.data.text, contentWidth);
      return (headingLines.length * 8) + 15;
    
    case 'paragraph':
      pdf.setFontSize(12);
      const paragraphLines = pdf.splitTextToSize(cleanMarkdown(block.data.text), contentWidth);
      return (paragraphLines.length * 6) + 10;
    
    case 'progressive_disclosure':
      return 60; // Estimated height for progressive disclosure
    
    case 'active_recall':
      return 40; // Estimated height for active recall
    
    case 'comparison_table':
      const rows = block.data.rows || [];
      return Math.max(30, rows.length * 8 + 20);
    
    case 'callout':
      pdf.setFontSize(12);
      const calloutLines = pdf.splitTextToSize(block.data.text || block.data.content || '', contentWidth);
      return Math.max(25, calloutLines.length * 6 + 15);
    
    default:
      return 25; // Default height estimate
  }
}

// Unified content block renderer
async function addContentBlock(
  pdf: jsPDF, 
  block: any, 
  yPosition: number, 
  margin: number, 
  contentWidth: number,
  pageWidth: number,
  pageHeight: number
): Promise<number> {
  switch (block.type) {
    case 'heading':
      return await addHeading(pdf, block.data, yPosition, margin, contentWidth);
    case 'paragraph':
      return await addParagraph(pdf, block.data, yPosition, margin, contentWidth);
    case 'progressive_disclosure':
      return await addProgressiveDisclosure(pdf, block.data, yPosition, margin, contentWidth);
    case 'active_recall':
      return await addActiveRecall(pdf, block.data, yPosition, margin, contentWidth);
    case 'comparison_table':
      return await addComparisonTable(pdf, block.data, yPosition, margin, contentWidth);
    case 'callout':
      return await addCallout(pdf, block.data, yPosition, margin, contentWidth);
    case 'mermaid_diagram':
      return await addMermaidDiagram(pdf, block.data, yPosition, margin, contentWidth);
    case '3d_visualization':
      return await add3DVisualization(pdf, block.data, yPosition, margin, contentWidth);
    default:
      return yPosition;
  }
}

// Enhanced markdown cleaning function with better LaTeX and code handling
function cleanMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Handle LaTeX math expressions - convert to readable text
    .replace(/\$\$([^$]+)\$\$/g, (match, content) => `[Math: ${content.trim()}]`)
    .replace(/\$([^$]+)\$/g, (match, content) => content.trim())
    // Handle specific LaTeX commands
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\infty/g, '∞')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Psi/g, 'Ψ')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\hbar/g, 'ℏ')
    // Handle subscripts and superscripts
    .replace(/\^(\d+)/g, '⁺$1')
    .replace(/_(\d+)/g, '₊$1')
    .replace(/\^\{([^}]+)\}/g, '^($1)')
    .replace(/_\{([^}]+)\}/g, '_($1)')
    // Handle bold text properly
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Handle italic text properly  
    .replace(/\*(.*?)\*/g, '$1')
    // Handle code blocks with better formatting
    .replace(/```([\w]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang ? ` (${lang})` : '';
      return `[Code Block${language}]\n${code.trim()}`;
    })
    .replace(/`([^`]+)`/g, '"$1"')
    // Handle links - preserve text, remove URL
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Handle headers
    .replace(/^#+\s+/gm, '')
    // Handle lists with better bullets
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, (match, offset, string) => {
      const num = match.match(/\d+/)?.[0] || '1';
      return `${num}. `;
    })
    // Clean up excessive whitespace but preserve some structure
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

async function addHeading(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { level, text } = data;
  
  // Add some space before heading (except for H1)
  if (level > 1) {
    yPosition += 8;
  }
  
  // Set font size and color based on heading level
  const fontSize = level === 1 ? 18 : level === 2 ? 16 : 14;
  const textColor = level === 1 ? [30, 30, 30] : [50, 50, 50];
  
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...textColor as [number, number, number]);
  
  // Clean and add heading text
  const cleanedText = cleanMarkdown(text);
  const lines = pdf.splitTextToSize(cleanedText, contentWidth);
  pdf.text(lines, margin, yPosition + (fontSize * 0.4));
  
  let newYPosition = yPosition + (lines.length * (fontSize * 0.6)) + 6;
  
  // Add underline for H1 and H2
  if (level <= 2) {
    const lineColor = level === 1 ? [100, 100, 100] : [180, 180, 180];
    pdf.setDrawColor(...lineColor as [number, number, number]);
    pdf.setLineWidth(level === 1 ? 0.8 : 0.4);
    pdf.line(margin, newYPosition, margin + (contentWidth * 0.3), newYPosition);
    newYPosition += 6;
  }
  
  return newYPosition;
}

async function addParagraph(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(40, 40, 40);
  
  // Clean the markdown text with improved function
  const cleanText = cleanMarkdown(data.text);
  
  // Better line spacing and text positioning
  const lines = pdf.splitTextToSize(cleanText, contentWidth);
  const lineHeight = 6;
  const startY = yPosition + 5;
  
  // Render each line with proper spacing
  lines.forEach((line: string, index: number) => {
    pdf.text(line, margin, startY + (index * lineHeight));
  });
  
  return startY + (lines.length * lineHeight) + 6;
}

async function addProgressiveDisclosure(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { key_idea, summary, full_text } = data;
  
  // Add background box for progressive disclosure
  const boxStartY = yPosition;
  pdf.setFillColor(248, 250, 252); // Light blue background
  pdf.setDrawColor(219, 234, 254); // Light blue border
  
  // Add key idea with icon
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175); // Blue color
  
  const keyIdeaText = `💡 Key Idea: ${cleanMarkdown(key_idea)}`;
  const keyIdeaLines = pdf.splitTextToSize(keyIdeaText, contentWidth - 10);
  
  let currentY = yPosition + 8;
  keyIdeaLines.forEach((line: string, index: number) => {
    pdf.text(line, margin + 5, currentY + (index * 7));
  });
  currentY += (keyIdeaLines.length * 7) + 8;
  
  // Add summary if present
  if (summary) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    pdf.text('Summary:', margin + 5, currentY);
    currentY += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    const summaryLines = pdf.splitTextToSize(cleanMarkdown(summary), contentWidth - 10);
    summaryLines.forEach((line: string, index: number) => {
      pdf.text(line, margin + 5, currentY + (index * 6));
    });
    currentY += (summaryLines.length * 6) + 8;
  }
  
  // Add detailed explanation if present
  if (full_text) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    pdf.text('Detailed Explanation:', margin + 5, currentY);
    currentY += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    const fullTextLines = pdf.splitTextToSize(cleanMarkdown(full_text), contentWidth - 10);
    fullTextLines.forEach((line: string, index: number) => {
      pdf.text(line, margin + 5, currentY + (index * 6));
    });
    currentY += (fullTextLines.length * 6) + 5;
  }
  
  // Draw the background box
  const boxHeight = currentY - boxStartY;
  pdf.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');
  
  return currentY + 3;
}

async function addActiveRecall(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { question, answer } = data;
  
  // Add background for active recall section
  const boxStartY = yPosition;
  pdf.setFillColor(252, 245, 255); // Light purple background
  pdf.setDrawColor(233, 213, 255); // Purple border
  
  // Add question with icon
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(126, 34, 206); // Purple color
  
  const questionText = `🤔 Think About This: ${cleanMarkdown(question)}`;
  const questionLines = pdf.splitTextToSize(questionText, contentWidth - 10);
  
  let currentY = yPosition + 8;
  questionLines.forEach((line: string, index: number) => {
    pdf.text(line, margin + 5, currentY + (index * 7));
  });
  currentY += (questionLines.length * 7) + 8;
  
  // Add answer if present
  if (answer) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text('💡 Answer:', margin + 5, currentY);
    currentY += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const answerLines = pdf.splitTextToSize(cleanMarkdown(answer), contentWidth - 10);
    answerLines.forEach((line: string, index: number) => {
      pdf.text(line, margin + 5, currentY + (index * 6));
    });
    currentY += (answerLines.length * 6) + 5;
  }
  
  // Draw the background box
  const boxHeight = currentY - boxStartY;
  pdf.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');
  
  return currentY + 3;
}

async function addComparisonTable(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { title, items, headers, rows } = data;
  
  // Add table title
  if (title) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(50, 50, 50);
    const titleLines = pdf.splitTextToSize(cleanMarkdown(title), contentWidth);
    titleLines.forEach((line: string, index: number) => {
      pdf.text(line, margin, yPosition + 10 + (index * 8));
    });
    yPosition += (titleLines.length * 8) + 8;
  }
  
  // Handle table with headers and rows
  if (headers && rows) {
    const boxStartY = yPosition;
    pdf.setFillColor(248, 249, 250); // Light gray background
    pdf.setDrawColor(209, 213, 219); // Gray border
    
    // Add headers
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    
    const colWidth = (contentWidth - 10) / headers.length;
    let currentY = yPosition + 8;
    
    headers.forEach((header: string, index: number) => {
      pdf.text(cleanMarkdown(header), margin + 5 + (index * colWidth), currentY);
    });
    currentY += 12;
    
    // Add separator line
    pdf.setDrawColor(180, 180, 180);
    pdf.line(margin + 5, currentY - 2, margin + contentWidth - 5, currentY - 2);
    currentY += 6;
    
    // Add rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    
    rows.forEach((row: string[]) => {
      row.forEach((cell: string, index: number) => {
        const cellLines = pdf.splitTextToSize(cleanMarkdown(cell), colWidth - 5);
        cellLines.forEach((line: string, lineIndex: number) => {
          pdf.text(line, margin + 5 + (index * colWidth), currentY + (lineIndex * 6));
        });
      });
      currentY += Math.max(12, Math.max(...row.map(cell => pdf.splitTextToSize(cleanMarkdown(cell), colWidth - 5).length)) * 6 + 6);
    });
    
    // Draw table background
    const boxHeight = currentY - boxStartY;
    pdf.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');
    
    return currentY + 5;
  }
  
  // Handle comparison items (legacy format)
  if (items && Array.isArray(items)) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    
    items.forEach((item: any) => {
      const itemText = `• ${item.concept || item.name || item.title}: ${item.description || item.explanation || ''}`;
      const cleanedText = cleanMarkdown(itemText);
      const lines = pdf.splitTextToSize(cleanedText, contentWidth - 10);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, margin + 5, yPosition + 8 + (index * 6));
      });
      yPosition += (lines.length * 6) + 4;
    });
  }
  
  return yPosition + 5;
}

async function addCallout(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { type, content, text, style } = data;
  const calloutText = content || text;
  
  if (!calloutText) return yPosition;
  
  // Set colors and icons based on callout type/style
  let backgroundColor: [number, number, number] = [248, 250, 252]; // Light blue default
  let borderColor: [number, number, number] = [209, 213, 219];
  let textColor: [number, number, number] = [30, 64, 175];
  let icon = '💡';
  
  const calloutType = type || style;
  
  switch (calloutType) {
    case 'warning':
      backgroundColor = [254, 242, 242];
      borderColor = [254, 202, 202];
      textColor = [153, 27, 27];
      icon = '⚠️';
      break;
    case 'info':
      backgroundColor = [239, 246, 255];
      borderColor = [191, 219, 254];
      textColor = [30, 64, 175];
      icon = 'ℹ️';
      break;
    case 'success':
      backgroundColor = [240, 253, 244];
      borderColor = [167, 243, 208];
      textColor = [22, 101, 52];
      icon = '✅';
      break;
    case 'tip':
    case 'example':
      backgroundColor = [255, 251, 235];
      borderColor = [253, 230, 138];
      textColor = [146, 64, 14];
      icon = '💡';
      break;
    case 'metaphor':
      backgroundColor = [245, 243, 255];
      borderColor = [196, 181, 253];
      textColor = [91, 33, 182];
      icon = '🎭';
      break;
    case 'analogy':
      backgroundColor = [240, 253, 244];
      borderColor = [167, 243, 208];
      textColor = [22, 101, 52];
      icon = '🔗';
      break;
  }
  
  const boxStartY = yPosition;
  
  // Add callout content with icon
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...textColor);
  
  const fullCalloutText = `${icon} ${cleanMarkdown(calloutText)}`;
  const lines = pdf.splitTextToSize(fullCalloutText, contentWidth - 16);
  
  let currentY = yPosition + 8;
  lines.forEach((line: string, index: number) => {
    pdf.text(line, margin + 8, currentY + (index * 6));
  });
  currentY += (lines.length * 6) + 8;
  
  // Draw background box with border
  const boxHeight = currentY - boxStartY;
  pdf.setFillColor(...backgroundColor);
  pdf.setDrawColor(...borderColor);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');
  
  return currentY + 3;
}

async function addMermaidDiagram(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { chart } = data;
  
  // Add background box for diagram placeholder
  const boxStartY = yPosition;
  pdf.setFillColor(248, 250, 252); // Light blue background
  pdf.setDrawColor(203, 213, 225); // Blue border
  
  // Add title and description
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  
  const title = '📊 Interactive Diagram';
  pdf.text(title, margin + 8, yPosition + 12);
  
  let currentY = yPosition + 20;
  
  // Add chart description if available
  if (chart) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    
    // Extract diagram type from mermaid syntax
    const diagramType = chart.includes('graph') ? 'Flow Chart' : 
                       chart.includes('sequenceDiagram') ? 'Sequence Diagram' :
                       chart.includes('classDiagram') ? 'Class Diagram' :
                       chart.includes('gitgraph') ? 'Git Graph' : 'Diagram';
    
    const description = `Type: ${diagramType}\nThis interactive diagram is available in the online version.`;
    const lines = pdf.splitTextToSize(description, contentWidth - 16);
    lines.forEach((line: string, index: number) => {
      pdf.text(line, margin + 8, currentY + (index * 6));
    });
    currentY += (lines.length * 6) + 8;
  } else {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text('View online for the interactive diagram experience.', margin + 8, currentY);
    currentY += 16;
  }
  
  // Draw background box
  const boxHeight = currentY - boxStartY;
  pdf.setLineWidth(0.5);
  pdf.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');
  
  return currentY + 5;
}

async function add3DVisualization(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { description } = data;
  
  // Add background box for 3D visualization placeholder
  const boxStartY = yPosition;
  pdf.setFillColor(250, 245, 255); // Light purple background
  pdf.setDrawColor(220, 208, 255); // Purple border
  
  // Add title
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(91, 33, 182);
  
  const title = '🧊 Interactive 3D Visualization';
  pdf.text(title, margin + 8, yPosition + 12);
  
  let currentY = yPosition + 20;
  
  // Add description
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(88, 28, 135);
  
  const content = description ? 
    `Model: ${cleanMarkdown(description)}\nThis 3D visualization is available in the online version for interactive exploration.` :
    'This interactive 3D model is available in the online version.';
  
  const lines = pdf.splitTextToSize(content, contentWidth - 16);
  lines.forEach((line: string, index: number) => {
    pdf.text(line, margin + 8, currentY + (index * 6));
  });
  currentY += (lines.length * 6) + 8;
  
  // Draw background box
  const boxHeight = currentY - boxStartY;
  pdf.setLineWidth(0.5);
  pdf.rect(margin, boxStartY, contentWidth, boxHeight, 'FD');
  
  return currentY + 5;
}