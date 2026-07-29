/**
 * Stage 1: Source Discovery
 *
 * Monitors RSS feeds across all 6 beats, deduplicates,
 * filters by recency, and clusters related stories.
 * Selects the best story candidates for each category.
 */

import { FeedItem, fetchCategoryFeeds, deduplicateItems, filterByRecency } from './rss';
import { batchScrape, ScrapedContent } from './scraper';
import { getSourcesByCategory, getAllCategories } from '@/lib/sources';
import { Category } from '@/lib/types';
import { getExistingSlugs, generateSlug, getExistingSourceUrls } from './utils';
import { llmGenerateJSON } from './llm';

// ============================================
// Types
// ============================================

export interface StoryCandidate {
  category: Category;
  title: string;
  sources: { name: string; url: string; summary: string }[];
  fullTexts: ScrapedContent[];
  feedItems: FeedItem[];
}

export interface DiscoveryResult {
  candidates: StoryCandidate[];
  totalFeedItems: number;
  totalSources: number;
  timestamp: string;
}

// ============================================
// Stage 1 Implementation
// ============================================

/**
 * Run Stage 1: Source Discovery
 *
 * 1. Fetch RSS feeds for all categories
 * 2. Filter by recency (last 24 hours)
 * 3. Deduplicate across sources
 * 4. Group into story clusters by category
 * 5. Select top stories per category
 * 6. Scrape full text from top story URLs
 */
