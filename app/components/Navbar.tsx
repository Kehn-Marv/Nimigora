'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNimiq } from './NimiqProvider';
import WalletPanel from './WalletPanel';
import { Wallet } from 'reicon-react';

const navLinks = [
  { label: 'HOME', href: '/' },
  { label: 'LATEST', href: '/latest' },
  { label: 'EXCLUSIVE', href: '/exclusive' },
  { label: 'BOOKMARKS', href: '/bookmarks' },
  { label: 'ABOUT', href: '/about' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const { wallet } = useNimiq();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMenuOpen(false);
    
    // If we're already on the home page and the link is an anchor to the home page
    if (pathname === '/' && href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const element = document.getElementById(targetId);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        // Update URL without triggering a full route change
        window.history.pushState(null, '', href);
      }
    }
  };

  return (
    <>
      <nav className="navbar" id="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <span className="navbar-logo-text">NIMIGORA</span>
          </Link>

          <ul className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
                  onClick={(e) => handleNavClick(e, link.href)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            {/* Wallet Button */}
            <button 
              className={`navbar-wallet-btn ${wallet.connected ? 'connected' : ''}`}
              onClick={() => setIsWalletOpen(true)}
              aria-label="Open wallet"
            >
              <Wallet size={18} />
              {wallet.connected && <span className="navbar-wallet-dot" />}
            </button>

            <Link href="/pipeline" className="navbar-cta">
              How It Works
            </Link>
          </div>

          <button 
            className={`navbar-mobile-toggle ${isMenuOpen ? 'open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <WalletPanel isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </>
  );
}
