import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CactusLogo } from './CactusLogo';

describe('CactusLogo', () => {
  it('renders the cactus wordmark', () => {
    render(<CactusLogo />);
    expect(screen.getByText('cactus')).toBeInTheDocument();
  });

  it('marks the SVG mark as decorative for assistive tech', () => {
    const { container } = render(<CactusLogo />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('forwards an additional className onto the wrapper', () => {
    const { container } = render(<CactusLogo className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
