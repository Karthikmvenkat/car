'use client';
import { FormEvent, useRef, useState } from 'react';
import { api } from '@/lib/api-client';
export function QuotationRequest({
  vehicleSlug,
  vehicleTitle,
  colourId,
}: {
  vehicleSlug: string;
  vehicleTitle: string;
  colourId?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const open = () => {
    setReference('');
    setError('');
    dialog.current?.showModal();
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    const normalized = phone.replace(/[\s-]/g, '');
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(normalized)) {
      setError('Enter a valid Indian mobile number, with optional +91.');
      return;
    }
    const fingerprint = JSON.stringify({
      phone: normalized,
      email: email.trim().toLowerCase(),
      vehicleSlug,
      colourId,
    });
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, key: crypto.randomUUID() };
    setBusy(true);
    try {
      const result = await api.post<{ reference: string }>('/quotations', {
        requestKey: attempt.current!.key,
        vehicleSlug,
        colourId,
        phone: normalized,
        email: email.trim(),
        consent: true,
      });
      setReference(result.reference);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not submit your request. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={open}
        className="btn-secondary w-full text-sm"
      >
        Request quotation
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="quotation-request-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        className="rounded-2xl p-6 w-[min(92vw,460px)] max-h-[90vh] overflow-y-auto m-auto backdrop:bg-primary-text/60 text-primary-text"
      >
        <div className="flex justify-between gap-4 items-center">
          <h2 id="quotation-request-title" className="text-xl font-bold">
            Request a quotation
          </h2>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() => dialog.current?.close()}
            aria-label="Close quotation request"
          >
            ✕
          </button>
        </div>
        {reference ? (
          <div className="mt-6">
            <h3 className="font-semibold text-lg">Quotation requested</h3>
            <p role="status" className="mt-3">
              Our team will contact you soon.
            </p>
            <p className="text-xs text-primary-muted mt-3 break-all">
              Reference: {reference}
            </p>
            <button
              type="button"
              className="btn-primary w-full mt-6"
              onClick={() => dialog.current?.close()}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <p className="text-sm text-primary-muted">{vehicleTitle}</p>
            <label className="block text-sm font-semibold">
              Phone number
              <input
                type="tel"
                autoComplete="tel"
                required
                maxLength={16}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full border border-primary-border rounded-lg p-3 mt-2 font-normal"
                placeholder="9876543210"
              />
            </label>
            <label className="block text-sm font-semibold">
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full border border-primary-border rounded-lg p-3 mt-2 font-normal"
                placeholder="you@example.com"
              />
            </label>
            <label className="flex items-start gap-3 text-xs text-primary-muted">
              <input type="checkbox" required className="mt-1" />I agree to be
              contacted by the CarPal team about this quotation request.
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full disabled:opacity-50"
            >
              {busy ? 'Submitting…' : 'Submit quotation request'}
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
