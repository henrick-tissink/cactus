import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhyDisclosure } from './WhyDisclosure';

describe('WhyDisclosure', () => {
  it('hides the reason content by default', () => {
    render(<WhyDisclosure reason="So we can tailor your plan." />);
    expect(screen.queryByText(/so we can tailor your plan/i)).not.toBeInTheDocument();
  });

  it('reveals the reason on click', async () => {
    render(<WhyDisclosure reason="So we can tailor your plan." />);
    await userEvent.click(screen.getByRole('button', { name: /why are we asking this/i }));
    expect(screen.getByText(/so we can tailor your plan/i)).toBeInTheDocument();
  });

  it('hides the reason on a second click', async () => {
    render(<WhyDisclosure reason="So we can tailor your plan." />);
    const trigger = screen.getByRole('button', { name: /why are we asking this/i });
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    expect(screen.queryByText(/so we can tailor your plan/i)).not.toBeInTheDocument();
  });
});
