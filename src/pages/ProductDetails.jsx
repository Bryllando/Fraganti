import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore.jsx';
import { store } from '../services/browserStore.js';
import { money } from '../utils/format.js';
import { Alert, EmptyState, Icon, ProductImage, Quantity } from '../components/UI.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, notify } = useStore();
  const [quantity, setQuantity] = useState(() => {
    const requested = Number(params.get('quantity') || 1);
    return Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  });
  const [validQuantity, setValidQuantity] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const product = state.products.find(p => p.id === id && p.active);
  if (!product) return <div className="container page-space"><EmptyState icon="droplet" title="This fragrance is unavailable." to="/shop"><p>It may have been removed from the collection. Explore our available fragrances instead.</p></EmptyState></div>;
  const category = state.categories.find(c => c.id === product.categoryId);
  const related = state.products.filter(p => p.active && p.categoryId === product.categoryId && p.id !== id).slice(0, 3);
  const inCart = state.cart.find(item => item.productId === id)?.quantity || 0;
  const remaining = Math.max(0, product.stock - inCart);
  const canBuy = validQuantity && quantity >= 1 && quantity <= product.stock && !busy;

  async function add() {
    if (!canBuy) return;
    setError(''); setBusy(true);
    try {
      await store.addToCart(id, quantity);
      notify({ message: quantity + ' × ' + product.name + ' added to your cart.', to: '/cart', label: 'View cart' });
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  return <div className="container page-space">
    <nav className="breadcrumb-nav" aria-label="Breadcrumb"><Link to="/shop">Shop</Link><Icon name="chevron-right"/><Link to={'/shop?category=' + product.categoryId}>{category?.name}</Link><Icon name="chevron-right"/><span>{product.name}</span></nav>
    <div className="row g-5 product-detail">
      <div className="col-md-6"><div className="detail-visual"><ProductImage image={product.image} name={product.name}/><span>ILLUSTRATIVE SAMPLE BOTTLE</span></div></div>
      <div className="col-md-6 detail-copy">
        <p className="eyebrow">{product.brand || 'OUD & AURA'}</p>
        <h1>{product.name}</h1>
        <p className="detail-subtitle">{category?.name} · Eau de parfum {product.size && '· ' + product.size}</p>
        <p className="detail-price">{money(product.price)}</p>
        <p className="detail-description">{product.description}</p>
        <div className="detail-stock"><span className={'stock-note ' + (product.stock === 0 ? 'unavailable' : '')}><span/>{product.stock === 0 ? 'Out of Stock' : product.stock + ' bottles available'}</span></div>
        <div className="quantity-label"><span>Quantity</span><Quantity value={quantity} max={product.stock} onChange={setQuantity} onValidityChange={setValidQuantity} name={product.name} disabled={product.stock === 0 || busy}/></div>
        {inCart > 0 && <p className="cart-context">{inCart} already in your cart. {remaining > 0 ? 'You can add up to ' + remaining + ' more.' : <Link to="/cart">View your cart to adjust quantities.</Link>}</p>}
        <Alert>{error}</Alert>
        <div className="purchase-actions">
          <button className="btn btn-outline-dark" disabled={!canBuy || quantity > remaining} onClick={add}><Icon name="cart-plus"/>{busy ? 'Adding…' : 'Add to Cart'}</button>
          <button className="btn btn-dark" disabled={!canBuy} onClick={() => navigate('/checkout?buyNow=' + encodeURIComponent(id) + '&quantity=' + quantity)}>Buy Now <Icon name="arrow-right"/></button>
        </div>
        <p className="form-text">Add to Cart to keep shopping, or Buy Now to check out this fragrance directly.</p>
        <p className="detail-demo-note"><Icon name="info-circle"/> Demo fragrance · Sample pricing · No real payment</p>
        {product.notes && <div className="fragrance-notes"><h2>The fragrance, unfolded.</h2>{[['top', 'The first impression'], ['middle', 'At the heart'], ['base', 'What stays with you']].map(([key, label]) => <div key={key}><span>{label}</span><strong>{product.notes[key]}</strong></div>)}</div>}
      </div>
    </div>
    {related.length > 0 && <section className="section-space"><div className="section-heading"><div><p className="eyebrow">KEEP EXPLORING</p><h2>In the same family.</h2></div></div><div className="row g-4">{related.map(p => <div key={p.id} className="col-6 col-lg-4"><ProductCard product={p}/></div>)}</div></section>}
  </div>;
}
