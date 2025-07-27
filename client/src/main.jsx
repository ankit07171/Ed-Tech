import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(
   <>
   <div className='w-full min-h-screen'>
      {/* <ThemeProvider> */}
    <App/>

      {/* </ThemeProvider> */}
   </div>
   </>
)
