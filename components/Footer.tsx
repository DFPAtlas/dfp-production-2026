'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-slate-700 border-t border-slate-200 relative overflow-hidden" role="contentinfo">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.4) 0.5px, transparent 0.5px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-20 pb-10 relative">
        {/* Main footer grid — single column mobile, 2 tablet, 4 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-5 cursor-pointer">
              <img
                src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
                alt="Digital Footprint Logo"
                width={36}
                height={36}
                className="object-contain rounded-lg"
              />
              <span className="text-lg font-bold tracking-tight text-slate-900" suppressHydrationWarning={true}>
                Digital<span className="text-[#06B6D4]"> Footprint</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Digital systems for independent UK businesses.
            </p>
            <div className="space-y-2">
              <a href="mailto:info@digital-footprint.uk" className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">
                <i className="ri-mail-line w-4 h-4 flex items-center justify-center" />
                info@digital-footprint.uk
              </a>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <i className="ri-map-pin-line w-4 h-4 flex items-center justify-center" />
                Hertfordshire, United Kingdom
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider mb-5">Services</h3>
            <ul className="space-y-3">
              <li><Link href="/services#digital-launch" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Digital Launch</Link></li>
              <li><Link href="/services#digital-growth" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Digital Growth</Link></li>
              <li><Link href="/services#digital-transformation" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Digital Transformation</Link></li>
              <li><Link href="/services#web-design" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Digital Platforms</Link></li>
              <li><Link href="/services#ai" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">AI and Automation</Link></li>
              <li><Link href="/services#portals" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Business Systems</Link></li>
              <li><Link href="/services#cloud" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Infrastructure</Link></li>
            </ul>
          </div>

          {/* Company + Support */}
          <div>
            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider mb-5">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">About</Link></li>
              <li><Link href="/who-we-help" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Who We Help</Link></li>
              <li><Link href="/team" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Team</Link></li>
              <li><Link href="/products" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Portfolio</Link></li>
              <li><Link href="/demos" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Demo Lab</Link></li>
              <li><Link href="/partners" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Partners</Link></li>
              <li><Link href="/careers" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Careers</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Insights</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Contact</Link></li>
            </ul>

            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider mb-5 mt-8">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Help Centre</Link></li>
              <li><Link href="/support" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Get Support</Link></li>
              <li><Link href="/support/status" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Service Status</Link></li>
            </ul>
          </div>

          {/* Access + Legal + Trust */}
          <div>
            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider mb-5">Access</h3>
            <ul className="space-y-3">
              <li><Link href="/login" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Sign In</Link></li>
              <li><Link href="/portal/login" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Client Portal</Link></li>
              <li><Link href="/pbx/dashboard" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Cloud PBX</Link></li>
              <li><Link href="/uat-testing" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">UAT TestLab</Link></li>
            </ul>

            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider mb-5 mt-8">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Terms</Link></li>
              <li><Link href="/cookie-policy" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Cookies</Link></li>
              <li><Link href="/cookie-preferences" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Cookie Settings</Link></li>
            </ul>

            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider mb-5 mt-8">Trust</h3>
            <ul className="space-y-3">
              <li><Link href="/security" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Security</Link></li>
              <li><Link href="/accessibility" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">Accessibility</Link></li>
              <li><Link href="/support/status" className="text-sm text-slate-500 hover:text-[#F97316] transition-colors cursor-pointer">System Status</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400 text-center sm:text-left" suppressHydrationWarning={true}>
              &copy; {currentYear} Digital Footprint. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
