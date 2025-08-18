import React from 'react';

interface ThreeDViewerProps {
  htmlContent: string;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ htmlContent }) => {
  console.log("ThreeDViewer: Rendering with htmlContent length:", htmlContent.length);
  console.log(`ThreeDViewer: htmlContent (first 200 chars):
${htmlContent.substring(0, 200)}`);
  // Define a minimal set of sandbox flags for security
  // allow-scripts: allows JavaScript execution
  // allow-same-origin: allows content to be treated as being from the same origin (important for loading textures/models if they are relative paths)
  // allow-popups: if the 3D content might open new windows (e.g., for external links)
  // allow-forms: if the 3D content includes forms
  // allow-pointer-lock: for first-person controls in 3D scenes
  const sandboxFlags = "allow-scripts allow-same-origin allow-pointer-lock";

  return (
    <div className="w-full h-96 my-4 border border-gray-300 rounded-lg overflow-hidden shadow-lg">
      <iframe
        srcDoc={htmlContent}
        sandbox={sandboxFlags}
        width="100%"
        height="100%"
        frameBorder="0"
        title="3D Visualization"
        // Consider adding a loading spinner or fallback content for the iframe
      ></iframe>
    </div>
  );
};

export default ThreeDViewer;
