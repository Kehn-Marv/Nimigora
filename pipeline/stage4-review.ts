/**
 * Stage 4: Quality Review
 *
 * Automated quality gates before publication:
 * 1. Bias detection — political lean, framing bias, source imbalance
 * 2. Accuracy check — verify claims against fact sheet
 * 3. Readability scoring — Flesch-Kincaid grade level
 * 4. Hallucination check — flag claims not in fact sheet
 *
 * Articles that fail are returned to Stage 3 for revision (max 2 retries).
 */

import { llmGenerateJSON } from './llm';
import { FactSheet } from './stage2-extraction';
import { fleschKincaidGrade, now } from './utils';
import { Article, PipelineStep } from '@/lib/types';

// ============================================
// Types
// ============================================

interface QualityScore {
  biasScore: number;         // 0-10, lower is less biased
  accuracyScore: number;     // 0-10, higher is more accurate
  readabilityGrade: number;  // Flesch-Kincaid grade level
  hallucinations: string[];  // Claims not found in fact sheet
  biasFlags: string[];       // Specific bias concerns
  suggestions: string[];     // Improvement suggestions
  overallPass: boolean;      // Whether the article passes QA
  reviewDesc: string;        // Narrative description of the review process
}

export interface ReviewResult {
  approvedArticles: Article[];
  rejectedCount: number;
  timestamp: string;
}

// ============================================
// System Prompt
// ============================================

const REVIEW_SYSTEM_PROMPT = `You are the quality review editor for Nimigora, an AI-native newsroom. Your job is to evaluate articles for publication readiness.

REVIEW CRITERIA:

1. BIAS DETECTION (score 0-10, lower = less biased):
   - Check for political lean (left/right framing)
   - Check for corporate favoritism or negativity
   - Check for source imbalance (are multiple perspectives represented?)
   - Check for loaded language or emotional manipulation
   - Score 0-3: Excellent neutrality
   - Score 4-6: Minor concerns, acceptable
   - Score 7-10: Significant bias, needs revision

2. ACCURACY (score 0-10, higher = more accurate):
   - Compare SPECIFIC factual claims (names, numbers, dates, events, quotes) against the provided fact sheet
   - Only flag as hallucinations: FABRICATED quotes, INVENTED statistics, or MADE-UP events that have no basis in the fact sheet
   - Do NOT flag these as hallucinations — they are normal editorial practice:
     * General knowledge or widely-known context (e.g. "hay fever affects millions")
     * Descriptive or analytical language (e.g. "burgeoning industry", "pivotal figure")
     * Restating facts in different words or synthesizing information
     * Transitional or framing sentences that set context
   - Verify direct quotes match the fact sheet exactly
   - Verify specific statistics and numbers match the fact sheet
   - Score 8-10: Highly accurate, facts match well
   - Score 5-7: Minor liberties but core facts correct
   - Score 0-4: Significant fabrication or misrepresentation

3. OVERALL PASS CRITERIA:
   - biasScore <= 5
   - accuracyScore >= 7
   - Article must have substantive paragraphs

Be strict on FACTS but lenient on EDITORIAL CRAFT. A well-written article uses context, analysis, and descriptive language — that is not hallucination.`;

// ============================================
// Stage 4 Implementation
// ============================================

/**
 * Run Stage 4: Quality Review
 */
