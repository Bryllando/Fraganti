import { CategoryCards } from './Home.jsx';
import { PageIntro } from '../components/UI.jsx';

export default function Collections() {
  return <div className="container page-space"><PageIntro eyebrow="YOUR SCENT JOURNEY" title="A world of possibilities.">Follow your mood. Find your fragrance family.</PageIntro><CategoryCards/><div className="collection-note"><p className="eyebrow">A NOTE ON OUR CATALOG</p><p>Our catalog is a fictional demonstration inspired by Middle Eastern fragrance lines. Names, descriptions, prices, and availability are sample data. Original bottle imagery is illustrative and does not represent actual branded packaging.</p></div></div>;
}
