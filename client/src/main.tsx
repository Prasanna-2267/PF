import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

const queryClient = new QueryClient();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const tree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider> : tree}
  </StrictMode>,
);
