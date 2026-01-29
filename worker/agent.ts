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
    const windowStart = Math.floor(now / 60);
    const key = `rl_win_${windowStart}`;
    // Using a simple window-based counter for performance
    const count = await this.ctx.storage.get<number>(key) || 0;
    if (count >= 10) {
      return { allowed: false, retryAfter: 60 - (now % 60) };
    }
    await this.ctx.storage.put(key, count + 1);
    // Non-blocking cleanup of the previous window
    const prevKey = `rl_win_${windowStart - 1}`;
    this.ctx.storage.delete(prevKey).catch(() => {});
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
    if (!prompt || prompt.trim().length < 5) {
      return Response.json({
        success: false,
        error: "Vision too short. Minimum 5 characters required to crystallize."
      }, { status: 400 });
    }
    const rateLimit = await this.checkRateLimit();
    if (!rateLimit.allowed) {
      return Response.json({
        success: false,
        error: `Engine cooling down. Try again in ${rateLimit.retryAfter}s.`,
        retryAfter: rateLimit.retryAfter
      }, { status: 429 });
    }
    const ai = (this.env as any).AI;
    if (!ai) {
      return Response.json({
        success: false,
        error: "Edge AI Configuration Error: Binding missing. Check wrangler.jsonc."
      }, { status: 500 });
    }
    try {
      const promptHash = await this.sha256(prompt + (negative_prompt || ""));
      const cacheKey = `img_cache_${promptHash}`;
      const cachedImage = await this.ctx.storage.get<string>(cacheKey);
      if (cachedImage) {
        return Response.json({ success: true, image: cachedImage, cached: true });
      }
      let lastError;
      // Exponential Backoff starting at 500ms for cold starts
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            const delay = Math.pow(2, attempt) * 500;
            await new Promise(r => setTimeout(r, delay));
          }
          const seed = Math.floor(Math.random() * 2147483647);
          const inputs = {
            prompt,
            negative_prompt: negative_prompt || "blurry, low quality, distorted, watermark, lowres, text, deformed, bad anatomy, disfigured",
            num_steps: 25,
            guidance: 7.5,
            seed
          };
          const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", inputs);
          const binaryData = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(binaryData)));
          await this.ctx.storage.put(cacheKey, base64);
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