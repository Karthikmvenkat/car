'use client';

import { useState } from 'react';
import catalogue from '@/lib/three-d-sourcing.json';

type Candidate = { name: string; url: string; thumbnail: string | null; licence: string; commercialUse: boolean; modification: boolean; downloadable: boolean; matchScore: number; yearVerified: boolean };
type Entry = { make: string; model: string; year: number; status: string; candidates: Candidate[]; error?: string };

export default function ModelLibraryPage() {
  const entries = catalogue.entries as Entry[];
  const [make, setMake] = useState('');
  const [search, setSearch] = useState('');
  const [onlyCandidates, setOnlyCandidates] = useState(false);
  const filtered = entries.filter((e) => (!make || e.make === make) && `${e.make} ${e.model}`.toLowerCase().includes(search.toLowerCase()) && (!onlyCandidates || e.candidates.length));
  return <div className="space-y-6 max-w-6xl">
    <div><h1 className="text-heading-md font-semibold">3D model sources</h1><p className="text-body-sm text-primary-muted mt-2">{entries.length} models across {new Set(entries.map((e) => e.make)).size} makes · Target year {catalogue.targetYear}</p></div>
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-body-sm">These are search candidates, not installed models. Review exact year, generation, Indian specification and licence before importing. {catalogue.downloadConfigured ? 'Download credentials are configured.' : 'Automatic downloads need a Sketchfab API token. You can also upload a licensed GLB from the vehicle review page.'}</div>
    <div className="flex flex-wrap gap-3"><select aria-label="Filter make" className="border rounded-lg p-2" value={make} onChange={(e) => setMake(e.target.value)}><option value="">All makes</option>{[...new Set(entries.map((e) => e.make))].map((name) => <option key={name}>{name}</option>)}</select><input aria-label="Search models" placeholder="Search model" className="border rounded-lg p-2" value={search} onChange={(e) => setSearch(e.target.value)} /><label className="flex gap-2 items-center"><input type="checkbox" checked={onlyCandidates} onChange={(e) => setOnlyCandidates(e.target.checked)} />With candidates</label></div>
    <p className="text-caption text-primary-muted">Source audit: {catalogue.checkedAt.slice(0,10)} · {filtered.length} results</p>
    {filtered.map((entry) => <section key={`${entry.make}-${entry.model}`} className="bg-white border rounded-xl p-5"><h2 className="font-semibold">{entry.make} {entry.model}</h2>{entry.candidates.length ? <div className="grid sm:grid-cols-3 gap-4 mt-4">{entry.candidates.map((c) => <div key={c.url} className="border rounded-lg overflow-hidden">{c.thumbnail && <img src={c.thumbnail} alt={c.name} loading="lazy" className="w-full h-36 object-contain bg-gray-100" />}<div className="p-3 space-y-2"><a href={c.url} target="_blank" rel="noreferrer" className="font-medium underline">{c.name}</a><p className="text-caption">{c.licence}</p><p className="text-caption">{c.commercialUse && c.modification ? 'Licence permits commercial use and modification; review attribution.' : 'Licence needs review before commercial use or recolouring.'}</p><p className="text-caption text-amber-700">2026 identity not verified</p></div></div>)}</div> : <p className="text-body-sm text-primary-muted mt-2">{entry.status === 'search_failed' ? 'Source search failed; availability is unknown.' : 'No matching downloadable candidate found. A licensed purchase or custom model may be needed.'}</p>}</section>)}
  </div>;
}
