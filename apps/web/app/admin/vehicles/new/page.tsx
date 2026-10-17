'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Field, Notice, inputClass, primaryBtn, smallBtn } from '@/components/configurator/admin-ui';
import indiaCatalog from '@/lib/india-vehicle-catalog.json';

interface ColourRow {
  imageUrl?: string;
  name: string;
  manufacturerPaintCode: string;
  previewHex: string;
  finish: 'solid' | 'metallic' | 'pearl' | 'matte';
  availabilityStatus: 'UNVERIFIED' | 'AVAILABLE';
}

const BODY_TYPES = ['SUV', 'Compact SUV', 'Sedan', 'Hatchback', 'MPV', 'Coupe', 'Convertible', 'Pickup', 'Wagon', 'Crossover'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'CNG'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT / IVT', 'DCT', 'AMT'];
const DRIVETRAINS = ['', 'FWD', 'RWD', 'AWD', '4WD'];
const LICENCES = [
  'Owned / commissioned by us',
  'Manufacturer-supplied (licensed)',
  'CC Attribution',
  'CC0 Public Domain',
  'Commercial licence (purchased)',
  'Other',
];

const emptyColour = (): ColourRow => ({ name: '', manufacturerPaintCode: '', previewHex: '#9a9d9f', finish: 'metallic', availabilityStatus: 'UNVERIFIED' });
const splitList = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

export default function NewConfiguratorVehiclePage() {
  const router = useRouter();
  const { token } = useAuth();

  const [form, setForm] = useState({
    make: '', model: '', year: String(new Date().getFullYear()), generation: '', market: 'India', variant: '',
    bodyType: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', drivetrain: '',
    interiorOptions: '', wheelOptions: '', price: '', currency: 'INR', priceVerified: false,
    manufacturerUrl: '', description: '',
  });
  const [colours, setColours] = useState<ColourRow[]>([emptyColour()]);
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelMeta, setModelMeta] = useState({ licenceLabel: LICENCES[0], licenceUrl: '', sourceUrl: '', author: '', attributionText: '', claimsExactMatch: false });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [photoMode, setPhotoMode] = useState(true);
  const [photoLookup, setPhotoLookup] = useState('Enter make, model and year to find manufacturer photos.');
  const [lookingUp, setLookingUp] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [manualColours, setManualColours] = useState(false);
  const [customMake, setCustomMake] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [customVariant, setCustomVariant] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantNotice, setVariantNotice] = useState('Select make and model first.');
  useEffect(() => {
    setVariants([]);
    setCustomVariant(false);
    setForm((f) => ({ ...f, variant: '' }));
    if (!token || !form.make.trim() || !form.model.trim()) { setVariantLoading(false); setVariantNotice('Select make and model first.'); return; }
    let cancelled = false;
    setVariantLoading(true);
    setVariantNotice('Fetching variants…');
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ make: form.make, model: form.model });
      api.get<{ variants: string[]; message: string }>(`/admin/configurator/variant-lookup?${query}`, token)
        .then((result) => { if (!cancelled) { setVariants(result.variants); setVariantNotice(result.message); } })
        .catch(() => { if (!cancelled) setVariantNotice('Variants unavailable. Use Other variant.'); })
        .finally(() => { if (!cancelled) setVariantLoading(false); });
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.make, form.model, form.year, token]);
  const makeModels = indiaCatalog.makes.find((make) => make.name === form.make)?.models ?? [];
  const isSonet = form.make.trim().toLowerCase() === 'kia' && form.model.trim().toLowerCase() === 'sonet';
  useEffect(() => {
    if (!photoMode || !token) return;
    if (!form.make.trim() || !form.model.trim() || !form.year) {
      setColours([emptyColour()]);
      setLookingUp(false);
      setPhotoLookup('Enter make and model to fetch colours and photos automatically.');
      return;
    }
    let cancelled = false;
    setColours([emptyColour()]);
    setPhotoLookup('Finding manufacturer colour photos…');
    setLookingUp(true);
    setSelectedPhoto(0);
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ make: form.make.trim(), model: form.model.trim(), year: form.year });
      api.get<{ colours: ColourRow[]; message: string; sourceYear?: number | null }>(`/admin/configurator/photo-lookup?${query}`, token)
        .then((result) => { if (!cancelled) { setPhotoLookup(result.message); setColours(result.colours.length ? result.colours : [emptyColour()]); } })
        .catch(() => { if (!cancelled) setPhotoLookup('Photo lookup is unavailable. Please retry shortly.'); })
        .finally(() => { if (!cancelled) setLookingUp(false); });
    }, 700);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.make, form.model, form.year, photoMode, token]);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const setColour = (i: number, patch: Partial<ColourRow>) => setColours((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const validate = () => {
    if (!form.make.trim() || !form.model.trim() || !form.variant.trim()) return 'Make, model and variant are required.';
    const y = Number(form.year);
    if (!Number.isInteger(y) || y < 1950 || y > 2100) return 'Enter a valid model year.';
    const named = colours.filter((c) => c.name.trim());
    if (photoMode && lookingUp) return 'Finding the vehicle colours and photos. Please wait.';
    if (!named.length) return photoMode ? 'No automatic photos found for this model. Try a supported model or use manual colour setup.' : 'Add at least one exterior colour.';
    if (photoMode && (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0)) return 'Enter a positive price for this variant.';
    if (photoMode && named.some((c) => !c.imageUrl || !/^https:\/\//i.test(c.imageUrl))) return 'Some colour photos are unavailable. Retry lookup or use manual colour setup.';
    const names = named.map((c) => c.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) return 'Colour names must be unique.';
    if (form.manufacturerUrl && !/^https?:\/\//i.test(form.manufacturerUrl)) return 'Manufacturer URL must start with https://';
    if (modelFile && !/\.glb$/i.test(modelFile.name)) return 'The 3D model must be a binary glTF (.glb) file.';
    if (modelFile && !modelMeta.licenceLabel) return 'Record the licence for the uploaded 3D model.';
    if (referenceImages.length > 6) return 'Upload at most 6 reference images at once.';
    return '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    if (!token) return setError('Your session has expired. Sign in again.');
    setError('');

    const specifications = Object.fromEntries(specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => [s.key.trim(), s.value.trim()]));
    const body = {
      photoMode,
      make: form.make.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      generation: form.generation.trim() || undefined,
      market: form.market.trim() || undefined,
      variant: form.variant.trim(),
      bodyType: form.bodyType,
      fuelType: form.fuelType,
      transmission: form.transmission,
      drivetrain: form.drivetrain || undefined,
      colours: colours
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          manufacturerPaintCode: c.manufacturerPaintCode.trim() || undefined,
          previewHex: c.previewHex.toLowerCase(),
          finish: c.finish,
          availabilityStatus: c.availabilityStatus,
          imageUrl: photoMode ? c.imageUrl : undefined,
        })),
      interiorOptions: splitList(form.interiorOptions),
      wheelOptions: splitList(form.wheelOptions),
      price: form.price ? Math.round(Number(form.price)) : undefined,
      currency: form.currency || 'INR',
      priceVerified: form.priceVerified,
      specifications: Object.keys(specifications).length ? specifications : undefined,
      manufacturerUrl: form.manufacturerUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      // Start the pipeline only after optional uploads, so they are used by every stage.
      generateAssets: false,
    };

    let vehicleId = '';
    try {
      setBusy('Saving vehicle…');
      const created = await api.post<{ vehicle: { id: string; slug: string } }>('/admin/configurator/vehicles', body, token);
      vehicleId = created.vehicle.id;
      if (photoMode) {
        router.push(`/configurator?vehicle=${encodeURIComponent(created.vehicle.slug)}`);
        return;
      }

      if (referenceImages.length) {
        setBusy('Uploading reference images…');
        const fd = new FormData();
        referenceImages.forEach((f) => fd.append('files', f));
        await api.upload(`/admin/configurator/vehicles/${vehicleId}/reference-images`, fd, token);
      }

      if (modelFile) {
        setBusy(`Uploading 3D model (${(modelFile.size / 1024 / 1024).toFixed(1)} MB)…`);
        const fd = new FormData();
        fd.append('file', modelFile);
        fd.append('licenceLabel', modelMeta.licenceLabel);
        if (modelMeta.licenceUrl) fd.append('licenceUrl', modelMeta.licenceUrl);
        if (modelMeta.sourceUrl) fd.append('sourceUrl', modelMeta.sourceUrl);
        if (modelMeta.author) fd.append('author', modelMeta.author);
        if (modelMeta.attributionText) fd.append('attributionText', modelMeta.attributionText);
        fd.append('claimsExactMatch', String(modelMeta.claimsExactMatch));
        // Uploading the model starts the full pipeline.
        await api.upload(`/admin/configurator/vehicles/${vehicleId}/model`, fd, token);
      } else {
        setBusy('Starting asset pipeline…');
        await api.post(`/admin/configurator/vehicles/${vehicleId}/jobs`, {}, token);
      }
      router.push(`/admin/vehicles/pipeline?id=${vehicleId}`);
    } catch (err: any) {
      setBusy('');
      setError(
        vehicleId
          ? `Vehicle saved, but a follow-up step failed: ${err.message}. Continue from the review page.`
          : err.message || 'Could not save the vehicle.',
      );
      if (vehicleId) setTimeout(() => router.push(`/admin/vehicles/pipeline?id=${vehicleId}`), 2500);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/vehicles" className="text-caption text-primary-muted hover:text-primary-text">← Inventory</Link>
          <h1 className="text-heading-md font-semibold text-primary-text">Add vehicle</h1>
          <p className="text-body-sm text-primary-muted">
            Enter the vehicle, variant and price. Choose photo colour previews for immediate display, or use the 3D asset pipeline.
          </p>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Card title="Preview automation">
        <label className="flex gap-3 items-center"><input type="checkbox" checked={photoMode} onChange={(e) => setPhotoMode(e.target.checked)} />Create and publish with photo colour previews</label>
        <p className="text-body-sm text-primary-muted mt-2">Manufacturer colour photos are looked up from make, model and year. Each variant uses your entered price and gets its own page without waiting for a 3D model.</p>
        {photoMode && <p role="status" className="text-body-sm mt-3">{photoLookup}</p>}
        {isSonet && photoMode && <p className="text-caption mt-2">Kia imagery illustrates a Sonet trim that may differ from your selected variant. Colours remain unverified for that variant.</p>}
      </Card>

      <Card title="Vehicle identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Make" required>
            <select className={inputClass} value={customMake ? '__other' : form.make} onChange={(e) => { const other = e.target.value === '__other'; setCustomMake(other); setCustomModel(false); setForm((f) => ({ ...f, make: other ? '' : e.target.value, model: '' })); }}>
              <option value="">Select make</option>
              {indiaCatalog.makes.map((make) => <option key={make.name} value={make.name}>{make.name}</option>)}
              <option value="__other">Other / older make</option>
            </select>
          </Field>
          {customMake && <Field label="Other make" required><input className={inputClass} value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value, model: '' }))} placeholder="Enter make" /></Field>}
          <Field label="Model" required>
            <select className={inputClass} disabled={!form.make.trim()} value={customModel ? '__other' : form.model} onChange={(e) => { const other = e.target.value === '__other'; setCustomModel(other); set('model', other ? '' : e.target.value); }}>
              <option value="">{form.make ? 'Select model' : 'Select make first'}</option>
              {makeModels.map((model) => <option key={model} value={model}>{model}</option>)}
              <option value="__other">Other / older model</option>
            </select>
          </Field>
          {customModel && <Field label="Other model" required><input className={inputClass} value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Enter model" /></Field>}
          <Field label="Model year" required><input className={inputClass} type="number" min={1950} max={2100} value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
          <Field label="Generation / facelift" hint="Used to find the exact body shape"><input className={inputClass} value={form.generation} onChange={(e) => set('generation', e.target.value)} placeholder="SP2 facelift" /></Field>
          <Field label="Market / region"><input className={inputClass} value={form.market} onChange={(e) => set('market', e.target.value)} placeholder="India" /></Field>
          <Field label="Variant / trim" required hint={variantNotice}>
            <select className={inputClass} disabled={!form.model.trim() || variantLoading} value={customVariant ? '__other' : form.variant} onChange={(e) => { const other = e.target.value === '__other'; setCustomVariant(other); set('variant', other ? '' : e.target.value); }}>
              <option value="">{variantLoading ? 'Loading variants…' : 'Select variant'}</option>
              {variants.map((variant) => <option key={variant} value={variant}>{variant}</option>)}
              <option value="__other">Other / older variant</option>
            </select>
          </Field>
          {customVariant && <Field label="Other variant" required><input className={inputClass} value={form.variant} onChange={(e) => set('variant', e.target.value)} placeholder="Enter variant / trim" /></Field>}
          <Field label="Body type" required>
            <select className={inputClass} value={form.bodyType} onChange={(e) => set('bodyType', e.target.value)}>{BODY_TYPES.map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
          <Field label="Fuel type" required>
            <select className={inputClass} value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>{FUEL_TYPES.map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
          <Field label="Transmission" required>
            <select className={inputClass} value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>{TRANSMISSIONS.map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
          <Field label="Drivetrain">
            <select className={inputClass} value={form.drivetrain} onChange={(e) => set('drivetrain', e.target.value)}>{DRIVETRAINS.map((b) => <option key={b} value={b}>{b || '—'}</option>)}</select>
          </Field>
        </div>
      </Card>

      <Card
        title="Exterior colours"
        actions={(!photoMode || manualColours) ? <button type="button" className={smallBtn} onClick={() => setColours((c) => [...c, emptyColour()])} disabled={colours.length >= 24}>+ Add colour</button> : undefined}
      >
        {photoMode && <>
          {colours[selectedPhoto]?.imageUrl && <img key={colours[selectedPhoto].imageUrl} src={colours[selectedPhoto].imageUrl} alt={`${form.make} ${form.model} in ${colours[selectedPhoto].name}`} className="w-full h-64 sm:h-80 object-contain bg-gray-50 rounded-xl mb-4" />}
          <div className="flex flex-wrap gap-3 mb-4">{colours.filter((c) => c.name).map((c, i) => <button type="button" key={`${c.name}-${i}`} aria-pressed={selectedPhoto === i} onClick={() => setSelectedPhoto(i)} className={`${smallBtn} ${selectedPhoto === i ? 'ring-2 ring-primary-accent' : ''}`}><span className="w-5 h-5 rounded-full border" style={{ backgroundColor: c.previewHex }} />{c.name}</button>)}</div>
          {lookingUp && <p role="status" className="text-body-sm text-primary-muted mb-4">Fetching colours and car photos…</p>}
          <button type="button" className="text-caption underline" onClick={() => setManualColours((v) => !v)}>{manualColours ? 'Hide manual colour setup' : 'Manual colour setup (optional)'}</button>
        </>}
        {(!photoMode || manualColours) && <>
        <p className="text-caption text-primary-muted mb-3">
          Use the manufacturer&apos;s colour name and paint code. The swatch is a rendering colour only — mark a colour as verified once checked against the manufacturer&apos;s colour list.
        </p>
        <div className="space-y-3">
          {colours.map((c, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-4"><Field label={i === 0 ? 'Colour name (primary)' : 'Colour name'}><input className={inputClass} value={c.name} onChange={(e) => setColour(i, { name: e.target.value })} placeholder="Aurora Black Pearl" /></Field></div>
              <div className="col-span-6 sm:col-span-2"><Field label="Paint code"><input className={inputClass} value={c.manufacturerPaintCode} onChange={(e) => setColour(i, { manufacturerPaintCode: e.target.value })} placeholder="ABP" /></Field></div>
              {photoMode && <div className="col-span-12"><Field label="Colour photo URL" required><input type="url" className={inputClass} value={c.imageUrl || ''} onChange={(e) => setColour(i, { imageUrl: e.target.value })} placeholder="https://manufacturer.example/car-blue.png" /></Field></div>}
              <div className="col-span-6 sm:col-span-2">
                <Field label="Swatch">
                  <div className="flex gap-1.5">
                    <input type="color" className="h-9 w-10 rounded border border-gray-200 bg-white p-0.5" value={c.previewHex} onChange={(e) => setColour(i, { previewHex: e.target.value })} />
                    <input className={inputClass} value={c.previewHex} onChange={(e) => setColour(i, { previewHex: e.target.value })} />
                  </div>
                </Field>
              </div>
              <div className="col-span-5 sm:col-span-2">
                <Field label="Finish">
                  <select className={inputClass} value={c.finish} onChange={(e) => setColour(i, { finish: e.target.value as ColourRow['finish'] })}>
                    <option value="solid">Solid</option><option value="metallic">Metallic</option><option value="pearl">Pearl</option><option value="matte">Matte</option>
                  </select>
                </Field>
              </div>
              <div className="col-span-5 sm:col-span-1">
                <label className="flex items-center gap-1.5 text-caption pb-2">
                  <input type="checkbox" checked={c.availabilityStatus === 'AVAILABLE'} onChange={(e) => setColour(i, { availabilityStatus: e.target.checked ? 'AVAILABLE' : 'UNVERIFIED' })} />
                  Verified
                </label>
              </div>
              <div className="col-span-2 sm:col-span-1 pb-1">
                <button type="button" className="text-caption text-red-600 disabled:opacity-30" disabled={colours.length === 1} onClick={() => setColours((cs) => cs.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        </>}
      </Card>

      <Card title="Options, price & specifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Interior options" hint="One per line or comma-separated"><textarea className={inputClass} rows={2} value={form.interiorOptions} onChange={(e) => set('interiorOptions', e.target.value)} placeholder="Black & Beige leatherette" /></Field>
          <Field label="Wheel options" hint="One per line or comma-separated"><textarea className={inputClass} rows={2} value={form.wheelOptions} onChange={(e) => set('wheelOptions', e.target.value)} placeholder="17-inch crystal-cut alloys" /></Field>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2"><Field label="Ex-showroom price"><input className={inputClass} type="number" min={0} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="1765000" /></Field></div>
            <Field label="Currency"><input className={inputClass} maxLength={3} value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} /></Field>
            <label className="col-span-3 flex items-start gap-2 text-caption text-primary-muted">
              <input type="checkbox" className="mt-0.5" checked={form.priceVerified} onChange={(e) => set('priceVerified', e.target.checked)} />
              I have verified this price against the manufacturer&apos;s official price list. Unverified prices are shown to customers as indicative.
            </label>
          </div>
          <Field label="Manufacturer page (source for specs)"><input className={inputClass} value={form.manufacturerUrl} onChange={(e) => set('manufacturerUrl', e.target.value)} placeholder="https://www.kia.com/in/our-vehicles/seltos/showroom.html" /></Field>
        </div>
        <div className="mt-4">
          <p className="text-caption font-medium text-primary-text mb-2">Specifications</p>
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputClass} placeholder="Engine" value={s.key} onChange={(e) => setSpecs((x) => x.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))} />
                <input className={inputClass} placeholder="1.5L petrol" value={s.value} onChange={(e) => setSpecs((x) => x.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))} />
                <button type="button" className="text-caption text-red-600 px-2" onClick={() => setSpecs((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : [{ key: '', value: '' }]))}>×</button>
              </div>
            ))}
            <button type="button" className={smallBtn} onClick={() => setSpecs((x) => [...x, { key: '', value: '' }])}>+ Add specification</button>
          </div>
        </div>
        <div className="mt-4">
          <Field label="Description"><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        </div>
      </Card>

      <Card title="Reference images (optional)">
        <p className="text-caption text-primary-muted mb-3">
          Official press photos help the AI preview generator match the real vehicle. They are never shown to customers as 3D renders.
        </p>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setReferenceImages(Array.from(e.target.files ?? []).slice(0, 6))} className="text-body-sm" />
        {referenceImages.length > 0 && <p className="mt-2 text-caption text-primary-muted">{referenceImages.length} image(s) selected</p>}
      </Card>

      <Card title="Licensed 3D model (optional)">
        <p className="text-caption text-primary-muted mb-3">
          If you already have a licensed .glb for this exact vehicle, upload it here. Otherwise the pipeline searches licensed sources and asks you to review candidates. A model is never published until you verify it is the exact vehicle or explicitly approve it as approximate.
        </p>
        <input type="file" accept=".glb,model/gltf-binary" onChange={(e) => setModelFile(e.target.files?.[0] ?? null)} className="text-body-sm" />
        {modelFile && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Licence" required>
              <select className={inputClass} value={modelMeta.licenceLabel} onChange={(e) => setModelMeta((m) => ({ ...m, licenceLabel: e.target.value }))}>{LICENCES.map((l) => <option key={l}>{l}</option>)}</select>
            </Field>
            <Field label="Licence URL"><input className={inputClass} value={modelMeta.licenceUrl} onChange={(e) => setModelMeta((m) => ({ ...m, licenceUrl: e.target.value }))} /></Field>
            <Field label="Source URL"><input className={inputClass} value={modelMeta.sourceUrl} onChange={(e) => setModelMeta((m) => ({ ...m, sourceUrl: e.target.value }))} /></Field>
            <Field label="Author"><input className={inputClass} value={modelMeta.author} onChange={(e) => setModelMeta((m) => ({ ...m, author: e.target.value }))} /></Field>
            <div className="sm:col-span-2"><Field label="Attribution text (if the licence requires it)"><input className={inputClass} value={modelMeta.attributionText} onChange={(e) => setModelMeta((m) => ({ ...m, attributionText: e.target.value }))} /></Field></div>
            <label className="sm:col-span-2 flex items-center gap-2 text-caption text-primary-muted">
              <input type="checkbox" checked={modelMeta.claimsExactMatch} onChange={(e) => setModelMeta((m) => ({ ...m, claimsExactMatch: e.target.checked }))} />
              The supplier states this model matches this exact make, model, year and generation (still requires review).
            </label>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-end gap-3 pb-10">
        {busy && <span className="text-body-sm text-primary-muted">{busy}</span>}
        <Link href="/admin/vehicles" className={smallBtn}>Cancel</Link>
        <button type="submit" className={primaryBtn} disabled={!!busy}>{photoMode ? 'Create & Publish Photo Preview' : 'Save Vehicle & Generate AI Assets'}</button>
      </div>
    </form>
  );
}
