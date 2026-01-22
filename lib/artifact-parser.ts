import { Artifact } from "@/stores/useArtifactStore";

/**
 * Parses message content to extract artifacts (HTML, React, or code blocks)
 */
export function extractArtifacts(content: string): {
  cleanedContent: string;
  artifacts: Artifact[];
} {
  const artifacts: Artifact[] = [];
  const cleanedContent = content;

  // Pattern to match code blocks with optional artifact metadata
  const codeBlockPattern = /```(\w+)?\s*(?:(?:\/\/|#)\s*artifact:\s*(.+?))?\n([\s\S]*?)```/g;
  
  let match;
  let artifactIndex = 0;

  while ((match = codeBlockPattern.exec(content)) !== null) {
    const language = match[1] || "text";
    const metadata = match[2];
    const code = match[3];

    // Check if this is an artifact (HTML, JSX, React, or marked as artifact)
    const isHtmlArtifact =
      language === "html" ||
      (language === "xml" && code.includes("<!DOCTYPE")) ||
      code.trim().startsWith("<!DOCTYPE") ||
      code.trim().startsWith("<html");

    const isReactArtifact =
      language === "jsx" ||
      language === "tsx" ||
      language === "react" ||
      (code.includes("import React") && code.includes("export default"));

    const isMarkedArtifact = metadata !== undefined || language === "artifact";

    if (isHtmlArtifact || isReactArtifact || isMarkedArtifact) {
      artifactIndex++;
      
      let artifactType: "html" | "react" | "code" = "code";
      let processedCode = code;

      if (isHtmlArtifact) {
        artifactType = "html";
        // Ensure it's a complete HTML document
        if (!code.includes("<!DOCTYPE") && !code.includes("<html")) {
          processedCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artifact</title>
</head>
<body>
${code}
</body>
</html>`;
        }
      } else if (isReactArtifact) {
        artifactType = "react";
        // Convert React component to standalone HTML
        processedCode = convertReactToHtml(code);
      } else if (language === "artifact") {
        // Heuristic: most "artifact" blocks are full HTML pages.
        const trimmed = code.trim();
        if (
          trimmed.startsWith("<!DOCTYPE") ||
          trimmed.toLowerCase().startsWith("<!doctype") ||
          trimmed.toLowerCase().startsWith("<html")
        ) {
          artifactType = "html";
        }
      }

      const artifact: Artifact = {
        id: `artifact-${Date.now()}-${artifactIndex}`,
        type: artifactType,
        title: metadata || `Artifact ${artifactIndex}`,
        code: processedCode,
        language,
      };

      artifacts.push(artifact);

      // Keep the code block visible in the content
      // Don't replace it - we'll show a button separately
    }
  }

  return { cleanedContent, artifacts };
}

/**
 * Converts a React component to a standalone HTML file
 */
function convertReactToHtml(reactCode: string): string {
  // Extract component name
  const componentMatch = reactCode.match(/export default (?:function\s+)?(\w+)/);
  const componentName = componentMatch ? componentMatch[1] : "App";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Artifact</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${reactCode}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<${componentName} />);
  </script>
</body>
</html>`;
}

/**
 * Detects if content contains potential artifacts
 */
export function hasArtifacts(content: string): boolean {
  const codeBlockPattern = /```(html|jsx|tsx|react|xml|artifact)/;
  return codeBlockPattern.test(content);
}
