import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore.jsx';
import { filterProducts } from '../services/store.js';
import ProductCard from '../components/ProductCard.jsx';
import { EmptyState, Icon, PageIntro } from '../components/UI.jsx';

export default function Shop() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const { hash, key: locationKey } = useLocation();
  const searchRef = useRef(null);
  const query = params.get('q') || '';
  const [search, setSearch] = useState(query);
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  const products = filterProducts(state.products, { query: search, category, sort });

  useEffect(() => {
    // Ignore older route renders while newer characters are already in the URL.
    const latestQuery = new URLSearchParams(window.location.search).get('q') || '';
    if (query === latestQuery) setSearch(query);
  }, [query, locationKey]);

  useEffect(() => {
    if (hash === '#product-search') {
      searchRef.current?.focus();
      searchRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [hash]);

  function update(key, value) {
    // Router renders can lag behind rapid changes; browser history already has the latest filters.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }

  return <div className="container page-space">
    <PageIntro eyebrow="THE FRAGRANCE COLLECTION" title="Find a little of yourself.">
      From bright beginnings to deep impressions. Your next signature awaits.
    </PageIntro>
    <div className="shop-toolbar" role="search" aria-label="Catalog search">
      <div className="filter-field catalog-search">
        <label htmlFor="product-search">Search fragrances</label>
        <div className="search-field">
          <Icon name="search"/>
          <input
            ref={searchRef}
            className="form-control"
            id="product-search"
            type="search"
            autoComplete="off"
            placeholder="e.g. Hawas Ice"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              update('q', e.target.value);
            }}
          />
        </div>
      </div>
      <div className="filter-field">
        <label htmlFor="category-filter">Category</label>
        <select className="form-select" id="category-filter" value={category} onChange={e => update('category', e.target.value)}>
          <option value="">All scent families</option>
          {state.categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="price-sort">Sort by</label>
        <select className="form-select" id="price-sort" value={sort} onChange={e => update('sort', e.target.value)}>
          <option value="featured">Our selection</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>
    </div>
    <div className="results-line">
      <span aria-live="polite">{products.length} fragrance{products.length === 1 ? '' : 's'} to discover</span>
      {(search || category || sort !== 'featured') && <button className="text-button" onClick={() => setParams({})}>Clear filters <Icon name="x"/></button>}
      <span className="sample-catalog-label">ILLUSTRATIVE DEMO CATALOG</span>
    </div>
    {products.length
      ? <div className="row g-4 product-grid">{products.map(product => <div className="col-6 col-md-4 col-xl-3" key={product.id}><ProductCard product={product}/></div>)}</div>
      : <EmptyState icon="search" title="A new direction, perhaps?">
          <p>No fragrances match your selection. Try a different name or scent family.</p>
          <button className="btn btn-outline-dark" onClick={() => setParams({})}>Clear all filters</button>
        </EmptyState>}
  </div>;
}
