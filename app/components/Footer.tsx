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
      </div>


      <div className="footer-bottom">
        <span>© {year} Nimigora. An AI-native newsroom experiment.</span>
        <span>Built with editorial rigor. Powered by Nimiq.</span>
      </div>
    </footer>
  );
}
