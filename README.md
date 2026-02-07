# OneChatAI - Enhanced Edition

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![NextJS](https://img.shields.io/badge/Built_with-NextJS-blue)
![OpenAI API](https://img.shields.io/badge/Powered_by-OpenAI_API-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

An advanced conversational AI application built on the OpenAI Responses API with ChatGPT-style UI, Claude-style artifacts, and extensive tool integrations. This enhanced starter app demonstrates modern AI capabilities including multi-turn conversations, streaming responses, function calling, and real-time code execution.

## ✨ Key Features

### 🎨 Modern UI/UX

- **ChatGPT-Style Interface** - Clean, responsive design with auto-expanding textarea
- **Claude-Style Artifacts** - Live code preview side panel with HTML/React rendering
- **Split-Screen Layout** - Chat on left, artifact preview on right (mobile-responsive)
- **Dark/Light Theme** - Seamless theme switching with system preference detection
- **Image Gallery** - Comprehensive gallery storing all generated images with metadata and search
- **App Gallery** - Dedicated gallery for all created apps and artifacts with preview and download options

### 🤖 AI Capabilities

- **Multi-turn Conversations** - Context-aware dialogue handling
- **Streaming Responses** - Real-time message streaming with typing indicators
- **Function Calling** - Custom function integration with tool execution
- **Voice Mode** - Voice conversations with image generation support
- **Artifact Generation** - Automatic detection and rendering of code blocks

### 🛠️ Tool Integrations

- **Built-in OpenAI Tools**:

  - Web Search - Real-time web information retrieval
  - File Search - Vector store-based document search
  - Code Interpreter - Python code execution with visualization
  - Image Generation - DALL-E and Gemini integration
- **External Integrations**:

  - Google Calendar & Gmail via OAuth
  - MCP (Model Context Protocol) servers
  - Local file system access
  - MongoDB database integration
  - SendGrid email services
- **APIPie Integration**:

  - **200+ AI Models** - Access to extensive model library including GPT, Claude, Llama, Mistral, and more
  - **Image Models** - Multiple image generation models (DALL-E, Midjourney, Stable Diffusion, etc.)
  - **Video Creation** - Text-to-video and image-to-video generation capabilities
  - **Model Switching** - Seamlessly switch between different AI models for specific tasks
- **MCP Server Types**:

  - **Local MCP Servers** - Run on your machine for file system access, local databases, and development tools
  - **Remote MCP Servers** - Cloud-hosted services for web APIs, external databases, and SaaS integrations
  - **Hybrid Setup** - Combine local and remote servers for comprehensive tool coverage
  - **Pre-built Servers** - File system, web search, database, and development tool servers
  - **Custom Servers** - Build your own MCP servers for specific workflows

### 📦 Skills System

Pre-loaded with 15+ specialized skills:

- **Web Artifacts Builder** - Production-ready HTML/React components
- **Frontend Design** - High-quality, distinctive UI design
- **Canvas Design** - Advanced design system components
- **Document Processing** - PDF, DOCX, PPTX handling
- **Algorithmic Art** - Generative art and visualizations
- **Web App Testing** - Automated testing workflows
- **And many more...**

### 🏗️ Architecture

- **Next.js 15** - Modern React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **Radix UI** - Accessible component primitives
- **MongoDB** - Database integration with authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (and < 23)
- npm, yarn, pnpm, or bun
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/openai-responses-starter-app.git
   cd openai-responses-starter-app
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:

   ```env
   # Required
   OPENAI_API_KEY=sk-your-openai-api-key

   # Optional - for enhanced features
   GOOGLE_API_KEY=your-google-api-key
   MONGODB_URI=mongodb://127.0.0.1:27017/responses_starter_app
   GOOGLE_CLIENT_ID=your-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-oauth-client-secret
   SENDGRID_API_KEY=your-sendgrid-api-key
   APIPIE_API_KEY=your-apipie-api-key
   ```
4. **Run the development server**

   ```bash
   npm run dev
   ```
5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Usage Guide

### Chat with Artifacts

Simply ask the AI to create web components:

```
Create a beautiful landing page for a coffee shop with a hero section and contact form.
```

The system will:

1. Detect HTML/React code blocks in the response
2. Automatically open the artifact viewer
3. Show a live preview alongside the code
4. Allow downloading as HTML files

### Using Tools

Enable tools from the UI panel:

**Web Search + Code Interpreter:**

```
Can you fetch the temperatures in SF for August and generate a chart plotting them?
```

**File Search:**

1. Upload PDF documents to create a vector store
2. Enable file search tool
3. Ask questions about your documents:
   ```
   What's new with the Responses API according to the uploaded documents?
   ```

**Google Integration:**

1. Click "Connect Google Integration"
2. Complete OAuth flow
3. Ask for calendar events or email summaries:
   ```
   Show my next five calendar events
   Summarize recent emails from wirecutter
   ```

### Voice Mode

- Click the voice button to start voice conversations
- Supports voice commands and image generation
- Automatically posts generated images to chat

### APIPie Models & Gallery

- **200+ AI Models**: Access to GPT, Claude, Llama, Mistral, and specialized models
- **Image Generation**: Multiple models including DALL-E, Midjourney, Stable Diffusion
- **Video Creation**: Text-to-video and image-to-video generation
- **Image Gallery**: Browse all generated images with metadata and search functionality
- **App Gallery**: View and manage all created apps and artifacts

### Local Agent

Run the local agent for file system operations:

```bash
npm run local-agent
```

Then use local file operations in chat:

```
List the files in the current directory
Read the package.json file
Create a new file called hello.js
```

## 🛠️ Advanced Configuration

### MCP Server Setup

#### Local MCP Servers

Local servers run on your machine and provide access to local resources:

**File System Server:**

```json
{
  "id": "local-filesystem",
  "server_label": "Local Files",
  "server_url": "http://localhost:3001",
  "allowed_tools": "read_file,write_file,list_dir",
  "skip_approval": false,
  "enabled": true
}
```

**Database Server:**

```json
{
  "id": "local-database",
  "server_label": "Local Database",
  "server_url": "http://localhost:3002",
  "allowed_tools": "query_database,insert_data,update_records",
  "skip_approval": false,
  "enabled": true
}
```

#### Remote MCP Servers

Remote servers connect to cloud services and external APIs:

**Web API Server:**

```json
{
  "id": "web-api-server",
  "server_label": "Web APIs",
  "server_url": "https://api.example.com/mcp",
  "allowed_tools": "fetch_data,post_request,api_call",
  "skip_approval": false,
  "enabled": true
}
```

**SaaS Integration Server:**

```json
{
  "id": "saas-integration",
  "server_label": "SaaS Services",
  "server_url": "https://mcp.saas-provider.com",
  "allowed_tools": "get_sales_data,update_crm,send_notification",
  "skip_approval": false,
  "enabled": true
}
```

#### Hybrid Configuration

Combine local and remote servers for full functionality:

```json
[
  {
    "id": "local-filesystem",
    "server_label": "Local Files",
    "server_url": "http://localhost:3001",
    "allowed_tools": "read_file,write_file,list_dir",
    "skip_approval": false,
    "enabled": true
  },
  {
    "id": "web-search",
    "server_label": "Web Search",
    "server_url": "https://api.search-service.com/mcp",
    "allowed_tools": "search_web,get_url_content",
    "skip_approval": false,
    "enabled": true
  },
  {
    "id": "cloud-storage",
    "server_label": "Cloud Storage",
    "server_url": "https://storage.googleapis.com/mcp",
    "allowed_tools": "upload_file,download_file,list_cloud_files",
    "skip_approval": false,
    "enabled": true
  }
]
```

#### Available MCP Server Types

**Development & Productivity:**

- **File System Server** - Local file operations
- **Git Server** - Repository management and operations
- **Database Server** - SQL and NoSQL database access
- **Terminal Server** - Command-line operations
- **Code Execution Server** - Run code in various languages

**Web & Cloud:**

- **Web Search Server** - Multiple search engine integration
- **Web Scraping Server** - Extract data from websites
- **API Gateway Server** - Connect to REST/GraphQL APIs
- **Cloud Storage Server** - AWS S3, Google Cloud, Azure integration
- **Email Server** - Send and receive emails

**Communication & Collaboration:**

- **Slack Server** - Team communication
- **Discord Server** - Community management
- **Calendar Server** - Google/Outlook calendar integration
- **Project Management Server** - Jira, Trello, Asana integration

**Data & Analytics:**

- **Analytics Server** - Google Analytics, Mixpanel integration
- **Monitoring Server** - System and application monitoring
- **Logging Server** - Centralized log management
- **Metrics Server** - Performance and business metrics

#### Running Local MCP Servers

**File System Server:**

```bash
npx @modelcontextprotocol/server-filesystem /path/to/directory
```

**Git Server:**

```bash
npx @modelcontextprotocol/server-git /path/to/repository
```

**Database Server:**

```bash
npx @modelcontextprotocol/server-postgres "postgresql://user:pass@localhost/db"
```

**Memory Server:**

```bash
npx @modelcontextprotocol/server-memory
```

#### Security Considerations

**Local Servers:**

- Run with appropriate file system permissions
- Use sandboxed environments for code execution
- Limit access to sensitive directories
- Monitor resource usage

**Remote Servers:**

- Use HTTPS connections only
- Implement proper authentication
- Validate and sanitize inputs
- Rate limit API calls
- Audit access logs

#### Custom MCP Server Development

Create your own MCP server for specific workflows:

```javascript
// Custom MCP server example
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'custom-workflow',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Define custom tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'custom_action',
      description: 'Perform custom workflow action',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string' },
        },
      },
    },
  ],
}));

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Custom Functions

Add your own functions in `config/functions.ts`:

```typescript
export const my_custom_function = async ({ param1, param2 }: {
  param1: string;
  param2: number;
}) => {
  // Your function logic here
  return { result: "success" };
};
```

### Skills Development

Create custom skills in the `/skills/` directory:

1. Copy an existing skill folder
2. Modify the `SKILL.md` file
3. Implement your skill logic
4. The skill will be automatically available

## 📁 Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── chat.tsx          # Chat interface
│   ├── artifact-viewer.tsx # Code preview
│   ├── voice-agent.tsx   # Voice mode
│   └── ...
├── config/               # Configuration files
│   ├── functions.ts      # Custom functions
│   ├── tools-list.ts     # Tool definitions
│   └── constants.ts      # App constants
├── lib/                  # Utility libraries
├── skills/               # AI skills (15+ included)
├── stores/               # Zustand state management
├── local-agent/          # Local file system agent
├── streamlit-app/        # Sample Streamlit dashboard
└── public/               # Static assets
```

## 🎯 Example Use Cases

### Web Development

```
Create a modern dashboard with charts showing user metrics. Use a dark theme with blue accents.
```

### Data Analysis

```
I have a CSV file with sales data. Can you analyze it and create visualizations?
```

### Document Processing

```
Summarize this PDF document and extract the key points.
```

### Automation

```
Create a script that monitors my Gmail for specific keywords and sends me notifications.
```

### Design Systems

```
Design a complete component library with buttons, forms, and cards using Tailwind CSS.
```

### Multi-Model Generation

```
Create an image using Midjourney style, then generate a short video from it using Runway.
```

### Model Comparison

```
Generate the same prompt using GPT-4, Claude-3, and Llama-3 to compare their responses.
```

### MCP Server Integration

```
Connect to my local file system server and list the files in my project directory.
```

### Hybrid Workflow

```
Use the local file system to read my data, then process it with a remote analytics server.

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run local-agent  # Start local file system agent
```

### MCP Server Commands

```bash
# Start built-in MCP servers
npx @modelcontextprotocol/server-filesystem /path/to/directory
npx @modelcontextprotocol/server-git /path/to/repository
npx @modelcontextprotocol/server-postgres "postgresql://user:pass@localhost/db"
npx @modelcontextprotocol/server-memory

# Start custom MCP server
node custom-mcp-server.js
```

### Environment Variables

See `.env.example` for all available configuration options.

### Database Setup (Optional)

For full functionality, set up MongoDB:

```bash
# Start MongoDB
mongod

# The app will automatically connect using MONGODB_URI
```

### Google OAuth Setup (Optional)

1. Create OAuth 2.0 client in Google Cloud Console
2. Add redirect URI: `http://localhost:3000/api/google/callback`
3. Enable Calendar and Gmail APIs
4. Configure environment variables

## 🌟 Features Showcase

### Artifact System

- **Auto-detection** - Automatically finds code blocks
- **Live Preview** - Real-time HTML rendering
- **Code View** - Syntax-highlighted source code
- **Download** - Save as standalone HTML files
- **Fullscreen** - Focused viewing mode
- **Responsive** - Works on all devices

### Voice Mode

- **Speech-to-text** - Natural voice input
- **Text-to-speech** - AI responses spoken aloud
- **Image Generation** - Voice-triggered image creation
- **Real-time** - Low-latency voice conversations

### Multi-Tool Integration

- **Parallel Execution** - Multiple tools can work together
- **Context Sharing** - Tools can share results
- **Error Handling** - Graceful failure recovery
- **Security** - Sandboxed execution environments

### Gallery Management

- **Image Gallery** - Automatic storage and organization of all generated images
- **App Gallery** - Complete repository of created artifacts and web apps
- **Search & Filter** - Find content by date, model, or keywords
- **Export Options** - Download images and apps in various formats
- **Metadata Tracking** - View generation parameters and model used

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the Responses API
- Anthropic for the skills system
- The Next.js team for the excellent framework
- All contributors and community members

## 📞 Support

- 📖 [Documentation](https://platform.openai.com/docs/api-reference/responses)
- 🐛 [Issue Tracker](https://github.com/your-username/openai-responses-starter-app/issues)
- 💬 [Discussions](https://github.com/your-username/openai-responses-starter-app/discussions)

## 🔮 Roadmap

- [ ] More built-in skills
- [ ] Advanced authentication options
- [ ] Plugin system
- [ ] Mobile app
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard

---

**Built with ❤️ using OpenAI's Responses API**

*Start building your AI-powered application today!*
