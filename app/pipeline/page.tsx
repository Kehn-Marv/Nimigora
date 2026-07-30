import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Pipeline How AI Journalism Works | Nimigora',
  description:
    'A complete breakdown of our autonomous editorial pipeline from source discovery to publication, with no human in the editorial path.',
};

import { Search, ClipboardList, PenTool, CheckCircle, Target, Scale, Unlock, DocumentText } from 'reicon-react';

export default function PipelinePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-subpage" id="pipeline-hero">
        <div className="hero-badge">
          <span className="badge badge-accent"><DocumentText size={16} /> Full Transparency</span>
        </div>
        <h1 className="hero-headline">
          The Editorial{' '}
          <span className="hero-headline-highlight">Pipeline</span>
        </h1>
        <p className="hero-deck">
          Our autonomous editorial pipeline. Every story is fully sourced, fact-checked, and built with zero human intervention.
        </p>
      </section>

      <hr className="divider" />

      {/* Pipeline Stages */}
      <section className="section" id="pipeline-stages">
        <div className="section-header">
          <h2 className="section-title">Four Stages</h2>
          <p className="section-subtitle">
            Each stage is fully autonomous, auditable, and transparent. Every article
            includes a pipeline record showing exactly what happened at each step.
          </p>
        </div>

        {/* Stage 1 */}
        <div style={{ marginBottom: '48px' }}>
          <div className="category-card" style={{ cursor: 'default' }}>
            <div className="category-header">
              <div className="category-icon feature-icon-blue" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={24} />
              </div>
              <h3 className="category-name">Stage 1: Source Discovery</h3>
            </div>
            <p className="category-desc" style={{ maxWidth: '800px', fontSize: '16px', lineHeight: '1.7' }}>
              We monitor 50+ global feeds across six beats. AI selects the most impactful stories, filters them by recency, and deduplicates them to ensure every piece covers new ground. Top candidates are scraped for full-text context.
            </p>
            <div className="category-tags" style={{ marginTop: '16px' }}>
              <span className="category-tag">50+ global RSS sources</span>
              <span className="category-tag">6 editorial beats</span>
              <span className="category-tag">Trending intelligence</span>
              <span className="category-tag">Automated deduplication</span>
              <span className="category-tag">Full-text scraping</span>
            </div>
          </div>
        </div>

        {/* Stage 2 */}
        <div style={{ marginBottom: '48px' }}>
          <div className="category-card" style={{ cursor: 'default' }}>
            <div className="category-header">
              <div className="category-icon feature-icon-green" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={24} />
              </div>
              <h3 className="category-name">Stage 2: Fact Extraction</h3>
            </div>
            <p className="category-desc" style={{ maxWidth: '800px', fontSize: '16px', lineHeight: '1.7' }}>
              Grok AI extracts structured fact sheets from the source material. Every claim, quote, and statistic is tagged with a confidence level and source attribution. Fact sheets typically contain 5–15 verified claims.
            </p>
            <div className="category-tags" style={{ marginTop: '16px' }}>
              <span className="category-tag">Structured fact sheets</span>
              <span className="category-tag">5–15 claims per article</span>
              <span className="category-tag">Source attribution</span>
              <span className="category-tag">Confidence scoring</span>
            </div>
          </div>
        </div>

        {/* Stage 3 */}
        <div style={{ marginBottom: '48px' }}>
          <div className="category-card" style={{ cursor: 'default' }}>
            <div className="category-header">
              <div className="category-icon feature-icon-purple" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PenTool size={24} />
              </div>
              <h3 className="category-name">Stage 3: Editorial Synthesis</h3>
            </div>
            <p className="category-desc" style={{ maxWidth: '800px', fontSize: '16px', lineHeight: '1.7' }}>
              The AI engine composes a dynamic, narrative-driven article using the verified fact sheet. It weaves in quotes, historical context, and conversational analysis to explain why the story matters. Articles typically run 8 to 14 paragraphs.
            </p>
            <div className="category-tags" style={{ marginTop: '16px' }}>
              <span className="category-tag">Narrative feature style</span>
              <span className="category-tag">8–14 paragraphs</span>
              <span className="category-tag">Contextual analysis</span>
              <span className="category-tag">No hallucination policy</span>
            </div>
          </div>
        </div>

        {/* Stage 4 */}
        <div style={{ marginBottom: '48px' }}>
          <div className="category-card" style={{ cursor: 'default' }}>
            <div className="category-header">
              <div className="category-icon feature-icon-pink" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} />
              </div>
              <h3 className="category-name">Stage 4: Quality Review</h3>
            </div>
            <p className="category-desc" style={{ maxWidth: '800px', fontSize: '16px', lineHeight: '1.7' }}>
              A separate AI reviewer evaluates every article for bias, factual accuracy, and readability. Only exceptionally high-scoring articles are approved. Any draft with significant accuracy or bias issues is rejected outright.
            </p>
            <div className="category-tags" style={{ marginTop: '16px' }}>
              <span className="category-tag">Bias detection</span>
              <span className="category-tag">Accuracy verification</span>
              <span className="category-tag">Readability scoring</span>
              <span className="category-tag">Fail-closed policy</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Ethics */}
      <section className="section section-full section-cream" id="ethics">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="section-header">
            <h2 className="section-title">Editorial Ethics</h2>
            <p className="section-subtitle">
              AI journalism raises important questions. Here&apos;s how we address them.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue"><Target size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">No Hallucination</h3>
                <p className="feature-desc">
                  Every factual claim traces to a verifiable source. If a fact can&apos;t be
                  verified, it doesn&apos;t appear.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-green"><Scale size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Bias-Aware</h3>
                <p className="feature-desc">
                  Automated bias detection catches political lean, framing bias, and
                  source imbalance before publication.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-purple"><Unlock size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Full Transparency</h3>
                <p className="feature-desc">
                  Every article shows its complete pipeline record sources, steps,
                  timestamps, and verification results.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-yellow"><DocumentText size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Source Attribution</h3>
                <p className="feature-desc">
                  All sources are listed openly. Readers can trace any claim back to
                  its origin independently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* CTA */}
      <section className="cta-section" id="pipeline-cta">
        <h2 className="cta-title">See It in Action</h2>
        <p className="cta-desc">
          Every published article includes its full pipeline record. Pick any
          story and click &quot;AI Editorial Pipeline&quot; to see exactly how it was made.
        </p>
        <a href="/latest" className="cta-btn">
          Read Our Stories
        </a>
      </section>
    </>
  );
}
