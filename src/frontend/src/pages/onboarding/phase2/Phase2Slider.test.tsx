import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Phase2Slider } from './Phase2Slider';

describe('Phase2Slider', () => {
  it('renders default values: income R35,000, Needs 50%, Wants 30%, Goals 20%', () => {
    render(<Phase2Slider onContinue={() => {}} />);
    expect(screen.getByText(/monthly income/i)).toBeInTheDocument();
    expect(screen.getByText(/r35[\s,]000/i)).toBeInTheDocument();
    // Each percentage appears twice (bar chart + slider/goals row)
    expect(screen.getAllByText(/50%/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/30%/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/20%/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Done in 3 months" at default 35,000 income / 20% goals (R7,000/mo for R20,000 debt)', () => {
    render(<Phase2Slider onContinue={() => {}} />);
    expect(screen.getByText(/done in 3 months/i)).toBeInTheDocument();
  });

  it('rebalances Goals when Needs slider is dragged up to 60%', () => {
    render(<Phase2Slider onContinue={() => {}} />);
    const needsSlider = screen.getByRole('slider', { name: /needs/i });
    fireEvent.change(needsSlider, { target: { value: '60' } });
    // 60% rendered both in the bar chart and the Needs slider row label
    expect(screen.getAllByText(/60%/).length).toBeGreaterThanOrEqual(1);
    // Goals (auto-calculated to 10%) rendered in bar + goals row
    expect(screen.getAllByText(/10%/).length).toBeGreaterThanOrEqual(1);
  });

  it('expands the income disclosure on click', async () => {
    render(<Phase2Slider onContinue={() => {}} />);
    expect(screen.queryByLabelText(/income amount/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /monthly income/i }));
    expect(screen.getByLabelText(/income amount/i)).toBeInTheDocument();
  });

  it('calls onContinue when "Got it" is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Slider onContinue={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
