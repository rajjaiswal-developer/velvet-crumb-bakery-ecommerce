import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/919999900000';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-showcase)] bg-showcase-grain text-gray-300 pt-14 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-master.png" alt="Velvet Crumb Bakery" className="h-10 w-auto object-contain" />
              <div>
                <span className="font-serif text-xl font-bold text-white block">Velvet Crumb Bakery</span>
                <svg viewBox="0 0 120 8" className="w-24 h-1.5" aria-hidden="true">
                  <path
                    d="M2 5 C 16 1, 28 7, 42 4 S 70 1, 84 5 S 108 7, 118 3"
                    fill="none"
                    stroke="var(--accent-secondary)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Established in 2021, Velvet Crumb Bakery is a pure vegetarian bakery crafting freshly baked, beautifully made cakes and celebration products.
            </p>

            {/* Our Team Members */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <h4 className="eyebrow text-white/90">Our Team Members</h4>
              <ul className="text-xs text-gray-400 space-y-1.5">
                <li className="flex justify-between items-center gap-2">
                  <span className="text-gray-200 font-medium">Aarav Mehta</span>
                  <span className="text-[10px] text-gray-400 font-mono">Head Baker</span>
                </li>
                <li className="flex justify-between items-center gap-2">
                  <span className="text-gray-200 font-medium">Kavya Reddy</span>
                  <span className="text-[10px] text-gray-400 font-mono">Co-founder</span>
                </li>
                <li className="flex justify-between items-center gap-2">
                  <span className="text-gray-200 font-medium">Rohan Iyer</span>
                  <span className="text-[10px] text-gray-400 font-mono">Operations</span>
                </li>
              </ul>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--state-success)]/10 border border-[var(--state-success)]/40 text-[#5fbf62] text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Eggless &amp; Vegetarian
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/40 text-[#3fdc7a] text-xs font-semibold hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="eyebrow text-white/90 mb-4">Explore</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/categories/cakes" className="hover:text-[var(--accent-primary)] transition-colors">
                  Birthday &amp; Anniversary Cakes
                </Link>
              </li>
              <li>
                <Link href="/categories/celebration" className="hover:text-[var(--accent-primary)] transition-colors">
                  Celebration Products &amp; Decorations
                </Link>
              </li>
              <li>
                <Link href="/custom-cakes" className="hover:text-[var(--accent-primary)] transition-colors">
                  Custom Cake Orders
                </Link>
              </li>
              <li>
                <Link href="/orders/track" className="hover:text-[var(--accent-primary)] transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Opening Hours & Delivery */}
          <div>
            <h3 className="eyebrow text-white/90 mb-4">Delivery Info</h3>
            <ul className="space-y-3 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                <span>Operating Hours: 10:00 AM – 10:00 PM Daily</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[var(--accent-secondary)] flex-shrink-0 mt-0.5" />
                <span>5 km Delivery Radius from Demo City</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="eyebrow text-white/90 mb-4">Contact Shop</h3>
            <ul className="space-y-3 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>12 Bakers Lane, Demo City</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>+91 9999900000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>hello@velvetcrumbdemo.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} Velvet Crumb Bakery. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-[var(--accent-primary)] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/terms-conditions" className="hover:text-[var(--accent-primary)] transition-colors">
              Terms &amp; Conditions
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/return-refund-policy" className="hover:text-[var(--accent-primary)] transition-colors">
              Return &amp; Refund
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/shipping-policy" className="hover:text-[var(--accent-primary)] transition-colors">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
