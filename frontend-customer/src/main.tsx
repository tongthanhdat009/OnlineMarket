import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, CartProvider, ToastProvider } from './app/providers';
import { appRoutes } from './app/router';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false }, mutations: { retry: 0 } } });
const router = createBrowserRouter(appRoutes);

createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={queryClient}><ToastProvider><AuthProvider><CartProvider><RouterProvider router={router} /></CartProvider></AuthProvider></ToastProvider></QueryClientProvider></StrictMode>);
