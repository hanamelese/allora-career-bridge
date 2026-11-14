import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
/* Inter, self-hosted: no request to a font service, and it works offline. */
import '@fontsource-variable/inter';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
