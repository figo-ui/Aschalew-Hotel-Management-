import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageThemeProvider } from './components/LanguageThemeContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageThemeProvider>
      <App />
    </LanguageThemeProvider>
  </StrictMode>,
);
