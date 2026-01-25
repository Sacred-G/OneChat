import { Artifact } from "@/stores/useArtifactStore";

/**
 * Parses message content to extract artifacts (HTML, React, or code blocks)
 */
export function extractArtifacts(content: string): {
  cleanedContent: string;
  artifacts: Artifact[];
} {
  const artifacts: Artifact[] = [];
  let cleanedContent = content;

  // Pattern to match code blocks with optional artifact metadata
  const codeBlockPattern = /```(\w+)?\s*(?:(?:\/\/|#)\s*artifact:\s*(.+?))?\n([\s\S]*?)```/g;

  // Track which code blocks to remove from content
  const blocksToRemove: string[] = [];

  let match;
  let artifactIndex = 0;

  while ((match = codeBlockPattern.exec(content)) !== null) {
    const fullMatch = match[0];
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
      language === "javascript" ||
      language === "typescript" ||
      (code.includes("import React") && (code.includes("export default") || code.includes("export function"))) ||
      (code.includes("function") && code.includes("return") && code.includes("<"));

    const isMarkedArtifact = metadata !== undefined;

    if (isHtmlArtifact || isReactArtifact || isMarkedArtifact) {
      artifactIndex++;
      blocksToRemove.push(fullMatch);

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
  <script src="https://cdn.tailwindcss.com"></script>
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
      }

      const artifact: Artifact = {
        id: `artifact-${Date.now()}-${artifactIndex}`,
        type: artifactType,
        title: metadata || `Artifact ${artifactIndex}`,
        code: processedCode,
        language,
      };

      artifacts.push(artifact);
    }
  }

  // Remove artifact code blocks from the displayed content
  for (const block of blocksToRemove) {
    cleanedContent = cleanedContent.replace(block, '');
  }

  // Clean up any excessive whitespace left behind
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim();

  return { cleanedContent, artifacts };
}

/**
 * Converts a React component to a standalone HTML file
 */
function convertReactToHtml(reactCode: string): string {
  // Extract component name - handle multiple export patterns
  let componentName = "App";

  // Pattern 1: export default function ComponentName
  const defaultFunctionMatch = reactCode.match(/export\s+default\s+function\s+(\w+)/);
  // Pattern 2: export default ComponentName (at end)
  const defaultExportMatch = reactCode.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
  // Pattern 3: const ComponentName = () => ... export default ComponentName
  const arrowFunctionMatch = reactCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/);
  // Pattern 4: function ComponentName() { ... export default ComponentName
  const namedFunctionMatch = reactCode.match(/function\s+(\w+)\s*\(/);

  if (defaultFunctionMatch) {
    componentName = defaultFunctionMatch[1];
  } else if (defaultExportMatch && !defaultExportMatch[1].match(/^(function|class|{)$/)) {
    componentName = defaultExportMatch[1];
  } else if (arrowFunctionMatch) {
    componentName = arrowFunctionMatch[1];
  } else if (namedFunctionMatch) {
    componentName = namedFunctionMatch[1];
  }

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
  const codeBlockPattern = /```(html|jsx|tsx|react|xml)/;
  return codeBlockPattern.test(content);
}
