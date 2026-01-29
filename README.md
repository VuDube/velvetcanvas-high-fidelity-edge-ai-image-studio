# Cloudflare AI Chat Agent Template

[cloudflarebutton]

A production-ready full-stack template for building scalable AI-powered chat applications on Cloudflare Workers. Features multi-session chat management, streaming responses, tool calling (web search, weather, extensible MCP tools), and a modern React frontend with Shadcn/UI.

## 🚀 Features

- **Multi-Session Chat**: Persistent conversations with titles, timestamps, and activity tracking
- **AI Integration**: Cloudflare AI Gateway with Gemini models (switchable)
- **Streaming Responses**: Real-time message streaming for natural UX
- **Tool Calling**: Built-in tools (weather, web search via SerpAPI) + MCP server integration
- **Session Management**: Create, list, delete, rename, and clear sessions via API
- **Modern UI**: React 18 + Tailwind CSS + Shadcn/UI components + dark mode
- **Type-Safe**: Full TypeScript with Workers types and path mapping
- **Production-Ready**: Durable Objects for state, CORS, error handling, health checks
- **Extensible**: Easy to add custom routes, agents, tools, and MCP servers

## 🛠️ Tech Stack

- **Backend**: Cloudflare Workers, Hono, Agents SDK, Durable Objects, OpenAI SDK
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Shadcn/UI, React Query, Sonner
- **AI**: Cloudflare AI Gateway (@ai.cloudflare), Gemini models
- **Tools**: SerpAPI, Model Context Protocol (MCP)
- **Build Tools**: Bun, Wrangler, esbuild/Vite

## ⚡ Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.1+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) (latest)
- Cloudflare account with AI Gateway configured
- SerpAPI key (optional, for web search)

### Installation

1. Clone the repo and navigate to the project directory
2. Install dependencies:
   ```bash
   bun install
   ```
3. Configure environment variables in `wrangler.jsonc`:
   ```json
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
     "CF_AI_API_KEY": "{your_ai_key}",
     "SERPAPI_KEY": "{your_serpapi_key}",
     "OPENROUTER_API_KEY": "{optional_openrouter_key}"
   }
   ```

### Development

- Start dev server (frontend + worker):
  ```bash
  bun dev
  ```
- Open [http://localhost:3000](http://localhost:3000)
- Edit `src/pages/HomePage.tsx` to build your UI
- Add custom routes in `worker/userRoutes.ts`
- Extend agent/tools in `worker/agent.ts`, `worker/chat.ts`, `worker/tools.ts`

Hot reload works for both frontend and worker. Type generation: `bun cf-typegen`.

### Build & Preview

```bash
bun build    # Production build
bun preview  # Preview built app
```

## 🔧 Usage Examples

### Chat API (via frontend service)
```ts
// Send message (streaming)
await chatService.sendMessage("Hello!", undefined, (chunk) => console.log(chunk));

// Get messages
const { data } = await chatService.getMessages();

// New session
await chatService.createSession("My Chat");

// List sessions
const sessions = await chatService.listSessions();
```

### Custom Extensions
- **New Tools**: Add to `worker/tools.ts` + `mcp-client.ts`
- **Models**: Update `src/lib/chat.ts` MODELS array
- **UI Customization**: Replace `src/pages/HomePage.tsx`, use `AppLayout` for sidebar
- **MCP Servers**: Add configs to `worker/mcp-client.ts` MCP_SERVERS

## ☁️ Deployment

1. Update `wrangler.jsonc` with your config
2. Deploy to Cloudflare:
   ```bash
   bun deploy
   ```
   Or:
   ```bash
   wrangler deploy
   ```

3. Set production vars via Wrangler dashboard or CLI:
   ```bash
   wrangler secret put CF_AI_API_KEY
   ```

[cloudflarebutton]

Assets are served as SPA. API routes proxied to `/api/*`. Custom domains supported.

## 📚 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/:sessionId/chat` | POST | Send message `{message, model?, stream?}` |
| `/api/chat/:sessionId/messages` | GET | Get chat state |
| `/api/chat/:sessionId/clear` | DELETE | Clear messages |
| `/api/chat/:sessionId/model` | POST | Update model `{model}` |
| `/api/sessions` | GET/POST/DELETE | List/create/clear sessions |
| `/api/sessions/:id` | DELETE | Delete session |
| `/api/sessions/:id/title` | PUT | Rename session |

See `worker/userRoutes.ts` for full schema.

## 🤝 Contributing

1. Fork & PR
2. Use `bun lint` before commit
3. Add tests for new features
4. Update README for public changes

## ⚠️ Important Notes

- Do **NOT** modify `worker/index.ts` or `worker/core-utils.ts`
- Customize `src/pages/HomePage.tsx` and `worker/userRoutes.ts`
- Rate limits apply to AI Gateway/Tools
- Sessions persist via Durable Objects (storage-backed)

## 📄 License

MIT. See [LICENSE](LICENSE) for details.

Built with ❤️ by Cloudflare Workers Templates.