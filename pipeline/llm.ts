/**
 * Provider-Agnostic LLM Abstraction
 *
 * Supports multiple providers behind a unified interface with automatic fallback.
 * Implements: Groq, Google Gemini, Cerebras, Mistral.
 */

import { GoogleGenerativeAI, GenerateContentResult, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Types
// ============================================

export interface LLMMessage {
  role: 'user' | 'model';
  content: string;
}

export interface LLMConfig {
  provider: 'gemini' | 'groq' | 'cerebras' | 'mistral' | 'qwen';
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

  isDead(): boolean {
    return this.apiKeys.length > 0 && this.exhaustedKeys.size >= this.apiKeys.length;
  }

  markKeyExhausted() {
    this.exhaustedKeys.add(this.currentKeyIndex);
    console.log(`  [LLM] ⚠ ${this.envPrefix} key #${this.currentKeyIndex + 1} exhausted (${this.exhaustedKeys.size}/${this.apiKeys.length})`);
  }
}

async function withRetry<T>(keyManager: KeyManager, providerName: string, operation: (apiKey: string) => Promise<T>, maxRetries = 3): Promise<T> {
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
        console.log(`  [LLM] ⏳ [${providerName}] Rate limit. Retrying in ${backoff / 1000}s (Attempt ${attempt + 1}/${maxRetries})...`);
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
    return withRetry(this.keyManager, 'gemini', async (apiKey: string) => {
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
    return withRetry(this.keyManager, 'gemini', async (apiKey: string) => {
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
    return withRetry(this.keyManager, 'groq', async (apiKey: string) => {
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
    return withRetry(this.keyManager, 'cerebras', async (apiKey: string) => {
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
    return withRetry(this.keyManager, 'mistral', async (apiKey: string) => {
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

class QwenProvider implements LLMProvider {
  private keyManager = new KeyManager('QWEN_API_KEY');

  async generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse> {
    return withRetry(this.keyManager, 'qwen', async (apiKey: string) => {
      const response = await fetch(`${config.baseUrl || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'qwen-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 8192,
        }),
      });

      if (!response.ok) throw new Error(`Qwen API Error ${response.status}: ${await response.text()}`);

      const data = await response.json() as {
        choices: { message: { content: string } }[];
        usage?: { total_tokens: number };
      };

      return {
        text: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        provider: 'qwen',
        model: config.model || 'qwen-flash',
      };
    });
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<T> {
    const enrichedPrompt = `${userPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown formatting, no explanation.`;
    const response = await this.generate(systemPrompt, enrichedPrompt, config);
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
  qwen: new QwenProvider(),
};

export function getDefaultConfig(): LLMConfig {
  return {
    provider: 'groq',
    temperature: 0.7,
    maxTokens: 8192,
  };
}

const PROVIDER_FALLBACK_ORDER: LLMConfig['provider'][] = ['groq', 'gemini', 'cerebras', 'mistral', 'qwen'];

// ============================================
// State Management for Fallback Rotation
// ============================================

const STATE_FILE = path.join(process.cwd(), '.llm-state.json');
const HEAL_TIME_MS = 12 * 60 * 60 * 1000; // 12 hours

let currentProviderIndex = 0;

// Load initial state on module import
try {
  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    if (Date.now() - state.lastUpdated < HEAL_TIME_MS) {
      currentProviderIndex = state.currentProviderIndex || 0;
      if (currentProviderIndex >= PROVIDER_FALLBACK_ORDER.length) {
        currentProviderIndex = 0;
      }
    }
  }
} catch (e) {
  // Ignore state load errors
}

function advanceProviderState(failedProviderName: string) {
  const failedIndex = PROVIDER_FALLBACK_ORDER.indexOf(failedProviderName as any);
  if (failedIndex === -1) return;
  
  // Only advance if this is actually the provider we are currently on
  // (Prevents skipping multiple steps if async requests fail simultaneously)
  if (failedIndex === currentProviderIndex) {
    currentProviderIndex = (currentProviderIndex + 1) % PROVIDER_FALLBACK_ORDER.length;
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify({
        currentProviderIndex,
        lastUpdated: Date.now()
      }));
    } catch (e) {
      // Ignore write errors
    }
  }
}

export async function llmGenerate(
  systemPrompt: string,
  userPrompt: string,
  configOverrides?: Partial<LLMConfig>
): Promise<LLMResponse> {
  let lastError;
  const isSpecificProviderRequested = !!configOverrides?.provider;

  const order = isSpecificProviderRequested
    ? [configOverrides.provider!]
    : [
        ...PROVIDER_FALLBACK_ORDER.slice(currentProviderIndex),
        ...PROVIDER_FALLBACK_ORDER.slice(0, currentProviderIndex)
      ];

  for (const providerName of order) {
    const config = { ...getDefaultConfig(), provider: providerName, ...configOverrides };
    const provider = providers[providerName as string];
    
    try {
      return await provider.generate(systemPrompt, userPrompt, config);
    } catch (err: any) {
      lastError = err;
      if (isSpecificProviderRequested) throw err;
      console.log(`  [LLM] ❌ Provider ${providerName} failed. Falling back to next... (${err.message})`);
      advanceProviderState(providerName);
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

  const order = isSpecificProviderRequested
    ? [configOverrides.provider!]
    : [
        ...PROVIDER_FALLBACK_ORDER.slice(currentProviderIndex),
        ...PROVIDER_FALLBACK_ORDER.slice(0, currentProviderIndex)
      ];

  for (const providerName of order) {
    const config = { ...getDefaultConfig(), provider: providerName, ...configOverrides };
    const provider = providers[providerName as string];
    
    try {
      return await provider.generateJSON<T>(systemPrompt, userPrompt, config);
    } catch (err: any) {
      lastError = err;
      if (isSpecificProviderRequested) throw err;
      console.log(`  [LLM] ❌ Provider ${providerName} failed during JSON generation. Falling back to next... (${err.message})`);
      advanceProviderState(providerName);
    }
  }
  throw new Error(`All fallback providers failed. Last error: ${lastError?.message}`);
}
