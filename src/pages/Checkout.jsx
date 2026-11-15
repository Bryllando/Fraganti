import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore.jsx';
import { store } from '../services/browserStore.js';
import { PAYMENT_METHODS, quoteCart, validateCustomer } from '../services/store.js';
import { Alert, EmptyState, Icon, PageIntro } from '../components/UI.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import ShoppingSteps from '../components/ShoppingSteps.jsx';
import personIcon from 'bootstrap-icons/icons/person.svg';
import emailIcon from 'bootstrap-icons/icons/envelope.svg';
import phoneIcon from 'bootstrap-icons/icons/telephone.svg';
import addressIcon from 'bootstrap-icons/icons/geo-alt.svg';

const DRAFT_KEY = 'oud-aura:checkout-draft';
const emptyForm = { name: '', email: '', phone: '', address: '', paymentMethod: '', notes: '' };

function readDraft() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY));
    return Object.fromEntries(Object.keys(emptyForm).map(key => [key, typeof saved?.[key] === 'string' ? saved[key] : '']));
  } catch { return { ...emptyForm }; }
}

export default function Checkout() {
  const { state, notify } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const buyNowId = params.get('buyNow');
  const buyNow = buyNowId ? { productId: buyNowId, quantity: Number(params.get('quantity') || 1) } : null;
  const [values, setValues] = useState(readDraft);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [changes, setChanges] = useState([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [reviewed, setReviewed] = useState(() => quoteCart(state, buyNow));
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const feedbackRef = useRef(null);
  const [invalidBuyNow] = useState(() => {
    const product = state.products.find(p => p.id === buyNowId);
    return buyNow && (!product?.active || !Number.isSafeInteger(buyNow.quantity) || buyNow.quantity < 1 || buyNow.quantity > product.stock);
  });
  useEffect(() => { if (error) feedbackRef.current?.focus(); }, [error]);

  if (savedId) return <Navigate replace to={'/order/' + savedId} state={{ placed: savedId }}/>;
  if (invalidBuyNow) return <div className="container page-space"><EmptyState icon="cart-x" title="This selection is unavailable." to="/shop" action="Return to shop"><p>The fragrance or quantity is no longer available. Choose an available fragrance and try again.</p></EmptyState></div>;
  if (!buyNow && !quoteCart(state).length && !busy) return <Navigate replace to="/cart"/>;

  const summaryItems = reviewed.map(item => ({ ...item, image: state.products.find(p => p.id === item.productId)?.image }));
  const unavailable = reviewed.some(item => !item.active || item.quantity > item.stock);
  const editTo = buyNow ? '/product/' + encodeURIComponent(buyNowId) + '?quantity=' + buyNow.quantity : '/cart';
  const needsReview = changes.length > 0;

  function update(event) {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);
    setErrors(previous => ({ ...previous, [name]: '' }));
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch { /* Draft saving is optional; checkout remains available. */ }
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || unavailable || (needsReview && !acknowledged)) return;
    const validation = validateCustomer(values);
    setErrors(validation); setError('');
    if (Object.keys(validation).length) {
      document.getElementById('checkout-' + Object.keys(validation)[0])?.focus();
      return;
    }
    setBusy(true);
        try {
      const order = await store.placeOrder(values, reviewed, buyNow);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* The order is already saved. */ }
      setSavedId(order.id);
      notify('Order ' + order.number + ' saved successfully.');
      navigate('/order/' + order.id, { replace: true, state: { placed: order.id } });
    } catch (error) {
      setError(error.message);
      if (error.code === 'REVIEW') {
        setChanges(error.details);
        setAcknowledged(false);
        setReviewed(quoteCart(store.read(), buyNow));
      }
    } finally { setBusy(false); }
  }

  function field({ name, label, type, autoComplete, placeholder, icon }) {
    return (
      <div className="col-md-6">
        <label htmlFor={'checkout-' + name} className="form-label">
          {label} <span aria-hidden="true">*</span>
        </label>
        <div className="checkout-field-control">
          <img className="checkout-field-icon" src={icon} alt="" aria-hidden="true"/>
          <input
            className={'form-control ' + (errors[name] ? 'is-invalid' : '')}
            id={'checkout-' + name}
            name={name}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={values[name]}
            onChange={update}
            required
            maxLength={name === 'name' ? 150 : 254}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? name + '-error' : undefined}
          />
        </div>
        {errors[name] && (
          <div className="invalid-feedback d-block" id={name + '-error'}>
            {errors[name]}
          </div>
        )}
      </div>
    );
  }

  return <div className="container page-space">
    <ShoppingSteps current={2} buyNow={Boolean(buyNow)}/>
    <PageIntro eyebrow={buyNow ? 'BUY NOW · DIRECT CHECKOUT' : 'REVIEW YOUR SELECTED ITEMS'} title="Checkout">Check your details and order before placing it. No account needed.</PageIntro>
    <div className="checkout-demo-note"><Icon name="info-circle"/><span>Demo store. Use fictional details. Payment options are simulated.</span></div>
    <div ref={feedbackRef} tabIndex="-1" id="checkout-feedback">
      <Alert>{error}{needsReview && <><ul className="mb-2 mt-2">{changes.map((change, i) => <li key={i}>{change}</li>)}</ul><p className="mb-0">The order summary has been updated. {unavailable ? <Link to={editTo}>Edit your selection to continue.</Link> : 'Review the new details and acknowledge them below.'}</p></>}</Alert>
    </div>
    {unavailable && !error && <Alert>Some selected items are unavailable or exceed current stock. <Link to={editTo}>Edit your selection</Link> before continuing.</Alert>}
    <form noValidate onSubmit={submit}>
      <fieldset disabled={busy} className="checkout-fields">
        <legend className="visually-hidden">Guest checkout</legend>
        <div className="row g-4 g-lg-5">
          <div className="col-lg-7">
            <section className="checkout-section">
              <div className="form-section-heading"><span>01</span><h2>Delivery details</h2></div>
              <div className="row g-3">
                {field({
                  name: 'name',
                  label: 'Customer Full Name',
                  type: 'text',
                  autoComplete: 'name',
                  placeholder: 'e.g. Maya Sample',
                  icon: personIcon,
                })}
                {field({
                  name: 'email',
                  label: 'Email Address',
                  type: 'email',
                  autoComplete: 'email',
                  placeholder: 'e.g. maya@example.com',
                  icon: emailIcon,
                })}
                {field({
                  name: 'phone',
                  label: 'Contact Number',
                  type: 'tel',
                  autoComplete: 'tel',
                  placeholder: 'e.g. 0900 000 0123',
                  icon: phoneIcon,
                })}
                <div className="col-12">
                  <label className="form-label" htmlFor="checkout-address">Delivery Address <span aria-hidden="true">*</span></label>
                  <div className="checkout-field-control checkout-field-control--address">
                    <img className="checkout-field-icon" src={addressIcon} alt="" aria-hidden="true"/>
                    <textarea
                      className={'form-control ' + (errors.address ? 'is-invalid' : '')}
                      id="checkout-address"
                      name="address"
                      rows="3"
                      autoComplete="street-address"
                      placeholder="House or unit, street, barangay, city, province"
                      value={values.address}
                      onChange={update}
                      required
                      maxLength="1000"
                      aria-invalid={Boolean(errors.address)}
                      aria-describedby={errors.address ? 'address-error' : undefined}
                    />
                  </div>
                  {errors.address && <div className="invalid-feedback d-block" id="address-error">{errors.address}</div>}
                </div>
              </div>
            </section>
            <section className="checkout-section">
              <div className="form-section-heading"><span>02</span><h2>Payment method</h2></div>
              <fieldset id="checkout-paymentMethod" tabIndex="-1" aria-describedby="payment-help">
                <legend className="visually-hidden">Payment Method (required)</legend>
                {PAYMENT_METHODS.map((method, index) => <label className={'payment-option ' + (values.paymentMethod === method ? 'selected' : '')} key={method}>
                  <input className="form-check-input" type="radio" name="paymentMethod" value={method} checked={values.paymentMethod === method} onChange={update} required/>
                  <Icon name={['cash-stack', 'phone', 'bank'][index]}/><span>{method}<small>Simulated selection only</small></span>
                </label>)}
                {errors.paymentMethod && <p className="field-error" role="alert">{errors.paymentMethod}</p>}
                <p className="form-text" id="payment-help">No card details, account numbers, or QR codes are needed.</p>
              </fieldset>
            </section>
            <section className="checkout-section">
              <label className="form-label" htmlFor="checkout-notes">Order Notes <span className="text-muted">(optional)</span></label>
              <textarea className="form-control" id="checkout-notes" name="notes" rows="3" value={values.notes} onChange={update} maxLength="2000" placeholder="Add delivery instructions or a note…"/>
            </section>
          </div>
          <div className="col-lg-5">
            <OrderSummary items={summaryItems} editTo={editTo}>
              {needsReview && !unavailable && <label className="review-acknowledgement"><input className="form-check-input" type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}/> I have reviewed the updated prices, quantities, and availability.</label>}
              <button type="submit" className="btn btn-dark w-100" disabled={busy || unavailable || (needsReview && !acknowledged)}>{busy ? 'Saving your order…' : 'Place Order'} <Icon name="arrow-right"/></button>
              <p className="summary-demo"><Icon name="shield-check"/> Your order starts as Pending once it is saved. {buyNow ? 'Your cart stays as it is.' : 'Unselected items stay in your cart.'}</p>
            </OrderSummary>
          </div>
        </div>
      </fieldset>
    </form>
  </div>;
}
