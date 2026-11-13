import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-500.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import './styles/tokens.css';
import './styles/app.css';
import App from './App.jsx';
import { StoreProvider } from './hooks/useStore.jsx';

createRoot(document.getElementById('root')).render(<BrowserRouter><StoreProvider><App/></StoreProvider></BrowserRouter>);
