// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { apiClient } from '../api';
import { ApiError, getStoredToken, setStoredCustomer, setStoredToken } from '../lib';
import type { CustomerInfo } from '../types';
import { AuthProvider, useAuth } from './providers';

vi.mock('../api', () => ({
  apiClient: {
    auth: {
      me: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    },
  },
}));

function Probe() {
  const { isAuthenticated, isLoading } = useAuth();
  return <div role="status">{`${isAuthenticated}:${isLoading}`}</div>;
}

function LoginProbe() {
  const { login } = useAuth();
  return <button onClick={() => void login({ Email: 'new@example.test', Password: 'secret' }).catch(() => undefined)}>Log in</button>;
}

const customer: CustomerInfo = { CustomerId: 1, Name: 'Test customer', Email: 'test@example.test' };

describe('customer auth session recovery', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiClient.auth.me).mockReset();
  });

  it('keeps the stored session during a transient /me failure', async () => {
    setStoredToken('token');
    setStoredCustomer(customer);
    vi.mocked(apiClient.auth.me).mockRejectedValue(new ApiError('upstream unavailable', 503));

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('true:false'));
    expect(screen.getByRole('status')).toHaveTextContent('true:false');
    expect(getStoredToken()).toBe('token');
  });

  it('clears the stored session when /me rejects authentication', async () => {
    setStoredToken('token');
    setStoredCustomer(customer);
    vi.mocked(apiClient.auth.me).mockRejectedValue(new ApiError('expired', 401));

    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('false:false'));
    expect(getStoredToken()).toBeNull();
  });

  it('does not expose the previous customer when login validation is transiently unavailable', async () => {
    setStoredCustomer(customer);
    vi.mocked(apiClient.auth.login).mockResolvedValue({ Message: 'ok', Token: 'new-token' });
    vi.mocked(apiClient.auth.me).mockRejectedValue(new ApiError('upstream unavailable', 503));

    render(<AuthProvider><><Probe /><LoginProbe /></></AuthProvider>);
    await screen.getByRole('button', { name: 'Log in' }).click();

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('false:false'));
    expect(getStoredToken()).toBe('new-token');
  });
});
