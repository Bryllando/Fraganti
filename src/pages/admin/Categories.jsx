import { useState } from 'react';
import { useStore } from '../../hooks/useStore.jsx';
import { store } from '../../services/browserStore.js';
import { Alert, ConfirmDialog, Icon, PageIntro } from '../../components/UI.jsx';

export default function Categories() {
  const { state, notify } = useStore();
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({ name: '', description: '' });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await store.saveCategory(values, editing); setValues({ name: '', description: '' }); setEditing(null); notify('Category saved.'); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <><PageIntro eyebrow="THE FRAGRANCE FAMILIES" title="Categories">Give every scent a place to belong.</PageIntro><div className="row g-4"><div className="col-lg-7"><section className="admin-panel"><div className="panel-heading"><h2>Your scent families</h2><span className="text-muted small">{state.categories.length} categories</span></div><div className="table-scroll" tabIndex="0" role="region" aria-label="Categories table, scroll horizontally on smaller screens"><table className="table admin-table"><thead><tr><th scope="col">Category</th><th scope="col">Products</th><th scope="col">Actions</th></tr></thead><tbody>{state.categories.map(c => <tr key={c.id}><td><strong>{c.name}</strong><small className="category-table-description">{c.description}</small></td><td>{state.products.filter(p => p.categoryId === c.id).length}</td><td><div className="table-actions"><button className="table-action" aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c.id); setValues({ name: c.name, description: c.description }); setError(''); document.getElementById('category-name')?.focus(); }}><Icon name="pencil-square"/> Edit</button><button className="icon-button delete-action" aria-label={`Delete ${c.name}`} onClick={() => setSelected(c)}><Icon name="trash3"/></button></div></td></tr>)}</tbody></table>{!state.categories.length && <p className="p-4 text-muted">No categories yet. Add your first scent family.</p>}</div></section></div><div className="col-lg-5"><section className="admin-panel p-4"><p className="eyebrow">CURATE YOUR COLLECTION</p><h2>{editing ? 'Edit category' : 'Add a scent family'}</h2><Alert>{error}</Alert><form onSubmit={save}><label className="form-label mt-3" htmlFor="category-name">Category name *</label><input className="form-control" id="category-name" required maxLength="100" value={values.name} onChange={e => setValues(previous => ({ ...previous, name: e.target.value }))}/><label className="form-label mt-3" htmlFor="category-description">Description (optional)</label><textarea className="form-control" rows="3" id="category-description" maxLength="500" value={values.description} onChange={e => setValues(previous => ({ ...previous, description: e.target.value }))}/><p className="form-text">Names must be unique, ignoring uppercase or lowercase differences.</p><button className="btn btn-dark mt-2" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save category' : 'Add category'} <Icon name="plus"/></button>{editing && <button type="button" className="btn btn-outline-dark mt-2 ms-2" onClick={() => { setEditing(null); setValues({ name: '', description: '' }); setError(''); }}>Cancel</button>}</form></section></div></div>{selected && <ConfirmDialog title="Delete this scent family?" confirmLabel="Delete category" onClose={() => setSelected(null)} onConfirm={async () => { await store.deleteCategory(selected.id); notify('Category deleted.'); }}><p><strong>{selected.name}</strong></p><p>Only unused categories can be deleted. Products assigned to this category, including inactive products, must be moved first.</p></ConfirmDialog>}</>;
}
