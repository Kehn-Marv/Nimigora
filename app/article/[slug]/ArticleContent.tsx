'use client';

import { useState } from 'react';
import { useNimiq } from '@/app/components/NimiqProvider';
import BookmarkButton from '@/app/components/BookmarkButton';
import PaywallModal from '@/app/components/PaywallModal';
import { LockKeyhole } from 'reicon-react';

interface ArticleContentProps {
  body: string[];
  slug: string;
  isExclusive: boolean;
}

export default function ArticleContent({ body, slug, isExclusive }: ArticleContentProps) {
  const { isSubscribed } = useNimiq();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const isLocked = isExclusive && !isSubscribed;
  // Show first 2 paragraphs as preview for locked content
  const previewParagraphs = isLocked ? body.slice(0, 2) : body;

  return (
    <>
      {/* Bookmark bar */}
      <div className="article-bookmark-bar">
        <BookmarkButton slug={slug} size={20} />
        <span className="article-bookmark-label">Save for later</span>
      </div>

      {/* Article Body */}
      <div className={`article-page-body ${isLocked ? 'article-body-locked' : ''}`} id="article-body">
        {previewParagraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {/* Paywall overlay for locked content */}
      {isLocked && (
        <div className="article-paywall-overlay">
          <div className="article-paywall-content">
            <LockKeyhole size={32} />
            <h3>This is an Exclusive Story</h3>
            <p>Subscribe to Nimigora Premium to read the full article.</p>
            <button 
              className="article-paywall-btn"
              onClick={() => setShowPaywall(true)}
            >
              Unlock This Story
            </button>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => setShowPaywall(false)}
      />
    </>
  );
}
