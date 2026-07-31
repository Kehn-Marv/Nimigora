/**
 * Provider-Agnostic LLM Abstraction
 *
 * Supports multiple providers behind a unified interface with automatic fallback.
 * Implements: Groq, Google Gemini, Cerebras, Mistral.
 */

import { GoogleGenerativeAI, GenerateContentResult, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';

// ============================================
// Types
// ============================================

export interface LLMMessage {
  role: 'user' | 'model';
  content: string;
}

export interface LLMConfig {
  provider: 'gemini' | 'groq' | 'cerebras' | 'mistral';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  tokensUsed?: number;
  provider: string;
  model: string;
}

// ============================================
// Provider Interface
// ============================================

interface LLMProvider {
  generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse>;
  generateJSON<T>(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<T>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const journalSafetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ============================================
// API Key Pool — rotate keys on quota exhaustion
// ============================================

class KeyManager {
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private exhaustedKeys = new Set<number>();
  public envPrefix: string;

  constructor(envPrefix: string) {
    this.envPrefix = envPrefix;
    this.loadKeys();
  }

  private loadKeys() {
    if (process.env[this.envPrefix]) this.apiKeys.push(process.env[this.envPrefix]!);
    for (let i = 2; i <= 20; i++) {
      const key = process.env[`${this.envPrefix}_${i}`];
      if (key) this.apiKeys.push(key);
    }
    if (this.apiKeys.length > 0) {
      console.log(`  [LLM] Loaded ${this.apiKeys.length} ${this.envPrefix} key(s)`);
    }
  }

  getNextApiKey(): string | null {
    if (this.apiKeys.length === 0) return null;
    
    if (this.exhaustedKeys.has(this.currentKeyIndex)) {
      for (let i = 0; i < this.apiKeys.length; i++) {
        if (!this.exhaustedKeys.has(i)) {
          this.currentKeyIndex = i;
          console.log(`  [LLM] 🔄 Rotated to ${this.envPrefix} key #${i + 1}`);
          return this.apiKeys[i];
        }
      }
      return null;
    }
    return this.apiKeys[this.currentKeyIndex];
  }

  markKeyExhausted() {
    this.exhaustedKeys.add(this.currentKeyIndex);
    console.log(`  [LLM] ⚠ ${this.envPrefix} key #${this.currentKeyIndex + 1} exhausted (${this.exhaustedKeys.size}/${this.apiKeys.length})`);
  }
}

async function withRetry<T>(keyManager: KeyManager, operation: (apiKey: string) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = keyManager.getNextApiKey();
    if (!apiKey) {
      throw new Error(`🚨 ALL ${keyManager.envPrefix} keys exhausted or not configured.`);
    }

    try {
      await delay(2000); // Short base delay
      return await operation(apiKey);
    } catch (err: any) {
      lastError = err;
      const msg = err.message?.toLowerCase() || '';
      
      const isDeadKey = msg.includes('quota') || msg.includes('exceeded') || msg.includes('api_key_invalid') || msg.includes('expired') || msg.includes('api key not valid') || msg.includes('revoked') || msg.includes('unauthorized') || msg.includes('401') || msg.includes('403');
      
      if (isDeadKey) {
        keyManager.markKeyExhausted();
        const nextKey = keyManager.getNextApiKey();
        if (nextKey) {
          console.log(`  [LLM] Retrying with next ${keyManager.envPrefix} key...`);
          attempt--; 
          continue;
        } else {
          throw err; // Allow to bubble up so it can trigger provider fallback
        }
      }
      
      if (msg.includes('429') || msg.includes('too many requests') || msg.includes('retry') || msg.includes('50')) {
        const backoff = Math.pow(2, attempt) * 15000;
        console.log(`\n  ⏳ Rate limit. Retrying in ${backoff / 1000}s (Attempt ${attempt + 1}/${maxRetries})...`);
        await delay(backoff);
      } else {
        throw err; // Bubble up other transient errors
      }
    }
  }
  throw lastError;
}

// ============================================
// Providers
// ============================================

class GeminiProvider implements LLMProvider {
  private keyManager = new KeyManager('GEMINI_API_KEY');

  async generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse> {
    return withRetry(this.keyManager, async (apiKey: string) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: config.model || 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        safetySettings: journalSafetySettings,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 8192,
        },
      });

      const result: GenerateContentResult = await model.generateContent(userPrompt);
      const text = result.response.text();

      return {
        text,
        tokensUsed: result.response.usageMetadata?.totalTokenCount,
        provider: 'gemini',
        model: config.model || 'gemini-2.5-flash',
      };
    });
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<T> {
    return withRetry(this.keyManager, async (apiKey: string) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: config.model || 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
        safetySettings: journalSafetySettings,
        generationConfig: {
          temperature: config.temperature ?? 0.4,
          maxOutputTokens: config.maxTokens ?? 8192,
          responseMimeType: 'application/json',
        },
      });

      const result: GenerateContentResult = await model.generateContent(userPrompt);
      const text = result.response.text();

      try {
        return JSON.parse(text) as T;
      } catch (e: any) {
        const finishReason = result.response.candidates?.[0]?.finishReason || 'UNKNOWN';
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();

        try {
          const repaired = jsonrepair(jsonStr);
          return JSON.parse(repaired) as T;
        } catch (repairError) {
          throw new Error(`Failed to parse JSON. Reason: ${finishReason}. Error: ${e.message}. Prefix: ${text.substring(0, 200)}`);
        }
      }
    });
  }
}

