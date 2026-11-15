import { useState } from 'react';
import { useStore } from '../../hooks/useStore.jsx';
import { ORDER_STATUSES } from '../../services/store.js';
import { EmptyState, Icon, PageIntro } from '../../components/UI.jsx';
import OrdersTable from '../../components/OrdersTable.jsx';

export default function Orders() {
  const { state, refresh } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const hasFilters = Boolean(query || status);
  const orders = state.orders.filter(o => (!status || o.status === status) &&
    `${o.number} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(query.trim().toLowerCase()));

  function clearFilters() {
    setQuery('');
    setStatus('');
  }

  return <>
    <PageIntro
      eyebrow="FROM DISCOVERY TO DELIVERY"
      title="Orders"
      action={<button type="button" className="btn btn-outline-dark" onClick={refresh}><Icon name="arrow-clockwise"/> Refresh orders</button>}
    >
      Review guest orders and update their status.
    </PageIntro>
    <section className="admin-panel">
      <div className="admin-filters orders-filters">
        <div className="search-field">
          <Icon name="search"/>
          <label className="visually-hidden" htmlFor="order-search">Search orders</label>
          <input className="form-control" type="search" id="order-search" placeholder="Search by order or customer…" value={query} onChange={e => setQuery(e.target.value)}/>
        </div>
        <div>
          <label className="visually-hidden" htmlFor="order-status">Filter order status</label>
          <select className="form-select" id="order-status" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {[...ORDER_STATUSES, 'Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {hasFilters && <button type="button" className="btn btn-outline-dark" onClick={clearFilters}><Icon name="x-lg"/> Clear filters</button>}
      </div>
      <div className="panel-count">Showing {orders.length} of {state.orders.length} order{state.orders.length === 1 ? '' : 's'} · Newest first</div>
      {orders.length
        ? <OrdersTable orders={orders}/>
        : <EmptyState icon="bag-check" title={state.orders.length ? 'No orders match your filters.' : 'No orders saved in this browser.'}>
            <p>{state.orders.length
              ? 'Clear the search or choose All statuses to see your other orders.'
              : 'Guest checkout orders appear here when the shop and admin use the same browser profile and site address.'}</p>
            {!state.orders.length && <p>Open admin from the browser window where your order appears in My Orders.</p>}
          </EmptyState>}
    </section>
  </>;
}
