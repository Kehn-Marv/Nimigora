'use client';

import { useState, useMemo } from 'react';
import { Article } from '@/lib/types';
import { ArticleCard } from './ArticleCards';
import { Search, Sort } from 'reicon-react';

interface ArchiveFilterProps {
  articles: Article[];
}

const CATEGORIES = [
  'ALL',
  'TECHNOLOGY',
  'GEOPOLITICS',
  'CLIMATE',
  'FINANCE',
  'HEALTH',
  'CULTURE',
];

const ITEMS_PER_PAGE = 12;

export default function ArchiveFilter({ articles }: ArchiveFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filter + search + sort
  const filteredArticles = useMemo(() => {
    let result = articles;

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Keyword search (headline + deck)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.headline.toLowerCase().includes(query) ||
          a.deck.toLowerCase().includes(query)
      );
    }

    // Date sort
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [articles, selectedCategory, searchQuery, sortOrder]);

  // Slice articles for pagination
  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  return (
    <div className="archive-filter-wrapper">
      {/* ── Search Bar ─────────────────── */}
      <div className="archive-search-bar">
        <div className="archive-search-input-wrapper">
          <Search size={16} className="archive-search-icon" />
          <input
            type="text"
            className="archive-search-input"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          />
        </div>
        <button className="archive-sort-btn" onClick={toggleSort} title={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}>
          <Sort size={14} />
          {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* ── Category Tabs ──────────────── */}
      <div className="filter-bar">
        <ul className="filter-tabs">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <button
                className={`filter-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Results Count ──────────────── */}
      <div className="archive-results-count">
        {filteredArticles.length} {filteredArticles.length === 1 ? 'story' : 'stories'} found
        {searchQuery && <span> for &ldquo;{searchQuery}&rdquo;</span>}
        {selectedCategory !== 'ALL' && <span> in {selectedCategory}</span>}
      </div>

      {/* ── Article Grid ───────────────── */}
      <div className="article-grid">
        {visibleArticles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '6rem 0', fontFamily: 'var(--font-body)', color: 'var(--color-dark-gray)' }}>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>No stories found</p>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            {searchQuery ? 'Try a different search term.' : 'The archive is currently empty for this category.'}
          </p>
        </div>
      )}

      {hasMore && (
        <div className="load-more-container" style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '4rem' }}>
          <button className="view-all-btn" onClick={handleLoadMore}>
            Load More Stories
          </button>
        </div>
      )}
    </div>
  );
}
