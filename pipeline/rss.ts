/**
 * RSS Feed Fetcher
 *
 * Fetches and normalizes items from RSS/Atom feeds.
 * Handles errors gracefully — a single failed feed never kills the pipeline.
 */

import Parser from 'rss-parser';
import { RSSSource } from '@/lib/sources';
import { Category } from '@/lib/types';

// ============================================
// Types
// ============================================

export interface FeedItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
  source: string;
  category: Category;
}

// ============================================
// RSS Fetcher
// ============================================

const parser = new Parser({
  timeout: 10000, // 10 second timeout per feed
  headers: {
    'User-Agent': 'Nimigora-Pipeline/1.0 (AI Newsroom)',
  },
  maxRedirects: 3,
});

/**
 * Fetch a single RSS feed and normalize its items.
 * Returns empty array on error (never throws).
 */
async function fetchFeed(source: RSSSource): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items: FeedItem[] = (feed.items || [])
      .filter((item) => item.title && item.link)
      .slice(0, 15) // Limit to 15 most recent items per feed
      .map((item) => ({
        title: (item.title || '').trim(),
        link: (item.link || '').trim(),
        summary: (item.contentSnippet || item.content || item.title || '')
          .replace(/<[^>]*>/g, '') // Strip HTML tags
          .substring(0, 500)
          .trim(),
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        source: source.name,
        category: source.category,
      }));

    console.log(`  ✓ ${source.name}: ${items.length} items`);
    return items;
  } catch (error) {
    console.warn(`  ✗ ${source.name}: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Fetch all feeds for a given category.
 * Runs feeds in parallel for speed.
 */
export async function fetchCategoryFeeds(sources: RSSSource[]): Promise<FeedItem[]> {
  const results = await Promise.allSettled(sources.map(fetchFeed));
  const items: FeedItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    }
  }

  return items;
}

/**
 * Fetch all feeds across all categories.
 * Returns items grouped by category for easier downstream processing.
 */
export async function fetchAllFeeds(
  sourcesByCategory: Record<Category, RSSSource[]>
): Promise<Record<Category, FeedItem[]>> {
  const result = {} as Record<Category, FeedItem[]>;

  for (const [category, sources] of Object.entries(sourcesByCategory)) {
    console.log(`\n📡 Fetching ${category} feeds...`);
    result[category as Category] = await fetchCategoryFeeds(sources);
  }

  return result;
}

/**
 * Deduplicate feed items by URL similarity and title similarity.
 * Keeps the item from the higher-reliability source.
 */
export function deduplicateItems(items: FeedItem[]): FeedItem[] {
  const seen = new Map<string, FeedItem>();

  for (const item of items) {
    // Normalize URL for comparison (strip protocol, www, trailing slash, query params)
    const normalizedUrl = item.link
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '')
      .split('?')[0]
      .toLowerCase();

    // Also check title similarity (first 50 chars, lowercased)
    const normalizedTitle = item.title.toLowerCase().substring(0, 50);

    const key = normalizedUrl || normalizedTitle;

    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

/**
 * Filter items to only those published within a given time window.
 */
export function filterByRecency(items: FeedItem[], hoursAgo: number = 24): FeedItem[] {
  const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
  return items.filter((item) => {
    const pubDate = new Date(item.publishedAt).getTime();
    return !isNaN(pubDate) && pubDate >= cutoff;
  });
}
