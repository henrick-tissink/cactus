import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Phase2Intro } from './Phase2Intro';

describe('Phase2Intro', () => {
  it('renders the heading and the 3 framework cards', () => {
    render(<Phase2Intro onContinue={() => {}} onSkip={() => {}} />);
    expect(screen.getByRole('heading', { name: /meet your spending plan/i })).toBeInTheDocument();
    expect(screen.getByText('Needs')).toBeInTheDocument();
    expect(screen.getByText('Wants')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('calls onContinue when "See it in action" is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Intro onContinue={fn} onSkip={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /see it in action/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onSkip when "Skip for now" is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Intro onContinue={() => {}} onSkip={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /skip for now/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
