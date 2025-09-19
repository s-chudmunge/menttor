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
    yPosition += 30;
    
    // Add title section
    if (subtopic) {
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      const title = `Learning: ${subtopic}`;
      pdf.text(title, margin, yPosition);
      yPosition += 15;
    }
    
    if (subject) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Subject: ${subject}`, margin, yPosition);
      yPosition += 10;
    }
    
    if (goal) {
      pdf.text(`Goal: ${goal}`, margin, yPosition);
      yPosition += 15;
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Process content blocks
    for (const block of content) {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      switch (block.type) {
        case 'heading':
          yPosition = await addHeading(pdf, block.data, yPosition, margin, contentWidth);
          break;
        case 'paragraph':
          yPosition = await addParagraph(pdf, block.data, yPosition, margin, contentWidth);
          break;
        case 'progressive_disclosure':
          yPosition = await addProgressiveDisclosure(pdf, block.data, yPosition, margin, contentWidth);
          break;
        case 'active_recall':
          yPosition = await addActiveRecall(pdf, block.data, yPosition, margin, contentWidth);
          break;
        case 'comparison_table':
          yPosition = await addComparisonTable(pdf, block.data, yPosition, margin, contentWidth);
          break;
        case 'callout':
          yPosition = await addCallout(pdf, block.data, yPosition, margin, contentWidth);
          break;
        case 'mermaid_diagram':
          yPosition = await addMermaidDiagram(pdf, block.data, yPosition, margin, contentWidth);
          break;
        case '3d_visualization':
          yPosition = await add3DVisualization(pdf, block.data, yPosition, margin, contentWidth);
          break;
      }
      
      yPosition += 5; // Add some space between blocks
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
    { text: 'Explore', url: 'https://menttor.ai/explore' },
    { text: 'Library', url: 'https://menttor.ai/library' },
    { text: 'Home', url: 'https://menttor.ai' },
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

async function addHeading(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { level, text } = data;
  
  // Set font size based on heading level
  const fontSize = level === 1 ? 18 : level === 2 ? 16 : 14;
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  // Add heading text
  const lines = pdf.splitTextToSize(text, contentWidth);
  pdf.text(lines, margin, yPosition + 10);
  
  return yPosition + (lines.length * 8) + 8;
}

async function addParagraph(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Clean the markdown text (basic cleanup)
  let cleanText = data.text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/`(.*?)`/g, '$1') // Remove code markdown
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Remove links, keep text
  
  const lines = pdf.splitTextToSize(cleanText, contentWidth);
  pdf.text(lines, margin, yPosition + 8);
  
  return yPosition + (lines.length * 6) + 8;
}

async function addProgressiveDisclosure(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { key_idea, summary, full_text } = data;
  
  // Add key idea as a heading
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246); // Blue color
  
  const keyIdeaLines = pdf.splitTextToSize(`💡 ${key_idea}`, contentWidth);
  pdf.text(keyIdeaLines, margin, yPosition + 10);
  yPosition += (keyIdeaLines.length * 8) + 8;
  
  // Add summary
  if (summary) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Summary:', margin, yPosition + 8);
    yPosition += 10;
    
    pdf.setFont('helvetica', 'normal');
    const summaryLines = pdf.splitTextToSize(summary, contentWidth);
    pdf.text(summaryLines, margin, yPosition + 5);
    yPosition += (summaryLines.length * 6) + 8;
  }
  
  // Add full text
  if (full_text) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Detailed Explanation:', margin, yPosition + 8);
    yPosition += 10;
    
    pdf.setFont('helvetica', 'normal');
    const fullTextLines = pdf.splitTextToSize(full_text, contentWidth);
    pdf.text(fullTextLines, margin, yPosition + 5);
    yPosition += (fullTextLines.length * 6) + 8;
  }
  
  return yPosition;
}

async function addActiveRecall(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { question, answer } = data;
  
  // Add question
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(168, 85, 247); // Purple color
  
  const questionText = `🤔 Think About This: ${question}`;
  const questionLines = pdf.splitTextToSize(questionText, contentWidth);
  pdf.text(questionLines, margin, yPosition + 10);
  yPosition += (questionLines.length * 8) + 8;
  
  // Add answer
  if (answer) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const answerLines = pdf.splitTextToSize(`Answer: ${answer}`, contentWidth);
    pdf.text(answerLines, margin + 10, yPosition + 5);
    yPosition += (answerLines.length * 6) + 8;
  }
  
  return yPosition;
}

async function addComparisonTable(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { title, items } = data;
  
  // Add table title
  if (title) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, margin, yPosition + 10);
    yPosition += 15;
  }
  
  // Add comparison items
  if (items && Array.isArray(items)) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    items.forEach((item: any) => {
      const itemText = `• ${item.concept || item.name || item.title}: ${item.description || item.explanation || ''}`;
      const lines = pdf.splitTextToSize(itemText, contentWidth - 10);
      pdf.text(lines, margin + 5, yPosition + 8);
      yPosition += (lines.length * 5) + 3;
    });
  }
  
  return yPosition + 5;
}

async function addCallout(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { type, content } = data;
  
  // Set colors based on callout type
  let backgroundColor: [number, number, number] = [240, 240, 240];
  let textColor: [number, number, number] = [0, 0, 0];
  let icon = '💡';
  
  switch (type) {
    case 'warning':
      backgroundColor = [254, 242, 242];
      textColor = [220, 38, 38];
      icon = '⚠️';
      break;
    case 'info':
      backgroundColor = [239, 246, 255];
      textColor = [59, 130, 246];
      icon = 'ℹ️';
      break;
    case 'success':
      backgroundColor = [240, 253, 244];
      textColor = [34, 197, 94];
      icon = '✅';
      break;
    case 'tip':
      backgroundColor = [255, 251, 235];
      textColor = [245, 158, 11];
      icon = '💡';
      break;
  }
  
  // Add callout with background
  const calloutHeight = 20;
  pdf.setFillColor(...backgroundColor);
  pdf.rect(margin, yPosition, contentWidth, calloutHeight, 'F');
  
  // Add callout content
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...textColor);
  
  const calloutText = `${icon} ${content}`;
  const lines = pdf.splitTextToSize(calloutText, contentWidth - 10);
  pdf.text(lines, margin + 5, yPosition + 10);
  
  return yPosition + Math.max(calloutHeight, lines.length * 6) + 8;
}

async function addMermaidDiagram(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  // For now, just add a placeholder for Mermaid diagrams
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  
  const placeholder = '📊 [Mermaid Diagram - View online for interactive diagram]';
  const lines = pdf.splitTextToSize(placeholder, contentWidth);
  pdf.text(lines, margin, yPosition + 10);
  
  return yPosition + (lines.length * 6) + 10;
}

async function add3DVisualization(pdf: jsPDF, data: any, yPosition: number, margin: number, contentWidth: number): Promise<number> {
  const { description } = data;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  
  const placeholder = `🧊 [3D Visualization: ${description || 'Interactive 3D Model'} - View online for interactive experience]`;
  const lines = pdf.splitTextToSize(placeholder, contentWidth);
  pdf.text(lines, margin, yPosition + 10);
  
  return yPosition + (lines.length * 6) + 10;
}