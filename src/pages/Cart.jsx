import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore.jsx';
import { store } from '../services/browserStore.js';
import { cartLines } from '../services/store.js';
import { itemCount, money, orderTotal } from '../utils/format.js';
import { Alert, EmptyState, Icon, PageIntro, ProductImage, Quantity } from '../components/UI.jsx';
import ShoppingSteps from '../components/ShoppingSteps.jsx';

export default function Cart() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [quantityState, setQuantityState] = useState({});
  const lines = cartLines(state);
  const selected = lines.filter(line => line.selected !== false);
  const total = orderTotal(selected.map(line => ({ quantity: line.quantity, unitPrice: line.product?.price || 0 })));
  const invalid = selected.some(line => !line.product?.active || line.quantity > line.product.stock || quantityState[line.productId]?.valid === false);
  const updating = busy || lines.some(line => quantityState[line.productId]?.pending);
  const canCheckout = selected.length > 0 && !invalid && !updating;
  const cartCount = itemCount(state.cart);
  const selectedCount = itemCount(selected);

  async function change(operation) {
    setError(''); setBusy(true);
    try { await operation(); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  function quantityFeedback(productId, key, value) {
    setQuantityState(previous => ({ ...previous, [productId]: { ...previous[productId], [key]: value } }));
  }

  return <div className="container page-space">
    <ShoppingSteps/>
    <PageIntro eyebrow="YOUR FRAGRANCE SELECTION" title="Shopping Cart">Choose the items you’re ready to order. Keep the rest for later.</PageIntro>
    <Alert>{error}</Alert>
    {!lines.length ? <EmptyState icon="cart3" title="Your cart is empty." to="/shop" action="Start shopping"><p>Find a fragrance you love and add it to your cart.</p></EmptyState> : <div className="row g-4 g-lg-5">
      <div className="col-lg-8">
        <div className="cart-select-all"><label><input className="form-check-input" type="checkbox" checked={selected.length === lines.length} disabled={updating} onChange={e => { const checked = e.target.checked; change(() => store.selectCartItems(lines.map(line => line.productId), checked)); }}/> Select all ({lines.length} {lines.length === 1 ? 'fragrance' : 'fragrances'})</label><span>{cartCount} {cartCount === 1 ? 'bottle' : 'bottles'} in your cart</span></div>
        <div className="cart-items">
          {lines.map(({ product, productId, quantity, selected: isSelected }) => <article className={'cart-item ' + (isSelected === false ? 'is-unselected' : '')} key={productId}>
            <input className="form-check-input cart-item-select" type="checkbox" aria-label={'Select ' + (product?.name || 'unavailable fragrance')} checked={isSelected !== false} disabled={updating} onChange={e => { const checked = e.target.checked; change(() => store.selectCartItems([productId], checked)); }}/>
            <ProductImage image={product?.image} name={product?.name}/>
            <div className="cart-item-info">
              <span className="product-brand">{product?.brand || 'FRAGRANCE'}</span>
              {product?.active ? <Link className="cart-item-name" to={'/product/' + productId}>{product.name}</Link> : <strong>{product?.name || 'Unavailable fragrance'}</strong>}
              <span>{money(product?.price || 0)} / bottle</span>
              {!product?.active ? <small className="field-error">No longer available. Remove or deselect this item.</small> : quantity > product.stock ? <small className="field-error">Only {product.stock} available. Update the quantity or deselect this item.</small> : null}
              <button className="text-button remove-button" disabled={updating} aria-label={'Remove ' + (product?.name || 'fragrance') + ' from cart'} onClick={() => change(() => store.removeFromCart(productId))}><Icon name="trash3"/> Remove</button>
            </div>
            <div className="cart-item-quantity"><Quantity value={quantity} max={product?.stock || 0} name={product?.name} disabled={busy || !product?.active || product.stock === 0} onChange={value => store.setQuantity(productId, value)} onValidityChange={valid => quantityFeedback(productId, 'valid', valid)} onPendingChange={pending => quantityFeedback(productId, 'pending', pending)}/></div>
            <strong className="cart-line-total">{money((product?.price || 0) * quantity)}</strong>
          </article>)}
        </div>
        <Link className="text-link mt-4" to="/shop"><Icon name="arrow-left"/> Continue shopping</Link>
      </div>
      <div className="col-lg-4"><aside className="summary-panel cart-checkout-panel">
        <p className="eyebrow">READY WHEN YOU ARE</p><h2>Order summary</h2>
        <div className="summary-row"><span>Selected items</span><span>{selectedCount} {selectedCount === 1 ? 'bottle' : 'bottles'}</span></div>
        <div className="summary-row"><span>Subtotal</span><span>{money(total)}</span></div>
        <div className="summary-row total-row"><strong>Total</strong><strong>{money(total)}</strong></div>
        <p className="summary-note">All amounts in PHP. No additional fees.</p>
        {!selected.length && <p className="form-text">Select at least one item to check out.</p>}
        {invalid && <Alert>Check the quantities and availability of your selected items before continuing.</Alert>}
        <button className="btn btn-dark w-100" disabled={!canCheckout} onClick={() => navigate('/checkout')}>{updating ? 'Updating cart…' : 'Checkout (' + selectedCount + ')'} <Icon name="arrow-right"/></button>
        <p className="summary-demo"><Icon name="shield-check"/> Guest checkout · Demo payments only</p>
      </aside></div>
    </div>}
  </div>;
}
