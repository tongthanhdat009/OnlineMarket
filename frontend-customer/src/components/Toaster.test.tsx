// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ToastProvider, useToast } from '../app/providers';
import { Toaster } from './store-ui';

function ShowToastButton({ message, kind }: { message: string; kind?: 'success' | 'error' | 'info' }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, kind)}>Notify</button>;
}

describe('global Toaster', () => {
  afterEach(() => { cleanup(); });

  it('renders success toasts without requiring the store layout', async () => {
    render(
      <ToastProvider>
        <Toaster />
        <ShowToastButton message="Tạo tài khoản thành công." kind="success" />
      </ToastProvider>,
    );
    screen.getByRole('button', { name: 'Notify' }).click();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Tạo tài khoản thành công.'));
  });

  it('renders error toasts without requiring the store layout', async () => {
    render(
      <ToastProvider>
        <Toaster />
        <ShowToastButton message="Email đã được đăng ký" kind="error" />
      </ToastProvider>,
    );
    screen.getByRole('button', { name: 'Notify' }).click();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Email đã được đăng ký'));
  });
});
