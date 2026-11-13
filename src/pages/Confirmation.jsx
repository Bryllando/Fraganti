import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore.jsx';
import { store } from '../services/browserStore.js';
import { nextStatuses } from '../services/store.js';
import { Alert, ConfirmDialog, EmptyState, Icon, StatusBadge } from '../components/UI.jsx';
import { dateTime } from '../utils/format.js';
import OrderSummary from '../components/OrderSummary.jsx';
import OrderJourney from '../components/OrderJourney.jsx';
import ShoppingSteps from '../components/ShoppingSteps.jsx';

const statusMessage = {
  Pending: 'Your order has been received and is awaiting confirmation.',
  Confirmed: 'Your order has been confirmed.',
  Preparing: 'Your fragrances are being prepared.',
  Shipped: 'Your order has been marked as shipped.',
  Completed: 'This order is complete. Thank you for shopping with OUD & AURA.',
  Cancelled: 'This order was cancelled. Its purchased quantities were returned to stock.',
};

export default function Confirmation() {
  const { id } = useParams();
  const location = useLocation();
  const { state, notify } = useStore();
  const [cancel, setCancel] = useState(false);
  const [error, setError] = useState('');
  const order = state.orders.find(order => order.id === id);
  if (!order) return <div className="container page-space"><EmptyState title="We couldn’t find that order." to="/orders" action="Go to My Orders"><p>Orders are saved only in the browser where they were placed.</p></EmptyState></div>;
  const justPlaced = location.state?.placed === id && order.status === 'Pending';
  const canCancel = nextStatuses(order.status).includes('Cancelled');

  return <div className="container page-space confirmation-page">
    {justPlaced ? <ShoppingSteps current={3}/> : <Link className="text-link mb-4" to="/orders"><Icon name="arrow-left"/> My Orders</Link>}
    <div className="confirmation-heading">
      {justPlaced && <span className="success-mark"><Icon name="check2"/></span>}
      <p className="eyebrow">{justPlaced ? 'THANK YOU FOR YOUR ORDER' : 'YOUR ORDER DETAILS'}</p>
      <h1>{justPlaced ? 'Order placed successfully.' : 'Your fragrance order.'}</h1>
      <p>{statusMessage[order.status]}</p>
      <div className="confirmation-number"><span>{order.number}</span><StatusBadge status={order.status}/></div>
      <small>{dateTime(order.createdAt)} · Philippine time</small>
    </div>
    <Alert>{error}</Alert>
    <div className="row g-4">
      <div className="col-lg-6">
        <section className="confirmation-info order-information">
          <h2>Delivery & payment</h2>
          <dl>
            <dt>Customer</dt><dd>{order.customer.name}<br/>{order.customer.email}<br/>{order.customer.phone}</dd>
            <dt>Delivery address</dt><dd className="preserve-lines">{order.customer.address}</dd>
            <dt>Payment method</dt><dd>{order.paymentMethod}<small className="d-block text-muted">Simulated selection · No payment collected</small></dd>
            <dt>Current status</dt><dd><StatusBadge status={order.status}/></dd>
            {order.notes && <><dt>Order notes</dt><dd className="preserve-lines">{order.notes}</dd></>}
          </dl>
          <p className="form-text">This fictional order is saved in this browser. No products will be delivered and no confirmation email is sent.</p>
        </section>
        <section className="order-information order-history-panel">
          <h2>Order progress</h2><OrderJourney order={order}/>
          {canCancel && <button className="text-button cancel-order-link" onClick={() => setCancel(true)}>Cancel this order</button>}
        </section>
      </div>
      <div className="col-lg-6">
        <OrderSummary items={order.items}/>
        <div className="order-next-actions"><Link className="btn btn-dark" to="/orders">View My Orders <Icon name="bag-check"/></Link><Link className="btn btn-outline-dark" to="/shop">Continue Shopping <Icon name="arrow-right"/></Link></div>
      </div>
    </div>
    {cancel && <ConfirmDialog title="Cancel this order?" confirmLabel="Cancel order" dismissLabel="Keep order" onClose={() => setCancel(false)} onConfirm={async () => {
      setError('');
      try { await store.transitionOrder(id, 'Cancelled'); notify('Order cancelled. Purchased stock has been restored.'); }
      catch (error) { setError(error.message); throw error; }
    }}><p>This cancels {order.number} and restores its stock. Cancellation is available only while Pending or Confirmed and cannot be undone.</p></ConfirmDialog>}
  </div>;
}