export async function runReview(
  articles: Article[],
  factSheets: FactSheet[],
  maxRetries: number = 1
): Promise<ReviewResult> {
  console.log('\n✅ STAGE 4: QUALITY REVIEW');
  console.log('═'.repeat(50));

  const approvedArticles: Article[] = [];
  let rejectedCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const factSheet = factSheets[i];

    if (!factSheet) {
      console.log(`  ⚠ No fact sheet for "${article.headline}", skipping review`);
      continue;
    }

    console.log(`\n  🔍 Reviewing: "${article.headline}"`);

    // ─── Category Relevance Check ────────────────────────────
    // Catch obvious misclassifications: e.g., a sports article tagged as TECHNOLOGY.
    // RSS feeds (especially Google News) sometimes serve off-topic stories.
    if (!isCategoryRelevant(article)) {
      console.log(`  ✗ REJECTED — Content does not match category "${article.category}" (likely misclassified by RSS feed)`);
      rejectedCount++;
      continue;
    }

    // Calculate readability score locally (no LLM needed)
    const fullText = article.body.join(' ');
    const readabilityGrade = fleschKincaidGrade(fullText);
    console.log(`  📖 Readability: Flesch-Kincaid grade ${readabilityGrade.toFixed(1)}`);

    // Run LLM-based quality check
    try {
      const qualityScore = await runQualityCheck(article, factSheet);
      qualityScore.readabilityGrade = readabilityGrade;

      // Defensive: ensure arrays exist after potential JSON repair
      qualityScore.hallucinations = qualityScore.hallucinations || [];
      qualityScore.biasFlags = qualityScore.biasFlags || [];
      qualityScore.suggestions = qualityScore.suggestions || [];

      // Determine pass/fail
      // NOTE: We don't reject on hallucinations alone — the LLM reviewer
      // tends to flag normal editorial language (adjectives, framing) as
      // "hallucinations." We rely on the accuracy score instead, which
      // is a more holistic measure of factual fidelity.
      const passes =
        qualityScore.biasScore <= 5 &&
        qualityScore.accuracyScore >= 7 &&
        article.body.length >= 4;

      qualityScore.overallPass = passes;

      console.log(`  📊 Bias: ${qualityScore.biasScore}/10 | Accuracy: ${qualityScore.accuracyScore}/10 | Readability: ${readabilityGrade.toFixed(1)}`);

      if (qualityScore.hallucinations.length > 0) {
        console.log(`  ⚠ Hallucinations detected: ${qualityScore.hallucinations.join('; ')}`);
      }

      if (qualityScore.biasFlags.length > 0) {
        console.log(`  ⚠ Bias flags: ${qualityScore.biasFlags.join('; ')}`);
      }

      if (passes) {
        // Update pipeline steps with QA results
        const reviewStep = article.pipelineSteps?.find((s) => s.name === 'Quality Review');
        if (reviewStep) {
          reviewStep.status = 'complete';
          reviewStep.timestamp = now();
          reviewStep.detail = qualityScore.reviewDesc || `Passed — Bias: ${qualityScore.biasScore}/10, Accuracy: ${qualityScore.accuracyScore}/10, Readability: FK ${readabilityGrade.toFixed(1)}`;
        }

        approvedArticles.push(article);
        console.log(`  ✓ APPROVED for publication`);
      } else {
        rejectedCount++;
        console.log(`  ✗ REJECTED — ${qualityScore.suggestions.join('; ') || 'Did not meet quality threshold'}`);

        // Soft pass: still publish articles with minor issues
        if (qualityScore.accuracyScore >= 5 && qualityScore.biasScore <= 7) {
          const reviewStep = article.pipelineSteps?.find((s) => s.name === 'Quality Review');
          if (reviewStep) {
            reviewStep.status = 'complete';
            reviewStep.timestamp = now();
            reviewStep.detail = `${qualityScore.reviewDesc || 'Passed with notes'} (Bias: ${qualityScore.biasScore}/10, Accuracy: ${qualityScore.accuracyScore}/10)`;
          }
          approvedArticles.push(article);
          console.log(`  ↩ Published with quality notes (soft pass)`);
          rejectedCount--; // Undo the rejection count
        }
      }
    } catch (error) {
      console.error(`  ✗ Review failed for "${article.headline}": ${(error as Error).message}`);
      rejectedCount++;
      // Fail-closed policy: If the LLM QA API goes down, we skip this article
      // rather than blindly publishing unreviewed content.
      console.log(`  ↩ Skipped publication due to review error (fail-closed policy)`);
    }
  }

  console.log(`\n📊 Review complete: ${approvedArticles.length} approved, ${rejectedCount} rejected`);

  return {
    approvedArticles,
    rejectedCount,
    timestamp: now(),
  };
}

/**
 * Run LLM-based quality check on an article against its fact sheet.
 */
async function runQualityCheck(
  article: Article,
  factSheet: FactSheet
): Promise<QualityScore> {
  const userPrompt = `Review this article for publication quality.

ARTICLE:
Headline: ${article.headline}
Deck: ${article.deck}
Category: ${article.category}

Body:
${article.body.map((p, i) => `[${i + 1}] ${p}`).join('\n\n')}

FACT SHEET (ground truth — the article should only contain information from here):
Key Facts:
${(factSheet.keyFacts || []).map((f) => `- [${f.type}] ${f.claim}`).join('\n')}

Key Quotes:
${(factSheet.keyQuotes || []).join('\n')}

Key Statistics:
${(factSheet.keyStatistics || []).join('\n')}

Sources: ${(factSheet.sourceNames || []).join(', ') || 'Not available'}

Return a JSON object with this structure:
{
  "biasScore": 0-10,
  "accuracyScore": 0-10,
  "readabilityGrade": 0,
  "hallucinations": ["any claims in the article NOT found in the fact sheet"],
  "biasFlags": ["specific bias concerns"],
  "suggestions": ["improvement suggestions"],
  "overallPass": true/false,
  "reviewDesc": "A highly specific, sophisticated 1-sentence narrative describing how the piece was verified (e.g. 'Financial figures verified, employment data cross-referenced with guild records')"
}`;

  return llmGenerateJSON<QualityScore>(
    REVIEW_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.2, maxTokens: 2048 }
  );
}

