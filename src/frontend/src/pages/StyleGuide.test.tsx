import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StyleGuidePage } from './StyleGuide';

describe('StyleGuidePage', () => {
  it('renders the main heading', () => {
    render(<StyleGuidePage />);
    expect(screen.getByText('Brand tokens & primitives')).toBeInTheDocument();
  });

  it('renders all 12 colour swatches', () => {
    render(<StyleGuidePage />);
    const swatchNames = [
      'brand-cream',
      'brand-surface',
      'brand-border',
      'brand-sage',
      'brand-terracotta',
      'brand-terracotta-soft',
      'brand-accent-ink',
      'brand-text',
      'brand-text-muted',
      'brand-text-faint',
      'brand-danger',
      'brand-info',
    ];
    for (const name of swatchNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('renders the wordmark sample', () => {
    render(<StyleGuidePage />);
    // The wordmark text appears in the typography section
    expect(screen.getByText('cactus')).toBeInTheDocument();
  });

  it('renders the radii samples', () => {
    render(<StyleGuidePage />);
    const radiusNames = [
      'radius-sm',
      'radius-md',
      'radius-lg',
      'radius-xl',
      'radius-2xl',
      'radius-pill',
    ];
    for (const name of radiusNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('renders the primitives placeholder noting future PRs', () => {
    render(<StyleGuidePage />);
    expect(screen.getByText(/Components arrive in Axis H PR-2/)).toBeInTheDocument();
  });
});
