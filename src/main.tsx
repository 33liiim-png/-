import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enforce permanent dark mode throughout the app
document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(<App />);
