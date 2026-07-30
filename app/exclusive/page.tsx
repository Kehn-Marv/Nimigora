import type { Metadata } from 'next';
import { getExclusiveArticles } from '@/lib/articles';
import ExclusiveCard from '../components/ExclusiveCard';
import { Crown } from 'reicon-react';

export const metadata: Metadata = {
  title: 'Exclusive Stories Nimigora Premium',
  description:
    'The best investigative reporting from each of our six beats handpicked by our editorial algorithm. Accessible to Nimigora Premium members.',
};

export const revalidate = 3600;

export default function ExclusivePage() {
  const exclusive = getExclusiveArticles();

  return (
    <>
      <section className="hero-subpage hero-exclusive" id="exclusive-hero">
        <div className="hero-badge">
          <span className="badge badge-premium">
            <Crown size={16} />
            Members Only
          </span>
        </div>
        <h1 className="hero-headline" style={{ display: 'flex', flexDirection: 'column', gap: '0.1em', alignItems: 'center' }}>
          <span>Exclusive</span>
          <span className="hero-headline-highlight-gold">Stories</span>
        </h1>
        <p className="hero-deck">
          The best of the best from each of our six beats handpicked by our 
          editorial-weight algorithm. Only the highest-scoring stories make it here.
        </p>
      </section>

      <hr className="divider" />

      <section className="section" id="exclusive-stories">
        <div className="section-header">
          <h2 className="section-title">Today&apos;s Premium Selection</h2>
          <p className="section-subtitle">
            {exclusive.length} stories selected from across Technology, Geopolitics, 
            Climate, Finance, Health, and Culture.
          </p>
        </div>

        {exclusive.length > 0 ? (
          <div className="exclusive-grid">
            {exclusive.map((article) => (
              <ExclusiveCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#666' }}>
            <Crown size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 600 }}>No exclusive stories yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Exclusive stories appear once the editorial pipeline has published articles across our six beats.
            </p>
          </div>
        )}
      </section>

      <hr className="divider" />

      <section className="cta-section" id="exclusive-cta">
        <h2 className="cta-title">Premium Journalism, Zero Compromise</h2>
        <p className="cta-desc">
          Subscribe with NIM to unlock the best stories our AI editorial pipeline produces.
          Powered by Nimiq Pay.
        </p>
        <a href="/latest" className="cta-btn">
          Browse All Stories
        </a>
      </section>
    </>
  );
}
