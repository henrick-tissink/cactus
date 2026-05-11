import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyInput } from './MoneyInput';

describe('MoneyInput', () => {
  it('renders the rand prefix', () => {
    render(<MoneyInput value="" onChange={() => {}} />);
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('passes numeric keystrokes through unchanged', async () => {
    const fn = vi.fn();
    render(<MoneyInput value="" onChange={fn} />);
    await userEvent.type(screen.getByRole('textbox'), '5');
    expect(fn).toHaveBeenLastCalledWith('5');
  });

  it('strips non-numeric keystrokes (calls onChange with empty string)', async () => {
    const fn = vi.fn();
    render(<MoneyInput value="" onChange={fn} />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(fn).toHaveBeenLastCalledWith('');
  });

  it('strips non-numeric characters from a multi-character paste', async () => {
    const fn = vi.fn();
    render(<MoneyInput value="" onChange={fn} />);
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.paste('1a2b3');
    expect(fn).toHaveBeenLastCalledWith('123');
  });

  it('renders the placeholder when value is empty', () => {
    render(<MoneyInput value="" onChange={() => {}} placeholder="35,000" />);
    expect(screen.getByPlaceholderText('35,000')).toBeInTheDocument();
  });

  it('renders the current value', () => {
    render(<MoneyInput value="12000" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('12000');
  });
});
