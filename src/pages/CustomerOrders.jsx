import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.jsx';
import { ORDER_STATUSES } from '../services/store.js';
import { dateTime, money } from '../utils/format.js';
import { EmptyState, Icon, PageIntro, ProductImage, StatusBadge } from '../components/UI.jsx';

export default function CustomerOrders() {
  const { state } = useStore();
  const [status, setStatus] = useState('');
  const orders = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter(order => !status || order.status === status);

  return <div className="container page-space my-orders-page">
    <PageIntro eyebrow="YOUR SCENT JOURNEY" title="My Orders" action={<Link className="btn btn-outline-dark" to="/shop">Continue shopping <Icon name="arrow-right"/></Link>}>Review your purchases and follow their latest saved status.</PageIntro>
    <p className="orders-browser-note"><Icon name="info-circle"/> Guest demo orders placed in this browser appear here. No account is required.</p>
    <div className="order-filters" role="group" aria-label="Filter orders by status">
      {['', ...ORDER_STATUSES, 'Cancelled'].map(value => <button key={value} className={status === value ? 'active' : ''} aria-pressed={status === value} onClick={() => setStatus(value)}>{value || 'All orders'}<span>{state.orders.filter(order => !value || order.status === value).length}</span></button>)}
    </div>
    {!orders.length ? <EmptyState icon="bag-check" title={state.orders.length ? 'No orders with this status.' : 'Your first order starts here.'} to={state.orders.length ? undefined : '/shop'} action="Explore fragrances"><p>{state.orders.length ? 'Choose another status to view your orders.' : 'After checkout, your order details and status will be waiting here.'}</p></EmptyState> : <div className="customer-orders">
      {orders.map(order => <article className="customer-order-card" key={order.id}>
        <header><div><Link to={'/order/' + order.id}>{order.number}</Link><small>{dateTime(order.createdAt)} · Philippine time</small></div><StatusBadge status={order.status}/></header>
        <div className="customer-order-items">{order.items.map(item => <Link className="customer-order-item" to={'/order/' + order.id} key={item.productId}><ProductImage image={item.image} name={item.name}/><div><strong>{item.name}</strong><small>{item.quantity} × {money(item.unitPrice)}</small></div><span>{money(item.quantity * item.unitPrice)}</span></Link>)}</div>
        <footer><span>Order total <strong>{money(order.total)}</strong></span><Link className="btn btn-outline-dark" to={'/order/' + order.id}>View Order <Icon name="arrow-right"/></Link></footer>
      </article>)}
    </div>}
  </div>;
}
