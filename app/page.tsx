import { getLatestArticles, getFeaturedArticle } from '@/lib/articles';
import { CATEGORY_META, Category } from '@/lib/types';
import { FeaturedArticle, ArticleCard } from './components/ArticleCards';
import { DocumentText, Search, ClipboardList, PenTool, CheckCircle, Flash, Globe as GlobeIcon, Leaf, ChartLine, Activity, Sparkles } from 'reicon-react';
import DynamicDotMatrix from './components/DynamicDotMatrix';

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  TECHNOLOGY: <Flash size={24} />,
  GEOPOLITICS: <GlobeIcon size={24} />,
  CLIMATE: <Leaf size={24} />,
  FINANCE: <ChartLine size={24} />,
  HEALTH: <Activity size={24} />,
  CULTURE: <Sparkles size={24} />,
};

export const revalidate = 3600; // Force Next.js to drop the cache and re-render the homepage every hour

export default function Home() {
  const featured = getFeaturedArticle();
  const latest = getLatestArticles();
  const nonFeatured = latest.filter((a) => a.slug !== featured?.slug);

  const categories = Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][];

  return (
    <>
      {/* ====== HERO ====== */}
      <div className="hero-wrapper" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#000000' }}>
        <div className="hero-background" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <DynamicDotMatrix 
            bgColor="#000000"
            colors={["#FFFFFF", "#E07000", "#000000"]}
            speed={6}
            frequency={1}
            cellSize={20}
            gamma={4}
            paletteBias={10}
            useGlyphAtlas={false}
          />
        </div>
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }} />
        <section className="hero hero-dark" id="hero" style={{ position: 'relative', zIndex: 1, maxWidth: '1600px', paddingLeft: '4vw', paddingRight: '4vw' }}>
          <div className="hero-content">
          <h1 className="hero-headline" style={{ display: 'flex', flexDirection: 'column', gap: '0.1em' }}>
            <span className="stagger-1">REAL <span className="serif-italic">Journalism,</span></span>
            <span className="stagger-2"><span className="hero-headline-highlight">ZERO HUMANS</span></span>
            <span className="stagger-3">IN THE</span>
            <span className="stagger-4">NEWSROOM.</span>
          </h1>
          <p className="hero-deck stagger-content" style={{ marginTop: '1.5rem', maxWidth: '600px' }}>
            Researched, written, and fact-checked entirely by AI. The depth of a premium newsroom, with zero human intervention.
          </p>
          <div className="stagger-content" style={{ marginTop: '2.5rem' }}>
            <a href="#latest" className="hero-cta">
              Read Latest Stories
            </a>
          </div>
        </div>
        <div className="hero-visual" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-visual-badge">ISSUE<br />#01</div>
          <div className="hero-visual-text">NM<br />GA</div>
          <div className="hero-visual-sub">The AI-Native Newsroom</div>
        </div>
      </section>
      </div>

      <hr className="divider" />

      {/* ====== FEATURED ====== */}
      <section className="section" id="featured">
        <div className="section-header">
          <h2 className="section-title">Featured Story</h2>
          <p className="section-subtitle">
            Our lead story, selected by editorial-weight algorithm from today&apos;s reporting.
          </p>
        </div>
        {featured && <FeaturedArticle article={featured} />}
      </section>


      {/* ====== HOW IT WORKS ====== */}
      <section className="section section-full section-gray" id="how-it-works">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Four automated stages take a story from discovery to publication, paired with
              complete transparency at every step.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card animate-in animate-delay-1">
              <div className="feature-icon feature-icon-blue"><Search size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Source Discovery</h3>
                <p className="feature-desc">
                  Monitors 50+ feeds. AI identifies the most impactful narratives, filtering and deduplicating daily.
                </p>
              </div>
            </div>
            <div className="feature-card animate-in animate-delay-2">
              <div className="feature-icon feature-icon-green"><ClipboardList size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Fact Extraction</h3>
                <p className="feature-desc">
                  Grok AI extracts structured claims, quotes, and statistics, tagged with full source attribution.
                </p>
              </div>
            </div>
            <div className="feature-card animate-in animate-delay-3">
              <div className="feature-icon feature-icon-purple"><PenTool size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Editorial Synthesis</h3>
                <p className="feature-desc">
                  Our engine weaves verified facts into engaging, narrative-driven features without any filler.
                </p>
              </div>
            </div>
            <div className="feature-card animate-in animate-delay-4">
              <div className="feature-icon feature-icon-pink"><CheckCircle size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Quality Review</h3>
                <p className="feature-desc">
                  Automated scoring for bias and factual accuracy. Failed drafts are permanently rejected.
                </p>
              </div>
            </div>
          </div>

          <div className="view-all-cta">
            <a href="/pipeline" className="view-all-btn">
              View Full Pipeline
            </a>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ====== LATEST STORIES ====== */}
      <section className="section" id="latest">
        <div className="section-header">
          <h2 className="section-title">Latest Stories</h2>
          <p className="section-subtitle">
            The latest reporting from our AI editorial pipeline. Every story includes
            full source attribution and pipeline transparency.
          </p>
        </div>

        <div className="article-grid">
          {nonFeatured.slice(0, 6).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>

        <div className="view-all-cta" style={{ marginTop: '3rem' }}>
          <a href="/latest" className="view-all-btn">
            View All Stories
          </a>
        </div>
      </section>

      <hr className="divider" />

      {/* ====== CATEGORIES ====== */}
      <section className="section" id="categories">
        <div className="section-header">
          <h2 className="section-title">Coverage Areas</h2>
          <p className="section-subtitle">
            Six beats with {latest.length} stories across global affairs, science,
            technology, and culture.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map(([key, meta]) => {
            const count = latest.filter((a) => a.category === key).length;
            const categoryArticles = latest.filter((a) => a.category === key);
            const bgColor = key === 'TECHNOLOGY' ? 'var(--color-tech)' : key === 'GEOPOLITICS' ? 'var(--color-geo)' : key === 'CLIMATE' ? 'var(--color-climate)' : key === 'FINANCE' ? 'var(--color-finance)' : key === 'HEALTH' ? 'var(--color-health)' : 'var(--color-culture)';
            return (
              <div className="category-card" key={key} id={`category-${key.toLowerCase()}`}>
                <div className="category-header">
                  <div className="category-icon" style={{ background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {CATEGORY_ICONS[key]}
                  </div>
                  <h3 className="category-name">{key}</h3>
                </div>
                <p className="category-desc">{meta.description}</p>
                <div className="category-tags">
                  {categoryArticles.slice(0, 3).map((a) => (
                    <a
                      key={a.slug}
                      href={`/article/${a.slug}`}
                      className="category-tag"
                    >
                      {a.headline.split(' ').slice(0, 3).join(' ')}…
                    </a>
                  ))}
                  {count === 0 && (
                    <span className="category-tag" style={{ opacity: 0.5 }}>
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <hr className="divider" />

      {/* ====== CTA ====== */}
      <section className="cta-section" id="cta">
        <h2 className="cta-title">Journalism Without Compromise</h2>
        <p className="cta-desc">
          Every story is fully sourced, fact-checked, and transparent about its AI
          editorial pipeline. Powered by Nimiq.
        </p>
        <a href="/pipeline" className="cta-btn">
          Explore the Pipeline
        </a>
      </section>
    </>
  );
}
