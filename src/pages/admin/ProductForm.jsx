import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../hooks/useStore.jsx';
import { store } from '../../services/browserStore.js';
import { Alert, EmptyState, Icon, PageIntro, ProductImage } from '../../components/UI.jsx';

export default function ProductForm() {
  const { id } = useParams();
  const { state, notify } = useStore();
  const navigate = useNavigate();
  const product = state.products.find(p => p.id === id);
  const [original, setOriginal] = useState(product);
  const [values, setValues] = useState(() => product ? { ...product, price: (product.price / 100).toFixed(2), stock: String(product.stock) } : { name: '', brand: '', categoryId: state.categories[0]?.id || '', description: '', image: '/images/catalog.png#bottle-0', price: '', stock: '0', active: true, size: '' });
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  if (id && !product) return <EmptyState title="This product no longer exists." to="/admin/products" action="Back to products"/>;
  function update(e) { setValues(previous => ({ ...previous, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); }
  async function save(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await store.saveProduct(values, id, original); notify(`Product ${id ? 'updated' : 'added'}. Storefront changes are saved.`); navigate('/admin/products'); }
    catch (error) { setError(error.message); setConflict(error.code === 'CONFLICT'); }
    finally { setBusy(false); }
  }
  function input(name, label, { type = 'text', required = false, ...props } = {}) {
    return <div><label className="form-label" htmlFor={`product-${name}`}>{label}{required && ' *'}</label><input className="form-control" id={`product-${name}`} name={name} type={type} required={required} value={values[name]} onChange={update} {...props}/></div>;
  }
  return <><Link className="text-link mb-4" to="/admin/products"><Icon name="arrow-left"/> Back to products</Link><PageIntro eyebrow="CURATE YOUR COLLECTION" title={id ? 'Edit fragrance' : 'A new discovery.'}>{id ? 'Thoughtful changes, reflected across your storefront.' : 'Add a fragrance to your boutique. All fields marked * are required.'}</PageIntro><Alert>{error}{conflict && <div className="mt-2"><button type="button" className="btn btn-outline-dark" onClick={() => { setValues({ ...product, price: (product.price / 100).toFixed(2), stock: String(product.stock) }); setOriginal(product); setConflict(false); setError(''); }}>Reload latest product</button></div>}</Alert><form onSubmit={save}><div className="row g-4"><div className="col-lg-8"><section className="admin-panel p-4"><h2 className="mb-4">Fragrance details</h2><div className="row g-3"><div className="col-md-8">{input('name', 'Product name', { required: true, maxLength: 150 })}</div><div className="col-md-4">{input('size', 'Bottle size', { placeholder: '100 ml', maxLength: 30 })}</div><div className="col-md-6">{input('brand', 'Brand / collection', { maxLength: 150 })}</div><div className="col-md-6"><label className="form-label" htmlFor="product-category">Category *</label><select className="form-select" name="categoryId" id="product-category" value={values.categoryId} onChange={update} required><option value="">Select a category</option>{state.categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div><div className="col-12"><label className="form-label" htmlFor="product-description">Description *</label><textarea className="form-control" id="product-description" name="description" rows="5" value={values.description} onChange={update} required maxLength="3000"/></div><div className="col-md-6">{input('price', 'Price (PHP)', { required: true, inputMode: 'decimal', placeholder: '2450.00' })}<small className="form-text">Positive amount with up to two decimal places.</small></div><div className="col-md-6">{input('stock', 'Stock quantity', { type: 'number', required: true, min: 0, max: 1000000, step: 1 })}</div></div></section><section className="admin-panel p-4 mt-4"><h2 className="mb-4">Product image</h2>{input('image', 'Image URL or bundled path', { required: true, maxLength: 2000 })}<p className="form-text mb-0">Use a permitted image URL or a local path. Bundled sample bottles: /images/catalog.png#bottle-0 through #bottle-11.</p></section></div><div className="col-lg-4"><section className="admin-panel p-4"><h2 className="mb-3">Preview & availability</h2><ProductImage image={values.image} name={values.name || 'Fragrance preview'} className="form-image-preview"/><div className="form-check form-switch mt-4"><input className="form-check-input" id="product-active" name="active" type="checkbox" checked={values.active} onChange={update}/><label className="form-check-label" htmlFor="product-active">Active on storefront</label></div><p className="form-text">Inactive products are hidden from customers and cannot be ordered. Active products with zero stock remain visible as Out of Stock.</p><button className="btn btn-dark w-100 mt-2" disabled={busy}>{busy ? 'Saving…' : 'Save product'} <Icon name="check2"/></button><Link className="btn btn-outline-dark w-100 mt-2" to="/admin/products">Cancel</Link></section></div></div></form></>;
}
