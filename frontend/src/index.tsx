import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import serviceWorkerManager from './utils/serviceWorker';
import { isProduction } from './config/environment';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker in production
if (isProduction()) {
  serviceWorkerManager.register();
}
