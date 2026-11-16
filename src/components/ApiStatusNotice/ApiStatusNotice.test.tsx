import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiStatusNotice, SLOW_AFTER_MS } from './ApiStatusNotice';

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ApiStatusNotice />
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => vi.useRealTimers());

describe('ApiStatusNotice', () => {
  it('renders nothing while idle', () => {
    setup();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('explains the wait only after a slow first load', async () => {
    vi.useFakeTimers();
    const client = setup();
    act(() => {
      void client.prefetchQuery({ queryKey: ['slow'], queryFn: () => new Promise(() => {}) });
    });
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(SLOW_AFTER_MS + 100);
    });
    expect(screen.getByRole('status').textContent).toContain('прокидається');
  });

  it('offers a retry after a failure and refetches the failed query', async () => {
    const client = setup();
    const queryFn = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue('ok');
    await act(async () => {
      await client.prefetchQuery({ queryKey: ['x'], queryFn }).catch(() => {});
    });

    const button = await screen.findByRole('button', { name: 'Спробувати ще' });
    await userEvent.click(button);

    expect(queryFn).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
