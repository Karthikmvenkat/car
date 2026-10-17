'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, assetUrl } from '@/lib/api-client';
import {
  AdminVehicle, VehicleAsset, AssetJob, JobStatus, AssetPipelineStatus,
  MaterialMapping, MaterialCategory, MATERIAL_CATEGORIES, CAMERA_VIEWS,
  STATUS_LABELS,
} from '@/lib/configurator-types';
import VehicleViewer from '@/components/configurator/VehicleViewer';
import { Card, Field, PipelineBadge, IdentityBadge, JobStatusText, Notice, smallBtn, primaryBtn, inputClass } from '@/components/configurator/admin-ui';

const PIPELINE_STAGES = ['VALIDATE_INPUT', 'SEARCH_MODEL', 'AI_PREVIEWS', 'PREPARE_3D', 'MAP_MATERIALS', 'GENERATE_PREVIEWS', 'QUALITY_ASSURANCE'] as const;
const STAGE_PROGRESS: Record<string, number> = { VALIDATE_INPUT: 5, SEARCH_MODEL: 20, AI_PREVIEWS: 45, PREPARE_3D: 65, MAP_MATERIALS: 80, GENERATE_PREVIEWS: 90, QUALITY_ASSURANCE: 100 };

function getToken() {
  try { return localStorage.getItem('token'); } catch { return null; }
}

