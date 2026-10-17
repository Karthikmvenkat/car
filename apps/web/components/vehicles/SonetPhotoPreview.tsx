'use client';

import { useState } from 'react';

export const sonetColours = [
  { name: 'Imperial Blue', code: 'mpb', hex: '#203b69' },
  { name: 'Glacier White Pearl', code: 'gwp', hex: '#f1f1ed' },
  { name: 'Aurora Black Pearl', code: 'abp', hex: '#18191c' },
  { name: 'Gravity Grey', code: 'kdg', hex: '#53585c' },
  { name: 'Pewter Olive', code: 'ewe', hex: '#777966' },
  { name: 'Magma Red', code: 'ar2', hex: '#a3262c' },
];

export function sonetPhotoUrl(code = 'mpb') {
  return `https://www.kia.com/content/dam/kia2/in/en/images/360vr/sonet/sxw5k2g1uhh078/exterior/${code}/09-d.png`;
}

export default function SonetPhotoPreview() {
  const [selected, setSelected] = useState(sonetColours[0]);
  const [loaded, setLoaded] = useState('');
  const [failed, setFailed] = useState('');
  const url = sonetPhotoUrl(selected.code);

  return (
    <section className="rounded-2xl border border-primary-border bg-white overflow-hidden" aria-label="Kia Sonet colour preview">
      <div className="px-6 pt-5">
        <h3 className="text-heading-sm font-semibold">Sonet Colour Studio</h3>
        <p className="text-caption text-primary-muted">Manufacturer imagery · Instant colour preview</p>
      </div>
      <div className="relative aspect-[16/9] bg-gradient-to-b from-white to-gray-100">
        <img key={url} src={url} alt={`Kia Sonet in ${selected.name}`} onLoad={() => setLoaded(url)} onError={() => setFailed(url)} className={`w-full h-full object-contain transition-opacity ${loaded === url ? 'opacity-100' : 'opacity-0'}`} />
        {loaded !== url && <p role="status" className="absolute inset-0 flex items-center justify-center text-primary-muted">{failed === url ? 'Photo unavailable. Please try another colour.' : 'Loading colour preview…'}</p>}
      </div>
      <div className="p-6">
        <p aria-live="polite" className="font-semibold mb-4">{selected.name}</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {sonetColours.map((colour) => <button key={colour.code} type="button" aria-pressed={selected.code === colour.code} onClick={() => setSelected(colour)} className={`rounded-xl p-2 border text-center ${selected.code === colour.code ? 'border-primary-accent ring-2 ring-primary-accent' : 'border-gray-200'}`}>
            <span className="block w-9 h-9 mx-auto rounded-full border border-gray-300 mb-2" style={{ backgroundColor: colour.hex }} />
            <span className="text-caption">{colour.name}</span>
          </button>)}
        </div>
        <p className="text-caption text-primary-muted mt-5">Illustrated Sonet trim may differ from the 2024 HTX+. Screen colours are indicative.</p>
        <a href="https://www.kia.com/in/our-vehicles/sonet/showroom.html" target="_blank" rel="noreferrer" className="text-caption underline text-primary-muted">Image source: Kia India</a>
      </div>
    </section>
  );
}
