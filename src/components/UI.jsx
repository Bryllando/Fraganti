import { Children, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export const Icon = ({ name, ...props }) => <i className={`bi bi-${name}`} aria-hidden="true" {...props} />;

export function Brand({ light = false }) {
  return <Link className={`brand ${light ? 'brand-light' : ''}`} to="/" aria-label="OUD & AURA home"><svg width="24" height="31" viewBox="0 0 24 31" aria-hidden="true"><path d="M12 2C6 11 2 16 2 21a10 10 0 0 0 20 0c0-5-4-10-10-19Z" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M7 21a5 5 0 0 0 5 5" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg><span>OUD <span className="brand-amp">&</span> AURA<small>THE ART OF ARABIAN FRAGRANCE</small></span></Link>;
}

export function ProductImage({ image = '', name = 'Illustrative sample fragrance bottle', className = '' }) {
  image = typeof image === 'string' ? image : '';
  const match = image.match(/^(.*)#bottle-(\d+)$/);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  if (match) {
    const index = Math.min(11, Math.max(0, Number(match[2])));
    return <div className={`product-image catalog-shot ${className}`} role="img" aria-label={`${name} — illustrative sample bottle`} style={{ backgroundImage: `url("${match[1]}")`, backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 50}%` }} />;
  }
  if (failed || !image) return <div className={`product-image image-fallback ${className}`} role="img" aria-label="Fragrance image unavailable"><Icon name="droplet"/><span>OUD & AURA</span></div>;
  return <img className={`product-image ${className}`} src={image} alt={`${name} — sample product image`} loading="lazy" onError={() => setFailed(true)} />;
}

export function EmptyState({ icon = 'bag', title, children, to, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon}/></span><h2>{title}</h2><div>{children}</div>{to && <Link className="btn btn-dark mt-3" to={to}>{action || 'Explore fragrances'} <Icon name="arrow-right"/></Link>}</div>;
}

export function Alert({ children, type = 'danger' }) {
  const hasContent = Children.toArray(children).some(child => typeof child !== 'string' || child.trim().length > 0);
  return hasContent ? <div className={`alert alert-${type}`} role={type === 'danger' ? 'alert' : 'status'}>{children}</div> : null;
}

export function PageIntro({ eyebrow, title, children, action }) {
  return <div className="page-intro"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children && <p className="text-muted mb-0">{children}</p>}</div>{action}</div>;
}

export function Quantity({ value, max, onChange, onValidityChange, onPendingChange, name = 'fragrance', disabled = false }) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(0);
  const editVersion = useRef(0);
  const errorId = useId();
  useEffect(() => {
    // Earlier writes must not replace a newer draft that is still being typed.
    if (pending.current === 0 && !error) setDraft(String(value));
  }, [value, busy, error]);
  async function commit(next) {
    const version = ++editVersion.current;
    if (!Number.isSafeInteger(next) || next < 1 || next > max) {
      setError(`Choose 1–${max} whole bottles.`);
      onValidityChange?.(false);
      return;
    }
    setDraft(String(next)); setError(''); setBusy(true);
    pending.current += 1;
    onValidityChange?.(true); onPendingChange?.(true);
    try { await onChange(next); }
    catch (error) {
      if (version === editVersion.current) { setError(error.message); onValidityChange?.(false); }
    }
    finally {
      pending.current -= 1;
      if (pending.current === 0) { setBusy(false); onPendingChange?.(false); }
    }
  }
  return <div className="quantity-wrap"><div className="quantity-control"><button type="button" aria-label={`Decrease quantity for ${name}`} disabled={disabled || busy || value <= 1} onClick={() => commit(value - 1)}><Icon name="dash"/></button><input aria-label={`Quantity for ${name}`} type="number" inputMode="numeric" min="1" max={Math.max(1, max)} step="1" value={draft} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={e => { const text = e.target.value; setDraft(text); commit(Number(text)); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}/><button type="button" aria-label={`Increase quantity for ${name}`} disabled={disabled || busy || value >= max} onClick={() => commit(value + 1)}><Icon name="plus"/></button></div>{error && <small className="field-error" id={errorId} role="alert">{error}</small>}</div>;
}

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

export function ConfirmDialog({ title, children, confirmLabel = 'Delete', dismissLabel = 'Keep it', onConfirm, onClose }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const headingId = useId();
  useEffect(() => {
    const element = ref.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog className="confirm-dialog" ref={ref} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}><h2 id={headingId}>{title}</h2><div className="text-muted">{children}</div><Alert>{error}</Alert><div className="d-flex gap-2 justify-content-end mt-4"><button className="btn btn-outline-dark" disabled={busy} onClick={onClose}>{dismissLabel}</button><button className="btn btn-danger" disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); onClose(); } catch (error) { setError(error.message); } finally { setBusy(false); } }}>{busy ? 'Saving…' : confirmLabel}</button></div></dialog>;
}
