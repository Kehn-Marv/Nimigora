/**
 * Pipeline Orchestrator
 *
 * The main entry point for the autonomous editorial pipeline.
 * Runs all 4 stages in sequence, saves approved articles,
 * prunes old content, and logs results.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx npx tsx pipeline/index.ts
 *   or triggered via GitHub Actions cron
 */

import { runDiscovery } from './stage1-discovery';
import { runExtraction } from './stage2-extraction';
import { runSynthesis } from './stage3-synthesis';
import { runReview } from './stage4-review';
import { saveArticle, pruneOldArticles, now, ensureContentDir } from './utils';

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

// ============================================
// Configuration
// ============================================

const CONFIG = {
  /** Number of articles to produce per category per run */
  articlesPerCategory: 2,
  /** How far back to look for news (hours) */
  recencyHours: 48,
  /** How many days to keep articles before pruning */
  retentionDays: 30,
  /** Max retries for quality review */
  maxRetries: 1,
};

// ============================================
// Main Pipeline
// ============================================

async function runPipeline(): Promise<void> {
  const startTime = Date.now();

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     NIMIGORA — Autonomous Editorial Pipeline ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n⏰ Pipeline started at ${now()}`);
  console.log(`📋 Config: ${CONFIG.articlesPerCategory} article(s)/category, ${CONFIG.recencyHours}h recency window`);

  ensureContentDir();

  try {
    // ── Stage 1: Source Discovery ──────────────────────────
    const discoveryResult = await runDiscovery(
      CONFIG.articlesPerCategory,
      CONFIG.recencyHours
    );

    if (discoveryResult.candidates.length === 0) {
      console.log('\n⚠ No story candidates found. Pipeline ending early.');
      console.log('  This can happen if:');
      console.log('  - RSS feeds are temporarily unavailable');
      console.log('  - All recent stories have already been covered');
      console.log('  - Network connectivity issues');
      logSummary(startTime, 0, 0);
      return;
    }

    // ── Stage 2: Fact Extraction ──────────────────────────
    const extractionResult = await runExtraction(discoveryResult.candidates);

    if (extractionResult.factSheets.length === 0) {
      console.log('\n⚠ No fact sheets generated. Pipeline ending early.');
      logSummary(startTime, 0, 0);
      return;
    }

    // ── Stage 3: Editorial Synthesis ──────────────────────
    const synthesisResult = await runSynthesis(
      extractionResult.factSheets,
      discoveryResult.timestamp,
      extractionResult.timestamp
    );

    if (synthesisResult.articles.length === 0) {
      console.log('\n⚠ No articles generated. Pipeline ending early.');
      logSummary(startTime, 0, 0);
      return;
    }

    // ── Stage 4: Quality Review ──────────────────────────
    const reviewResult = await runReview(
      synthesisResult.articles,
      extractionResult.factSheets,
      CONFIG.maxRetries
    );

    // ── Save Approved Articles ───────────────────────────
    console.log('\n💾 SAVING ARTICLES');
    console.log('═'.repeat(50));

    for (const article of reviewResult.approvedArticles) {
      saveArticle(article);
    }

    // ── Prune Old Articles ───────────────────────────────
    console.log('\n🗑 PRUNING OLD CONTENT');
    console.log('═'.repeat(50));

    const prunedCount = pruneOldArticles(CONFIG.retentionDays);
    console.log(`  Pruned ${prunedCount} article(s) older than ${CONFIG.retentionDays} days`);

    // ── Summary ──────────────────────────────────────────
    logSummary(
      startTime,
      reviewResult.approvedArticles.length,
      reviewResult.rejectedCount,
      discoveryResult.totalFeedItems,
      discoveryResult.totalSources,
      extractionResult.totalFacts,
      prunedCount
    );

  } catch (error) {
    console.error('\n❌ PIPELINE ERROR:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

function logSummary(
  startTime: number,
  published: number,
  rejected: number,
  feedItems?: number,
  sources?: number,
  facts?: number,
  pruned?: number
): void {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║                 PIPELINE SUMMARY                 ║');
  console.log('╠══════════════════════════════════════════════════╣');
  if (sources !== undefined)   console.log(`║  📡 Sources monitored:    ${String(sources).padStart(24)} ║`);
  if (feedItems !== undefined) console.log(`║  📰 Feed items processed: ${String(feedItems).padStart(24)} ║`);
  if (facts !== undefined)     console.log(`║  📋 Facts extracted:      ${String(facts).padStart(24)} ║`);
  console.log(`║  ✅ Articles published:   ${String(published).padStart(24)} ║`);
  console.log(`║  ❌ Articles rejected:    ${String(rejected).padStart(24)} ║`);
  if (pruned !== undefined)    console.log(`║  🗑 Articles pruned:      ${String(pruned).padStart(24)} ║`);
  console.log(`║  ⏱ Duration:             ${(duration + 's').padStart(24)} ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n✨ Pipeline completed at ${now()}`);
}

// ── Run ──────────────────────────────────────────────
runPipeline()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Unhandled pipeline error:', err);
    process.exit(1);
  });
