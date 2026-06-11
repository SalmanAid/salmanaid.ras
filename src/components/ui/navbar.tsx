'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { PublicLandingContent } from '@/schemas/cms.schema';

export const Navbar = ({ config }: { config: PublicLandingContent["navbar"] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;

    const updateActiveSection = () => {
      const scrollPosition = window.scrollY + 96;
      let currentSection = 'home';

      config.items.forEach((item) => {
        const section = document.getElementById(item.sectionId);

        if (section && section.offsetTop <= scrollPosition) {
          currentSection = item.sectionId;
        }
      });

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [config.items, pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-350 mx-auto px-6">
        <div className="flex justify-between items-center h-14.5">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src={config.logoUrl}
                alt={config.logoAlt}
                width={115}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            {config.items.map((item) => (
              <Link
                key={item.id}
                href={`/#${item.sectionId}`}
                className={`text-[12.5px] font-medium transition-colors ${
                  pathname === '/' && activeSection === item.sectionId
                    ? 'text-[#07B0C8] underline underline-offset-8 decoration-2 decoration-[#07B0C8]'
                    : 'text-gray-700 hover:text-[#07B0C8]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-[12.5px] font-medium text-gray-700 transition-colors hover:text-[#07B0C8]"
            >
              {config.loginLabel}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-cyan-500 px-4.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-cyan-600"
            >
              {config.registerLabel}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            {config.items.map((item) => (
              <Link
                key={item.id}
                href={`/#${item.sectionId}`}
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-[13px] font-medium hover:text-cyan-600 ${
                  pathname === '/' && activeSection === item.sectionId
                    ? 'text-[#07B0C8]'
                    : 'text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center text-[13px] text-gray-700 font-medium py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {config.loginLabel}
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center text-[13px] bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {config.registerLabel}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
