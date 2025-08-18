// Utility functions for cleaning up text formatting

/**
 * Removes markdown-style formatting from text
 */
export const cleanMarkdownText = (text: string): string => {
  if (!text) return '';
  
  return text
    // Remove bold markdown (**text**)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic markdown (*text*)
    .replace(/\*(.*?)\*/g, '$1')
    // Remove subtopic numbering prefixes like "Sub-topic 1: "
    .replace(/^Sub-topic\s+\d+:\s*/i, '')
    // Remove topic numbering prefixes like "Topic 1: "
    .replace(/^Topic\s+\d+:\s*/i, '')
    // Remove module numbering prefixes like "Module 1: "
    .replace(/^Module\s+\d+:\s*/i, '')
    // Clean up extra whitespace
    .trim();
};

/**
 * Formats LaTeX-style math expressions for better display
 */
export const formatMathText = (text: string): string => {
  if (!text) return '';
  
  return text
    // Replace LaTeX-style math with more readable format
    .replace(/\\?\(\s*(.*?)\s*\\?\)/g, '$1')
    // Replace common LaTeX commands
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\,/g, ' ')
    .replace(/\\\s/g, ' ')
    // Clean up spacing around units
    .replace(/\s*\\\s*text\s*\{\s*([^}]*)\s*\}/g, ' $1')
    // Replace degree symbol
    .replace(/°/g, '°')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extracts and formats quiz questions properly
 */
export const formatQuizQuestion = (text: string): string => {
  if (!text) return '';
  
  // Remove "Quiz:" prefix if present
  let cleaned = text.replace(/^Quiz:\s*/i, '');
  
  // Apply math formatting
  cleaned = formatMathText(cleaned);
  
  // Ensure proper punctuation
  if (cleaned && !cleaned.match(/[.!?]$/)) {
    cleaned += '?';
  }
  
  return cleaned;
};

/**
 * Formats subtopic titles for display
 */
export const formatSubtopicTitle = (title: string): string => {
  if (!title) return '';
  
  let cleaned = cleanMarkdownText(title);
  cleaned = formatMathText(cleaned);
  
  // Capitalize first letter if needed
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned;
};

/**
 * Formats module and topic titles
 */
export const formatTitle = (title: string): string => {
  if (!title) return '';
  
  let cleaned = cleanMarkdownText(title);
  
  // Capitalize first letter if needed
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned;
};