'use client';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, API_URL } from '@/lib/api-client';
import { canManageSales } from '@/lib/admin-auth';
type Item = {
  label: string;
  note: string;
  kind: 'CHARGE' | 'DISCOUNT';
  amount: string;
};
type Draft = {
  customerName: string;
  customerLocation: string;
  issuerName: string;
  issuerAddress: string;
  issuerContact: string;
  validUntil: string;
  deliveryEstimate: string;
  terms: string;
  items: Item[];
};
type Revision = {
  id: string;
  number: number;
  totalPaise: number;
  snapshot: Omit<Draft, 'items'> & {
    items: {
      label: string;
      note?: string;
      kind: 'CHARGE' | 'DISCOUNT';
      amountPaise: number;
    }[];
  };
};
type Row = {
  id: string;
  phone: string;
  email: string;
  status: string;
  version: number;
  createdAt: string;
  vehicleSnapshot: { title: string; variant: string; colour: string };
  revisions: Revision[];
};
const money = (value: number) =>
  'INR ' +
  (value / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
function paise(value: string) {
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(value))
    throw new Error('Enter INR amounts with at most two decimal places.');
  const [whole, fraction = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (result > 2000000000)
    throw new Error('The quotation amount exceeds the supported limit.');
  return result;
}
const empty = (): Draft => ({
  customerName: '',
  customerLocation: '',
  issuerName: '',
  issuerAddress: '',
  issuerContact: '',
  validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  deliveryEstimate: '',
  terms:
    'Prices are subject to the stated validity. Availability and delivery will be confirmed by our team. This quotation does not reserve a vehicle.',
  items: [
    { label: 'Ex-showroom price', note: '', kind: 'CHARGE', amount: '0' },
  ],
});
const inputClass =
  'w-full border border-primary-border rounded-lg p-3 mt-1 text-sm bg-white';
export default function QuotationsPage() {
  const { token, user } = useAuth();
  const allowed = canManageSales(user?.role);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    if (!token || !allowed) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get<{ items: Row[]; total: number }>(
        `/quotations?page=${page}&limit=20${status ? '&status=' + status : ''}`,
        token,
      );
      setRows(response.items);
      setTotal(response.total);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not load quotations.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, allowed, page, status]);
  useEffect(() => {
    void load();
  }, [load]);
  async function prepare(row: Row) {
    if (!token) return;
    setError('');
    try {
      const detail = await api.get<Row>('/quotations/' + row.id, token);
      setSelected(detail);
      const latest = detail.revisions[0]?.snapshot;
      setDraft(
        latest
          ? {
              customerName: latest.customerName,
              customerLocation: latest.customerLocation,
              issuerName: latest.issuerName,
              issuerAddress: latest.issuerAddress,
              issuerContact: latest.issuerContact,
              validUntil: latest.validUntil,
              deliveryEstimate: latest.deliveryEstimate ?? '',
              terms: latest.terms,
              items: latest.items.map((item) => ({
                label: item.label,
                kind: item.kind,
                note: item.note ?? '',
                amount: (item.amountPaise / 100).toFixed(2),
              })),
            }
          : empty(),
      );
      setReview(false);
      setFormError('');
      dialog.current?.showModal();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not open request.',
      );
    }
  }
  function calculation() {
    const items = draft.items.map((item) => ({
      label: item.label,
      note: item.note,
      kind: item.kind,
      amountPaise: paise(item.amount),
    }));
    const charges = items
      .filter((i) => i.kind === 'CHARGE')
      .reduce((sum, i) => sum + i.amountPaise, 0);
    const discount = items
      .filter((i) => i.kind === 'DISCOUNT')
      .reduce((sum, i) => sum + i.amountPaise, 0);
    if (charges > 2000000000 || discount >= charges)
      throw new Error(
        'Charges must exceed discounts and stay within INR 2 crore.',
      );
    return { items, totalPaise: charges - discount };
  }
  function reviewForm(event: FormEvent) {
    event.preventDefault();
    try {
      calculation();
      setFormError('');
      setReview(true);
    } catch (cause) {
      setFormError((cause as Error).message);
    }
  }
  async function createRevision() {
    if (!selected || !token || busy) return;
    setBusy(true);
    setFormError('');
    try {
      const calculated = calculation();
      await api.post(
        '/quotations/' + selected.id + '/revisions',
        {
          ...draft,
          items: calculated.items,
          expectedVersion: selected.version,
          reviewed: true,
        },
        token,
      );
      dialog.current?.close();
      setNotice(
        'Quotation revision created. Download the PDF and contact the customer personally.',
      );
      await load();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : 'Could not create quotation.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function updateStatus(row: Row, value: string) {
    if (!token) return;
    setError('');
    try {
      await api.post(
        '/quotations/' + row.id + '/status',
        { status: value, expectedVersion: row.version },
        token,
      );
      await load();
    } catch (cause) {
      await load();
      setError(
        cause instanceof Error ? cause.message : 'Could not update status.',
      );
    }
  }
  async function download(row: Row) {
    if (!token || !row.revisions[0]) return;
    setError('');
    try {
      const revision = row.revisions[0];
      const response = await fetch(
        `${API_URL}/quotations/${row.id}/revisions/${revision.id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
      );
      if (!response.ok)
        throw new Error(
          'Could not download this quotation. Refresh and try again.',
        );
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `quotation-${row.id}-r${revision.number}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  const field = (
    key: keyof Omit<Draft, 'items'>,
    label: string,
    maxLength: number,
    multiline = false,
    required = true,
  ) => (
    <label className="block text-sm font-semibold">
      {label}
      {multiline ? (
        <textarea
          required={required}
          maxLength={maxLength}
          rows={3}
          className={inputClass}
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      ) : (
        <input
          required={required}
          maxLength={maxLength}
          type={key === 'validUntil' ? 'date' : 'text'}
          min={
            key === 'validUntil'
              ? new Date().toISOString().slice(0, 10)
              : undefined
          }
          className={inputClass}
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      )}
    </label>
  );
  const changeItem = (index: number, key: keyof Item, value: string) =>
    setDraft({
      ...draft,
      items: draft.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Sales workspace</p>
          <h1 className="text-3xl font-bold mt-3">Requested quotations</h1>
          <p className="text-sm text-primary-muted mt-3">
            Prepare a reviewed price quote, download it and contact the customer
            personally.
          </p>
        </div>
        {allowed && (
          <button
            className="btn-secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh
          </button>
        )}
      </div>
      {!allowed ? (
        <p>You do not have access to quotation requests.</p>
      ) : (
        <>
          <label className="block text-sm">
            Filter quotation status
            <select
              className="border rounded-lg p-2 ml-3"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {['NEW', 'CONTACTED', 'CLOSED'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="bg-red-50 text-red-700 rounded-xl p-4">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-green-700">
              {notice}
            </p>
          )}
          {loading && <p>Loading quotation requests…</p>}
          <div className="surface overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[850px]">
              <caption className="sr-only">Customer quotation requests</caption>
              <thead className="bg-primary-bg text-primary-muted">
                <tr>
                  {[
                    'Requested',
                    'Car',
                    'Contact',
                    'Status',
                    'Quotation',
                    'Actions',
                  ].map((label) => (
                    <th key={label} className="p-4">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-primary-border">
                    <td className="p-4">
                      <p>
                        {new Date(row.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      <p className="text-xs text-primary-muted max-w-32 break-all mt-1">
                        {row.id}
                      </p>
                    </td>
                    <td className="p-4">
                      <strong>{row.vehicleSnapshot.title}</strong>
                      <p className="text-xs mt-1">
                        {[
                          row.vehicleSnapshot.variant,
                          row.vehicleSnapshot.colour,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </td>
                    <td className="p-4">
                      <a
                        className="text-primary-accent"
                        href={'tel:+91' + row.phone}
                      >
                        {row.phone}
                      </a>
                      <br />
                      <a
                        className="text-primary-accent break-all"
                        href={'mailto:' + encodeURIComponent(row.email)}
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="p-4">
                      <select
                        aria-label={'Quotation status ' + row.id}
                        className="border rounded-lg p-2"
                        value={row.status}
                        onChange={(e) => void updateStatus(row, e.target.value)}
                      >
                        {['NEW', 'CONTACTED', 'CLOSED'].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      {row.revisions[0] ? (
                        <>
                          <p>Revision {row.revisions[0].number}</p>
                          <p>{money(row.revisions[0].totalPaise)}</p>
                        </>
                      ) : (
                        'Not prepared'
                      )}
                    </td>
                    <td className="p-4 space-y-2">
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => void prepare(row)}
                      >
                        Prepare quotation
                      </button>
                      {row.revisions[0] && (
                        <button
                          className="btn-primary text-xs"
                          onClick={() => void download(row)}
                        >
                          Download PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !rows.length && (
              <p className="p-8 text-primary-muted">
                No quotation requests found.
              </p>
            )}
          </div>
          <div className="flex justify-between items-center gap-3 text-sm">
            <p>
              {total} requests · Page {page}
            </p>
            <div className="flex gap-3">
              <button
                className="btn-secondary"
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn-secondary"
                disabled={page * 20 >= total || loading}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="prepare-quotation-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        className="rounded-2xl p-6 w-[min(95vw,850px)] max-h-[90vh] overflow-y-auto m-auto backdrop:bg-primary-text/60 text-primary-text"
      >
        <div className="flex justify-between items-center gap-4">
          <h2 id="prepare-quotation-title" className="text-xl font-bold">
            Prepare quotation
          </h2>
          <button
            disabled={busy}
            className="btn-secondary"
            onClick={() => dialog.current?.close()}
            aria-label="Close quotation preparation"
          >
            ✕
          </button>
        </div>
        {selected && (
          <>
            <p className="text-sm text-primary-muted my-4">
              {selected.vehicleSnapshot.title} · {selected.phone} ·{' '}
              {selected.email}
            </p>
            {review ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Review price quotation</h3>
                <p className="whitespace-pre-wrap">
                  {draft.customerName} · {draft.customerLocation}
                </p>
                <p className="whitespace-pre-wrap">
                  {draft.issuerName}
                  <br />
                  {draft.issuerAddress}
                  <br />
                  {draft.issuerContact}
                </p>
                <p>
                  Valid through {draft.validUntil}
                  {draft.deliveryEstimate
                    ? ' · Delivery: ' + draft.deliveryEstimate
                    : ''}
                </p>
                <dl className="divide-y">
                  {calculation().items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-5 py-3">
                      <dt>
                        {item.label}
                        <span className="block text-xs text-primary-muted whitespace-pre-wrap">
                          {item.note}
                        </span>
                      </dt>
                      <dd>
                        {item.kind === 'DISCOUNT' ? '- ' : ''}
                        {money(item.amountPaise)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xl font-bold">
                  Total: {money(calculation().totalPaise)}
                </p>
                <p className="whitespace-pre-wrap text-sm">{draft.terms}</p>
                <div className="flex gap-3">
                  <button
                    disabled={busy}
                    className="btn-secondary"
                    onClick={() => setReview(false)}
                  >
                    Back to edit
                  </button>
                  <button
                    disabled={busy}
                    className="btn-primary disabled:opacity-50"
                    onClick={() => void createRevision()}
                  >
                    {busy ? 'Creating…' : 'Confirm and create PDF'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={reviewForm} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  {field('customerName', 'Customer name', 120)}
                  {field('customerLocation', 'Customer location', 300)}
                  {field('issuerName', 'Seller name', 150)}
                  {field('issuerContact', 'Seller contact', 150)}
                  {field('issuerAddress', 'Seller address', 500, true)}
                  {field('validUntil', 'Valid through', 10)}
                  {field(
                    'deliveryEstimate',
                    'Estimated delivery',
                    120,
                    false,
                    false,
                  )}
                </div>
                <h3 className="font-semibold">Price breakdown</h3>
                <p className="text-xs text-primary-muted">
                  Enter approved INR amounts. Taxes and charges are supplied by
                  staff; rates are not calculated automatically.
                </p>
                {draft.items.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-primary-border p-4 space-y-3"
                  >
                    <div className="grid sm:grid-cols-3 gap-3">
                      <label className="text-xs">
                        Item {i + 1}
                        <input
                          required
                          maxLength={100}
                          className={inputClass}
                          value={item.label}
                          onChange={(e) =>
                            changeItem(i, 'label', e.target.value)
                          }
                        />
                      </label>
                      <label className="text-xs">
                        Type {i + 1}
                        <select
                          className={inputClass}
                          value={item.kind}
                          onChange={(e) =>
                            changeItem(i, 'kind', e.target.value)
                          }
                        >
                          <option value="CHARGE">Charge</option>
                          <option value="DISCOUNT">Discount</option>
                        </select>
                      </label>
                      <label className="text-xs">
                        Amount INR {i + 1}
                        <input
                          required
                          inputMode="decimal"
                          className={inputClass}
                          value={item.amount}
                          onChange={(e) =>
                            changeItem(i, 'amount', e.target.value)
                          }
                        />
                      </label>
                    </div>
                    <label className="block text-xs">
                      Item note {i + 1}
                      <textarea
                        rows={2}
                        maxLength={300}
                        className={inputClass}
                        value={item.note}
                        onChange={(e) => changeItem(i, 'note', e.target.value)}
                      />
                    </label>
                    {draft.items.length > 1 && (
                      <button
                        type="button"
                        className="text-red-700 text-xs"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            items: draft.items.filter((_, n) => n !== i),
                          })
                        }
                      >
                        Remove item {i + 1}
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  disabled={draft.items.length >= 20}
                  className="btn-secondary"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      items: [
                        ...draft.items,
                        { label: '', note: '', kind: 'CHARGE', amount: '0' },
                      ],
                    })
                  }
                >
                  Add price item
                </button>
                {field('terms', 'Quotation terms', 3000, true)}
                <button type="submit" className="btn-primary w-full">
                  Review quotation
                </button>
              </form>
            )}
            {formError && (
              <p role="alert" className="text-red-700 text-sm mt-4">
                {formError}
              </p>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
