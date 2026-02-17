# ChatGPT-Style UI with Claude Artifacts

This enhanced version of the OpenAI Responses Starter App features:

## Features

### 1. **ChatGPT-Like Styling**
- Clean, modern interface matching ChatGPT's design
- Responsive layout with proper spacing and typography
- Auto-expanding textarea for message input
- Smooth transitions and hover effects

### 2. **Claude-Style Artifacts**
- Automatic detection of HTML and React code blocks
- Dedicated artifact viewer panel on the right side
- Split-screen view: chat on left, artifact preview on right
- Toggle between preview and code view
- Download artifacts as HTML files
- Fullscreen mode for artifacts

### 3. **Skills Integration**
The app includes two powerful skills from Anthropic's skills repository:

#### Web Artifacts Builder
- Create elaborate, multi-component HTML artifacts
- Uses React 18, TypeScript, Vite, Tailwind CSS, and shadcn/ui
- Generates production-ready, self-contained HTML files
- Perfect for complex interactive components

#### Frontend Design
- Creates distinctive, production-grade interfaces
- Avoids generic "AI slop" aesthetics
- Emphasizes bold design choices and unique typography
- Focuses on memorable, well-crafted user experiences

## How to Use Artifacts

### Creating an Artifact

Simply ask the AI to create HTML or React components. The system automatically detects code blocks and renders them:

**Example prompts:**
- "Create a beautiful landing page for a coffee shop"
- "Build an interactive todo list with React"
- "Design a modern dashboard with charts"
- "Create a pricing page with animations"

### Artifact Detection

The system automatically detects these as artifacts:
- HTML code blocks (```html)
- React/JSX code blocks (```jsx, ```tsx, ```react)
- Code blocks marked with `// artifact:` comment

### Viewing Artifacts

When an artifact is created:
1. The artifact viewer opens on the right side (desktop) or fullscreen (mobile)
2. Preview mode shows the rendered HTML
3. Code mode shows the source code with syntax highlighting
4. Download button saves the artifact as an HTML file
5. Fullscreen mode for focused viewing

## Architecture

### Key Components

- **`artifact-viewer.tsx`**: Renders artifacts with preview/code toggle
- **`artifact-parser.ts`**: Extracts artifacts from message content
- **`useArtifactStore.ts`**: Manages artifact state
- **`skills-integration.ts`**: Integrates Claude skills system

### Artifact Flow

1. User sends a message requesting code/design
2. AI responds with code in markdown code blocks
3. `artifact-parser.ts` extracts code blocks
4. Artifacts are stored in `useArtifactStore`
5. `artifact-viewer.tsx` renders the artifact
6. Layout splits to show chat + artifact side-by-side

## Styling Philosophy

Following the frontend-design skill principles:
- **No generic aesthetics**: Avoid Inter font, purple gradients, centered layouts
- **Bold choices**: Distinctive typography, unexpected layouts, creative colors
- **Production quality**: Proper spacing, accessibility, responsive design
- **Memorable design**: Each artifact should be unique and intentional

## Development

### Running the App

```bash
cd openai-responses-starter-app
npm install
npm run dev
```

### Environment Variables

Create a `.env.local` file:
```
OPENAI_API_KEY=your_api_key_here
```

### Testing Artifacts

Try these example prompts:
1. "Create a modern portfolio hero section with animations"
2. "Build a weather widget with glassmorphism design"
3. "Design a pricing table with hover effects"
4. "Create an interactive color palette generator"

## Skills Location

Skills are located in `/skills/`:
- `web-artifacts-builder/` - Tools for building complex artifacts
- `frontend-design/` - Design guidelines and principles

## Tips for Best Results

1. **Be specific**: Describe the design aesthetic you want
2. **Request artifacts explicitly**: Say "create an artifact" or "build a component"
3. **Iterate**: Ask for refinements and improvements
4. **Explore styles**: Try different design directions (brutalist, minimal, maximalist, etc.)
5. **Use the skills**: Reference "use the frontend-design skill" for better aesthetics

## Browser Compatibility

Artifacts use modern web APIs and are tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Artifacts run in sandboxed iframes for security.
