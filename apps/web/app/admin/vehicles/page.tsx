'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, assetUrl } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminVehicleListItem } from '@/lib/configurator-types';
import { IdentityBadge, JobStatusText, Notice, PipelineBadge, inputClass, smallBtn } from '@/components/configurator/admin-ui';

export default function AdminVehiclesPage() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<AdminVehicleListItem[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [publication, setPublication] = useState('all');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setVehicles(await api.get<AdminVehicleListItem[]>('/admin/configurator/vehicles', token));
      setError('');
    } catch (e: any) {
      setError(e.message || 'Could not load vehicles');
    }
  }, [token]);

  useEffect(() => {
    load();
    // Keep pipeline progress fresh while jobs are running.
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = (vehicles ?? []).filter((v) => {
    const text = `${v.make} ${v.model} ${v.variant ?? ''} ${v.year}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (publication === 'all' || v.publicationStatus === publication);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-md font-semibold text-primary-text">Vehicle Inventory</h1>
          <p className="text-body-sm text-primary-muted">
            {vehicles ? `${vehicles.length} vehicle(s) in the 3D configurator pipeline` : 'Loading…'}
          </p>
        </div>
        <Link href="/admin/vehicles/new" className="btn-primary inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Vehicle
        </Link>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col sm:flex-row gap-3">
        <input className={inputClass} placeholder="Search make, model, variant…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={`${inputClass} sm:w-48`} value={publication} onChange={(e) => setPublication(e.target.value)}>
          <option value="all">All</option>
          <option value="PUBLISHED">Published</option>
          <option value="UNPUBLISHED">Unpublished</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-gray-50 text-caption uppercase tracking-wider text-primary-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium">Pipeline</th>
                <th className="text-left px-4 py-3 font-medium">3D model</th>
                <th className="text-left px-4 py-3 font-medium">Latest job</th>
                <th className="text-left px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-primary-muted">
                    No vehicles yet. <Link href="/admin/vehicles/new" className="underline">Add the first one</Link>.
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-11 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                        {v.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={assetUrl(v.thumbnailUrl)!} alt="" className="w-full h-full object-cover" />
                        )}
                        {v.thumbnailIsAi && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center">AI image</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-primary-text">{v.year} {v.make} {v.model}</p>
                        <p className="text-caption text-primary-muted">{[v.variant, v.market, `${v.colourCount} colours`].filter(Boolean).join(' · ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><PipelineBadge status={v.assetStatus} /></td>
                  <td className="px-4 py-3"><IdentityBadge status={v.identity} /></td>
                  <td className="px-4 py-3">
                    {v.latestJob ? (
                      <div className="space-y-1 min-w-[140px]">
                        <JobStatusText status={v.latestJob.jobStatus} />
                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full bg-primary-accent" style={{ width: `${v.latestJob.progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-caption text-primary-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-caption">
                    {v.publicationStatus === 'PUBLISHED' ? (
                      <Link href={`/configurator?vehicle=${v.slug}`} className="text-green-700 underline">Live</Link>
                    ) : (
                      <span className="text-primary-muted">Unpublished</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {v.make === 'Kia' && v.model === 'Sonet' && <Link href="/vehicles/2024-kia-sonet" className={`${smallBtn} mr-2`}>Colour preview</Link>}
                    <Link href={`/admin/vehicles/pipeline?id=${v.id}`} className={smallBtn}>Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
