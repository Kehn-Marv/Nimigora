/**
 * Provider-Agnostic LLM Abstraction
 *
 * Supports multiple providers behind a unified interface.
 * Currently implements: Google Gemini (primary)
 * Designed to be extended with: Groq, Ollama, OpenRouter, etc.
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
  provider: 'gemini' | 'groq' | 'ollama';
  model: string;
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

function loadApiKeys(): string[] {
  const keys: string[] = [];
  // Primary key
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  // Additional keys: GEMINI_API_KEY_2, GEMINI_API_KEY_3, ...
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

let apiKeys: string[] = [];
let currentKeyIndex = 0;
let exhaustedKeys = new Set<number>();

function getNextApiKey(): string | null {
  if (apiKeys.length === 0) {
    apiKeys = loadApiKeys();
    if (apiKeys.length === 0) return null;
    console.log(`  [LLM] Loaded ${apiKeys.length} API key(s)`);
  }

  // If current key is exhausted, find the next available one
  if (exhaustedKeys.has(currentKeyIndex)) {
    for (let i = 0; i < apiKeys.length; i++) {
      if (!exhaustedKeys.has(i)) {
        currentKeyIndex = i;
        console.log(`  [LLM] 🔄 Rotated to API key #${i + 1}`);
        return apiKeys[i];
      }
    }
    return null; // All keys exhausted
  }

  return apiKeys[currentKeyIndex];
}

function markKeyExhausted(keyIndex: number): void {
  exhaustedKeys.add(keyIndex);
  console.log(`  [LLM] ⚠ API key #${keyIndex + 1} quota exhausted (${exhaustedKeys.size}/${apiKeys.length} keys used up)`);
}

// ============================================
// Gemini Provider
// ============================================

/** Helper to handle rate limits and 500s with retries + key rotation */
async function withRetry<T>(operation: (apiKey: string) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getNextApiKey();
    if (!apiKey) {
      throw new Error('🚨 ALL API keys exhausted. No remaining quota. Pipeline cannot continue.');
    }

    try {
      // Base wait to respect the 15 RPM free tier API limits
      await delay(10000);
      return await operation(apiKey);
    } catch (err: any) {
      lastError = err;
      const msg = err.message?.toLowerCase() || '';

      // KEY IS DEAD (quota burned, expired, invalid, or revoked) — rotate to next key
      const isDeadKey =
        msg.includes('quota') || msg.includes('exceeded') ||
        msg.includes('api_key_invalid') || msg.includes('expired') ||
        msg.includes('api key not valid') || msg.includes('revoked');

      if (isDeadKey) {
        markKeyExhausted(currentKeyIndex);
        
        // Try to rotate to a fresh key
        const nextKey = getNextApiKey();
        if (nextKey) {
          console.log(`  [LLM] Retrying with next API key...`);
          attempt--; // Don't count this as a retry attempt
          continue;
        } else {
          console.error(`\n  🚨 FATAL: ALL ${apiKeys.length} API key(s) exhausted or invalid. No usable keys remain.`);
          throw err;
        }
      }

      // Also catch 5xx errors or 429 rate limit (per-minute, not daily)
      if (msg.includes('429') || msg.includes('too many requests') || msg.includes('retry') || msg.includes('50')) {
        const backoff = Math.pow(2, attempt) * 15000; // 15s, 30s, 60s
        console.log(`\n  ⏳ Rate limit or server error. Retrying in ${backoff / 1000}s (Attempt ${attempt + 1}/${maxRetries})...`);
        await delay(backoff);
      } else {
        throw err; // Stop retrying for non-transient errors
      }
    }
  }
  throw lastError;
}

class GeminiProvider implements LLMProvider {
  async generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse> {
    return withRetry(async (apiKey: string) => {
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
    return withRetry(async (apiKey: string) => {
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
        
        // Use markdown matched block if present, otherwise raw text
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }

        try {
          // Attempt robust JSON repair to salvage truncated or slightly malformed outputs
          const repaired = jsonrepair(jsonStr);
          const parsed = JSON.parse(repaired) as T;
          console.log(`  [LLM] Extracted and repaired broken JSON (FinishReason: ${finishReason})`);
          return parsed;
        } catch (repairError) {
          throw new Error(`Failed to parse JSON. Reason: ${finishReason}. Error: ${e.message}. Prefix: ${text.substring(0, 200)}`);
        }
      }
    }); // Close withRetry callback and function call
  } // Close generateJSON method
} // Close GeminiProvider class

// ============================================
// Groq Provider (Stub for future use)
// ============================================

class GroqProvider implements LLMProvider {
  async generate(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is required');

    // Groq uses OpenAI-compatible API
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
  }

  async generateJSON<T>(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<T> {
    const enrichedPrompt = `${userPrompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown, no explanation.`;
    const response = await this.generate(systemPrompt, enrichedPrompt, config);
    try {
      return JSON.parse(response.text) as T;
    } catch {
      let jsonStr = response.text;
      const jsonMatch = response.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      try {
        const repaired = jsonrepair(jsonStr);
        return JSON.parse(repaired) as T;
      } catch (repairError) {
        throw new Error(`Failed to parse Groq JSON response: ${response.text.substring(0, 200)}`);
      }
    }
  }
}

// ============================================
// LLM Factory
// ============================================

const providers: Record<string, LLMProvider> = {
  gemini: new GeminiProvider(),
  groq: new GroqProvider(),
};

export function getDefaultConfig(): LLMConfig {
  return {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8192,
  };
}

export async function llmGenerate(
  systemPrompt: string,
  userPrompt: string,
  configOverrides?: Partial<LLMConfig>
): Promise<LLMResponse> {
  const config = { ...getDefaultConfig(), ...configOverrides };
  const provider = providers[config.provider];
  if (!provider) throw new Error(`Unknown LLM provider: ${config.provider}`);
  return provider.generate(systemPrompt, userPrompt, config);
}

export async function llmGenerateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  configOverrides?: Partial<LLMConfig>
): Promise<T> {
  const config = { ...getDefaultConfig(), ...configOverrides };
  const provider = providers[config.provider];
  if (!provider) throw new Error(`Unknown LLM provider: ${config.provider}`);
  return provider.generateJSON<T>(systemPrompt, userPrompt, config);
}
