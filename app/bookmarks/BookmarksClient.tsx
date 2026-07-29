'use client';

import { useState, useEffect } from 'react';
import { getBookmarks } from '@/lib/bookmarks';
import { Bookmark } from 'reicon-react';
import BookmarkButton from '../components/BookmarkButton';
import Link from 'next/link';

interface BookmarkArticle {
  slug: string;
  headline: string;
  deck: string;
  category: string;
  publishedAt: string;
  readTime: number;
}

interface BookmarksClientProps {
  articleCategories: Record<string, string>;
}

export default function BookmarksClient({ articleCategories }: BookmarksClientProps) {
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [articles, setArticles] = useState<BookmarkArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slugs = getBookmarks();
    setBookmarkedSlugs(slugs);
    setLoading(false);
  }, []);

  // Listen for bookmark changes
  useEffect(() => {
    const handleStorage = () => {
      const slugs = getBookmarks();
      setBookmarkedSlugs(slugs);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '96px 24px' }}>
        <p>Loading bookmarks...</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero" id="bookmarks-hero">
        <div className="hero-badge">
          <span className="badge badge-accent">
            <Bookmark size={16} />
            Your Collection
          </span>
        </div>
        <h1 className="hero-headline">
          Saved{' '}
          <span className="hero-headline-highlight">Stories</span>
        </h1>
        <p className="hero-deck">
          {bookmarkedSlugs.length > 0
            ? `You have ${bookmarkedSlugs.length} saved ${bookmarkedSlugs.length === 1 ? 'story' : 'stories'}. Come back anytime to pick up where you left off.`
            : 'Stories you bookmark will appear here. Start exploring and save the ones you love.'}
        </p>
      </section>

      <hr className="divider" />

      <section className="section" id="bookmarks-list">
        {bookmarkedSlugs.length > 0 ? (
          <div className="bookmarks-grid">
            {bookmarkedSlugs.map((slug) => (
              <div key={slug} className="bookmark-item">
                <Link href={`/article/${slug}`} className="bookmark-item-link">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <span className={`badge badge-${(articleCategories[slug] || 'technology').toLowerCase()}`} style={{ padding: '2px 8px', fontSize: '9px' }}>
                      {articleCategories[slug] || 'STORY'}
                    </span>
                    <h3 className="bookmark-item-title">
                      {slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </h3>
                  </div>
                  <span className="bookmark-item-action">READ</span>
                </Link>
                <BookmarkButton slug={slug} size={16} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bookmarks-empty">
            <Bookmark size={48} style={{ opacity: 0.2 }} />
            <h3>No saved stories yet</h3>
            <p>
              Tap the bookmark icon on any story to save it here. 
              Your bookmarks are stored locally and persist across sessions.
            </p>
            <a href="/latest" className="cta-btn" style={{ marginTop: '24px' }}>
              Explore Stories
            </a>
          </div>
        )}
      </section>
    </>
  );
}
