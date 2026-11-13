import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../hooks/useStore.jsx';
import { store } from '../services/browserStore.js';
import { money } from '../utils/format.js';
import { Icon, ProductImage } from './UI.jsx';

export default function ProductCard({ product }) {
  const { state, notify } = useStore();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const category = state.categories.find(c => c.id === product.categoryId);
  const inCart = state.cart.find(item => item.productId === product.id)?.quantity || 0;
  async function add() {
    setBusy(true); setError('');
    try { await store.addToCart(product.id); notify({ message: `${product.name} added to your cart.`, to: '/cart', label: 'View cart' }); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <article className="product-card" data-product-id={product.id}>
    <Link className="product-visual" to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
      <ProductImage image={product.image} name={product.name}/>
      {product.stock === 0 ? <span className="product-label sold-out">Out of Stock</span> : product.isNew ? <span className="product-label">New arrival</span> : product.featured ? <span className="product-label">The signature edit</span> : null}
      <span className="visual-arrow"><Icon name="arrow-up-right"/></span>
    </Link>
    <div className="product-info"><p className="product-brand">{product.brand || 'OUD & AURA'}</p><h3><Link to={`/product/${product.id}`}>{product.name}</Link></h3><p className="product-category">{category?.name || 'Fragrance'} <span>·</span> {product.size || 'Eau de parfum'}</p><div className="product-price-line"><strong>{money(product.price)}</strong><span className={`stock-note ${product.stock === 0 ? 'unavailable' : ''}`}><span/>{product.stock === 0 ? 'Out of stock' : product.stock < 10 ? `Only ${product.stock} left` : 'In stock'}</span></div><div className="product-actions"><Link to={`/product/${product.id}`} className="btn btn-outline-dark">View Details</Link><button className="btn btn-dark" aria-label={`Add ${product.name} to cart`} disabled={busy || product.stock === 0 || inCart >= product.stock} onClick={add}><Icon name="bag-plus"/>{busy ? 'Adding…' : product.stock === 0 ? 'Sold out' : inCart >= product.stock ? 'Limit reached' : 'Add to Cart'}</button></div>{error && <small className="field-error mt-2" role="alert">{error}</small>}</div>
  </article>;
}
