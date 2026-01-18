# Quick Start Guide

## What's New

This enhanced version includes:
- **ChatGPT-style UI** - Clean, modern interface
- **Claude-style Artifacts** - Code renders in a side panel
- **Skills Integration** - Web artifacts builder and frontend design skills

## Setup

1. **Install dependencies** (already done):
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-...
```

3. **Run the development server**:
```bash
npm run dev
```

4. **Open in browser**:
```
http://localhost:3000
```

## Using Artifacts

### Try These Prompts

**Simple HTML Page:**
```
Create a beautiful landing page for a coffee shop with a hero section, 
menu preview, and contact form. Use warm colors and modern design.
```

**Interactive Component:**
```
Build an interactive todo list with React. Include add, delete, and 
mark complete functionality. Make it visually appealing with animations.
```

**Dashboard:**
```
Create a modern analytics dashboard with charts showing user growth, 
revenue, and engagement metrics. Use a dark theme with accent colors.
```

**Creative Design:**
```
Design a unique portfolio hero section with an unexpected layout, 
distinctive typography, and creative animations. Avoid generic design.
```

### How It Works

1. **Ask for code** - Request HTML, React, or web components
2. **Automatic detection** - System detects code blocks
3. **Artifact viewer opens** - Right panel shows live preview
4. **Toggle views** - Switch between preview and code
5. **Download** - Save artifacts as HTML files

## Features

### Split Screen Layout
- Chat on the left
- Artifact preview on the right
- Responsive design (mobile-friendly)

### Artifact Controls
- **Preview/Code toggle** - View rendered output or source
- **Download** - Save as HTML file
- **Fullscreen** - Maximize artifact viewer
- **Close** - Return to full-width chat

### Skills Integration
The AI has access to:
- **Web Artifacts Builder** - Creates production-ready components
- **Frontend Design** - Ensures high-quality, distinctive design

## Tips

1. **Be specific about design** - Describe the aesthetic you want
2. **Request artifacts explicitly** - Say "create an artifact" or "build a component"
3. **Iterate** - Ask for refinements and improvements
4. **Explore styles** - Try different design directions
5. **Use skills** - Say "use the frontend-design skill" for better aesthetics

## Troubleshooting

**Artifact not showing?**
- Make sure code is in a markdown code block with language tag (```html or ```jsx)
- Try refreshing the page

**Styling issues?**
- Artifacts use Tailwind CDN by default
- For custom styles, include them in the HTML

**TypeScript errors?**
- These are expected during development
- The app will run correctly despite lint warnings

## Next Steps

- Read `README-ARTIFACTS.md` for detailed documentation
- Explore the skills in `/skills/` directory
- Customize the UI in `/components/` and `/app/`
- Add more skills from the Anthropic skills repository

## Support

For issues or questions:
- Check the main README.md
- Review the OpenAI Responses API documentation
- Explore the skills documentation in `/skills/`

Enjoy building with artifacts! 🚀
