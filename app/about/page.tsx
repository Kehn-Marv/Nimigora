import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Nimigora',
  description:
    'Nimigora is an AI-native newsroom that produces real journalism through an autonomous editorial pipeline, powered by Nimiq Pay for premium content access.',
};

import { DocumentText, Target, Search, Scale, Setting2 } from 'reicon-react';

export default function AboutPage() {
  return (
    <>
      <section className="hero-subpage" id="about-hero">
        <div className="hero-badge">
          <span className="badge badge-accent"><DocumentText size={16} /> Our Mission</span>
        </div>
        <h1 className="hero-headline">
          News That Earns{' '}
          <span className="hero-headline-highlight">Your Trust</span>
        </h1>
        <p className="hero-deck">
          Proving AI can deliver world-class journalism. 100% transparent, rigorously fact-checked, and free from commercial pressure.
        </p>
      </section>

      <hr className="divider" />

      <section className="section" id="about-content">
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <div className="article-page-body">
            <p>
              <strong style={{ fontFamily: 'var(--font-display)' }}>Nimigora</strong>{' '}is an AI-native newsroom. We believe strict editorial standards like careful sourcing, fact-checking, and balanced analysis are processes that can be automated.
            </p>
            <br />
            <p>
              Our autonomous pipeline monitors global feeds, extracts facts, and synthesizes original reporting. Every draft undergoes rigorous automated review before publication. Premium stories are unlocked seamlessly via Nimiq Pay. No human touches the editorial path.
            </p>
            <br />
            <p>
              Transparency is our core requirement. We publish every article with its complete pipeline record, allowing readers to verify sources, methodology, and quality scores.
            </p>
            <br />
            <p>
              Nimigora is built for readers who take news seriously. We aim to be the first AI newsroom that deserves to be taken seriously in return.
            </p>
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="section section-full section-gray" id="principles">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="section-header">
            <h2 className="section-title">Our Principles</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue"><Target size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Accuracy First</h3>
                <p className="feature-desc">
                  Claims are extracted from source material, scored for confidence, and reviewed before publication.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-green"><Search size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Radical Transparency</h3>
                <p className="feature-desc">
                  Every article includes its full editorial pipeline record. Readers can verify every single claim.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-purple"><Scale size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Zero Bias Tolerance</h3>
                <p className="feature-desc">
                  Automated bias detection catches political lean, framing issues, and source imbalance.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-yellow"><Setting2 size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Depth Over Speed</h3>
                <p className="feature-desc">
                  We prioritize thorough reporting over being first. Context and analysis matter most.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="cta-section" id="about-cta">
        <h2 className="cta-title">Ready to Read?</h2>
        <p className="cta-desc">
          See AI journalism that meets the bar of the world&apos;s best newsrooms.
        </p>
        <a href="/latest" className="cta-btn">
          Start Reading
        </a>
      </section>
    </>
  );
}
