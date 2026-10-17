'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// GSAP accepts these as animation targets
type GsapTarget = string | Element | Element[] | null;

/**
 * Hook for safe GSAP context management in React.
 * Automatically cleans up animations on unmount.
 */
export function useGsapContext(
  callback: (ctx: gsap.Context) => void,
  deps: React.DependencyList = []
) {
  const scope = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!scope.current) return;

    try {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const ctx = gsap.context(callback, scope);
        return () => ctx.revert();
      });
      return () => media.revert();
    } catch (error) {
      console.error('GSAP context error:', error);
      // Force visibility if GSAP fails
      if (scope.current) {
        scope.current.querySelectorAll('[style*="opacity: 0"]').forEach((el) => {
          (el as HTMLElement).style.opacity = '1';
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/**
 * Animate elements with a fade-up entrance.
 */
export function animateFadeUp(
  elements: GsapTarget,
  options: {
    stagger?: number;
    duration?: number;
    delay?: number;
    y?: number;
    ease?: string;
  } = {}
) {
  const {
    stagger = 0.1,
    duration = 0.7,
    delay = 0,
    y = 30,
    ease = 'power3.out',
  } = options;

  return gsap.from(elements as gsap.TweenTarget, {
    y,
    autoAlpha: 0,
    duration,
    stagger,
    delay,
    ease,
  });
}

/**
 * Animate elements with a fade-in entrance.
 */
export function animateFadeIn(
  elements: GsapTarget,
  options: {
    stagger?: number;
    duration?: number;
    delay?: number;
    ease?: string;
  } = {}
) {
  const {
    stagger = 0.1,
    duration = 0.6,
    delay = 0,
    ease = 'power2.out',
  } = options;

  return gsap.from(elements as gsap.TweenTarget, {
    autoAlpha: 0,
    duration,
    stagger,
    delay,
    ease,
  });
}

/**
 * Animate elements with a scale-in entrance.
 */
export function animateScaleIn(
  elements: GsapTarget,
  options: {
    stagger?: number;
    duration?: number;
    delay?: number;
    scale?: number;
    ease?: string;
  } = {}
) {
  const {
    stagger = 0.1,
    duration = 0.7,
    delay = 0,
    scale = 0.95,
    ease = 'power2.out',
  } = options;

  return gsap.from(elements as gsap.TweenTarget, {
    scale,
    autoAlpha: 0,
    duration,
    stagger,
    delay,
    ease,
  });
}

/**
 * Create a ScrollTrigger reveal animation.
 */
export function createScrollReveal(
  elements: GsapTarget,
  options: {
    y?: number;
    duration?: number;
    stagger?: number;
    delay?: number;
    start?: string;
    once?: boolean;
    ease?: string;
  } = {}
) {
  const {
    y = 30,
    duration = 0.7,
    stagger = 0.1,
    delay = 0,
    start = 'top 85%',
    once = true,
    ease = 'power2.out',
  } = options;

  const targets = gsap.utils.toArray<Element>(elements as gsap.DOMTarget);
  // Each item watches its own position, so later rows never animate off screen.
  return targets.map((target, index) => gsap.fromTo(target,
    { y: Math.min(y, 18), opacity: 0 },
    { opacity: 1, y: 0, duration: Math.min(duration, .5),
      delay: Math.min(delay + index * stagger, .15), ease, clearProps: 'transform,opacity',
      scrollTrigger: { trigger: target, start, once,
        toggleActions: 'play none none none' },
    }
  ));
}

/**
 * Create a parallax scroll effect.
 */
export function createParallax(
  element: GsapTarget,
  options: {
    y?: number;
    start?: string;
    end?: string;
    scrub?: boolean | number;
  } = {}
) {
  const {
    y = -50,
    start = 'top bottom',
    end = 'bottom top',
    scrub = 1,
  } = options;

  return gsap.to(element as gsap.TweenTarget, {
    y,
    ease: 'none',
    scrollTrigger: {
      trigger: element as Element,
      start,
      end,
      scrub,
    },
  });
}

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
