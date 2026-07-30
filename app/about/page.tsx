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
          Nimigora exists to prove that AI can produce journalism worthy of the world's best newsrooms. It operates completely transparently, rigorously, and without the commercial pressures that compromise human editorial judgment.
        </p>
      </section>

      <hr className="divider" />

      <section className="section" id="about-content">
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <div className="article-page-body">
            <p>
              <strong style={{ fontFamily: 'var(--font-display)' }}>Nimigora</strong>{' '}is
              an experiment in AI-native journalism. We believe the strict editorial
              standards associated with the world&apos;s great newsrooms are not inherently
              human capabilities. Careful sourcing, rigorous fact-checking, balanced analysis,
              and transparent methodology are processes. And processes can be automated.
            </p>
            <br />
            <p>
              Our editorial pipeline monitors 40 global RSS feeds across six beats. It extracts structured fact
              sheets from source material, synthesizes original reporting in a dynamic narrative style,
              and subjects every draft to automated quality review before publication. Alongside traditional
              news sources, we use AI-powered story selection to identify the most impactful narratives.
              Premium stories are accessible through Nimiq Pay integration. No human touches the editorial path.
            </p>
            <br />
            <p>
              This is not a gimmick. It is a serious attempt to explore whether AI
              can meet the bar readers expect from trustworthy journalism. We
              publish every article with its complete pipeline record because
              transparency is an absolute requirement when the writer is a machine. Readers
              see the exact sources consulted, the verification steps taken, and the quality scores achieved.
            </p>
            <br />
            <p>
              We cover six beats: Technology, Geopolitics, Climate, Finance, Health,
              and Culture. Each story is selected by algorithms that prioritize significance,
              timeliness, and real reader impact instead of outrage or virality.
            </p>
            <br />
            <p>
              Nimigora is built for readers who take news seriously. We aim to
              be the first AI newsroom that deserves to be taken seriously in return.
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
                  Every factual claim is extracted from source material and scored
                  for confidence. Articles are reviewed for accuracy before
                  publication.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-green"><Search size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Radical Transparency</h3>
                <p className="feature-desc">
                  Every article includes its full editorial pipeline record. Readers
                  can see exactly how each story was produced and verify every claim.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-purple"><Scale size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Zero Bias Tolerance</h3>
                <p className="feature-desc">
                  Automated bias detection catches political lean, framing issues,
                  and source imbalance before publication.
                </p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon feature-icon-yellow"><Setting2 size={24} /></div>
              <div className="feature-text">
                <h3 className="feature-title">Depth Over Speed</h3>
                <p className="feature-desc">
                  We prioritize thorough reporting over being first. Context and
                  analysis matter more than headlines.
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
