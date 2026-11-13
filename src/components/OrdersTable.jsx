import { Link } from 'react-router-dom';
import { dateTime, money } from '../utils/format.js';
import { StatusBadge } from './UI.jsx';

export default function OrdersTable({ orders }) {
  return <div className="table-scroll" tabIndex="0" role="region" aria-label="Orders table, scroll horizontally on smaller screens"><table className="table admin-table"><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Date & time (PH)</th><th scope="col">Total</th><th scope="col">Payment</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{[...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(order => <tr key={order.id}><td><Link className="order-number" to={`/admin/orders/${order.id}`}>{order.number}</Link></td><td>{order.customer.name}<small>{order.customer.email}</small></td><td>{dateTime(order.createdAt)}</td><td className="price-cell">{money(order.total)}</td><td>{order.paymentMethod}</td><td><StatusBadge status={order.status}/></td><td><Link className="table-action" to={`/admin/orders/${order.id}`} aria-label={`View details for ${order.number}`}>View Details</Link></td></tr>)}</tbody></table></div>;
}
