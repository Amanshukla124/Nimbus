import React from 'react';

const footerLinks = [
  { label: 'Privacy Policy',    href: '#' },
  { label: 'Terms of Service',  href: '#' },
  { label: 'Cookie Policy',     href: '#' },
];

export const Footer = () => {
  return (
    <footer className="w-full py-12 px-8 bg-[#07090e]" style={{ borderTop: '1px solid rgba(69,72,79,0.15)' }}>
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        {/* Brand */}
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold font-display bg-gradient-to-r from-[#97a9ff] to-[#b884ff] bg-clip-text text-transparent">
            Nimbus
          </span>
          <p className="font-label text-[#73757d]">
            © 2024 Nimbus Atmospheric Intelligence. All rights reserved.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-8">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-label text-[#73757d] hover:text-[#97a9ff] transition-glide"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Social icons */}
        <div className="flex gap-4">
          {/* Globe / Web */}
          <button className="text-[#73757d] hover:text-[#ecedf6] transition-glide p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
            </svg>
          </button>
          {/* GitHub */}
          <button className="text-[#73757d] hover:text-[#ecedf6] transition-glide p-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};
