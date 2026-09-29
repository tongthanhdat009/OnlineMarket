import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './providers';
import { StoreLayout } from '../layouts/StoreLayout';
import { AccountLayout } from '../layouts/AccountLayout';
import { HomePage, ProductDetailPage, ProductsPage } from '../pages/CatalogPages';
import { CartPage, CheckoutPage, OrdersPage, OrderDetailPage, PaymentResultPage } from '../pages/CommercePages';
import { AccountProfilePage, SecurityPage } from '../pages/AuthPages';
import { BillsPage, RefundsPage } from '../pages/AccountPages';
import { LoginPage, RegisterPage } from '../pages/AuthPages';

export function ProtectedRoute() { const { isAuthenticated, isLoading } = useAuth(); const location = useLocation(); if (isLoading) return <div className="container-store py-16"><div className="mx-auto h-40 max-w-xl rounded-3xl skeleton" /></div>; return isAuthenticated ? <Outlet /> : <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} replace />; }

export const appRoutes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { element: <StoreLayout />, children: [
    { index: true, element: <HomePage /> },
    { path: 'products', element: <ProductsPage /> },
    { path: 'products/:id', element: <ProductDetailPage /> },
    { path: 'category/:id', element: <ProductsPage /> },
    { path: 'search', element: <ProductsPage /> },
    { path: 'cart', element: <ProtectedRoute />, children: [{ index: true, element: <CartPage /> }] },
    { path: 'checkout', element: <ProtectedRoute />, children: [{ index: true, element: <CheckoutPage /> }] },
    { path: 'payment-result', element: <PaymentResultPage /> },
    { path: 'account', element: <ProtectedRoute />, children: [{ element: <AccountLayout />, children: [
      { index: true, element: <Navigate to="profile" replace /> },
      { path: 'profile', element: <AccountProfilePage /> },
      { path: 'security', element: <SecurityPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'bills', element: <BillsPage /> },
      { path: 'refunds', element: <RefundsPage /> },
    ] }] },
  ] },
  { path: '*', element: <Navigate to="/" replace /> },
];