export default function PipelineReviewPage() { return <Suspense fallback={<p>Loading vehicle review…</p>}><PipelineReviewContent/></Suspense>; }
function PipelineReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token: authToken } = useAuth();
  const token = authToken ?? undefined;
  const vehicleId = searchParams.get('id');

  const [vehicle, setVehicle] = useState<AdminVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [note, setNote] = useState('');
  const [mappings, setMappings] = useState<Record<string, MaterialCategory>>({});
  const [mappingDirty, setMappingDirty] = useState(false);
  const [mappingSaving, setMappingSaving] = useState(false);
  const viewerRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVehicle = async () => {
    if (!vehicleId || !token) return;
    try {
      const data = await api.get<AdminVehicle>(`/admin/configurator/vehicles/${vehicleId}`, token);
      setVehicle(data);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicle(); }, [vehicleId, token]);

  // Poll while job is active
  useEffect(() => {
    if (!vehicle) return;
    const latestJob = vehicle.assetJobs[0];
    const isActive = latestJob && ['QUEUED', 'RUNNING'].includes(latestJob.jobStatus);
    if (isActive) {
      pollRef.current = setInterval(fetchVehicle, 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [vehicle?.assetJobs[0]?.jobStatus]);

  // Init mappings from web asset
  useEffect(() => {
    if (!vehicle) return;
    const web = vehicle.assets.find((a) => a.assetType === 'MODEL_3D_WEB' && a.label === 'active');
    if (web?.materialMappings?.entries) {
      const init: Record<string, MaterialCategory> = {};
      web.materialMappings.entries.forEach((e) => { init[e.name] = e.category; });
      setMappings(init);
    }
  }, [vehicle?.id]);

  if (!vehicleId) return <div className="p-8 text-body text-primary-muted">No vehicle ID provided.</div>;
  if (loading) return <div className="p-8 text-body">Loading...</div>;
  if (error) return <div className="p-8 text-body text-red-600">{error} <button onClick={fetchVehicle} className={smallBtn}>Retry</button></div>;
  if (!vehicle) return <div className="p-8 text-body">Vehicle not found.</div>;

  const latestJob = vehicle.assetJobs[0] ?? null;
  const webAsset = vehicle.assets.find((a) => a.assetType === 'MODEL_3D_WEB' && a.label === 'active') ?? null;
  const sourceAsset = vehicle.assets.find((a) => a.assetType === 'MODEL_3D_SOURCE' && a.label === 'active') ?? null;
  const candidates = vehicle.assets.filter((a) => a.assetType === 'MODEL_CANDIDATE');
  const aiPreviews = vehicle.assets.filter((a) => a.assetType === 'AI_PREVIEW');
  const renders = vehicle.assets.filter((a) => a.assetType === 'RENDER_PREVIEW');
  const isWaitingForInput = latestJob?.jobStatus === 'WAITING_FOR_INPUT';
  const isReadyForReview = vehicle.assetStatus === 'READY_FOR_REVIEW' || vehicle.assetStatus === 'APPROVED';

  const doAction = async (fn: () => Promise<any>, label: string) => {
    setActionLoading(label);
    try { await fn(); await fetchVehicle(); } catch (e: any) { setError(e.message); } finally { setActionLoading(''); }
  };

  const handleImportCandidate = async (assetId: string) => {
    await doAction(() => api.post(`/admin/configurator/vehicles/${vehicleId}/candidates/${assetId}/import`, { licenceAcknowledged: true }, token), 'Importing...');
  };

  const handleSearchCandidates = async () => {
    await doAction(() => api.post(`/admin/configurator/vehicles/${vehicleId}/candidates/search`, {}, token), 'Searching...');
  };

  const handleResumeJob = async (fromStage: string) => {
    await doAction(() => api.post(`/admin/configurator/vehicles/${vehicleId}/jobs`, { fromStage }, token), 'Starting...');
  };

  const handleRetryJob = async (fromStage?: string) => {
    if (!latestJob) return;
    await doAction(() => api.post(`/admin/configurator/jobs/${latestJob.id}/retry`, fromStage ? { fromStage } : {}, token), 'Retrying...');
  };

  const handleCancelJob = async () => {
    if (!latestJob) return;
    await doAction(() => api.post(`/admin/configurator/jobs/${latestJob.id}/cancel`, {}, token), 'Cancelling...');
  };

  const handleApprove = async () => {
    await doAction(() => api.post(`/admin/configurator/vehicles/${vehicleId}/approve`, { note }, token), 'Approving...');
  };

  const handleReject = async () => {
    await doAction(() => api.post(`/admin/configurator/vehicles/${vehicleId}/reject`, { note }, token), 'Rejecting...');
  };

  const handlePublish = async (marketingOnly = false) => {
    await doAction(() => api.post(`/admin/configurator/vehicles/${vehicleId}/publish?marketingOnly=${marketingOnly}`, {}, token), 'Publishing...');
  };

  const handleUnpublish = async () => {
    await doAction(() => api.post(`/admin/configurator/vehicles/${vehicleId}/unpublish`, {}, token), 'Unpublishing...');
  };

  const handleSaveMappings = async () => {
    if (!webAsset) return;
    setMappingSaving(true);
    try {
      const entries = Object.entries(mappings).map(([name, category]) => ({ name, category }));
      await api.put(`/admin/configurator/assets/${webAsset.id}/material-mappings`, { entries }, token);
      setMappingDirty(false);
      await fetchVehicle();
    } catch (e: any) { setError(e.message); } finally { setMappingSaving(false); }
  };

  const handleIdentityDecision = async (status: 'VERIFIED_EXACT' | 'APPROVED_APPROXIMATE' | 'REJECTED') => {
    if (!webAsset) return;
    await doAction(() => api.post(`/admin/configurator/assets/${webAsset.id}/identity`, { status, note }, token), 'Saving...');
  };

  const handleCaptureRenders = async () => {
    if (!viewerRef.current) return;
    setActionLoading('Capturing renders...');
    try {
      for (const view of CAMERA_VIEWS) {
        const blob = await viewerRef.current.capture({ view, width: 1600, height: 1000 });
        if (!blob) continue;
        const form = new FormData();
        form.append('file', new File([blob], `${view}.png`, { type: 'image/png' }));
        form.append('label', `view:${view}`);
        await api.upload(`/admin/configurator/vehicles/${vehicleId}/renders`, form, token);
      }
      await fetchVehicle();
    } catch (e: any) { setError(e.message); } finally { setActionLoading(''); }
  };

  const modelUrl = assetUrl(webAsset?.assetUrl ?? sourceAsset?.assetUrl);
  const currentStageIdx = latestJob?.stagesCompleted?.length ? PIPELINE_STAGES.indexOf(latestJob.stagesCompleted[latestJob.stagesCompleted.length - 1] as any) : -1;
  const progress = latestJob?.progress ?? (currentStageIdx >= 0 ? STAGE_PROGRESS[PIPELINE_STAGES[currentStageIdx]] ?? 0 : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/admin/vehicles')} className="text-caption text-primary-muted hover:text-primary-text mb-2">← Back to vehicles</button>
          <h1 className="text-heading-lg font-semibold text-primary-text">
            {vehicle.year} {vehicle.brand.name} {vehicle.model.name} — {vehicle.variant}
          </h1>
          <p className="text-body-sm text-primary-muted mt-1">{vehicle.market} · {vehicle.bodyStyle} · {vehicle.colours.length} colours</p>
        </div>
        <div className="flex items-center gap-3">
          <PipelineBadge status={vehicle.assetStatus} />
          {vehicle.publicationStatus === 'PUBLISHED' && <span className="text-caption font-medium text-green-700 bg-green-50 px-2 py-1 rounded">LIVE</span>}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {/* Pipeline Progress */}
      <Card title="Pipeline Progress">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium text-primary-text">
              {latestJob ? JobStatusText({ status: latestJob.jobStatus as JobStatus }) : 'No job yet'}
            </span>
            <span className="text-caption text-primary-muted">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-primary-accent h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {PIPELINE_STAGES.map((stage, i) => {
              const completed = latestJob?.stagesCompleted?.includes(stage);
              const current = latestJob?.processingStage === (stage as string) || (i === currentStageIdx && !completed);
              return (
                <div key={stage} className={`text-center text-caption py-1 rounded ${completed ? 'bg-green-100 text-green-800' : current ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'bg-gray-50 text-primary-muted'}`}>
                  {stage.replace(/_/g, ' ').split(' ').map((w) => w[0]).join('')}
                </div>
              );
            })}
          </div>
          {latestJob?.errorMessage && <Notice tone="error">{latestJob.errorMessage}</Notice>}
        </div>
      </Card>

      {/* Job Controls */}
      <Card title="Job Controls">
        <div className="flex flex-wrap gap-2">
          {isWaitingForInput && (
            <button onClick={() => handleResumeJob('PREPARE_3D')} disabled={!!actionLoading} className={primaryBtn}>
              {actionLoading || 'Resume from Prepare 3D'}
            </button>
          )}
          {latestJob && ['FAILED', 'WAITING_FOR_INPUT'].includes(latestJob.jobStatus) && (
            <button onClick={() => handleRetryJob()} disabled={!!actionLoading} className={smallBtn}>
              Retry job
            </button>
          )}
          {latestJob && ['QUEUED', 'RUNNING'].includes(latestJob.jobStatus) && (
            <button onClick={handleCancelJob} disabled={!!actionLoading} className={`${smallBtn} text-red-600 border-red-200`}>
              Cancel job
            </button>
          )}
          {!latestJob && (
            <button onClick={() => handleResumeJob('VALIDATE_INPUT')} disabled={!!actionLoading} className={primaryBtn}>
              Start pipeline
            </button>
          )}
        </div>
      </Card>

      {/* 3D Viewer */}
      {modelUrl && (
        <Card title="3D Preview">
          <div className="h-[400px] rounded-lg overflow-hidden bg-gray-50">
            <VehicleViewer
              url={modelUrl}
              bodyPaintMaterials={webAsset?.materialMappings?.bodyPaintMaterials ?? []}
              paint={vehicle.colours[0]?.renderingParameters ?? null}
              lengthAxis={(webAsset?.validationReport as any)?.orientation?.lengthAxis ?? 'Z'}
              scaleToMeters={(webAsset?.validationReport as any)?.scale?.unitGuess === 'cm' ? 0.01 : (webAsset?.validationReport as any)?.scale?.unitGuess === 'mm' ? 0.001 : 1}
              initialView="front-three-quarter"
              preserveDrawingBuffer
              apiRef={viewerRef}
            />
          </div>
        </Card>
      )}

      {/* Candidates */}
      {candidates.length > 0 && (
        <Card title={`Model Candidates (${candidates.length})`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                {c.previewUrl && <img src={assetUrl(c.previewUrl)!} alt={c.label ?? ''} className="w-full h-32 object-cover rounded" />}
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium">{c.sourceProvider}</span>
                  <span className="text-caption text-primary-muted">{Math.round((c.matchConfidence ?? 0) * 100)}% match</span>
                </div>
                {c.sourceUrl && <a href={c.sourceUrl} target="_blank" rel="noopener" className="text-caption text-primary-accent hover:underline">View source →</a>}
                {c.licenceDetails && (
                  <div className="text-caption text-primary-muted">
                    {c.licenceDetails.label} {c.licenceDetails.requiresAttribution && '· Attribution required'}
                  </div>
                )}
                <button onClick={() => handleImportCandidate(c.id)} disabled={!!actionLoading} className={`${smallBtn} w-full`}>
                  Import this model
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSearchCandidates} disabled={!!actionLoading} className={`${smallBtn} mt-4`}>
            Search for more candidates
          </button>
        </Card>
      )}

      {/* AI Previews */}
      {aiPreviews.length > 0 && (
        <Card title={`AI Previews (${aiPreviews.length})`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {aiPreviews.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {a.assetUrl && <img src={assetUrl(a.assetUrl)!} alt={a.label ?? ''} className="w-full h-24 object-cover" />}
                <div className="p-2 text-caption text-primary-muted">{a.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Material Mappings */}
      {webAsset?.materialMappings && (
        <Card title="Material Mappings">
          <div className="space-y-3">
            {webAsset.materialMappings.entries.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-body-sm font-medium text-primary-text">{entry.name}</span>
                  <span className="text-caption text-primary-muted ml-2">{Math.round(entry.triangleShare * 100)}% of mesh</span>
                </div>
                <select
                  value={mappings[entry.name] ?? entry.category}
                  onChange={(e) => { setMappings({ ...mappings, [entry.name]: e.target.value as MaterialCategory }); setMappingDirty(true); }}
                  className={inputClass + ' w-40'}
                >
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            ))}
            {mappingDirty && (
              <button onClick={handleSaveMappings} disabled={mappingSaving} className={primaryBtn}>
                {mappingSaving ? 'Saving...' : 'Save mappings'}
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Identity Decision */}
      {webAsset && (
        <Card title="Identity Verification">
          <div className="flex items-center gap-3 mb-4">
            <IdentityBadge status={webAsset.identityVerificationStatus} />
            <span className="text-body-sm text-primary-muted">
              {webAsset.identityVerificationStatus === 'VERIFIED_EXACT' ? 'Exact match confirmed' :
               webAsset.identityVerificationStatus === 'APPROVED_APPROXIMATE' ? 'Approved as approximate' :
               webAsset.identityVerificationStatus === 'REJECTED' ? 'Rejected' : 'Not yet verified'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleIdentityDecision('VERIFIED_EXACT')} disabled={!!actionLoading} className={smallBtn}>Mark as exact match</button>
            <button onClick={() => handleIdentityDecision('APPROVED_APPROXIMATE')} disabled={!!actionLoading} className={smallBtn}>Approve as approximate</button>
            <button onClick={() => handleIdentityDecision('REJECTED')} disabled={!!actionLoading} className={`${smallBtn} text-red-600 border-red-200`}>Reject</button>
          </div>
        </Card>
      )}

      {/* Render Capture */}
      {webAsset && isReadyForReview && (
        <Card title="Render Capture">
          <p className="text-body-sm text-primary-muted mb-3">Capture labelled renders from the 3D model for the public configurator.</p>
          <button onClick={handleCaptureRenders} disabled={!!actionLoading} className={primaryBtn}>
            {actionLoading === 'Capturing renders...' ? 'Capturing...' : `Capture ${CAMERA_VIEWS.length} renders`}
          </button>
          {renders.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
              {renders.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded overflow-hidden">
                  {r.assetUrl && <img src={assetUrl(r.assetUrl)!} alt={r.label ?? ''} className="w-full h-16 object-cover" />}
                  <div className="p-1 text-caption text-primary-muted text-center truncate">{r.label}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* QA Report */}
      {vehicle.qa && (
        <Card title="Quality Assurance">
          <div className={`text-body-sm font-medium mb-2 ${vehicle.qa.passed ? 'text-green-700' : 'text-red-700'}`}>
            {vehicle.qa.passed ? 'Passed' : 'Issues found'}
          </div>
          {vehicle.qa.blocking.length > 0 && (
            <div className="space-y-1 mb-3">
              <span className="text-caption font-medium text-red-700">Blocking:</span>
              {vehicle.qa.blocking.map((b, i) => <div key={i} className="text-caption text-red-600 ml-2">· {b}</div>)}
            </div>
          )}
          {vehicle.qa.warnings.length > 0 && (
            <div className="space-y-1">
              <span className="text-caption font-medium text-amber-700">Warnings:</span>
              {vehicle.qa.warnings.map((w, i) => <div key={i} className="text-caption text-amber-600 ml-2">· {w}</div>)}
            </div>
          )}
        </Card>
      )}

      {/* Job Logs */}
      {latestJob?.log && latestJob.log.length > 0 && (
        <Card title={`Job Logs (${latestJob.log.length})`}>
          <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-caption">
            {latestJob.log.map((entry, i) => (
              <div key={i} className={`flex gap-2 ${entry.level === 'error' ? 'text-red-600' : entry.level === 'warn' ? 'text-amber-600' : 'text-primary-muted'}`}>
                <span className="text-gray-400 shrink-0">{new Date(entry.at).toLocaleTimeString()}</span>
                <span>[{entry.stage}]</span>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Approve / Reject / Publish */}
      {isReadyForReview && (
        <Card title="Review Decision">
          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Add a note..." />
          </Field>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={handleApprove} disabled={!!actionLoading} className={primaryBtn}>
              {actionLoading === 'Approving...' ? 'Approving...' : 'Approve'}
            </button>
            <button onClick={handleReject} disabled={!!actionLoading} className={`${smallBtn} text-red-600 border-red-200`}>
              {actionLoading === 'Rejecting...' ? 'Rejecting...' : 'Reject'}
            </button>
            {vehicle.assetStatus === 'APPROVED' && vehicle.publicationStatus !== 'PUBLISHED' && (
              <button onClick={() => handlePublish(false)} disabled={!!actionLoading} className={`${smallBtn} bg-green-600 text-white border-green-600`}>
                {actionLoading === 'Publishing...' ? 'Publishing...' : 'Publish'}
              </button>
            )}
            {vehicle.publicationStatus === 'PUBLISHED' && (
              <button onClick={handleUnpublish} disabled={!!actionLoading} className={`${smallBtn} text-amber-600 border-amber-200`}>
                {actionLoading === 'Unpublishing...' ? 'Unpublishing...' : 'Unpublish'}
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
