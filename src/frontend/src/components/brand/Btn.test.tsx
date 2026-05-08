import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Btn } from './Btn';

describe('Btn', () => {
  it('renders its children as the button label', () => {
    render(<Btn onClick={() => {}}>Continue</Btn>);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const fn = vi.fn();
    render(<Btn onClick={fn}>Go</Btn>);
    await userEvent.click(screen.getByRole('button', { name: /go/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const fn = vi.fn();
    render(
      <Btn onClick={fn} disabled>
        Go
      </Btn>
    );
    await userEvent.click(screen.getByRole('button', { name: /go/i }));
    expect(fn).not.toHaveBeenCalled();
  });

  it('forwards an additional className', () => {
    render(
      <Btn onClick={() => {}} className="my-extra">
        Go
      </Btn>
    );
    expect(screen.getByRole('button')).toHaveClass('my-extra');
  });
});