export async function runDiscovery(
  articlesPerCategory: number = 1,
  recencyHours: number = 48
): Promise<DiscoveryResult> {
  console.log('\n🔍 STAGE 1: SOURCE DISCOVERY');
  console.log('═'.repeat(50));

  // Reverted test mode: now processing all categories
  const categories = getAllCategories();
  const existingSlugs = getExistingSlugs();
  const existingUrls = getExistingSourceUrls();
  const allCandidates: StoryCandidate[] = [];
  let totalFeedItems = 0;
  let totalSources = 0;

  for (const category of categories) {
    const sources = getSourcesByCategory(category);
    totalSources += sources.length;

    // 1. Fetch feeds for this category
    const feedItems = await fetchCategoryFeeds(sources);
    totalFeedItems += feedItems.length;

    if (feedItems.length === 0) {
      console.log(`  ⚠ No items found for ${category}, skipping`);
      continue;
    }

    // 2. Filter by recency
    const recent = filterByRecency(feedItems, recencyHours);
    console.log(`  📅 ${category}: ${recent.length}/${feedItems.length} items within ${recencyHours}h window`);

    if (recent.length === 0) continue;

    // 3. Deduplicate
    const unique = deduplicateItems(recent);
    console.log(`  🔄 ${category}: ${unique.length} unique items after dedup`);

    // 4. Filter out already-published stories first
    const fresh = unique.filter(item => {
      if (existingUrls.has(item.link)) return false;
      const candidateSlug = generateSlug(item.title);
      if (existingSlugs.has(candidateSlug)) return false;
      return true;
    });

    if (fresh.length === 0) {
      console.log(`  ⚠ No new stories for ${category} after filtering existing`);
      continue;
    }

    // 5. 🧠 AI-POWERED STORY SELECTION: Let the LLM pick the most engaging stories
    const titlesForAI = fresh.slice(0, 50).map((item, i) => `${i + 1}. ${item.title}`);
    console.log(`  🧠 AI selecting best stories from ${titlesForAI.length} candidates for ${category}...`);

    let selected: FeedItem[] = [];
    try {
      const aiPicks = await llmGenerateJSON<{ picks: number[] }>(
        `You are a ruthlessly selective editorial director for a premium, high-impact international newsroom. Your ONLY job is to select the most thrilling, controversial, or culturally impactful stories.

If a story is boring, YOU DO NOT PICK IT.

Prioritize stories that are:
- CONTROVERSIAL or PROVOCATIVE (scandals, massive backlash, lawsuits, political drama, public feuds)
- SURPRISING or BREATHTAKING (shocking discoveries, wild scientific breakthroughs, unprecedented events)
- CULTURALLY SIGNIFICANT (celebrity controversies, viral explosions, massive cultural shifts)
- GENUINELY IMPORTANT (major geopolitical shifts, humanitarian crises, massive economic impacts)

🚨 IMMEDIATE DISQUALIFICATION - DO NOT EVER PICK THESE:
- Smartphone spec leaks, phone comparisons ("Phone A vs Phone B")
- App updates, beta releases, or "Notification Rules" changes
- Gadget reviews, software patches, or driver updates
- Generic stock picks ("Is XYZ a good stock to buy?")
- Routine corporate earnings reports or press releases
- Anything that sounds like a dry product manual or a PR wire release`,
        `Here are ${titlesForAI.length} story candidates in the ${category} category. Pick the ${Math.min(articlesPerCategory * 3, titlesForAI.length)} most engaging, interesting, and diverse stories. Return ONLY the numbers of stories you want to pick.

${titlesForAI.join('\n')}

Return JSON: { "picks": [1, 5, 8] } (example — use the actual numbers of stories you select)`,
        { temperature: 0.3, maxTokens: 1024 }
      );

      // Map AI picks back to actual feed items
      const pickedIndices = (aiPicks.picks || []).map(n => n - 1).filter(i => i >= 0 && i < fresh.length);
      selected = pickedIndices.length > 0
        ? pickedIndices.map(i => fresh[i])
        : fresh.slice(0, articlesPerCategory * 3); // Fallback to first N if AI returns nothing

      console.log(`  ✓ AI picked: ${selected.map(s => `"${s.title.substring(0, 50)}..."`).join(', ')}`);
    } catch (err) {
      console.log(`  ⚠ AI selection failed, falling back to recency sort`);
      selected = fresh
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, articlesPerCategory * 3);
    }

    if (selected.length === 0) {
      console.log(`  ⚠ No new stories for ${category} after filtering existing`);
      continue;
    }

    // 6. Scrape full text from top stories
    const toScrape = selected.slice(0, articlesPerCategory * 2).map((item) => ({
      url: item.link,
      fallbackText: item.summary,
    }));

    console.log(`  🌐 Scraping ${toScrape.length} URLs for ${category}...`);
    const scraped = await batchScrape(toScrape, 2);

    // Build story candidates by grouping scraped content with feed data
    // Take the best N candidates (those with successful scrapes first)
    const candidatesForCategory: StoryCandidate[] = [];
    const withFullText = selected.slice(0, articlesPerCategory * 2);

    for (let i = 0; i < Math.min(articlesPerCategory, withFullText.length); i++) {
      const primaryItem = withFullText[i];
      const primaryScrape = scraped[i];

      // Find related items (similar titles in the same category)
      const relatedItems = selected.filter(
        (item) =>
          item !== primaryItem &&
          hasTitleOverlap(item.title, primaryItem.title)
      );

      candidatesForCategory.push({
        category,
        title: primaryItem.title,
        sources: [primaryItem, ...relatedItems].map((item) => ({
          name: item.source,
          url: item.link,
          summary: item.summary,
        })),
        fullTexts: primaryScrape ? [primaryScrape] : [],
        feedItems: [primaryItem, ...relatedItems],
      });
    }

    allCandidates.push(...candidatesForCategory);
    console.log(`  ✓ ${category}: ${candidatesForCategory.length} story candidate(s) selected`);
  }

  console.log(`\n📊 Discovery complete: ${allCandidates.length} candidates from ${totalFeedItems} feed items across ${totalSources} sources`);

  return {
    candidates: allCandidates,
    totalFeedItems,
    totalSources,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if two titles share significant word overlap.
 * Used to cluster related stories.
 */
function hasTitleOverlap(a: string, b: string): boolean {
  const wordsA = new Set(
    a.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );
  const wordsB = new Set(
    b.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  // Require at least 30% word overlap
  const minSize = Math.min(wordsA.size, wordsB.size);
  return minSize > 0 && overlap / minSize >= 0.3;
}
