import { Link } from 'react-router-dom';
import { Icon } from './UI.jsx';

export default function ShoppingSteps({ current = 1, buyNow = false }) {
  return <nav aria-label="Purchase progress" className="shopping-progress"><ol>
    {[buyNow ? 'Product' : 'Cart', 'Checkout', 'Order placed'].map((label, index) => <li key={label} className={current === index + 1 ? 'is-current' : current > index + 1 ? 'is-complete' : ''} aria-current={current === index + 1 ? 'step' : undefined}>
      <span>{current > index + 1 ? <Icon name="check2"/> : index + 1}</span>
      {index === 0 && current === 2 && !buyNow ? <Link to="/cart">{label}</Link> : label}
    </li>)}
  </ol></nav>;
}
