'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFavorites } from '@/contexts/FavoritesContext';
import { api, assetUrl } from '@/lib/api-client';
import { PublicVehicle, PublicColour, CameraView, CAMERA_VIEWS, formatPrice } from '@/lib/configurator-types';
import VehicleViewer from '@/components/configurator/VehicleViewer';

export default function PublicConfiguratorContent({ slugOverride }: { slugOverride?: string }) {
  const searchParams = useSearchParams();
  const slug = slugOverride || searchParams.get('vehicle');
  const configToken = searchParams.get('config');
  const {isFavorite,toggleFavorite}=useFavorites();
  const photoDialog=useRef<HTMLDialogElement>(null);
  const [galleryPhoto,setGalleryPhoto]=useState<{url:string;alt:string}|null>(null);
  const [prefer3d,setPrefer3d]=useState(false);
  const [activeTab,setActiveTab]=useState('Overview');

  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedColour, setSelectedColour] = useState<PublicColour | null>(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [view, setView] = useState<CameraView>('front-three-quarter');
  const [saving, setSaving] = useState(false);
  const [saveError,setSaveError]=useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!slug) { setError('No vehicle specified'); setLoading(false); return; }
    let active=true;
    setLoading(true);setError('');setGalleryPhoto(null);setSavedToken(null);setPrefer3d(false);
    api.get<PublicVehicle>(`/configurator/vehicles/${slug}`)
      .then((data) => {
        if(!active)return;
        setVehicle(data);
        setSelectedColour(data.colours[0] ?? null);
        setSelectedVariant(data.variant ?? '');
        if (configToken) {
          api.get(`/configurator/configurations/${configToken}`)
            .then((cfg: any) => {
              if(!active)return;
              if (cfg.selectedColour) {
                const c = data.colours.find((col) => col.name === cfg.selectedColour);
                if (c) setSelectedColour(c);
              }
              if (cfg.selectedVariant) setSelectedVariant(cfg.selectedVariant);
            })
            .catch(() => {});
        }
      })
      .catch((e: any) => {if(active)setError(e.message || 'Failed to load vehicle');})
      .finally(() => {if(active)setLoading(false);});
    return ()=>{active=false;};
  }, [slug, configToken]);

  const handleSave = async () => {
    if (!vehicle || !selectedColour) return;
    setSaving(true);
    setSaveError('');
    try {
      const result = await api.post('/configurator/configurations', {
        vehicleSlug: vehicle.slug,
        selectedVariant,
        selectedColour: selectedColour.name,
      });
      setSavedToken(result.shareToken);
    } catch (e: any) { setSaveError(e.message); } finally { setSaving(false); }
  };

  const shareUrl = savedToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/configurator?vehicle=${slug}&config=${savedToken}` : null;

  if (loading) return <div role="status" className="min-h-screen flex items-center justify-center text-body text-primary-muted">Loading vehicle…</div>;
  if (error) return <div className="page-shell container-main"><div className="surface p-10"><h1 className="text-2xl font-bold">This vehicle is unavailable</h1><p role="alert" className="text-primary-muted mt-3">{error}</p><Link href="/vehicles" className="btn-primary mt-6">Explore available cars</Link></div></div>;
  if (!vehicle) return <div className="min-h-screen flex items-center justify-center text-body text-primary-muted">Vehicle not found.</div>;


  const paint=selectedColour?.rendering ?? null;
  const title=vehicle.year+' '+vehicle.make+' '+vehicle.model;
  const photos=[...(selectedColour?.imageUrl?[{url:selectedColour.imageUrl,alt:selectedColour.name}]:[]),...(vehicle.images??[]).map(p=>({url:p.url,alt:p.alt||title})),...vehicle.renders.map(p=>({url:assetUrl(p.url)!,alt:p.label})),...vehicle.aiPreviews.map(p=>({url:assetUrl(p.assetUrl)!,alt:'AI illustration: '+p.label}))].filter((p,i,a)=>p.url&&a.findIndex(q=>q.url===p.url)===i);
  const photo=galleryPhoto??photos[0];
  const step=(n:number)=>{setPrefer3d(false);setGalleryPhoto(photos[(photos.findIndex(p=>p.url===photo?.url)+n+photos.length)%photos.length]);};
  const tabs=['Overview','Key Specifications','Features','Variants','Gallery'];
  return <div className="vehicle-detail min-h-screen bg-[#F3F7FC] pt-[calc(var(--header-height)+1rem)] pb-10"><div className="mx-auto max-w-[1536px] px-[var(--container-padding)] py-4">
    <div className="flex flex-wrap justify-between items-center gap-4 mb-5"><div><p className="text-xs text-primary-muted"><Link href="/vehicles">All cars</Link> › {vehicle.make} › {vehicle.model}</p><h1 className="text-2xl sm:text-3xl font-bold mt-2">{title}</h1><p className="text-sm text-primary-muted mt-1">{[vehicle.variant,vehicle.fuelType,vehicle.transmission,vehicle.bodyType].filter(Boolean).join(' · ')}</p></div><div className="flex gap-3"><button className="btn-secondary !bg-white text-sm" aria-pressed={isFavorite(vehicle.id)} onClick={()=>toggleFavorite(vehicle.id)}>{isFavorite(vehicle.id)?'♥ Saved':'♡ Save car'}</button><Link className="btn-secondary !bg-white text-sm" href="/compare">Compare ↔</Link></div></div>
    <div className="grid lg:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)] gap-5 items-start"><div className="contents lg:block min-w-0"><div className="order-1 min-w-0">
      <div className="relative rounded-xl overflow-hidden border border-primary-border bg-white aspect-[4/3] sm:aspect-[16/10]">
        <div className="absolute top-4 left-4 z-10 flex rounded-xl bg-primary-text/85 p-1 text-white text-xs"><button aria-pressed={!prefer3d} className={'px-4 py-3 rounded-lg '+(!prefer3d?'bg-white text-primary-text font-bold':'')} onClick={()=>setPrefer3d(false)}>Exterior</button>{vehicle.model3d&&<button className={'px-4 py-2 rounded-lg '+(prefer3d?'bg-white text-primary-text':'')} onClick={()=>setPrefer3d(true)}>360° view</button>}</div>
        {prefer3d&&vehicle.model3d?<VehicleViewer url={vehicle.model3d.url} bodyPaintMaterials={vehicle.model3d.bodyPaintMaterials} paint={paint} lengthAxis={vehicle.model3d.lengthAxis} scaleToMeters={vehicle.model3d.scaleToMeters} initialView={view} apiRef={viewerRef} preserveDrawingBuffer/>:photo?<img key={photo.url} src={photo.url} alt={title+' · '+photo.alt} className="w-full h-full gallery-image object-contain p-3 sm:p-6"/>:<div className="h-full flex items-center justify-center text-primary-muted">Photos are not available yet.</div>}
        {!prefer3d&&photo&&<button aria-label="Expand vehicle photo" onClick={()=>photoDialog.current?.showModal()} className="absolute top-4 right-4 rounded-full bg-white shadow h-11 w-11 text-xl">⤢</button>}
        {!prefer3d&&photos.length>1&&<><button aria-label="Previous photo" onClick={()=>step(-1)} className="absolute left-4 top-1/2 h-11 w-11 rounded-full bg-white shadow text-2xl">‹</button><button aria-label="Next photo" onClick={()=>step(1)} className="absolute right-4 top-1/2 h-11 w-11 rounded-full bg-white shadow text-2xl">›</button></>}
      </div>
      <div className="flex gap-2 overflow-x-auto py-3">{prefer3d?CAMERA_VIEWS.map(v=><button key={v} className="shrink-0 bg-white rounded-lg px-3 py-2 text-xs" onClick={()=>{setView(v);viewerRef.current?.setView(v);}}>{v.replace(/-/g,' ')}</button>):photos.map((p,i)=><button key={p.url} aria-label={'View photo '+(i+1)+': '+p.alt} aria-pressed={photo?.url===p.url} onClick={()=>setGalleryPhoto(p)} className={'shrink-0 w-28 h-[72px] rounded-lg overflow-hidden border-2 bg-white '+(photo?.url===p.url?'border-primary-accent':'border-transparent')}><img src={p.url} alt={p.alt} className="w-full h-full object-contain"/></button>)}</div>
      <p className="text-[11px] text-primary-muted mb-3">{prefer3d?'Drag to rotate the vehicle.':'Photo preview · illustrated trim and screen colours may differ.'}</p>
      </div><div className="order-3 min-w-0"><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-primary-border rounded-xl p-5">{[{label:'Fuel type',value:vehicle.fuelType,icon:'◈'},{label:'Transmission',value:vehicle.transmission,icon:'⚙'},{label:'Body style',value:vehicle.bodyType,icon:'▱'},{label:'Model year',value:vehicle.year,icon:'▦'}].map(item=><div key={item.label} className="flex gap-3 items-center"><span className="text-2xl" aria-hidden="true">{item.icon}</span><div><p className="text-sm font-semibold">{item.value||'Not specified'}</p><p className="text-xs text-primary-muted">{item.label}</p></div></div>)}</div>
      <section className="mt-4 bg-white border border-primary-border rounded-xl overflow-hidden"><div role="tablist" aria-label="Vehicle information" className="flex overflow-x-auto px-3 border-b border-primary-border">{tabs.map(tab=><button key={tab} id={'tab-'+tab.replace(/ /g,'-')} role="tab" tabIndex={activeTab===tab?0:-1} onKeyDown={e=>{let n=tabs.indexOf(tab);if(e.key==='ArrowRight')n=(n+1)%tabs.length;else if(e.key==='ArrowLeft')n=(n-1+tabs.length)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();setActiveTab(tabs[n]);document.getElementById('tab-'+tabs[n].replace(/ /g,'-'))?.focus();}} aria-selected={activeTab===tab} aria-controls="vehicle-information" onClick={()=>setActiveTab(tab)} className={'shrink-0 px-4 py-4 text-sm border-b-2 '+(activeTab===tab?'border-primary-accent text-primary-accent':'border-transparent text-primary-muted')}>{tab}</button>)}<Link className="px-4 py-4 text-sm text-primary-muted" href="/compare">Compare</Link></div>
      <div id="vehicle-information" role="tabpanel" tabIndex={0} aria-labelledby={'tab-'+activeTab.replace(/ /g,'-')} className="p-6">
        {activeTab==='Overview'&&<><h2 className="text-xl font-bold mb-3">About the {vehicle.make} {vehicle.model}</h2><p className="text-sm text-primary-muted leading-7">{vehicle.description||title+'. Explore the colours, save your configuration or contact the dealer for more information.'}</p>{vehicle.interiorOptions.length>0&&<p className="text-sm mt-4">Interior: {vehicle.interiorOptions.join(', ')}</p>}{vehicle.wheelOptions.length>0&&<p className="text-sm mt-3">Wheels: {vehicle.wheelOptions.join(', ')}</p>}</>}
        {activeTab==='Key Specifications'&&<dl className="divide-y divide-primary-border">{Object.entries(vehicle.specifications??{}).length?Object.entries(vehicle.specifications??{}).map(([k,v])=><div key={k} className="flex justify-between gap-4 py-3 text-sm"><dt className="capitalize text-primary-muted">{k.replace(/([A-Z])/g,' $1').replace(/_/g,' ')}</dt><dd className="text-right font-medium">{typeof v==='object'?JSON.stringify(v):String(v)}</dd></div>):<p className="text-sm text-primary-muted">Detailed specifications have not been added.</p>}{vehicle.specificationsSource&&<a className="text-sm text-primary-accent inline-block mt-4" href={vehicle.specificationsSource.url} target="_blank" rel="noopener noreferrer">Specification source ↗</a>}</dl>}
        {activeTab==='Features'&&(vehicle.features?.length?<ul className="grid sm:grid-cols-2 gap-4">{vehicle.features.map(f=><li key={f} className="text-sm">✓ {f}</li>)}</ul>:<p className="text-sm text-primary-muted">Feature details have not been added.</p>)}
        {activeTab==='Variants'&&<div className="space-y-3">{vehicle.variants.length?vehicle.variants.map(v=><Link className="flex justify-between gap-4 border rounded-lg p-4 text-sm" key={v.slug} href={'/configurator?vehicle='+encodeURIComponent(v.slug)}><span>{v.variant||vehicle.model}</span><strong>{formatPrice(v.price,v.currency)}</strong></Link>):<p className="text-sm">{vehicle.variant||'Contact the dealer for available variants.'}</p>}</div>}
        {activeTab==='Gallery'&&<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{photos.map(p=><button key={p.url} onClick={()=>{setGalleryPhoto(p);photoDialog.current?.showModal();}} className="border rounded-lg p-2"><img src={p.url} alt={p.alt} className="h-28 w-full object-contain"/><span className="text-xs text-primary-muted">{p.alt}</span></button>)}</div>}
      </div></section>
    </div></div><aside className="order-2 lg:order-none configuration-panel bg-white border border-primary-border rounded-xl p-5 xl:p-6"><h2 className="text-xl xl:text-2xl font-bold">{title}</h2><p className="text-sm text-primary-muted mt-1">{[vehicle.variant,vehicle.bodyType,vehicle.fuelType,vehicle.transmission].filter(Boolean).join(' · ')}</p>
      <div className="flex flex-wrap items-center gap-3 py-6 border-b border-primary-border"><strong className="text-3xl font-heading">{vehicle.price?formatPrice(vehicle.price.amount,vehicle.price.currency):'Price on request'}</strong><div className="text-[11px] text-primary-muted"><p className="uppercase">{vehicle.market||'India'} market</p><p className="mt-1">{vehicle.price?.label||'Confirm price with dealer'}</p></div></div>
      {vehicle.variants.length>1&&<label className="block text-sm font-semibold mt-5">Variant<select className="block w-full border rounded-lg p-3 mt-2 text-sm font-normal" value={selectedVariant} onChange={e=>{const v=vehicle.variants.find(v=>v.variant===e.target.value);if(v)window.location.assign('/configurator?vehicle='+encodeURIComponent(v.slug));}}>{vehicle.variants.map(v=><option key={v.slug} value={v.variant??''}>{v.variant}</option>)}</select></label>}
      {!!vehicle.colours.length&&<div className="py-5"><h3 className="font-bold text-base mb-3">Exterior Colour</h3>{selectedColour&&!selectedColour.imageUrl&&!prefer3d&&<p className="text-xs text-primary-muted mb-3">A matching photo for this colour is not available. The gallery shows the saved vehicle photos.</p>}<div className="grid grid-cols-3 xl:grid-cols-4 gap-2">{vehicle.colours.map(c=><button key={c.id} aria-pressed={selectedColour?.id===c.id} onClick={()=>{setSelectedColour(c);setGalleryPhoto(null);setSavedToken(null);setSaveError('');if(!c.imageUrl&&vehicle.model3d)setPrefer3d(true);}} className={'relative rounded-xl border px-1.5 py-3 min-h-[120px] motion-colour flex flex-col items-center '+(selectedColour?.id===c.id?'border-primary-accent ring-1 ring-primary-accent bg-blue-50/30':'border-primary-border hover:border-slate-400')}><span className="h-10 w-10 rounded-full border border-black/10 shadow-inner mb-2" style={{background:'linear-gradient(145deg,rgba(255,255,255,.55),transparent 55%,rgba(0,0,0,.4)),'+c.hex}}/>{selectedColour?.id===c.id&&<span className="absolute top-1 right-1 text-[10px] rounded-full w-4 h-4 bg-primary-accent text-white">✓</span>}<span className="text-xs leading-4 font-semibold">{c.name}</span><span className="text-[11px] text-primary-muted mt-1 capitalize">{c.finish}</span></button>)}</div></div>}
      <div className="space-y-2 mt-1"><button onClick={handleSave} disabled={saving||!selectedColour} className="w-full rounded-lg bg-primary-text hover:bg-primary-dark text-white py-3 text-sm font-semibold disabled:opacity-50">♧ {saving?'Saving…':'Save Configuration'}</button><Link href={'/test-drive?vehicle='+encodeURIComponent(vehicle.slug)} className="btn-primary w-full text-sm">▦ Book Test Drive →</Link><Link href={'/enquire?vehicle='+encodeURIComponent(vehicle.slug)} className="btn-secondary w-full text-sm">Contact Dealer</Link></div>
      {saveError&&<p role="alert" className="text-sm text-red-700 mt-3">{saveError}</p>}
      {shareUrl&&<div className="mt-4"><p role="status" className="text-sm text-green-700 mb-2">Configuration saved</p><label className="text-xs">Share link<input readOnly value={shareUrl} className="w-full border rounded-lg p-3 text-xs mt-1" onClick={e=>e.currentTarget.select()}/></label></div>}{vehicle.model3d?.attribution&&<p className="text-xs text-primary-muted mt-4">{vehicle.model3d.attribution.text}</p>}
    </aside></div></div>
    <dialog ref={photoDialog} aria-label="Vehicle photo" className="photo-dialog rounded-2xl p-4 w-[min(95vw,1100px)] max-h-[90vh] m-auto backdrop:bg-primary-text/80"><div className="flex items-center justify-between mb-3 gap-4"><p className="text-sm font-semibold">{title} · {photo?.alt}</p><button className="btn-secondary" onClick={()=>photoDialog.current?.close()} aria-label="Close photo">✕</button></div>{photo&&<img src={photo.url} alt={photo.alt} className="w-full max-h-[72vh] object-contain"/>}</dialog>
  </div>;
}
