'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useGsapContext, prefersReducedMotion } from '@/hooks/useGsap';
import { gsap } from 'gsap';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1920&q=80&auto=format&fit=crop',
];

export function Hero() {
  // Safety fallback: if GSAP fails, force hero-image visible after 2s
  useEffect(() => {
    const timer = setTimeout(() => {
      const heroImage = document.querySelector('.hero-image') as HTMLElement;
      if (heroImage && parseFloat(getComputedStyle(heroImage).opacity) < 0.1) {
        heroImage.style.opacity = '1';
        heroImage.style.transform = 'scale(1)';
      }
      // Also reveal any still-hidden animated elements
      document.querySelectorAll('.hero-animate').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (parseFloat(getComputedStyle(htmlEl).opacity) < 0.1) {
          htmlEl.style.opacity = '1';
          htmlEl.style.transform = 'translateY(0)';
        }
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const heroRef = useGsapContext((ctx) => {
    if (prefersReducedMotion()) {
      gsap.set('.hero-animate', { autoAlpha: 1, y: 0 });
      gsap.set('.hero-image', { autoAlpha: 1, scale: 1 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      '.hero-eyebrow',
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5 }
    )
      .fromTo(
        '.hero-headline-1',
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8 },
        '-=0.2'
      )
      .fromTo(
        '.hero-headline-2',
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8 },
        '-=0.5'
      )
      .fromTo(
        '.hero-support',
        { y: 25, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6 },
        '-=0.4'
      )
      .fromTo(
        '.hero-cta-primary',
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5 },
        '-=0.3'
      )
      .fromTo(
        '.hero-cta-secondary',
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5 },
        '-=0.35'
      )
      .fromTo(
        '.hero-image',
        { scale: 1.08, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.0, ease: 'power2.out' },
        '-=0.8'
      )
      .fromTo(
        '.hero-meta',
        { y: 15, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.08 },
        '-=0.5'
      );
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Image with solid fallback */}
      <div className="absolute inset-0 z-0">
        {/* Solid fallback gradient — always visible behind image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a332c] via-[#1a201b] to-[#0d110e]" />

        {/* Decorative pattern for visual interest when image fails */}
        {!imgLoaded && (
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, rgba(125,138,120,0.3) 0%, transparent 50%),
                               radial-gradient(circle at 75% 50%, rgba(125,138,120,0.2) 0%, transparent 50%)`,
            }}
          />
        )}

        {/* Hero car image */}
        <div
          className="hero-image absolute inset-0"
          style={{ opacity: 0 }}
        >
          {!imgError ? (
            <img
              src={HERO_IMAGES[0]}
              alt="Premium vehicle in cinematic lighting"
              className="w-full h-full object-cover"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            /* SVG car silhouette fallback */
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d3830]/80 via-[#1a201b] to-[#0d110e]" />
              <svg
                className="relative w-full max-w-4xl px-8 opacity-20"
                viewBox="0 0 800 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse cx="400" cy="320" rx="350" ry="30" fill="rgba(125,138,120,0.3)" />
                <path d="M150 250 C150 250 200 150 350 140 C450 133 550 133 650 150 C700 158 720 200 720 250 L150 250Z" fill="rgba(125,138,120,0.4)" />
                <path d="M250 250 C250 250 270 180 370 170 C430 165 530 165 600 175 C640 180 660 220 660 250" fill="rgba(125,138,120,0.2)" />
                <circle cx="250" cy="270" r="40" fill="rgba(125,138,120,0.5)" />
                <circle cx="250" cy="270" r="25" fill="rgba(125,138,120,0.3)" />
                <circle cx="600" cy="270" r="40" fill="rgba(125,138,120,0.5)" />
                <circle cx="600" cy="270" r="25" fill="rgba(125,138,120,0.3)" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/80 via-primary-dark/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/60 via-transparent to-primary-dark/20" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container-main w-full pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div
            className="hero-eyebrow hero-animate inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6"
            style={{ opacity: 0 }}
          >
            <span className="w-2 h-2 rounded-full bg-primary-accent animate-pulse" />
            <span className="text-caption text-white/80">
              Premium Automotive Experience
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6">
            <span
              className="hero-headline-1 hero-animate block text-4xl md:text-5xl lg:text-display-lg font-bold text-white leading-tight tracking-tight"
              style={{ opacity: 0 }}
            >
              Your next car.
            </span>
            <span
              className="hero-headline-2 hero-animate block text-4xl md:text-5xl lg:text-display-lg font-bold text-white leading-tight tracking-tight mt-2"
              style={{ opacity: 0 }}
            >
              A better way.
            </span>
          </h1>

          {/* Supporting Text */}
          <p
            className="hero-support hero-animate text-body-lg text-white/70 max-w-lg mb-8 text-pretty"
            style={{ opacity: 0 }}
          >
            Discover the right car with transparent pricing, thoughtful guidance
            and a better buying experience.
          </p>

          {/* CTAs */}
          <div
            className="hero-cta-primary hero-animate flex flex-wrap gap-4 mb-10"
            style={{ opacity: 0 }}
          >
            <Link href="/vehicles" className="btn-primary text-body-md px-8 py-4">
              Explore Cars
              <svg
                className="ml-2 w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="hero-cta-secondary hero-animate" style={{ opacity: 0 }}>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-body-md font-medium text-white/80 hover:text-white transition-colors group"
            >
              <span className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
              </span>
              How it works
            </Link>
          </div>

          {/* Meta Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
            <div className="hero-meta hero-animate" style={{ opacity: 0 }}>
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-caption text-white/50">Vehicles Available</p>
            </div>
            <div className="hero-meta hero-animate" style={{ opacity: 0 }}>
              <p className="text-2xl font-bold text-white">50+</p>
              <p className="text-caption text-white/50">Trusted Partners</p>
            </div>
            <div className="hero-meta hero-animate" style={{ opacity: 0 }}>
              <p className="text-2xl font-bold text-white">4.9★</p>
              <p className="text-caption text-white/50">Customer Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-caption text-white/40">Scroll</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/40"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
