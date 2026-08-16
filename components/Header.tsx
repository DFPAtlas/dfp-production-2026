'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from '@/components/motion';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerBgLight, setHeaderBgLight] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [clientLoginOpen, setClientLoginOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobilePortfolioOpen, setMobilePortfolioOpen] = useState(false);
  const [mobileClientLoginOpen, setMobileClientLoginOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);
  const lastFocusableRef = useRef<HTMLAnchorElement>(null);
  const servicesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const portfolioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientLoginTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aboutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const clientLoginRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    let ticking = false;

    const detectBgLightness = () => {
      if (!mountedRef.current) return;
      const headerEl = headerRef.current;
      if (!headerEl) return;
      const rect = headerEl.getBoundingClientRect();
      const sampleY = rect.bottom + 8;
      const centerX = window.innerWidth / 2;
      if (sampleY > window.innerHeight) return;

      const stack = document.elementsFromPoint(centerX, sampleY);
      let targetEl: Element | null = null;
      for (const el of stack) {
        if (!headerEl.contains(el)) {
          targetEl = el;
          break;
        }
      }
      if (!targetEl) return;

      let current: Element | null = targetEl;
      let bg = '';
      for (let i = 0; i < 12 && current && current !== document.body; i++) {
        bg = window.getComputedStyle(current).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') break;
        current = current.parentElement;
      }

      if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
        bg = window.getComputedStyle(document.body).backgroundColor;
      }

      const match = bg.match(/[\d.]+/g);
      if (match && match.length >= 3) {
        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (mountedRef.current) {
          setHeaderBgLight(luminance > 0.25);
        }
      }
    };

    const onScroll = () => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(() => {
          if (mountedRef.current) {
            setScrolled(window.scrollY > 40);
            detectBgLightness();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    detectBgLightness();
    return () => {
      mountedRef.current = false;
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (!mobileMenuOpen || e.key !== 'Tab') return;
    const focusableElements = mobileMenuRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements || focusableElements.length === 0) return;
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleFocusTrap);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [handleEscapeKey, handleFocusTrap]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (servicesOpen && servicesRef.current && !servicesRef.current.contains(target)) setServicesOpen(false);
      if (portfolioOpen && portfolioRef.current && !portfolioRef.current.contains(target)) setPortfolioOpen(false);
      if (aboutOpen && aboutRef.current && !aboutRef.current.contains(target)) setAboutOpen(false);
      if (clientLoginOpen && clientLoginRef.current && !clientLoginRef.current.contains(target)) setClientLoginOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setServicesOpen(false);
        setPortfolioOpen(false);
        setAboutOpen(false);
        setClientLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (servicesTimeoutRef.current) { clearTimeout(servicesTimeoutRef.current); servicesTimeoutRef.current = null; }
      if (portfolioTimeoutRef.current) { clearTimeout(portfolioTimeoutRef.current); portfolioTimeoutRef.current = null; }
      if (clientLoginTimeoutRef.current) { clearTimeout(clientLoginTimeoutRef.current); clientLoginTimeoutRef.current = null; }
      if (aboutTimeoutRef.current) { clearTimeout(aboutTimeoutRef.current); aboutTimeoutRef.current = null; }
    };
  }, [servicesOpen, portfolioOpen, aboutOpen, clientLoginOpen]);

  const handleServicesEnter = () => {
    if (servicesTimeoutRef.current) clearTimeout(servicesTimeoutRef.current);
    setServicesOpen(true);
    setPortfolioOpen(false);
    setClientLoginOpen(false);
  };
  const handleServicesLeave = () => {
    servicesTimeoutRef.current = setTimeout(() => { if (mountedRef.current) setServicesOpen(false); }, 200);
  };
  const handlePortfolioEnter = () => {
    if (portfolioTimeoutRef.current) clearTimeout(portfolioTimeoutRef.current);
    setPortfolioOpen(true);
    setServicesOpen(false);
    setClientLoginOpen(false);
  };
  const handlePortfolioLeave = () => {
    portfolioTimeoutRef.current = setTimeout(() => { if (mountedRef.current) setPortfolioOpen(false); }, 200);
  };
  const handleClientLoginEnter = () => {
    if (clientLoginTimeoutRef.current) clearTimeout(clientLoginTimeoutRef.current);
    setClientLoginOpen(true);
    setServicesOpen(false);
    setPortfolioOpen(false);
  };
  const handleClientLoginLeave = () => {
    clientLoginTimeoutRef.current = setTimeout(() => { if (mountedRef.current) setClientLoginOpen(false); }, 200);
  };

  const handleAboutEnter = () => {
    if (aboutTimeoutRef.current) clearTimeout(aboutTimeoutRef.current);
    setAboutOpen(true);
    setServicesOpen(false);
    setPortfolioOpen(false);
    setClientLoginOpen(false);
  };
  const handleAboutLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => { if (mountedRef.current) setAboutOpen(false); }, 200);
  };

  const servicesDropdown = [
    { href: '/services#web-design', label: 'Websites and SaaS', icon: 'ri-code-s-slash-line' },
    { href: '/services#ai', label: 'AI and Automation', icon: 'ri-robot-line' },
    { href: '/services#portals', label: 'Business Portals', icon: 'ri-dashboard-line' },
    { href: '/services#cloud', label: 'Cloud and Infrastructure', icon: 'ri-cloud-line' },
    { href: '/pricing', label: 'Pricing', icon: 'ri-price-tag-3-line' },
    { href: '/services', label: 'View All Services', icon: 'ri-arrow-right-line', divider: true },
  ];

  const portfolioDropdown = [
    { href: '/products', label: 'Digital Footprint Products', icon: 'ri-stack-line' },
    { href: '/demos', label: 'Demo Centre', icon: 'ri-slideshow-line' },
    { href: '/partners', label: 'Partners', icon: 'ri-briefcase-line' },
    { href: '/case-studies', label: 'Case Studies', icon: 'ri-file-list-3-line' },
    { href: '/industries', label: 'Industries', icon: 'ri-building-4-line' },
  ];

  const aboutDropdown = [
    { href: '/about', label: 'About DFP', icon: 'ri-information-line' },
    { href: '/team', label: 'Meet the Team', icon: 'ri-team-line' },
    { href: '/careers', label: 'Careers', icon: 'ri-briefcase-line' },
    { href: '/uat-testing', label: 'UAT TestLab', icon: 'ri-bug-line' },
  ];

  const clientLoginDropdown = [
    { href: '/login', label: 'All Sign-In Areas', icon: 'ri-key-line' },
    { href: '/portal/login', label: 'Client Portal', icon: 'ri-user-line' },
    { href: '/pbx/dashboard', label: 'Cloud PBX', icon: 'ri-phone-line' },
  ];

  const moreDropdown = [
    { href: '/help', label: 'Help Centre', icon: 'ri-question-line' },
    { href: '/uat-testing', label: 'UAT TestLab', icon: 'ri-test-tube-line' },
    { href: '/blog', label: 'Insights', icon: 'ri-article-line' },
  ];

  const transparent = !scrolled;

  const navItemClass = transparent
    ? (headerBgLight
      ? 'text-slate-600 hover:text-[#F97316] hover:bg-orange-50'
      : 'text-white/85 hover:text-[#F97316] hover:bg-white/[0.06]')
    : 'text-[#7DD3FC] hover:text-[#F97316] hover:bg-white/[0.06]';

  const subtleLinkClass = transparent
    ? (headerBgLight
      ? 'text-slate-500 hover:text-[#F97316]'
      : 'text-white/65 hover:text-[#F97316]')
    : 'text-[#67E8F9] hover:text-[#F97316]';

  const logoTextClass = transparent
    ? (headerBgLight ? 'text-slate-800' : 'text-white')
    : 'text-white';

  const mobileToggleClass = transparent
    ? (headerBgLight
      ? 'text-slate-600 hover:text-[#F97316]'
      : 'text-white/70 hover:text-[#F97316]')
    : 'text-[#67E8F9] hover:text-[#F97316]';

  const headerBgClass = scrolled
    ? 'bg-[#0A1628]/94 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/[0.06]'
    : 'bg-transparent';

  const dropdownBg = transparent && headerBgLight
    ? { backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(0,0,0,0.06)' }
    : { backgroundColor: 'rgba(8,20,40,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' };

  const dropdownShadow = transparent && headerBgLight
    ? 'shadow-xl shadow-slate-900/10'
    : 'shadow-xl shadow-black/30';

  const dropdownTextClass = transparent && headerBgLight
    ? 'text-slate-700 hover:text-[#F97316] hover:bg-orange-50'
    : 'text-[#7DD3FC] hover:text-[#F97316] hover:bg-white/[0.08]';

  const dropdownIconClass = transparent && headerBgLight
    ? 'text-slate-500'
    : 'text-[#67E8F9]';

  const dropdownDividerClass = transparent && headerBgLight
    ? 'border-slate-200'
    : 'border-white/[0.08]';

  return (
    <header
      ref={headerRef}
      className={`top-0 left-0 right-0 z-50 transition-all duration-500 fixed ${headerBgClass}`}
      role="banner"
      suppressHydrationWarning={true}
    >
      <nav
        className={`transition-all duration-500 ${
          scrolled ? 'py-2.5' : 'py-4'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="px-6 flex items-center justify-between">
          <Link
            href="/"
            className={`flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2 focus:ring-offset-[#0A1628] rounded-lg transition-all duration-500 ${
              scrolled ? 'scale-90' : 'scale-100'
            }`}
            aria-label="Digital Footprint - Home"
          >
            <img
              src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
              alt="Digital Footprint Logo"
              width={40}
              height={40}
              className={`object-contain rounded-lg transition-all duration-500 ${
                scrolled ? 'w-8 h-8' : 'w-10 h-10'
              }`}
            />
            <span className={`font-bold tracking-tight transition-all duration-500 whitespace-nowrap overflow-hidden -ml-[3px] ${
              scrolled ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px] hidden sm:block'
            } ${
              scrolled ? 'text-base' : 'text-lg'
            } ${logoTextClass}`} suppressHydrationWarning={true}>
              Digital<span className="text-[#06B6D4]"> Footprint</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <div
              ref={servicesRef}
              className="relative"
              onMouseEnter={handleServicesEnter}
              onMouseLeave={handleServicesLeave}
            >
              <button
                onClick={() => { setServicesOpen(!servicesOpen); setPortfolioOpen(false); setClientLoginOpen(false); setAboutOpen(false); }}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                aria-controls="services-dropdown"
                className={`flex items-center gap-1 text-[13px] font-medium transition-all duration-200 cursor-pointer px-3 py-2 rounded-lg whitespace-nowrap justify-center leading-none ${navItemClass}`}
              >
                Services
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    id="services-dropdown"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={handleServicesEnter}
                    onMouseLeave={handleServicesLeave}
                    className={`absolute top-full left-0 mt-2 w-64 rounded-2xl overflow-hidden z-50 ${dropdownShadow}`}
                    style={dropdownBg}
                  >
                    <div className="p-2">
                      {servicesDropdown.map((item) => (
                        <div key={item.label}>
                          {item.divider && <div className={`my-1 border-t ${dropdownDividerClass}`} />}
                          <Link
                            href={item.href}
                            onClick={() => setServicesOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${item.divider ? 'font-semibold' : ''} ${dropdownTextClass}`}
                          >
                            <i className={`${item.icon} text-base w-5 h-5 flex items-center justify-center ${dropdownIconClass}`} />
                            {item.label}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              ref={portfolioRef}
              className="relative"
              onMouseEnter={handlePortfolioEnter}
              onMouseLeave={handlePortfolioLeave}
            >
              <button
                onClick={() => { setPortfolioOpen(!portfolioOpen); setServicesOpen(false); setClientLoginOpen(false); setAboutOpen(false); }}
                aria-expanded={portfolioOpen}
                aria-haspopup="true"
                aria-controls="portfolio-dropdown"
                className={`flex items-center gap-1 text-[13px] font-medium transition-all duration-200 cursor-pointer px-3 py-2 rounded-lg whitespace-nowrap justify-center leading-none ${navItemClass}`}
              >
                Portfolio
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${portfolioOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {portfolioOpen && (
                  <motion.div
                    id="portfolio-dropdown"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={handlePortfolioEnter}
                    onMouseLeave={handlePortfolioLeave}
                    className={`absolute top-full left-0 mt-2 w-56 rounded-2xl overflow-hidden z-50 ${dropdownShadow}`}
                    style={dropdownBg}
                  >
                    <div className="p-2">
                      {portfolioDropdown.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setPortfolioOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${dropdownTextClass}`}
                        >
                          <i className={`${item.icon} text-base w-5 h-5 flex items-center justify-center ${dropdownIconClass}`} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/#how-we-work"
              className={`inline-flex items-center text-[13px] font-medium transition-all duration-200 cursor-pointer px-3 py-2 rounded-lg whitespace-nowrap justify-center leading-none ${navItemClass}`}
            >
              How We Work
            </Link>

            <Link
              href="/who-we-help"
              className={`inline-flex items-center text-[13px] font-medium transition-all duration-200 cursor-pointer px-3 py-2 rounded-lg whitespace-nowrap justify-center leading-none ${navItemClass}`}
            >
              Who We Help
            </Link>

            <div
              ref={aboutRef}
              className="relative"
              onMouseEnter={handleAboutEnter}
              onMouseLeave={handleAboutLeave}
            >
              <button
                onClick={() => { setAboutOpen(!aboutOpen); setServicesOpen(false); setPortfolioOpen(false); setClientLoginOpen(false); }}
                aria-expanded={aboutOpen}
                aria-haspopup="true"
                aria-controls="about-dropdown"
                className={`flex items-center gap-1 text-[13px] font-medium transition-all duration-200 cursor-pointer px-3 py-2 rounded-lg whitespace-nowrap justify-center leading-none ${navItemClass}`}
              >
                About
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {aboutOpen && (
                  <motion.div
                    id="about-dropdown"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={handleAboutEnter}
                    onMouseLeave={handleAboutLeave}
                    className={`absolute top-full left-0 mt-2 w-48 rounded-2xl overflow-hidden z-50 ${dropdownShadow}`}
                    style={dropdownBg}
                  >
                    <div className="p-2">
                      {aboutDropdown.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setAboutOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${dropdownTextClass}`}
                        >
                          <i className={`${item.icon} text-base w-5 h-5 flex items-center justify-center ${dropdownIconClass}`} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              ref={clientLoginRef}
              className="relative"
              onMouseEnter={handleClientLoginEnter}
              onMouseLeave={handleClientLoginLeave}
            >
              <button
                onClick={() => { setClientLoginOpen(!clientLoginOpen); setServicesOpen(false); setPortfolioOpen(false); setAboutOpen(false); }}
                aria-expanded={clientLoginOpen}
                aria-haspopup="true"
                aria-controls="client-login-dropdown"
                className={`flex items-center gap-1 text-[13px] font-medium transition-all duration-200 cursor-pointer px-3 py-2 rounded-lg whitespace-nowrap justify-center leading-none ${subtleLinkClass}`}
              >
                <i className="ri-user-line w-3.5 h-3.5 flex items-center justify-center" />
                Client Login
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${clientLoginOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {clientLoginOpen && (
                  <motion.div
                    id="client-login-dropdown"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={handleClientLoginEnter}
                    onMouseLeave={handleClientLoginLeave}
                    className={`absolute top-full right-0 left-auto mt-2 w-48 rounded-2xl overflow-hidden z-50 ${dropdownShadow}`}
                    style={dropdownBg}
                  >
                    <div className="p-2">
                      {clientLoginDropdown.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setClientLoginOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${dropdownTextClass}`}
                        >
                          <i className={`${item.icon} text-base w-5 h-5 flex items-center justify-center ${dropdownIconClass}`} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/contact"
              title="Discuss a Project"
              className={`group relative rounded-[13px] font-semibold text-[13px] text-white overflow-hidden whitespace-nowrap cursor-pointer transition-all duration-500 bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#F97316]/25 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#050D1C] ${
                scrolled ? 'p-2 w-9 h-9 flex items-center justify-center' : 'px-5 py-2.5'
              }`}
            >
              <span className={`relative z-10 transition-all duration-500 overflow-hidden whitespace-nowrap ${
                scrolled ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]'
              }`}>
                Start Your Project
              </span>
              <span className={`relative z-10 transition-all duration-500 ${
                scrolled ? 'opacity-100 w-4 flex items-center justify-center' : 'opacity-0 w-0'
              }`}
              >
                <i className="ri-chat-3-line w-4 h-4 flex items-center justify-center" />
              </span>
              <span className={`absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#0A1628] border border-white/10 text-[11px] font-medium text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg shadow-black/30 ${
                scrolled ? '' : 'hidden'
              }`}>
                Start Your Project
                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#0A1628]" />
              </span>
              <span className="absolute inset-0 rounded-[13px] bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/contact"
              title="Discuss a Project"
              className={`group relative rounded-lg font-semibold text-xs text-white bg-[#F97316] whitespace-nowrap cursor-pointer transition-all duration-500 overflow-hidden flex items-center justify-center ${
                scrolled ? 'p-2 w-8 h-8' : 'px-4 py-2'
              }`}
            >
              <span className={`transition-all duration-500 overflow-hidden whitespace-nowrap ${
                scrolled ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]'
              }`}>
                Start Your Project
              </span>
              <span className={`transition-all duration-500 flex items-center justify-center ${
                scrolled ? 'opacity-100 w-4' : 'opacity-0 w-0'
              }`}>
                <i className="ri-chat-3-line w-4 h-4 flex items-center justify-center" />
              </span>
            </Link>
            <button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded ${mobileToggleClass}`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 lg:hidden z-40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              ref={mobileMenuRef}
              id="mobile-menu"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm border-l border-white/[0.08] lg:hidden z-50 overflow-y-auto"
              style={{ backgroundColor: 'rgba(5,13,28,0.98)', backdropFilter: 'blur(30px)' }}
              role="dialog"
              aria-label="Mobile navigation menu"
              aria-modal="true"
            >
              <div className="flex justify-end p-4">
                <button
                  onClick={() => { setMobileMenuOpen(false); menuButtonRef.current?.focus(); }}
                  className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded"
                  aria-label="Close menu"
                >
                  <X size={24} aria-hidden="true" />
                </button>
              </div>
              <nav className="flex flex-col p-6 gap-1" role="navigation" aria-label="Mobile navigation">
                <div>
                  <button
                    onClick={() => { setMobileServicesOpen(!mobileServicesOpen); setMobilePortfolioOpen(false); setMobileClientLoginOpen(false); setMobileMoreOpen(false); }}
                    aria-expanded={mobileServicesOpen}
                    aria-controls="mobile-services-submenu"
                    className="w-full flex items-center justify-between text-lg font-medium text-white hover:text-[#F97316] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded px-2 py-3"
                  >
                    <span>Services</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileServicesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileServicesOpen && (
                      <motion.div
                        id="mobile-services-submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 py-1 space-y-0.5">
                          {servicesDropdown.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              ref={item.label === 'Websites and SaaS' ? firstFocusableRef : undefined}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded ${item.divider ? 'font-semibold border-t border-white/[0.08] mt-1 pt-2.5' : ''}`}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <button
                    onClick={() => { setMobilePortfolioOpen(!mobilePortfolioOpen); setMobileServicesOpen(false); setMobileClientLoginOpen(false); setMobileMoreOpen(false); }}
                    aria-expanded={mobilePortfolioOpen}
                    aria-controls="mobile-portfolio-submenu"
                    className="w-full flex items-center justify-between text-lg font-medium text-white hover:text-[#F97316] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded px-2 py-3"
                  >
                    <span>Portfolio</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobilePortfolioOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobilePortfolioOpen && (
                      <motion.div
                        id="mobile-portfolio-submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 py-1 space-y-0.5">
                          {portfolioDropdown.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/#how-we-work"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-white hover:text-[#F97316] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded px-2 py-3"
                >
                  How We Work
                </Link>

                <Link
                  href="/who-we-help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-white hover:text-[#F97316] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded px-2 py-3"
                >
                  Who We Help
                </Link>

                <div>
                  <button
                    onClick={() => { setMobileAboutOpen(!mobileAboutOpen); setMobileServicesOpen(false); setMobilePortfolioOpen(false); setMobileClientLoginOpen(false); setMobileMoreOpen(false); }}
                    aria-expanded={mobileAboutOpen}
                    aria-controls="mobile-about-submenu"
                    className="w-full flex items-center justify-between text-lg font-medium text-white hover:text-[#F97316] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded px-2 py-3"
                  >
                    <span>About</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileAboutOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileAboutOpen && (
                      <motion.div
                        id="mobile-about-submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 py-1 space-y-0.5">
                          {aboutDropdown.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <button
                    onClick={() => { setMobileClientLoginOpen(!mobileClientLoginOpen); setMobileServicesOpen(false); setMobilePortfolioOpen(false); setMobileMoreOpen(false); }}
                    aria-expanded={mobileClientLoginOpen}
                    aria-controls="mobile-login-submenu"
                    className="w-full flex items-center justify-between text-lg font-medium text-white hover:text-[#F97316] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded px-2 py-3"
                  >
                    <span>Client Login</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileClientLoginOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileClientLoginOpen && (
                      <motion.div
                        id="mobile-login-submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 py-1 space-y-0.5">
                          {clientLoginDropdown.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <button
                    onClick={() => { setMobileMoreOpen(!mobileMoreOpen); setMobileServicesOpen(false); setMobilePortfolioOpen(false); setMobileClientLoginOpen(false); }}
                    aria-expanded={mobileMoreOpen}
                    aria-controls="mobile-more-submenu"
                    className="w-full flex items-center justify-between text-lg font-medium text-white hover:text-[#F97316] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded px-2 py-3"
                  >
                    <span>More</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileMoreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileMoreOpen && (
                      <motion.div
                        id="mobile-more-submenu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 py-1 space-y-0.5">
                          {moreDropdown.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#06B6D4] rounded"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-6 border-t border-white/[0.08] mt-3">
                  <Link
                    href="/contact"
                    ref={lastFocusableRef}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center px-6 py-3 rounded-xl font-semibold text-white bg-[#F97316] transition-all cursor-pointer"
                  >
                    Start Your Project
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}