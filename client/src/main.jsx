import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import { SocketProvider } from "./context/SocketContext.jsx";
function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <div className={isDark ? 'dark' : ''}>
      <SocketProvider>
      <App />
      </SocketProvider>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);
