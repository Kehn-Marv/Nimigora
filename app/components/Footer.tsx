import Image from 'next/image';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <Image src="/logo-v2.png" alt="Nimigora Logo" width={36} height={36} style={{ objectFit: 'contain' }} />
            NIMIGORA
          </div>
          <p className="footer-desc">
            AI-native journalism that meets the editorial standards of premium newsrooms.
            Every article is researched, written, and fact-checked entirely by an autonomous
            pipeline. Powered by Nimiq Pay.
          </p>
          <div className="footer-nimiq-badge">
            Powered by Nimiq
          </div>
        </div>

        <div>
          <h4 className="footer-col-title">Sections</h4>
          <ul className="footer-col-links">
            <li><a href="/latest">Latest Stories</a></li>
            <li><a href="/exclusive">Exclusive</a></li>
            <li><a href="/#featured">Featured</a></li>
            <li><a href="/bookmarks">Bookmarks</a></li>
            <li><a href="/pipeline">The Pipeline</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Topics</h4>
          <ul className="footer-col-links">
            <li><a href="/#categories">Technology</a></li>
            <li><a href="/#categories">Geopolitics</a></li>
            <li><a href="/#categories">Climate</a></li>
            <li><a href="/#categories">Finance</a></li>
            <li><a href="/#categories">Health</a></li>
            <li><a href="/#categories">Culture</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">About</h4>
          <ul className="footer-col-links">
            <li><a href="/about">Our Mission</a></li>
            <li><a href="/pipeline">How It Works</a></li>
            <li><a href="/pipeline#ethics">AI Ethics</a></li>
            <li><a href="/pipeline#ethics">Transparency</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Nimigora. An AI-native newsroom experiment.</span>
        <span>Built with editorial rigor. Powered by Nimiq.</span>
      </div>
    </footer>
  );
}
