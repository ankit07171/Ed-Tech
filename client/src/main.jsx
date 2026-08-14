import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Theme is applied by ThemeContext directly on <html> (see ThemeContext.jsx),
// so we don't need to wrap App in an extra themed div here — that used to
// cause a duplicate/out-of-sync `.dark` class between this file and App.jsx.
createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
