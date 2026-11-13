import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.jsx';
import { Icon, ProductImage } from '../components/UI.jsx';
import ProductCard from '../components/ProductCard.jsx';

export function CategoryCards() {
  const { state } = useStore();
  return <div className="row g-4">{state.categories.map((category, index) => <div className="col-md-4" key={category.id}><Link className="category-card" to={`/shop?category=${category.id}`}><div className="category-visual"><ProductImage image={category.image} name={category.name}/><span className="category-number">0{index + 1}</span></div><div className="category-content"><div><span className="eyebrow">THE {index === 0 ? 'FRESH' : index === 1 ? 'WARM' : 'DEEP'} EDIT</span><h3>{category.name}</h3></div><span className="circle-arrow"><Icon name="arrow-up-right"/></span></div></Link></div>)}</div>;
}

export default function Home() {
  const { state } = useStore();
  const featured = state.products.filter(p => p.active && p.featured).slice(0, 4);
  const newItems = state.products.filter(p => p.active && p.isNew).slice(0, 4);
  return <>
    <section className="hero-section"><div className="container"><div className="hero-grid"><div className="hero-copy"><p className="eyebrow"><span className="tiny-line"/> A WORLD OF SCENT, THOUGHTFULLY CURATED</p><h1>Discover Your<br/>Signature <em>Scent</em></h1><p className="hero-description">Explore a curated world of Arabian fragrances, from fresh everyday scents to rich and captivating oud.</p><div className="hero-actions"><Link className="btn btn-dark" to="/shop">Shop Fragrances <Icon name="arrow-right"/></Link><Link className="text-link" to="/collections">Explore Collections <Icon name="arrow-up-right"/></Link></div><div className="hero-footnote"><span>01 / THE SIGNATURE COLLECTION</span><span>A little discovery. A lasting impression.</span></div></div><div className="hero-image-wrap"><img className="hero-image" src="/images/hero.png" alt="Original editorial image of Arabian-inspired fragrance bottles on warm travertine plinths" fetchPriority="high"/><span className="hero-image-note">THE ART OF ARABIAN FRAGRANCE</span></div></div></div></section>
    <div className="values-strip"><div className="container"><span><Icon name="flower1"/> Thoughtfully curated scents</span><span><Icon name="droplet"/> Inspired by Arabian perfumery</span><span><Icon name="gift"/> A little luxury, every day</span></div></div>
    <section className="section-space container" id="collections"><div className="section-heading"><div><p className="eyebrow">FIND YOUR FRAGRANCE FAMILY</p><h2>A scent for every side of you.</h2></div><Link className="text-link" to="/collections">Explore collections <Icon name="arrow-right"/></Link></div><CategoryCards/></section>
    <section className="section-space section-white"><div className="container"><div className="section-heading"><div><p className="eyebrow">THE SIGNATURE EDIT</p><h2>Meet your next obsession.</h2><p>Distinctive scents. Beautifully chosen.</p></div><Link className="text-link" to="/shop">Shop all fragrances <Icon name="arrow-right"/></Link></div><div className="row g-4">{featured.map(product => <div className="col-6 col-md-4 col-xl-3" key={product.id}><ProductCard product={product}/></div>)}</div></div></section>
    <section className="story-section container section-space"><div className="story-image"><img src="/images/hero.png" alt="Warm light falling across artisan-inspired sample fragrance bottles" loading="lazy"/><span>ROOTED IN TRADITION.<br/>MADE FOR YOUR EVERYDAY.</span></div><div className="story-copy"><p className="eyebrow">THE SOUL BEHIND THE SCENT</p><h2>More than a fragrance.<br/><em>A feeling.</em></h2><p>Some scents take you somewhere. Others bring you back to yourself. We bring together the richness of Arabian perfumery and the ease of everyday luxury.</p><p>From a first discovery to a familiar favourite, there’s a story waiting in every bottle.</p><Link className="text-link" to="/our-story">Discover our story <Icon name="arrow-right"/></Link></div></section>
    {newItems.length > 0 && <section className="section-space section-white"><div className="container"><div className="section-heading"><div><p className="eyebrow">FRESH PERSPECTIVES</p><h2>New to the collection.</h2></div><Link to="/shop" className="text-link">Find something new <Icon name="arrow-right"/></Link></div><div className="row g-4">{newItems.map(product => <div className="col-6 col-md-4 col-xl-3" key={product.id}><ProductCard product={product}/></div>)}</div></div></section>}
    <section className="closing-note container"><Icon name="droplet"/><p>Discover the scent that defines you.</p><span>OUD & AURA</span></section>
  </>;
}
