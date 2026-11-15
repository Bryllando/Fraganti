import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import uploadIcon from 'bootstrap-icons/icons/cloud-upload.svg';
import imageIcon from 'bootstrap-icons/icons/image.svg';
import { useStore } from '../../hooks/useStore.jsx';
import { store } from '../../services/browserStore.js';
import { isUploadedProductImage, prepareProductImage } from '../../utils/productImage.js';
import { Alert, EmptyState, Icon, PageIntro, ProductImage } from '../../components/UI.jsx';

export default function ProductForm() {
  const { id } = useParams();
  const { state, notify } = useStore();
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const product = state.products.find(p => p.id === id);
  const [original, setOriginal] = useState(product);
  const [values, setValues] = useState(() => product
    ? { ...product, price: (product.price / 100).toFixed(2), stock: String(product.stock) }
    : { name: '', brand: '', categoryId: '', description: '', image: '', price: '', stock: '0', active: true, size: '' });
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const uploaded = isUploadedProductImage(values.image);

  if (id && !product) return <EmptyState title="This product no longer exists." to="/admin/products" action="Back to products"/>;

  function update(e) {
    const { name, type, checked, value } = e.target;
    setValues(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'image') setImageError('');
  }

  async function uploadPhoto(e) {
    const file = e.currentTarget.files[0];
    e.currentTarget.value = '';
    if (!file) return;
    setImageError('');
    setImageBusy(true);
    try {
      const image = await prepareProductImage(file);
      setValues(previous => ({ ...previous, image }));
    } catch (error) {
      setImageError(error.message);
    } finally {
      setImageBusy(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (busy || imageBusy) return;
    setError('');
    setBusy(true);
    try {
      await store.saveProduct(values, id, original);
      notify(`Product ${id ? 'updated' : 'added'}. Storefront changes are saved.`);
      navigate('/admin/products');
    } catch (error) {
      setError(error.message);
      setConflict(error.code === 'CONFLICT');
    } finally {
      setBusy(false);
    }
  }

  function input(name, label, { type = 'text', required = false, icon, ...props } = {}) {
    return <div>
      <label className="form-label" htmlFor={`product-${name}`}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <div className="product-field-control">
        {icon && <Icon name={icon}/>}
        <input className="form-control" id={`product-${name}`} name={name} type={type} required={required} value={values[name]} onChange={update} {...props}/>
      </div>
    </div>;
  }

  return <>
    <Link className="text-link mb-4" to="/admin/products"><Icon name="arrow-left"/> Back to products</Link>
    <PageIntro eyebrow="CURATE YOUR COLLECTION" title={id ? 'Edit fragrance' : 'A new discovery.'}>
      {id ? 'Update the details or change the photo of your fragrance.' : 'Add your fragrance details and a product photo. Fields marked * are required.'}
    </PageIntro>
    <Alert>{error}{conflict && <div className="mt-2">
      <button type="button" className="btn btn-outline-dark" onClick={() => {
        setValues({ ...product, price: (product.price / 100).toFixed(2), stock: String(product.stock) });
        setOriginal(product);
        setConflict(false);
        setError('');
        setImageError('');
      }}>Reload latest product</button>
    </div>}</Alert>
    <form className="product-form" onSubmit={save}>
      <fieldset className="product-form-grid" disabled={busy}>
        <section className="admin-panel product-details-panel p-4">
          <h2 className="mb-2">Fragrance details</h2>
          <p className="form-text mb-4">Help customers get to know your fragrance.</p>
          <div className="row g-4">
            <div className="col-md-8">{input('name', 'Product name', { required: true, icon: 'tag', placeholder: 'e.g. Hawas Ice', maxLength: 150 })}</div>
            <div className="col-md-4">{input('size', 'Bottle size', { icon: 'droplet', placeholder: 'e.g. 100 ml', maxLength: 30 })}</div>
            <div className="col-md-6">{input('brand', 'Brand / collection', { icon: 'bag', placeholder: 'e.g. Rasasi', maxLength: 150 })}</div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="product-category">Category <span aria-hidden="true">*</span></label>
              <div className="product-field-control">
                <Icon name="grid"/>
                <select className="form-select" name="categoryId" id="product-category" value={values.categoryId} onChange={update} required>
                  <option value="">Select a scent category</option>
                  {state.categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="product-description">Description <span aria-hidden="true">*</span></label>
              <div className="product-field-control product-field-control--textarea">
                <Icon name="text-left"/>
                <textarea className="form-control" id="product-description" name="description" rows="5" value={values.description} onChange={update} placeholder="Describe the scent, key notes, and when to wear it." required maxLength="3000"/>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="product-price">Price (PHP) <span aria-hidden="true">*</span></label>
              <div className="product-field-control">
                <span className="product-field-prefix" aria-hidden="true">₱</span>
                <input className="form-control" id="product-price" name="price" inputMode="decimal" placeholder="e.g. 2450.00" value={values.price} onChange={update} required aria-describedby="product-price-help"/>
              </div>
              <small className="form-text" id="product-price-help">Enter the price per bottle, up to two decimal places.</small>
            </div>
            <div className="col-md-6">
              {input('stock', 'Stock quantity', { icon: 'box-seam', type: 'number', required: true, min: 0, max: 1000000, step: 1, placeholder: 'e.g. 20', inputMode: 'numeric', 'aria-describedby': 'product-stock-help' })}
              <small className="form-text" id="product-stock-help">Number of bottles available. Use 0 for out of stock.</small>
            </div>
          </div>
          <div className="product-availability">
            <div className="form-check form-switch">
              <input className="form-check-input" id="product-active" name="active" type="checkbox" checked={values.active} onChange={update} aria-describedby="product-active-help"/>
              <label className="form-check-label" htmlFor="product-active">Active on storefront</label>
            </div>
            <p className="form-text mb-0" id="product-active-help">Turn off to hide this fragrance. Active products with zero stock appear as Out of Stock.</p>
          </div>
        </section>

        <section className="admin-panel product-photo-panel p-4">
          <h2 className="mb-2">Product image <span className="product-required" aria-hidden="true">*</span></h2>
          <p className="form-text mb-3">Choose a clear photo of your perfume.</p>
          {values.image
            ? <ProductImage image={values.image} name={values.name || 'Fragrance preview'} className="form-image-preview"/>
            : <div className="product-photo-placeholder">
                <img src={imageIcon} alt="" aria-hidden="true"/>
                <strong>Your fragrance photo</strong>
                <span>Upload a photo or paste an image link below.</span>
              </div>}
          <div className="product-photo-actions">
            <button className="btn btn-outline-dark" type="button" disabled={imageBusy} onClick={() => fileInput.current.click()}>
              <img src={uploadIcon} alt="" aria-hidden="true"/>
              {imageBusy ? 'Preparing…' : values.image ? 'Change photo' : 'Upload photo'}
            </button>
            {values.image && <button className="btn product-remove-photo" type="button" disabled={imageBusy} onClick={() => {
              setValues(previous => ({ ...previous, image: '' }));
              setImageError('');
            }}><Icon name="trash3"/> Remove</button>}
          </div>
          <input ref={fileInput} id="product-upload" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload product photo" aria-describedby="product-upload-help" onChange={uploadPhoto} disabled={imageBusy} hidden/>
          <p className="form-text mb-0" id="product-upload-help">JPG, PNG or WebP, up to 5 MB. A square photo works best.</p>
          {uploaded && <p className="product-photo-status" role="status"><Icon name="check-circle"/> Uploaded photo selected.</p>}
          {imageError && <p className="field-error mt-2 mb-0" role="alert">{imageError}</p>}
          <div className="product-image-link">
            {input('image', 'Or use an image link', {
              icon: 'link-45deg',
              value: uploaded ? '' : values.image,
              placeholder: 'https://example.com/perfume.jpg',
              maxLength: 2000,
              required: !values.image,
              disabled: imageBusy,
              'aria-describedby': 'product-image-help',
            })}
            <p className="form-text mb-0 mt-2" id="product-image-help">Use a direct image URL or a path such as /images/products/hawas-ice.webp.</p>
          </div>
        </section>
        <div className="product-form-actions">
          <button className="btn btn-dark" disabled={busy || imageBusy}>
            {busy ? 'Saving…' : imageBusy ? 'Preparing photo…' : 'Save product'} <Icon name="check2"/>
          </button>
          <Link className="btn btn-outline-dark" to="/admin/products">Cancel</Link>
        </div>
      </fieldset>
    </form>
  </>;
}
