import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyColorPalette } from './data/paletteStorage';

// Apply active theme palette on bootstrap
applyColorPalette();

createRoot(document.getElementById('root')!).render(<App />);
