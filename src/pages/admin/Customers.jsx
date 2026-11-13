import { useState } from 'react';
import { useStore } from '../../hooks/useStore.jsx';
import { customerSummary } from '../../services/store.js';
import { money } from '../../utils/format.js';
import { EmptyState, Icon, PageIntro } from '../../components/UI.jsx';

export default function Customers() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const customers = customerSummary(state.orders).filter(c => `${c.name} ${c.email}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <><PageIntro eyebrow="THE PEOPLE BEHIND THE ORDERS" title="Customers">A little insight into the people finding their signature.</PageIntro><section className="admin-panel"><div className="admin-filters"><div className="search-field"><Icon name="search"/><label className="visually-hidden" htmlFor="customer-search">Search customers</label><input type="search" className="form-control" id="customer-search" placeholder="Search by name or email…" value={query} onChange={e => setQuery(e.target.value)}/></div></div><div className="panel-count">{customers.length} unique customer{customers.length === 1 ? '' : 's'} · Read-only, derived from orders</div>{customers.length ? <div className="table-scroll" tabIndex="0" role="region" aria-label="Customers table, scroll horizontally on smaller screens"><table className="table admin-table"><thead><tr><th scope="col">Customer</th><th scope="col">Normalized email</th><th scope="col">Contact number</th><th scope="col">Total orders</th><th scope="col">Completed order value</th></tr></thead><tbody>{customers.map(c => <tr key={c.email}><td><strong>{c.name}</strong></td><td>{c.email}</td><td>{c.phone}</td><td>{c.totalOrders}</td><td className="price-cell">{money(c.completedValue)}</td></tr>)}</tbody></table></div> : <EmptyState icon="people" title="Every connection starts somewhere."><p>{query ? 'No customers match your search.' : 'Customer details will appear after a demo order is placed.'}</p></EmptyState>}</section><p className="form-text mt-3">Repeat customers are grouped by trimmed, lowercase email addresses. Name and contact number come from their latest order. Completed value excludes pending, in-progress, and cancelled orders.</p></>;
}
