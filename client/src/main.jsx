import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import axios from 'axios';

// Global axios config - set baseURL and attach token to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <div className={isDark ? 'dark' : ''}>
      <App />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);
