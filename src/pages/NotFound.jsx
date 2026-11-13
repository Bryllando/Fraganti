import { EmptyState } from '../components/UI.jsx';
export default function NotFound() {
  return <div className="container page-space"><EmptyState icon="compass" title="A little off the scent trail." to="/shop"><p>This page doesn’t exist. Let’s get you back to the collection.</p></EmptyState></div>;
}
