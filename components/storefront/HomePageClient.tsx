'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import CartDrawer from '@/components/storefront/CartDrawer';
import { useHomePage } from '@/lib/hooks/useHomePage';
import {
  Sparkles,
  Cake,
  ShieldCheck,
  MapPin,
  HeartHandshake,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Leaf,
} from 'lucide-react';

// Demo carousel slides — replace `image` with final photography URLs when ready.
const HERO_BANNER_SLIDES = [
  {
    image: 'https://ik.imagekit.io/by3es5jcax/products/Silder%201.png',
    title: 'Freshly Baked, Every Single Day',
    subtitle: 'Our ovens start at dawn so your cake arrives warm with love.',
  },
  {
    image: 'https://ik.imagekit.io/by3es5jcax/products/Slider%202-1.png',
    title: 'Custom Cakes for Every Celebration',
    subtitle: 'Tell us your theme — we\u2019ll design the rest, eggless and delicious.',
  },
  {
    image: 'https://ik.imagekit.io/by3es5jcax/products/Silder%203.png',
    title: 'Celebration Products, Delivered Fast',
    subtitle: 'Balloons, candles, and party décor within a 5 km radius.',
  },
];

// Demo testimonials — swap in verified customer reviews when available.
const TESTIMONIALS = [
  { name: 'Priya Shah', area: 'Demo City East', rating: 5, quote: 'The chocolate truffle cake was so soft and not overly sweet. Ordered for my daughter\u2019s birthday and it stole the show.' },
  { name: 'Rohan Mehta', area: 'Demo City', rating: 5, quote: 'Best eggless cakes in the area, hands down. Delivery was right on time and the packaging was spotless.' },
  { name: 'Ayesha Khan', area: 'Vikhroli', rating: 4, quote: 'Loved the custom design cake for our anniversary. Communicated every step over WhatsApp, very reassuring.' },
  { name: 'Karan Joshi', area: 'Demo City', rating: 5, quote: 'Been ordering from Velvet Crumb for years now. Consistent quality and genuinely feels handmade every time.' },
  { name: 'Sneha Patil', area: 'Kanjurmarg', rating: 5, quote: 'Their celebration decor combo made our small get-together look festive without much effort on our part.' },
];

function HeroBannerCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveSlide((i) => (i + 1) % HERO_BANNER_SLIDES.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goTo(index: number) {
    setActiveSlide(index);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveSlide((i) => (i + 1) % HERO_BANNER_SLIDES.length);
    }, 5000);
  }

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Featured banners">
      <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#E8DCCB] aspect-[16/7] sm:aspect-[21/8] bg-[#141414]">
        {HERO_BANNER_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            aria-hidden={idx !== activeSlide}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8 text-white">
              <h3 className="font-serif text-xl sm:text-3xl font-bold max-w-lg leading-tight">
                {slide.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-200 mt-1.5 max-w-md">{slide.subtitle}</p>
            </div>
          </div>
        ))}

        {/* Prev / Next controls */}
        <button
          onClick={() => goTo((activeSlide - 1 + HERO_BANNER_SLIDES.length) % HERO_BANNER_SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
          aria-label="Previous banner"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => goTo((activeSlide + 1) % HERO_BANNER_SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
          aria-label="Next banner"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 z-20 flex items-center gap-1.5">
          {HERO_BANNER_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to banner ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === activeSlide ? 'w-6 bg-[#F0791A]' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutUsSection() {
  const values = [
    { icon: Leaf, label: '100% Vegetarian', desc: 'No eggs, ever. Every recipe is built eggless from scratch.' },
    { icon: Heart, label: 'Made with Care', desc: 'Small batches, baked fresh daily — never mass-produced.' },
    { icon: ShieldCheck, label: 'Quality First', desc: 'Premium ingredients sourced for taste and consistency.' },
  ];

  return (
    <section className="py-14 bg-white border-t border-[#E8DCCB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-5 relative">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#E8DCCB] shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://ik.imagekit.io/by3es5jcax/products/Silder%201.png"
              alt="Velvet Crumb Bakery bakery team at work"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:flex absolute -bottom-6 -right-6 bg-[#141414] text-white rounded-2xl p-5 shadow-xl items-center gap-3 max-w-[220px]">
            <HeartHandshake className="h-8 w-8 text-[#F0791A] flex-shrink-0" />
            <p className="text-xs text-gray-300">Trusted by hundreds of families in Demo City since 2021</p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs uppercase font-bold tracking-widest text-[#F0791A]">About Us</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1B1F3B] leading-tight">
            WHO WE ARE?
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
            In 2021 when we started this Velvet Crumb Bakery in Demo City it was buzzing with people full of desire. The world was changing daily and we had to create our own path and sought to turn others into new directions.
          </p>
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
            The Bakery &amp; Confectionery exceeded our dreams and grew from a storefront start-up. We offer a variety of baking goods perfect for any time.
          </p>
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
            We at Velvet Crumb Bakery are proud of where we came from, but we are even more excited about where we are headed. We are happy that you have taken the time to look at our website and learn about our products. We look forward to talking more about the great Velvet Crumb Bakery products that we offer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {values.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-[#FFF8F0] border border-[#E8DCCB] rounded-xl p-4">
                <Icon className="h-5 w-5 text-[#F0791A] mb-2" />
                <p className="text-xs font-bold text-[#1B1F3B]">{label}</p>
                <p className="text-[11px] text-[#6B6B6B] mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionVisionValuesCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = [
    {
      id: 'mission',
      eyebrow: 'Our Purpose',
      title: 'MISSION',
      content: (
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            The Mission of Velvet Crumb Bakery is to produce quality bakery products cost effectively; in an environment that is safe, clean and friendly for our employees and community. The integrity of our company is based on the principles of quality products, satisfied customers and consumers, conscientious employees, and our commitments to innovative growth and development.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Our mission is to protect and improve the reputation and wholesomeness of the products and services we provide, as well as the sales and brand equity of our company. We will accomplish this through a full commitment and a systematic approach to pro-active and preventative programs and business practices.
          </p>
        </div>
      ),
    },
    {
      id: 'vision',
      eyebrow: 'Looking Ahead',
      title: 'VISION',
      content: (
        <div className="space-y-3">
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
            To be the most popular and needed in our Bakery &amp; Confectionery industry.
          </p>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            To provide baked goods of exceptional quality to every household in Demo City. Everybody deserves great baked products. It is our job to create indulgent and decadent products for them regardless of what they can, and cannot eat.
          </p>
        </div>
      ),
    },
    {
      id: 'values',
      eyebrow: 'What Guides Us',
      title: 'Our Values',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <h4 className="text-xs uppercase font-bold text-[#F0791A] tracking-wider">Quality</h4>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              To establish and maintain high-quality standards in services and products and be curious in seeking improvements.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <h4 className="text-xs uppercase font-bold text-[#C9A24B] tracking-wider">Productivity</h4>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              To complete our tasks and responsibilities effectively and efficiently.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <h4 className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Value</h4>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              To create value beyond customer expectations.
            </p>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveSlide((i) => (i + 1) % slides.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  function goTo(index: number) {
    setActiveSlide(index);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveSlide((i) => (i + 1) % slides.length);
    }, 6000);
  }

  return (
    <section className="py-14 bg-[#141414] text-white relative overflow-hidden border-t border-b border-[#C9A24B]/20" aria-label="Mission, Vision and Values">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative bg-gradient-to-b from-[#1E1E1E] to-[#141414] rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl overflow-hidden min-h-[300px] flex flex-col justify-between">

          {/* Header & Controls Bar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-[#C9A24B] block">
                {slides[activeSlide].eyebrow}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
                {slides[activeSlide].title}
              </h2>
            </div>

            {/* Slide Indicator & Nav Buttons */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400 hidden sm:inline-block">
                0{activeSlide + 1} / 0{slides.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goTo((activeSlide - 1 + slides.length) % slides.length)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goTo((activeSlide + 1) % slides.length)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Slide Content Area */}
          <div className="py-2">
            {slides[activeSlide].content}
          </div>

          {/* Bottom Dots Indicator */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to ${s.title}`}
                  className={`h-2 rounded-full transition-all ${idx === activeSlide ? 'w-8 bg-[#F0791A]' : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-400">
              Velvet Crumb Bakery Excellence &amp; Commitment
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const loopedTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-14 bg-[#141414] overflow-hidden" aria-label="Customer reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex items-end justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#C9A24B]">Testimonials</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">What Our Customers Say</h2>
        </div>
      </div>

      <div className="relative group">
        <div className="flex gap-5 w-max animate-[marquee_38s_linear_infinite] group-hover:[animation-play-state:paused] px-4 sm:px-6 lg:px-8">
          {loopedTestimonials.map((t, idx) => (
            <div
              key={idx}
              className="w-72 sm:w-80 flex-shrink-0 bg-white/[0.04] border border-white/10 rounded-2xl p-5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < t.rating ? 'fill-[#C9A24B] text-[#C9A24B]' : 'text-gray-700'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-bold text-white">{t.name}</p>
                <p className="text-[10px] text-gray-500">{t.area}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[marquee_38s_linear_infinite\\] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

export default function HomePageClient() {
  const {
    flavors,
    selectedFlavor,
    setSelectedFlavor,
    filteredProducts,
    featuredProduct,
    heroImageUrl,
    featuredProducts = [],
    cart,
    isCartOpen,
    setIsCartOpen,
    loading,
    handleQuickAdd,
    handleUpdateQuantity,
    handleRemoveItem,
  } = useHomePage();

  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);

  const currentFeaturedItem = featuredProducts.length > 0
    ? featuredProducts[activeFeaturedIndex % featuredProducts.length]
    : null;
  const currentProduct = currentFeaturedItem?.product || featuredProduct;
  const currentImageUrl = currentFeaturedItem?.heroImageUrl || heroImageUrl;
  const hasMultipleFeatured = featuredProducts.length > 1;

  const handlePrevFeatured = () => {
    if (!hasMultipleFeatured) return;
    setActiveFeaturedIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };

  const handleNextFeatured = () => {
    if (!hasMultipleFeatured) return;
    setActiveFeaturedIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0]">
      <Navbar cartItemCount={cart.itemCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1">
        {/* Redesigned Dark Showcase Hero Section */}
        {/* ===== HERO PANEL REDESIGN START (was line 259) ===== */}
        <section className="bg-gradient-to-br from-[#2a1f16] via-[#171310] to-[#0a0806] text-white py-12 lg:py-20 relative overflow-hidden border-b border-[#C9A24B]/20">
          {/* Warm ambient base glow — lifts the panel off flat black, matches reference mockup's lit backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 78% 30%, rgba(240,121,26,0.16), transparent 60%), radial-gradient(ellipse 55% 50% at 15% 85%, rgba(201,162,75,0.12), transparent 65%)',
            }}
          />

          {/* Drifting photographic bokeh — varied sizes, blur depths & speeds for a real out-of-focus light feel */}
          <div className="hero-bokeh hero-bokeh--a absolute top-[12%] right-[22%] w-3 h-3 rounded-full bg-[#F0791A] blur-[2px] opacity-70" />
          <div className="hero-bokeh hero-bokeh--b absolute top-[22%] right-[10%] w-6 h-6 rounded-full bg-[#C9A24B] blur-[4px] opacity-60" />
          <div className="hero-bokeh hero-bokeh--c absolute top-[8%] right-[35%] w-10 h-10 rounded-full bg-[#F0791A] blur-[10px] opacity-40" />
          <div className="hero-bokeh hero-bokeh--a absolute top-[38%] right-[6%] w-16 h-16 rounded-full bg-[#C9A24B] blur-[18px] opacity-30" style={{ animationDelay: '1.2s' }} />
          <div className="hero-bokeh hero-bokeh--b absolute bottom-[28%] right-[28%] w-4 h-4 rounded-full bg-[#C9A24B] blur-[3px] opacity-60" style={{ animationDelay: '0.6s' }} />
          <div className="hero-bokeh hero-bokeh--c absolute bottom-[15%] right-[15%] w-24 h-24 rounded-full bg-[#F0791A] blur-[24px] opacity-25" style={{ animationDelay: '2s' }} />
          <div className="hero-bokeh hero-bokeh--a absolute top-[65%] left-[10%] w-8 h-8 rounded-full bg-[#F0791A] blur-[8px] opacity-25" style={{ animationDelay: '1.6s' }} />
          <div className="hero-bokeh hero-bokeh--b absolute top-[15%] left-[24%] w-5 h-5 rounded-full bg-[#C9A24B] blur-[4px] opacity-30" style={{ animationDelay: '2.4s' }} />

          {/* Twinkling sparkle glints — clearly visible, four-point star shapes with real scale/opacity twinkle */}
          <svg viewBox="0 0 24 24" className="hero-sparkle absolute top-[14%] left-[6%] h-5 w-5 text-[#C9A24B]" style={{ animationDelay: '0s' }}>
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
          </svg>
          <svg viewBox="0 0 24 24" className="hero-sparkle absolute top-[48%] right-[4%] h-4 w-4 text-[#F0791A]" style={{ animationDelay: '1s' }}>
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
          </svg>
          <svg viewBox="0 0 24 24" className="hero-sparkle hidden sm:block absolute bottom-[10%] left-[30%] h-4 w-4 text-[#C9A24B]" style={{ animationDelay: '2s' }}>
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
          </svg>
          <svg viewBox="0 0 24 24" className="hero-sparkle absolute top-[30%] right-[38%] h-3 w-3 text-white" style={{ animationDelay: '1.5s' }}>
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
          </svg>

          {/* Subtle grain texture overlay (self-contained inline SVG, no external asset) */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />

          {/* Slow diagonal gold-foil light sweep (added on top of existing bokeh/sparkle layers) */}
          <div className="hero-foil-sweep absolute inset-0 pointer-events-none" />

          {/* Thin gold accent line along the top edge */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B]/60 to-transparent" />

          <style>{`
            @keyframes hero-bokeh-float-a {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(8px, -18px); }
            }
            @keyframes hero-bokeh-float-b {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(-10px, -12px); }
            }
            @keyframes hero-bokeh-float-c {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(6px, 14px); }
            }
            @keyframes hero-sparkle-twinkle {
              0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
              50% { opacity: 1; transform: scale(1) rotate(20deg); }
            }
            @keyframes hero-foil-sweep-move {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .hero-bokeh--a { animation: hero-bokeh-float-a 6s ease-in-out infinite; }
            .hero-bokeh--b { animation: hero-bokeh-float-b 7s ease-in-out infinite; }
            .hero-bokeh--c { animation: hero-bokeh-float-c 8s ease-in-out infinite; }
            .hero-sparkle { animation: hero-sparkle-twinkle 2.8s ease-in-out infinite; }
            .hero-foil-sweep {
              background: linear-gradient(115deg, transparent 40%, rgba(201, 162, 75, 0.18) 50%, transparent 60%);
              background-size: 200% 100%;
              animation: hero-foil-sweep-move 7s linear infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .hero-bokeh--a, .hero-bokeh--b, .hero-bokeh--c, .hero-sparkle { animation: none !important; }
            }
          `}</style>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Headline & CTAs & Trust Signals */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-[#C9A24B]/30 text-[#C9A24B] text-xs font-semibold backdrop-blur-md shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    100% Veg &amp; Eggless Bakery
                  </div>
                  <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400 border border-gray-700/80 px-3 py-1.5 rounded-full">
                    Est. 2021 • Demo City
                  </span>
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                  Freshly Baked <span className="text-[#F0791A]">Pure Veg Cakes</span> &amp; Celebrations
                </h1>

                <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
                  Handcrafted daily with premium vegetarian ingredients. Enjoy custom chocolate truffle cakes, birthday specials, and party supplies delivered directly to your doorstep in Demo City.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/categories/cakes"
                    className="bg-[#F0791A] hover:bg-[#d6650f] text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-orange-500/20 flex items-center gap-2 text-sm"
                  >
                    <Cake className="h-5 w-5" />
                    Order Cakes Now
                  </Link>

                  <Link
                    href="/custom-cakes"
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm"
                  >
                    Custom Design Cakes
                    <ArrowRight className="h-4 w-4 text-[#C9A24B]" />
                  </Link>
                </div>

                {/* Integrated Trust Badges Row */}
                <div className="pt-6 border-t border-gray-800/80 grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-green-950/80 border border-green-700/60 flex items-center justify-center text-green-400 flex-shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">100% Eggless</p>
                      <p className="text-[10px] text-gray-400">Pure Veg</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-[#C9A24B] flex-shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">5 km Delivery</p>
                      <p className="text-[10px] text-gray-400">Demo City</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-orange-950/80 border border-orange-700/60 flex items-center justify-center text-[#F0791A] flex-shrink-0">
                      <HeartHandshake className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">Est. 2021</p>
                      <p className="text-[10px] text-gray-400">Trusted Bakery</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Featured Product Photography */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border-2 border-[#C9A24B]/40 shadow-2xl bg-gradient-to-b from-[#141414] to-gray-900 group">
                  {currentImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentImageUrl}
                      alt={currentProduct?.name ? `${currentProduct.name} - Featured Eggless Cake` : 'Featured Velvet Crumb Cake'}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-amber-950/30">
                      <Cake className="h-16 w-16 text-[#F0791A]" />
                      <p className="font-serif text-lg font-bold text-white">Velvet Crumb Bakery</p>
                    </div>
                  )}

                  {hasMultipleFeatured && (
                    <>
                      <button
                        onClick={handlePrevFeatured}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                        aria-label="Previous featured product"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleNextFeatured}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                        aria-label="Next featured product"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {currentProduct && (
                    <div className="absolute bottom-4 left-4 right-4 bg-[#141414]/90 backdrop-blur-md p-4 rounded-2xl border border-gray-800 flex items-center justify-between shadow-xl z-10">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A24B] block">
                          Featured Product
                        </span>
                        <Link
                          href={`/products/${currentProduct.slug}`}
                          className="font-bold text-white text-sm hover:text-[#F0791A] transition-colors truncate block max-w-[180px]"
                        >
                          {currentProduct.name}
                        </Link>
                      </div>

                      <Link
                        href={`/products/${currentProduct.slug}`}
                        className="px-3 py-1.5 rounded-xl bg-[#F0791A] hover:bg-[#d6650f] text-white text-xs font-bold transition-all shadow flex items-center gap-1"
                      >
                        View Cake <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ===== HERO PANEL REDESIGN END (was line 383) ===== */}

        {/* Sliding Banner (new) */}
        <HeroBannerCarousel />

        {/* Category Showcase Cards */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1F3B]">
                Shop Categories
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1">Browse our vegetarian cake range &amp; party decor</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/categories/cakes"
              className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-8 text-white shadow-md hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="relative z-10 space-y-2">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-200 block">
                  Category
                </span>
                <h3 className="text-3xl font-bold font-serif">Birthday &amp; Occasion Cakes</h3>
                <p className="text-xs text-amber-100 max-w-sm">
                  Chocolate truffle, black forest, pineapple, fruit cakes &amp; more.
                </p>
                <div className="pt-4 flex items-center gap-2 text-sm font-bold group-hover:translate-x-1 transition-transform">
                  Explore Cakes <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link
              href="/categories/celebration"
              className="bg-gradient-to-r from-[#141414] to-gray-800 rounded-2xl p-8 text-white shadow-md hover:shadow-xl transition-all group relative overflow-hidden border border-gray-800"
            >
              <div className="relative z-10 space-y-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#C9A24B] block">
                  Category
                </span>
                <h3 className="text-3xl font-bold font-serif">Celebration Products</h3>
                <p className="text-xs text-gray-300 max-w-sm">
                  Balloons, candles, party decorations, and gift bouquets.
                </p>
                <div className="pt-4 flex items-center gap-2 text-sm font-bold text-[#C9A24B] group-hover:translate-x-1 transition-transform">
                  Explore Celebrations <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* About Us (new) */}
        <AboutUsSection />

        {/* Featured Products & Flavor Filter */}
        <section className="py-12 bg-white border-t border-[#E8DCCB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1F3B]">
                  Featured Bakery Products
                </h2>
                <p className="text-xs text-[#6B6B6B] mt-1">Freshly baked active products ready for order</p>
              </div>

              {/* Flavor Filter Pills */}
              {flavors.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0" role="group" aria-label="Filter by flavor">
                  <button
                    onClick={() => setSelectedFlavor('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedFlavor === ''
                      ? 'bg-[#F0791A] text-white'
                      : 'bg-[#FFF8F0] text-[#1B1F3B] border border-[#E8DCCB] hover:bg-gray-100'
                      }`}
                  >
                    All Flavors
                  </button>
                  {flavors.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFlavor(f.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedFlavor === f.name
                        ? 'bg-[#F0791A] text-white'
                        : 'bg-[#FFF8F0] text-[#1B1F3B] border border-[#E8DCCB] hover:bg-gray-100'
                        }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-[#6B6B6B] text-sm">
                Loading cakes &amp; products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center bg-[#FFF8F0] rounded-2xl border border-[#E8DCCB] p-8">
                <Cake className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#1B1F3B]">No products found</h3>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {selectedFlavor ? `No cakes matching flavor "${selectedFlavor}"` : 'Check back soon for new bakery items.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Mission, Vision & Values Slider */}
        <MissionVisionValuesCarousel />
      </main>

      {/* Customer Reviews */}
      <TestimonialsSection />

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
