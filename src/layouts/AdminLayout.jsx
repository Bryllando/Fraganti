import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout } from '../services/auth.js';
import { Brand, Icon } from '../components/UI.jsx';

const links = [['/admin', 'grid', 'Overview'], ['/admin/products', 'box-seam', 'Products'], ['/admin/categories', 'collection', 'Categories'], ['/admin/orders', 'bag-check', 'Orders'], ['/admin/customers', 'people', 'Customers']];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  if (!isLoggedIn()) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace/>;
  const current = links.find(([path]) => path !== '/admin' && location.pathname.startsWith(path))?.[2] || 'Overview';
  return <div className="admin-shell"><a className="skip-link" href="#admin-main">Skip to admin content</a><aside className={`admin-sidebar ${menu ? 'is-open' : ''}`}><Brand/><p className="sidebar-caption">BOUTIQUE MANAGEMENT</p><nav aria-label="Admin navigation" id="admin-navigation">{links.map(([path, icon, label]) => <NavLink end={path === '/admin'} to={path} key={path} onClick={() => setMenu(false)}><Icon name={icon}/>{label}</NavLink>)}</nav><div className="sidebar-bottom"><div><span className="demo-dot"/> Demo workspace<small>Simulated login. Browser-local data.</small></div><Link to="/" className="sidebar-store-link"><Icon name="arrow-up-right"/> View storefront</Link><button onClick={() => { try { logout(); navigate('/admin/login', { replace: true }); } catch { navigate('/admin/login', { replace: true }); } }}><Icon name="box-arrow-right"/> Logout</button></div></aside><div className="admin-workspace"><header className="admin-header"><div className="d-flex align-items-center gap-3"><button className="icon-button admin-menu-button" aria-label="Toggle admin navigation" aria-expanded={menu} aria-controls="admin-navigation" onClick={() => setMenu(!menu)}><Icon name={menu ? 'x-lg' : 'list'}/></button><span className="admin-breadcrumb">Workspace <Icon name="chevron-right"/> <strong>{current}</strong></span></div><div className="admin-user"><span className="admin-avatar">OA</span><div>Demo administrator<small>OUD & AURA</small></div></div></header><main className="admin-main" id="admin-main"><Outlet/></main><footer className="admin-footer">OUD & AURA · Assessment demo · Data stays in this browser</footer></div></div>;
}
