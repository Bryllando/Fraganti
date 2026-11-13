import { ORDER_STATUSES } from '../services/store.js';
import { dateTime } from '../utils/format.js';
import { Icon } from './UI.jsx';

export default function OrderJourney({ order }) {
  return <>
    <ol className="order-timeline" aria-label="Order status history">
      {ORDER_STATUSES.map((status, index) => {
        const entry = order.history.find(event => event.status === status);
        return <li className={entry ? 'is-done' : ''} key={status} aria-current={order.status === status ? 'step' : undefined}>
          <span>{entry ? <Icon name="check2"/> : index + 1}</span>
          <div><strong>{status}</strong>{entry && <small>{dateTime(entry.at)}</small>}</div>
        </li>;
      })}
    </ol>
    {order.status === 'Cancelled' && <p className="cancellation-note"><Icon name="x-circle"/> Cancelled on {dateTime(order.history.at(-1).at)}. Purchased stock has been restored.</p>}
  </>;
}