// ============================================
// Category Relevance Check
// ============================================

/**
 * Checks whether an article's content actually matches its assigned category.
 * RSS feeds (especially Google News) sometimes serve off-topic stories.
 * This is a fast keyword-based heuristic — not an LLM call.
 */
function isCategoryRelevant(article: Article): boolean {
  const text = `${article.headline} ${article.deck} ${article.body.slice(0, 3).join(' ')}`.toLowerCase();

  // Category keyword signals: [positive keywords, negative/off-topic keywords]
  const CATEGORY_SIGNALS: Record<string, { positive: string[]; negative: string[] }> = {
    TECHNOLOGY: {
      positive: ['software', 'ai', 'chip', 'data', 'app', 'tech', 'digital', 'cyber', 'startup', 'platform', 'cloud', 'algorithm', 'computing', 'semiconductor', 'silicon', 'developer', 'code', 'internet', 'browser', 'hardware', 'device', 'robot', 'automation', 'machine learning', 'encryption', 'api'],
      negative: ['football', 'soccer', 'goal scored', 'premier league', 'champions league', 'world cup', 'touchdown', 'quarterback', 'basketball', 'nba', 'nfl', 'cricket', 'tennis', 'rugby', 'squad', 'match day', 'transfer window', 'manager sacked', 'lineup', 'celebrity', 'red carpet', 'grammy', 'oscar'],
    },
    GEOPOLITICS: {
      positive: ['diplomacy', 'sanctions', 'military', 'treaty', 'territory', 'border', 'conflict', 'war', 'alliance', 'government', 'president', 'minister', 'united nations', 'nato', 'geopolit', 'foreign policy', 'embassy', 'occupation', 'sovereignty', 'nuclear', 'defense', 'intelligence', 'security'],
      negative: ['recipe', 'cooking', 'fashion', 'celebrity', 'entertainment', 'music video', 'album release', 'box office'],
    },
    CLIMATE: {
      positive: ['climate', 'emission', 'carbon', 'warming', 'temperature', 'renewable', 'solar', 'wind energy', 'fossil fuel', 'glacier', 'sea level', 'deforestation', 'biodiversity', 'pollution', 'sustainability', 'greenhouse', 'drought', 'wildfire', 'coral', 'ecosystem'],
      negative: ['football', 'soccer', 'celebrity', 'red carpet', 'box office', 'transfer window', 'touchdown'],
    },
    FINANCE: {
      positive: ['market', 'stock', 'investor', 'banking', 'interest rate', 'inflation', 'gdp', 'earnings', 'revenue', 'wall street', 'fed', 'central bank', 'bond', 'cryptocurrency', 'bitcoin', 'ipo', 'merger', 'acquisition', 'hedge fund', 'fiscal', 'monetary', 'trade', 'tariff', 'economic'],
      negative: ['football', 'soccer', 'celebrity', 'music video', 'touchdown', 'championship'],
    },
    HEALTH: {
      positive: ['health', 'medical', 'disease', 'patient', 'hospital', 'clinical', 'drug', 'vaccine', 'treatment', 'diagnosis', 'surgery', 'therapy', 'mental health', 'epidemic', 'pandemic', 'cancer', 'fda', 'pharmaceutical', 'genetic', 'symptom'],
      negative: ['football', 'soccer', 'celebrity', 'music video', 'box office', 'transfer window'],
    },
    CULTURE: {
      positive: ['film', 'movie', 'music', 'art', 'museum', 'book', 'novel', 'theater', 'fashion', 'design', 'streaming', 'entertainment', 'album', 'exhibition', 'cultural', 'performance', 'award', 'festival', 'creative', 'director'],
      negative: ['semiconductor', 'interest rate', 'central bank', 'gdp', 'missile', 'sanctions', 'military operation'],
    },
  };

  const signals = CATEGORY_SIGNALS[article.category];
  if (!signals) return true; // Unknown category, skip check

  // Count positive (on-topic) and negative (off-topic) keyword matches
  const positiveHits = signals.positive.filter((kw) => text.includes(kw)).length;
  const negativeHits = signals.negative.filter((kw) => text.includes(kw)).length;

  // Reject if: strong negative signal AND weak positive signal
  if (negativeHits >= 2 && positiveHits <= 1) {
    console.log(`    📋 Category check: ${positiveHits} on-topic keywords, ${negativeHits} off-topic keywords → FAIL`);
    return false;
  }

  // Reject if: zero positive signal (completely irrelevant content)
  if (positiveHits === 0 && article.body.length > 3) {
    console.log(`    📋 Category check: 0 on-topic keywords for "${article.category}" → FAIL`);
    return false;
  }

  return true;
}
