import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { DEMO_EMAIL, DEMO_PASSWORD, isLoggedIn, login } from '../../services/auth.js';
import { Alert, Brand, Icon } from '../../components/UI.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  if (isLoggedIn()) return <Navigate to="/admin" replace/>;
  return <main className="login-page"><div className="login-brand-panel"><Brand light/><div><p className="eyebrow">BEHIND THE BOUTIQUE</p><h2>Good things,<br/>beautifully<br/><em>managed.</em></h2><p>Your collection. Your customers. Every detail in one place.</p></div><span>OUD & AURA · DEMO WORKSPACE</span></div><div className="login-form-panel"><Link className="text-link" to="/"><Icon name="arrow-left"/> Back to the boutique</Link><div className="login-form-inner"><span className="login-icon"><Icon name="lock"/></span><p className="eyebrow">BOUTIQUE MANAGEMENT</p><h1>Admin login</h1><p className="text-muted">Manage your products, categories, and orders.</p><Alert>{error}</Alert><form onSubmit={event => { event.preventDefault(); setError(''); try { login(email, password); const from = location.state?.from; navigate(from?.startsWith('/admin') && from !== '/admin/login' ? from : '/admin', { replace: true }); } catch (error) { setError(error.message); } }}><label className="form-label" htmlFor="admin-email">Email address</label><input className="form-control mb-3" id="admin-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/><label className="form-label" htmlFor="admin-password">Password</label><div className="password-field"><input className="form-control" id="admin-password" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/><button type="button" className="icon-button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}><Icon name={show ? 'eye-slash' : 'eye'}/></button></div><button className="btn btn-dark w-100 mt-4">Sign in <Icon name="arrow-right"/></button></form><p className="login-customer-note">Shopping with us? <Link className="text-link" to="/shop">Continue as guest <Icon name="arrow-right"/></Link></p><div className="demo-credentials"><strong><Icon name="info-circle"/> Demo access</strong><span>{DEMO_EMAIL}</span><code>{DEMO_PASSWORD}</code><button className="text-button" onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); }}>Use demo credentials <Icon name="arrow-up-right"/></button><small>Simulated authentication for assessment only. This is not production security. Please use fictional customer information.</small></div></div></div></main>;
}
