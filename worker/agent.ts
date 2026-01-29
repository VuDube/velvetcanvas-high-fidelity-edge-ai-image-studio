import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, GenerateImageRequest } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage } from './utils';
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.5-flash'
  };
  async onStart(): Promise<void> {
    this.chatHandler = new ChatHandler(
      this.env.CF_AI_BASE_URL,
      this.env.CF_AI_API_KEY,
      this.state.model
    );
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      // New route for specialized image generation
      if (method === 'POST' && url.pathname === '/generate') {
        return this.handleImageGeneration(await request.json());
      }
      if (method === 'GET' && url.pathname === '/messages') {
        return Response.json({ success: true, data: this.state });
      }
      if (method === 'POST' && url.pathname === '/chat') {
        return Response.json({ success: false, error: "Use /generate for VelvetCanvas" }, { status: 400 });
      }
      return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    } catch (error) {
      console.error('Agent Request Error:', error);
      return Response.json({ success: false, error: "Internal Error" }, { status: 500 });
    }
  }
  private async handleImageGeneration(body: GenerateImageRequest): Promise<Response> {
    const { prompt, negative_prompt } = body;
    if (!prompt) {
      return Response.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }
    try {
      // Use Cloudflare Workers AI directly for SDXL
      // Note: In local dev, this might need fallback if AI binding isn't mocked
      // @ts-ignore - access AI binding from env
      const ai = (this.env as any).AI;
      if (!ai) {
        throw new Error("AI Binding not found. Ensure wrangler.jsonc has [ai] configuration.");
      }
      const inputs = {
        prompt,
        negative_prompt: negative_prompt || "blurry, low quality, distorted, watermark",
        num_steps: 20
      };
      const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", inputs);
      // The AI model returns a binary stream for images
      const binaryData = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(binaryData)));
      return Response.json({
        success: true,
        image: base64
      });
    } catch (error: any) {
      console.error('Image Generation Error:', error);
      return Response.json({
        success: false,
        error: error.message || "Failed to generate image"
      }, { status: 500 });
    }
  }
}