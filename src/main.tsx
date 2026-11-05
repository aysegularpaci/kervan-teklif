import {StrictMode} from 'react';import {createRoot} from 'react-dom/client';import App from './App2';import {migrateLegacy} from './lib/database';import './styles.css';import './toast.css';import './profile.css';import './app2.css';
migrateLegacy().catch(()=>undefined).finally(()=>createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>));
