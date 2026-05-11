import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionPill } from './OptionPill';

describe('OptionPill', () => {
  it('renders the icon and label', () => {
    render(<OptionPill icon="🔓" label="Get out of debt" selected={false} onClick={() => {}} />);
    expect(screen.getByText('🔓')).toBeInTheDocument();
    expect(screen.getByText('Get out of debt')).toBeInTheDocument();
  });

  it('shows a checkmark when selected', () => {
    render(<OptionPill icon="🔓" label="X" selected onClick={() => {}} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('hides the checkmark when not selected', () => {
    render(<OptionPill icon="🔓" label="X" selected={false} onClick={() => {}} />);
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const fn = vi.fn();
    render(<OptionPill icon="🔓" label="Get out of debt" selected={false} onClick={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /get out of debt/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