class GroqProvider implements LLMProvider {
  private keyManager = new KeyManager('GROQ_API_KEY');

  async generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse> {
    return withRetry(this.keyManager, async (apiKey: string) => {
      const response = await fetch(`${config.baseUrl || 'https://api.groq.com/openai/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 8192,
        }),
      });

      if (!response.ok) throw new Error(`Groq API Error ${response.status}: ${await response.text()}`);

      const data = await response.json() as {
        choices: { message: { content: string } }[];
        usage?: { total_tokens: number };
      };

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        provider: 'groq',
        model: config.model || 'llama-3.3-70b-versatile',
      };
    });
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<T> {
    const enrichedPrompt = `${userPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown formatting, no explanation.`;
    const response = await this.generate(systemPrompt, enrichedPrompt, config);
    return parseJsonResponse<T>(response.text);
  }
}

class CerebrasProvider implements LLMProvider {
  private keyManager = new KeyManager('CEREBRAS_API_KEY');

  async generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse> {
    return withRetry(this.keyManager, async (apiKey: string) => {
      const response = await fetch(`${config.baseUrl || 'https://api.cerebras.ai/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'llama3.3-70b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: config.temperature ?? 0.7,
          max_completion_tokens: config.maxTokens ?? 8192,
        }),
      });

      if (!response.ok) throw new Error(`Cerebras API Error ${response.status}: ${await response.text()}`);

      const data = await response.json() as {
        choices: { message: { content: string } }[];
        usage?: { total_tokens: number };
      };

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        provider: 'cerebras',
        model: config.model || 'llama3.3-70b',
      };
    });
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<T> {
    const enrichedPrompt = `${userPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown formatting, no explanation.`;
    const response = await this.generate(systemPrompt, enrichedPrompt, config);
    return parseJsonResponse<T>(response.text);
  }
}

class MistralProvider implements LLMProvider {
  private keyManager = new KeyManager('MISTRAL_API_KEY');

  async generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse> {
    return withRetry(this.keyManager, async (apiKey: string) => {
      const response = await fetch(`${config.baseUrl || 'https://api.mistral.ai/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'mistral-small-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 8192,
        }),
      });

      if (!response.ok) throw new Error(`Mistral API Error ${response.status}: ${await response.text()}`);

      const data = await response.json() as {
        choices: { message: { content: string } }[];
        usage?: { total_tokens: number };
      };

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        provider: 'mistral',
        model: config.model || 'mistral-small-latest',
      };
    });
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<T> {
    const enrichedPrompt = `${userPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown formatting, no explanation.`;
    // Mistral actually supports response_format = { type: "json_object" } but we use the common parsing logic for now to be safe with open source APIs.
    const configOverride = { ...config, baseUrl: config.baseUrl };
    const response = await this.generate(systemPrompt, enrichedPrompt, configOverride);
    return parseJsonResponse<T>(response.text);
  }
}

// Utility to parse JSON
function parseJsonResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    try {
      const repaired = jsonrepair(jsonStr);
      return JSON.parse(repaired) as T;
    } catch (repairError) {
      throw new Error(`Failed to parse JSON response: ${text.substring(0, 200)}`);
    }
  }
}

// ============================================
// LLM Factory & Export
// ============================================

const providers: Record<string, LLMProvider> = {
  gemini: new GeminiProvider(),
  groq: new GroqProvider(),
  cerebras: new CerebrasProvider(),
  mistral: new MistralProvider(),
};

export function getDefaultConfig(): LLMConfig {
  return {
    provider: 'groq',
    temperature: 0.7,
    maxTokens: 8192,
  };
}

const PROVIDER_FALLBACK_ORDER: LLMConfig['provider'][] = ['groq', 'gemini', 'cerebras', 'mistral'];

export async function llmGenerate(
  systemPrompt: string,
  userPrompt: string,
  configOverrides?: Partial<LLMConfig>
): Promise<LLMResponse> {
  let lastError;
  const isSpecificProviderRequested = !!configOverrides?.provider;

  for (const providerName of (isSpecificProviderRequested ? [configOverrides.provider!] : PROVIDER_FALLBACK_ORDER)) {
    const config = { ...getDefaultConfig(), provider: providerName, ...configOverrides };
    const provider = providers[providerName];
    
    try {
      return await provider.generate(systemPrompt, userPrompt, config);
    } catch (err: any) {
      lastError = err;
      if (isSpecificProviderRequested) throw err;
      console.log(`  [LLM] ❌ Provider ${providerName} failed. Falling back to next... (${err.message})`);
    }
  }
  throw new Error(`All fallback providers failed. Last error: ${lastError?.message}`);
}

export async function llmGenerateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  configOverrides?: Partial<LLMConfig>
): Promise<T> {
  let lastError;
  const isSpecificProviderRequested = !!configOverrides?.provider;

  for (const providerName of (isSpecificProviderRequested ? [configOverrides.provider!] : PROVIDER_FALLBACK_ORDER)) {
    const config = { ...getDefaultConfig(), provider: providerName, ...configOverrides };
    const provider = providers[providerName];
    
    try {
      return await provider.generateJSON<T>(systemPrompt, userPrompt, config);
    } catch (err: any) {
      lastError = err;
      if (isSpecificProviderRequested) throw err;
      console.log(`  [LLM] ❌ Provider ${providerName} failed during JSON generation. Falling back to next... (${err.message})`);
    }
  }
  throw new Error(`All fallback providers failed. Last error: ${lastError?.message}`);
}
