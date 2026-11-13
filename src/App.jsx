import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import StoreLayout from './layouts/StoreLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Collections from './pages/Collections.jsx';
import OurStory from './pages/OurStory.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirmation from './pages/Confirmation.jsx';
import CustomerOrders from './pages/CustomerOrders.jsx';
import NotFound from './pages/NotFound.jsx';
import Login from './pages/admin/Login.jsx';
import Overview from './pages/admin/Overview.jsx';
import Products from './pages/admin/Products.jsx';
import ProductForm from './pages/admin/ProductForm.jsx';
import Categories from './pages/admin/Categories.jsx';
import Orders from './pages/admin/Orders.jsx';
import OrderDetails from './pages/admin/OrderDetails.jsx';
import Customers from './pages/admin/Customers.jsx';

function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
    const title = pathname.startsWith('/admin') ? 'Boutique management' : pathname === '/' ? 'Discover your signature scent' : pathname === '/shop' ? 'The fragrance collection' : pathname === '/cart' ? 'Shopping cart' : pathname === '/orders' ? 'My Orders' : pathname === '/checkout' ? 'Guest checkout' : 'The art of Arabian fragrance';
    document.title = `${title} — OUD & AURA`;
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname, search } = useLocation();
  return <><RouteEffects/><Routes><Route element={<StoreLayout/>}><Route index element={<Home/>}/><Route path="shop" element={<Shop/>}/><Route path="collections" element={<Collections/>}/><Route path="our-story" element={<OurStory/>}/><Route path="product/:id" element={<ProductDetails key={pathname + search}/>}/><Route path="cart" element={<Cart/>}/><Route path="checkout" element={<Checkout key={pathname + search}/>}/><Route path="orders" element={<CustomerOrders/>}/><Route path="order/:id" element={<Confirmation key={pathname}/>}/><Route path="*" element={<NotFound/>}/></Route><Route path="/admin/login" element={<Login/>}/><Route path="/admin" element={<AdminLayout/>}><Route index element={<Overview/>}/><Route path="products" element={<Products/>}/><Route path="products/new" element={<ProductForm key="new"/>}/><Route path="products/:id/edit" element={<ProductForm key={pathname}/>}/><Route path="categories" element={<Categories/>}/><Route path="orders" element={<Orders/>}/><Route path="orders/:id" element={<OrderDetails/>}/><Route path="customers" element={<Customers/>}/><Route path="*" element={<NotFound/>}/></Route></Routes></>;
}
