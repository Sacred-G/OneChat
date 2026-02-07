# Multi-Server MCP Configuration

Your app now supports multiple MCP (Model Context Protocol) servers through a configuration file.

## 📁 Setup

1. **Create `mcp-config.json`** in your project root
2. **Copy the example** from `mcp-config.json.example`
3. **Configure your servers** (see format below)

## 📄 Configuration Format

### Single Server (legacy format)
```json
{
  "server_label": "DeepWiki",
  "server_url": "http://localhost:3000", 
  "allowed_tools": "search_wiki,get_page",
  "skip_approval": false
}
```

### Multiple Servers (new format)
```json
[
  {
    "id": "deepwiki-server-1",
    "server_label": "DeepWiki",
    "server_url": "http://localhost:3000",
    "allowed_tools": "search_wiki,get_page",
    "skip_approval": false,
    "enabled": true
  },
  {
    "id": "filesystem-server-2",
    "server_label": "File System", 
    "server_url": "http://localhost:3001",
    "allowed_tools": "",
    "skip_approval": true,
    "enabled": true
  }
]
```

## ⚙️ Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | No (auto-generated) | Unique identifier for the server |
| `server_label` | string | Yes | Human-readable name for the server |
| `server_url` | string | Yes | URL where the MCP server is running |
| `allowed_tools` | string | No | Comma-separated list of allowed tools (empty = all) |
| `skip_approval` | boolean | No | Whether to auto-approve tool calls (default: false) |
| `enabled` | boolean | No | Whether the server is active (default: true) |

## 🎛️ UI Features

The new MCP configuration interface includes:

- **Add Server**: Form to add new MCP servers
- **Edit Server**: Inline editing of existing configurations  
- **Delete Server**: Remove servers from the list
- **Enable/Disable**: Toggle individual servers on/off
- **Status Indicators**: Visual feedback for enabled/disabled state

## 🔧 Backend Changes

- **Multi-server support**: Tools system now handles multiple enabled MCP servers
- **Backward compatibility**: Still supports single-server config files
- **Automatic ID generation**: Servers without IDs get unique identifiers
- **Individual server control**: Enable/disable specific servers

## 🚀 Usage

1. **Configure servers** in `mcp-config.json` or use the UI
2. **Enable MCP** in the tools panel
3. **Toggle individual servers** as needed
4. **Use tools** from any enabled MCP server in your conversations

## 📝 Example Use Cases

- **Development**: Local MCP server for file operations
- **Production**: Remote MCP server for database access  
- **Testing**: Multiple test servers with different tool sets
- **Teams**: Shared configuration with role-based access

The system automatically loads your configuration on startup and provides a rich UI for managing multiple MCP servers!
