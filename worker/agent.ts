import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, GenerateImageRequest } from './types';
import { ChatHandler } from './chat';
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
  private async sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'POST' && url.pathname === '/generate') {
        const body = await request.json() as GenerateImageRequest;
        return this.handleImageGeneration(body);
      }
      if (method === 'GET' && url.pathname === '/messages') {
        return Response.json({ success: true, data: this.state });
      }
      return Response.json({ success: false, error: "Not Found" }, { status: 404 });
    } catch (error) {
      console.error('Agent Request Error:', error);
      return Response.json({ success: false, error: "Internal Error" }, { status: 500 });
    }
  }
  private async handleImageGeneration(body: GenerateImageRequest): Promise<Response> {
    const { prompt, negative_prompt } = body;
    if (!prompt || prompt.length < 5) {
      return Response.json({ success: false, error: "Prompt must be at least 5 characters" }, { status: 400 });
    }
    try {
      const promptHash = await this.sha256(prompt + (negative_prompt || ""));
      const cacheKey = `img_cache_${promptHash}`;
      const cachedImage = await this.ctx.storage.get<string>(cacheKey);
      if (cachedImage) {
        return Response.json({ success: true, image: cachedImage, cached: true });
      }
      // Safe access to AI binding which is typically injected by Cloudflare
      const ai = (this.env as any).AI;
      if (!ai) {
        throw new Error("AI Binding not found. Check wrangler configuration.");
      }
      const seed = Math.floor(Math.random() * 2147483647);
      const inputs = {
        prompt,
        negative_prompt: negative_prompt || "blurry, low quality, distorted, watermark, lowres, text, deformed",
        num_steps: 20,
        guidance: 7.5,
        seed
      };
      const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", inputs);
      const binaryData = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(binaryData)));
      await this.ctx.storage.put(cacheKey, base64);
      return Response.json({
        success: true,
        image: base64,
        seed
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