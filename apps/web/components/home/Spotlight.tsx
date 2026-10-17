'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Vehicle } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export function Spotlight({ vehicle }: { vehicle?: Vehicle }) {
  const scope = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState(false);
  const imageUrl = vehicle?.images[0]?.url;

  useEffect(() => {
    const node = scope.current;
    if (!node) return;
    let inView = false;
    const update = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    }, { threshold: .1 });
    observer.observe(node);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  useEffect(() => {
    const photo = image.current;
    if (!photo || !imageUrl) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {}, scope);
      let entered = false;
      const enter = () => {
        if (entered || !photo.naturalWidth) return;
        entered = true;
        ctx.add(() => {
          gsap.timeline()
            .fromTo('[data-spotlight-car]', { x: 44, y: 12, scale: .94, opacity: 0 },
              { x: 0, y: 0, scale: 1, opacity: 1, duration: .85, ease: 'power3.out', clearProps: 'all' })
            .fromTo('[data-spotlight-details]', { y: 10, opacity: 0 },
              { y: 0, opacity: 1, duration: .4, clearProps: 'all' }, .25)
            .fromTo('[data-spotlight-sweep]', { xPercent: -180, opacity: 0 },
              { xPercent: 280, opacity: .65, duration: 1.1, ease: 'power2.inOut' }, 0)
            .set('[data-spotlight-sweep]', { opacity: 0 });
        });
      };
      if (photo.complete) enter();
      photo.addEventListener('load', enter);
      return () => { photo.removeEventListener('load', enter); ctx.revert(); };
    });
    return () => media.revert();
  }, [imageUrl]);

  return <div ref={scope} data-active={active} className="spotlight relative min-h-[390px]">
    <div className="spotlight-card bg-white rounded-2xl overflow-hidden text-primary-text shadow-xl">
      <div className="flex justify-between items-center gap-3 p-5 border-b border-primary-border">
        <span className="eyebrow flex items-center gap-2"><span aria-hidden="true" className="spotlight-dot h-2 w-2 rounded-full bg-primary-accent"/>In the spotlight</span>
        <span className="text-xs text-primary-muted">{vehicle ? 'Available to explore' : 'Discover our collection'}</span>
      </div>
      <div className="spotlight-stage relative isolate aspect-[4/3] sm:aspect-[16/11] bg-[#F8FAFD] flex items-center justify-center p-4 overflow-hidden">
        <div aria-hidden="true" className="spotlight-halo pointer-events-none absolute -z-10 w-[80%] aspect-square rounded-full"/>
        <div aria-hidden="true" className="spotlight-floor pointer-events-none absolute inset-x-[12%] bottom-[8%] h-[10%] rounded-[50%]"/>
        {vehicle ? <div className="spotlight-float w-full h-full relative"><img ref={image} data-spotlight-car src={imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="spotlight-car w-full h-full object-contain" fetchPriority="high"/></div>
          : <svg viewBox="0 0 400 170" className="w-3/4 text-slate-200" fill="currentColor" aria-label="Vehicle preview loading"><path d="m50 100 45-55h155l65 55 40 10v30H30v-30z"/><circle cx="100" cy="140" r="24"/><circle cx="290" cy="140" r="24"/></svg>}
        <div data-spotlight-sweep aria-hidden="true" className="spotlight-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-0"/>
      </div>
      {vehicle ? <Link data-spotlight-details href={vehicle.detailsHref!} className="flex items-center justify-between gap-3 p-5 sm:p-6 border-t border-primary-border hover:bg-primary-bg focus-visible:bg-primary-bg">
        <div className="min-w-0"><p className="text-xs text-primary-muted mb-1">{vehicle.year} · {vehicle.variant}</p><h2 className="text-xl font-bold">{vehicle.make} {vehicle.model}</h2></div>
        <div className="text-right shrink-0"><p className="text-sm font-semibold">{formatPrice(vehicle.price, vehicle.currency)}</p><span className="text-primary-accent text-xs">Explore this car <span className="spotlight-arrow inline-block">↗</span></span></div>
      </Link> : <div aria-hidden="true" className="h-[94px] border-t border-primary-border"/>}
    </div>
    <p className="text-xs text-slate-400 mt-4 text-center">Real inventory. Images and prices supplied with each listing.</p>
  </div>;
}
