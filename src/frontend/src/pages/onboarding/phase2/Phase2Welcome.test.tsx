import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Phase2Welcome } from './Phase2Welcome';

describe('Phase2Welcome', () => {
  it('renders the welcome heading and "Show me" CTA', () => {
    render(<Phase2Welcome onContinue={() => {}} />);
    expect(screen.getByRole('heading', { name: /you're in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show me/i })).toBeInTheDocument();
  });

  it('calls onContinue when the CTA is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Welcome onContinue={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /show me/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
