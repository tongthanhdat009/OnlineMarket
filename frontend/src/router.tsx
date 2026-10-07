import { useEffect } from 'react';
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { pages, PlaceholderPage, OrderDetailPage, LoginPage } from './pages/AdminPages';
import { useAuth } from './auth/AuthContext';

function AuthenticatedShell() {
  const auth = useAuth();
  const user = auth.user;
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.loading && !user) navigate('/login', { replace: true });
  }, [auth.loading, user, navigate]);
  if (auth.loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas"><div className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" aria-label="Loading session" /></div>;
  }
  return <AppShell
    permissions={user?.Permissions}
    user={{ name: user.FullName ?? user.Username, email: user.Username, role: String(user.Role ?? 'Administrator') }}
    onSignOut={auth.logout}
  />;
}

/** Route keys keep page selection explicit while details remain deep-linkable. */
function page(name: string) {
  if (name === 'dashboard') return <pages.DashboardPage />;
  if (name === 'orders') return <pages.OrdersPage />;
  if (name === 'orders-detail') return <OrderDetailPage />;
  if (name === 'pos') return <pages.PosPage />;
  if (name === 'products') return <pages.ProductsPage />;
  if (name === 'inventory') return <pages.InventoryPage />;
  if (name === 'customers' || name === 'customers-detail') return <pages.CustomersPage />;
  if (['categories', 'suppliers', 'promotions', 'bills', 'refunds'].includes(name)) {
    const label = { categories: 'Categories', suppliers: 'Suppliers', promotions: 'Promotions', bills: 'Bills', refunds: 'Refunds' }[name] ?? 'Categories';
    return <pages.ListPage type={label} />;
  }
  if (name.startsWith('ai-')) return <pages.AiPage page={name.slice(3).replace('-detail', '')} />;
  if (name.startsWith('admin-')) return <pages.AdminPage page={name.slice(6)} />;
  return <PlaceholderPage title="Page not found" />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AuthenticatedShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: page('dashboard') },
      { path: 'orders', element: page('orders') },
      { path: 'orders/:id', element: page('orders-detail') },
      { path: 'pos', element: page('pos') },
      { path: 'products', element: page('products') },
      { path: 'categories', element: page('categories') },
      { path: 'suppliers', element: page('suppliers') },
      { path: 'inventory', element: page('inventory') },
      { path: 'customers', element: page('customers') },
      { path: 'customers/:id', element: page('customers-detail') },
      { path: 'promotions', element: page('promotions') },
      { path: 'bills', element: page('bills') },
      { path: 'refunds', element: page('refunds') },
      { path: 'ai/chat', element: page('ai-chat') },
      { path: 'ai/agents', element: page('ai-agents') },
      { path: 'ai/agents/:id', element: page('ai-agents-detail') },
      { path: 'ai/runs', element: page('ai-runs') },
      { path: 'ai/runs/:id', element: page('ai-runs-detail') },
      { path: 'ai/activity', element: page('ai-activity') },
      { path: 'ai/reports', element: page('ai-reports') },
      { path: 'ai/analytics', element: page('ai-analytics') },
      { path: 'ai/tools', element: page('ai-tools') },
      { path: 'admin/users', element: page('admin-users') },
      { path: 'admin/roles', element: page('admin-roles') },
      { path: 'admin/permissions', element: page('admin-permissions') },
      { path: '*', element: page('not-found') },
    ],
  },
]);
