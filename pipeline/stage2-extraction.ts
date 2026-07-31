/**
 * Stage 2: Fact Extraction
 *
 * Takes story candidates from Stage 1 and uses LLM to:
 * - Extract discrete factual claims
 * - Identify key quotes, statistics, dates
 * - Cross-reference claims across sources
 * - Build structured fact sheets per story
 */

import { llmGenerateJSON } from './llm';
import { StoryCandidate } from './stage1-discovery';

// ============================================
// Types
// ============================================

export interface ExtractedFact {
  claim: string;
  sourceCount: number;
  sources: string[];
  type: 'statistic' | 'quote' | 'event' | 'analysis' | 'claim';
  confidence: 'high' | 'medium' | 'low';
}

export interface FactSheet {
  storyTitle: string;
  category: string;
  keyFacts: ExtractedFact[];
  keyQuotes: string[];
  keyStatistics: string[];
  contextualBackground: string;
  whyItMatters: string;
  sourceNames: string[];
  sourceUrls?: string[];
  extractionTimestamp: string;
}

export interface ExtractionResult {
  factSheets: FactSheet[];
  totalFacts: number;
  timestamp: string;
}

// ============================================
// System Prompt
// ============================================

const EXTRACTION_SYSTEM_PROMPT = `You are a fact extraction engine for Nimigora, an AI-native newsroom. Your job is to analyze source material and extract verified factual claims into a structured fact sheet.

RULES:
1. Extract ONLY factual claims present in the source material.
2. PRIORITIZE: Rank facts by news value. The most consequential development — what happened, to whom, and with what immediate impact — must be flagged as [LEDE FACT]. This ensures the writer opens with the actual news, not throat-clearing.
3. Classify each claim by type: statistic, quote, event, analysis, or claim.
4. Rate confidence: high (multiple sources), medium (single reliable source), low (unverified).
5. Identify key quotes VERBATIM from the source material.
6. Extract concrete statistics and numbers with units and context.
7. Provide 1-2 sentences of background ONLY if it is essential to understand why the lede fact matters. No fluff.
8. NEVER fabricate or infer facts not present in the sources.
9. If source material is thin, acknowledge it — do not pad with invented details.`;

// ============================================
// Stage 2 Implementation
// ============================================

/**
 * Run Stage 2: Fact Extraction
 *
 * For each story candidate, send source material to LLM
 * and extract a structured fact sheet.
 */
export async function runExtraction(
  candidates: StoryCandidate[]
): Promise<ExtractionResult> {
  console.log('\n📋 STAGE 2: FACT EXTRACTION');
  console.log('═'.repeat(50));

  const factSheets: FactSheet[] = [];
  let totalFacts = 0;

  for (const candidate of candidates) {
    console.log(`\n  📄 Extracting facts for: ${candidate.title}`);

    // Compile source material
    const sourceMaterial = compileSourceMaterial(candidate);

    const userPrompt = `Analyze the following source material about "${candidate.title}" and extract a structured fact sheet.

SOURCE MATERIAL:
${sourceMaterial}

Return a JSON object with this exact structure:
{
  "storyTitle": "concise, descriptive title for this story",
  "category": "${candidate.category}",
  "keyFacts": [
    {
      "claim": "specific factual claim",
      "sourceCount": 1,
      "sources": ["source name"],
      "type": "statistic|quote|event|analysis|claim",
      "confidence": "high|medium|low"
    }
  ],
  "keyQuotes": ["verbatim quotes from sources, with attribution"],
  "keyStatistics": ["specific numbers, percentages, dollar amounts with context"],
  "contextualBackground": "2-3 sentences of relevant background context",
  "whyItMatters": "2-3 sentences explaining why this story is significant",
  "sourceNames": ["list of all source names referenced"]
}

Extract at least 5-10 key facts. Be thorough but only include claims present in the source material.`;

    try {
      const factSheet = await llmGenerateJSON<FactSheet>(
        EXTRACTION_SYSTEM_PROMPT,
        userPrompt,
        { temperature: 0.3, maxTokens: 4096 }
      );

      factSheet.extractionTimestamp = new Date().toISOString();
      factSheet.category = candidate.category; // Strict preservation to avoid LLM category drift
      factSheet.sourceUrls = candidate.sources.map(s => s.url);
      // Defensive: ensure arrays exist after potential JSON repair
      factSheet.keyFacts = factSheet.keyFacts || [];
      factSheet.keyQuotes = factSheet.keyQuotes || [];
      factSheet.keyStatistics = factSheet.keyStatistics || [];
      
      // Defensively ensure 'SOURCES REFERENCED' is never empty by injecting the hardcoded RSS source names
      const candidateSourceNames = candidate.sources.map(s => s.name);
      const llmSourceNames = factSheet.sourceNames || [];
      // Combine and deduplicate to ensure core sources are always present
      factSheet.sourceNames = Array.from(new Set([...candidateSourceNames, ...llmSourceNames]));
      factSheets.push(factSheet);
      totalFacts += factSheet.keyFacts.length;

      console.log(`  ✓ Extracted ${factSheet.keyFacts.length} facts, ${factSheet.keyQuotes.length} quotes, ${factSheet.keyStatistics.length} statistics`);
    } catch (error) {
      console.error(`  ✗ Extraction failed for "${candidate.title}": ${(error as Error).message}`);
    }
  }

  console.log(`\n📊 Extraction complete: ${totalFacts} total facts from ${factSheets.length} stories`);

  return {
    factSheets,
    totalFacts,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compile all source material for a story candidate into a single text block.
 */
function compileSourceMaterial(candidate: StoryCandidate): string {
  const sections: string[] = [];

  // Add scraped full texts
  for (const fullText of candidate.fullTexts) {
    if (fullText.text) {
      sections.push(`--- Source: ${fullText.title || fullText.url} ---\n${fullText.text}`);
    }
  }

  // Add RSS summaries for sources we didn't scrape
  for (const source of candidate.sources) {
    if (source.summary) {
      sections.push(`--- Source: ${source.name} (${source.url}) ---\n${source.summary}`);
    }
  }

  return sections.join('\n\n') || `Title: ${candidate.title}\nCategory: ${candidate.category}\nNo detailed source material available.`;
}
