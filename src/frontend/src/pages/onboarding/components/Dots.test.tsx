import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dots } from './Dots';

describe('Dots', () => {
  it('renders one dot per total', () => {
    const { container } = render(<Dots current={0} total={5} />);
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(5);
  });

  it('marks dots up to and including current as active', () => {
    const { container } = render(<Dots current={2} total={5} />);
    const dots = container.querySelectorAll('[data-dot]');
    expect(dots[0]).toHaveAttribute('data-active', 'true');
    expect(dots[1]).toHaveAttribute('data-active', 'true');
    expect(dots[2]).toHaveAttribute('data-active', 'true');
    expect(dots[3]).toHaveAttribute('data-active', 'false');
    expect(dots[4]).toHaveAttribute('data-active', 'false');
  });
});
