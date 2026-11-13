import { useState } from 'react';
import { useStore } from '../../hooks/useStore.jsx';
import { ORDER_STATUSES } from '../../services/store.js';
import { EmptyState, Icon, PageIntro } from '../../components/UI.jsx';
import OrdersTable from '../../components/OrdersTable.jsx';

export default function Orders() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const orders = state.orders.filter(o => (!status || o.status === status) && `${o.number} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <><PageIntro eyebrow="FROM DISCOVERY TO DELIVERY" title="Orders">Every order, every detail, in one place.</PageIntro><section className="admin-panel"><div className="admin-filters orders-filters"><div className="search-field"><Icon name="search"/><label className="visually-hidden" htmlFor="order-search">Search orders</label><input className="form-control" type="search" id="order-search" placeholder="Search by order or customer…" value={query} onChange={e => setQuery(e.target.value)}/></div><div><label className="visually-hidden" htmlFor="order-status">Filter order status</label><select className="form-select" id="order-status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{[...ORDER_STATUSES, 'Cancelled'].map(s => <option key={s}>{s}</option>)}</select></div></div><div className="panel-count">{orders.length} order{orders.length === 1 ? '' : 's'} · Newest first</div>{orders.length ? <OrdersTable orders={orders}/> : <EmptyState icon="bag-check" title="No orders here just yet."><p>{query || status ? 'Try a different search or status.' : 'Place a demo order in the storefront to begin the journey.'}</p></EmptyState>}</section></>;
}
