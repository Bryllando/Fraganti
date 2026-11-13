import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { store, STORE_EVENT } from '../services/browserStore.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [snapshot, setSnapshot] = useState(() => {
    try { return { state: store.read(), error: null }; }
    catch (error) { return { state: null, error }; }
  });
  const [notice, setNotice] = useState('');
  const refresh = useCallback(() => {
    try { setSnapshot({ state: store.read(), error: null }); }
    catch (error) { setSnapshot(previous => ({ ...previous, error })); }
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refresh);
    window.addEventListener(STORE_EVENT, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(STORE_EVENT, refresh); };
  }, [refresh]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (snapshot.error) return <main className="container recovery-page"><p className="eyebrow">OUD & AURA · DEMO</p><h1>Let’s recover your boutique.</h1><p role="alert">{snapshot.error.message}</p><p>Resetting replaces only this site’s demo products, categories, cart, and orders. Other browser data is unaffected.</p><button className="btn btn-dark" onClick={async () => { if (window.confirm('Reset all OUD & AURA demo data? Saved orders and your cart will be removed.')) { try { await store.reset(); refresh(); } catch (error) { setSnapshot(previous => ({ ...previous, error })); } } }}>Reset demo data</button><button className="btn btn-outline-dark ms-2" onClick={refresh}>Try again</button></main>;

  return <StoreContext.Provider value={{ ...snapshot, refresh, notify: setNotice }}>
    {children}
    {notice && <div className="notice-toast" role="status"><i className="bi bi-check-circle" aria-hidden="true" /><span>{typeof notice === 'string' ? notice : notice.message}</span>{notice.to && <Link to={notice.to} onClick={() => setNotice('')}>{notice.label}</Link>}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}><i className="bi bi-x-lg" aria-hidden="true" /></button></div>}
  </StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
