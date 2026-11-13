import { money, orderTotal } from '../utils/format.js';
import { Link } from 'react-router-dom';
import { ProductImage } from './UI.jsx';

export default function OrderSummary({ items, children, title = 'Order summary', editTo }) {
  const total = orderTotal(items);
  return <aside className="summary-panel"><p className="eyebrow">YOUR SELECTION</p><div className="summary-heading"><h2>{title}</h2>{editTo && <Link to={editTo} className="text-link">Edit items</Link>}</div><div className="summary-items">{items.map(item => <div className="summary-item" key={item.productId}><ProductImage image={item.image} name={item.name}/><div><strong>{item.name}</strong><small>{item.quantity} × {money(item.unitPrice)}</small></div><span>{money(item.unitPrice * item.quantity)}</span></div>)}</div><div className="summary-row"><span>Subtotal</span><span>{money(total)}</span></div><div className="summary-row total-row"><strong>Total</strong><strong>{money(total)}</strong></div><p className="summary-note">All amounts in PHP. No additional fees.</p>{children}</aside>;
}
