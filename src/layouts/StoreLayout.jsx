import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Brand, Icon } from '../components/UI.jsx';
import { useStore } from '../hooks/useStore.jsx';
import { isLoggedIn } from '../services/auth.js';
import { itemCount } from '../utils/format.js';

export default function StoreLayout() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const count = itemCount(state.cart);
  const adminSignedIn = isLoggedIn();
  useEffect(() => { setOpen(false); setSearchOpen(false); }, [location.pathname, location.search]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="announcement"><span>AN INVITATION TO DISCOVER</span><span>Arabian soul. Everyday elegance.</span><Link className="announcement-login" to={adminSignedIn ? '/admin' : '/admin/login'}><Icon name={adminSignedIn ? 'grid' : 'person-circle'}/>{adminSignedIn ? 'Admin Dashboard' : 'Login'}</Link></div>
    <header className="store-header"><div className="container header-inner"><Brand/><nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation" id="main-navigation"><NavLink end to="/">Home</NavLink><NavLink to="/shop">Shop</NavLink><NavLink to="/collections">Categories</NavLink><NavLink to="/our-story">Our Story</NavLink><NavLink to="/orders" className="mobile-orders-nav">My Orders</NavLink></nav><div className="header-actions"><Link className="orders-link" to="/orders" aria-label="My Orders"><Icon name="bag-check"/><span>My Orders</span></Link><button className="icon-button" aria-label="Search fragrances" aria-expanded={searchOpen} aria-controls="header-search" onClick={() => setSearchOpen(!searchOpen)}><Icon name="search"/></button><Link className="cart-link" to="/cart" aria-label={`Shopping cart, ${count} items`}><Icon name="cart3"/><span className="bag-label">Cart</span><span className="bag-count">{count}</span></Link><button className="icon-button mobile-menu" aria-label="Toggle navigation" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}><Icon name={open ? 'x-lg' : 'list'}/></button></div></div>
      {searchOpen && <form className="container header-search" id="header-search" onSubmit={event => { event.preventDefault(); navigate(`/shop?q=${encodeURIComponent(search)}`); }}><label className="visually-hidden" htmlFor="global-search">Search by fragrance name</label><input id="global-search" autoFocus className="form-control" placeholder="Find your next signature scent…" value={search} onChange={e => setSearch(e.target.value)}/><button className="btn btn-dark">Search <Icon name="arrow-right"/></button></form>}
    </header>
    <main id="main-content"><Outlet/></main>
    <footer className="store-footer"><div className="container"><div className="row g-4 footer-top"><div className="col-lg-5"><Brand light/><p>A world of fragrance.<br/>A scent that feels like you.</p><span className="footer-demo">A fictional store for the CubeTech internship assessment.</span></div><div className="col-6 col-md-3 col-lg-2"><h2>Explore</h2><Link to="/shop">All fragrances</Link><Link to="/collections">Scent collections</Link><Link to="/orders">My Orders</Link><Link to="/our-story">Our story</Link><Link to="/admin/login">Demo admin</Link></div><div className="col-6 col-md-4 col-lg-3"><h2>Say hello</h2><a href="mailto:hello@oudandaura.example">hello@oudandaura.example</a><span>+63 900 000 0000</span><span>Baliuag, Bulacan, Philippines</span><small>Fictional contact details</small></div><div className="col-md-4 col-lg-2"><h2>Follow along</h2><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <Icon name="arrow-up-right"/></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook <Icon name="arrow-up-right"/></a><small>Sample social links</small></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} OUD & AURA. A demonstration of good taste.</span><span>Demo only · No real payments · Browser-local data</span></div></div></footer>
  </>;
}
