import React, { useState } from 'react';
import { Link } from 'wouter';
import { Menu } from 'lucide-react';
import Logo from './ui/logo';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { label: 'Início', href: '#', active: false },
    { label: 'Nossa História', href: '#', active: false },
    { label: 'Clube Toca', href: '#', active: false },
    { label: 'Segurança', href: '#', active: false },
    { label: 'Eventos', href: '#', active: false },
    { label: 'Dicas', href: '#', active: false },
    { label: 'Aves da Toca', href: '/', active: true },
    { label: 'Contato', href: '#', active: false },
  ];

  return (
    <header className="sticky top-0 bg-white shadow-sm z-10" role="banner">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="flex items-center" aria-label="Ir para a página inicial Aves da Toca">
          <Logo />
        </Link>

        <nav className="hidden md:flex space-x-6 text-sm font-montserrat" role="navigation" aria-label="Navegação principal">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className={`transition-colors uppercase ${
                link.active
                  ? "text-[#4CAF50] hover:text-[#388E3C] font-semibold"
                  : "text-[#333333] hover:text-[#4CAF50]"
              }`}
              aria-current={link.active ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden text-[#333333]"
          onClick={toggleMobileMenu}
          aria-label="Abrir menu de navegação"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md px-4 py-2">
          <nav id="mobile-navigation" className="flex flex-col space-y-3 font-montserrat text-sm" role="navigation" aria-label="Navegação móvel">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className={`py-2 transition-colors uppercase ${
                  link.active
                    ? "text-[#4CAF50] hover:text-[#388E3C] font-semibold"
                    : "text-[#333333] hover:text-[#4CAF50]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={link.active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
