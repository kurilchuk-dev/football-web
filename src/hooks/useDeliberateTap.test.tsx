import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeliberateTap } from './useDeliberateTap';

function Target({ onTap }: { onTap: () => void }) {
  const tap = useDeliberateTap(onTap);
  return (
    <button type="button" {...tap}>
      press
    </button>
  );
}

afterEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

describe('useDeliberateTap', () => {
  it('fires on a plain tap', () => {
    const onTap = vi.fn();
    render(<Target onTap={onTap} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, { clientX: 50, clientY: 50 });
    fireEvent.click(button, { clientX: 52, clientY: 51 });
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('fires on a keyboard click, which has no pointer press', () => {
    const onTap = vi.fn();
    render(<Target onTap={onTap} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('ignores a press that moved like a scroll', () => {
    const onTap = vi.fn();
    render(<Target onTap={onTap} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, { clientX: 50, clientY: 50 });
    fireEvent.click(button, { clientX: 50, clientY: 120 });
    expect(onTap).not.toHaveBeenCalled();
  });

  it('ignores a press during which the page scrolled', () => {
    const onTap = vi.fn();
    render(<Target onTap={onTap} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, { clientX: 50, clientY: 50 });
    Object.defineProperty(window, 'scrollY', { value: 80, configurable: true });
    fireEvent.click(button, { clientX: 50, clientY: 50 });
    expect(onTap).not.toHaveBeenCalled();
  });

  it('ignores the click after the browser cancelled the press for scrolling', () => {
    const onTap = vi.fn();
    render(<Target onTap={onTap} />);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, { clientX: 50, clientY: 50 });
    fireEvent.pointerCancel(button);
    // A stray click without a press start counts as keyboard, so it must still pass.
    fireEvent.click(button);
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
