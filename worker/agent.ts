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
  private async checkRateLimit(): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Math.floor(Date.now() / 1000);
    const minute = Math.floor(now / 60);
    const key = `rate_limit_${minute}`;
    const count = await this.ctx.storage.get<number>(key) || 0;
    if (count >= 10) {
      return { allowed: false, retryAfter: 60 - (now % 60) };
    }
    await this.ctx.storage.put(key, count + 1);
    // Cleanup old rate limit keys
    const prevKey = `rate_limit_${minute - 1}`;
    await this.ctx.storage.delete(prevKey);
    return { allowed: true };
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
    // Spec compliance: Min 5 characters
    if (!prompt || prompt.trim().length < 5) {
      return Response.json({ 
        success: false, 
        error: "Vision too short. Minimum 5 characters required to crystallize." 
      }, { status: 400 });
    }
    // Rate Limiting (10 req/min)
    const rateLimit = await this.checkRateLimit();
    if (!rateLimit.allowed) {
      return Response.json({ 
        success: false, 
        error: `Engine cooling down. Try again in ${rateLimit.retryAfter}s.`,
        retryAfter: rateLimit.retryAfter
      }, { status: 429 });
    }
    try {
      const promptHash = await this.sha256(prompt + (negative_prompt || ""));
      const cacheKey = `img_cache_${promptHash}`;
      const cachedImage = await this.ctx.storage.get<string>(cacheKey);
      if (cachedImage) {
        return Response.json({ success: true, image: cachedImage, cached: true });
      }
      const ai = (this.env as any).AI;
      if (!ai) throw new Error("AI Binding not found.");
      // Exponential Backoff Retry Logic (Up to 3 times)
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 250));
          }
          const seed = Math.floor(Math.random() * 2147483647);
          const inputs = {
            prompt,
            negative_prompt: "blurry, low quality, distorted, watermark, lowres, text, deformed, bad anatomy, disfigured",
            num_steps: 20,
            guidance: 7.5,
            seed
          };
          const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", inputs);
          const binaryData = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(binaryData)));
          await this.ctx.storage.put(cacheKey, base64);
          // Internal Analytics
          const totalGen = await this.ctx.storage.get<number>('usage_count') || 0;
          await this.ctx.storage.put('usage_count', totalGen + 1);
          return Response.json({ success: true, image: base64, seed });
        } catch (e) {
          lastError = e;
          console.warn(`Generation attempt ${attempt + 1} failed:`, e);
        }
      }
      throw lastError || new Error("Failed after multiple attempts");
    } catch (error: any) {
      console.error('Image Generation Final Error:', error);
      return Response.json({
        success: false,
        error: error.message || "Failed to generate image"
      }, { status: 500 });
    }
  }
}