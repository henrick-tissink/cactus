/**
 * Style Guide — dev-only route at /styleguide
 * Renders every brand token + every typographic + every radius variant.
 * Added in Axis H PR-1 (2026-05-13). Expanded in subsequent PRs as primitives land.
 */

const swatches = [
  { name: 'brand-cream', hex: '#faf5ec', use: 'app background' },
  { name: 'brand-surface', hex: '#ffffff', use: 'card / elevated panel' },
  { name: 'brand-border', hex: '#ebe5d5', use: '1px hairline between surfaces' },
  { name: 'brand-sage', hex: '#1f6f4a', use: 'primary; links; positive numbers' },
  { name: 'brand-terracotta', hex: '#c9743a', use: 'accent (decorative)' },
  { name: 'brand-terracotta-soft', hex: '#fdf0e6', use: 'alert bg' },
  { name: 'brand-accent-ink', hex: '#8c4a1e', use: 'text on terracotta-soft' },
  { name: 'brand-text', hex: '#2d2418', use: 'primary text' },
  { name: 'brand-text-muted', hex: '#6b5e4a', use: 'secondary text' },
  { name: 'brand-text-faint', hex: '#a59982', use: 'disabled / decorative only' },
  { name: 'brand-danger', hex: '#b54838', use: 'error states' },
  { name: 'brand-info', hex: '#4a6b8a', use: 'informational chips' },
] as const;

const radii = [
  { name: 'radius-sm', value: '6px' },
  { name: 'radius-md', value: '10px' },
  { name: 'radius-lg', value: '12px' },
  { name: 'radius-xl', value: '16px' },
  { name: 'radius-2xl', value: '20px' },
  { name: 'radius-pill', value: '9999px' },
] as const;

export function StyleGuidePage() {
  return (
    <div
      style={{
        background: 'var(--color-brand-cream)',
        minHeight: '100vh',
        padding: '48px 32px',
        fontFamily: 'var(--font-sans-brand)',
        color: 'var(--color-brand-text)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <header style={{ marginBottom: 48 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-brand-text-muted)',
              fontWeight: 600,
            }}
          >
            Cactus · Axis H · style guide
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 56,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              margin: '8px 0 0',
              fontVariationSettings: '"opsz" 144, "SOFT" 100',
            }}
          >
            Brand tokens &amp; primitives
          </h1>
          <p style={{ marginTop: 8, color: 'var(--color-brand-text-muted)', fontSize: 15 }}>
            Living reference. Updated as each Axis H PR lands.
          </p>
        </header>

        {/* ── Colour ─────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
              fontVariationSettings: '"opsz" 60, "SOFT" 50',
            }}
          >
            Colour
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {swatches.map((s) => (
              <div
                key={s.name}
                style={{
                  background: 'var(--color-brand-surface)',
                  border: '1px solid var(--color-brand-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: 64,
                    borderRadius: 'var(--radius-md)',
                    background: s.hex,
                    border:
                      s.name === 'brand-surface' || s.name === 'brand-cream'
                        ? '1px solid var(--color-brand-border)'
                        : 'none',
                  }}
                />
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-brand-text-muted)',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {s.hex}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-brand-text-muted)', marginTop: 4 }}>
                  {s.use}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ─────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
              fontVariationSettings: '"opsz" 60, "SOFT" 50',
            }}
          >
            Typography
          </h2>

          <div
            style={{
              background: 'var(--color-brand-surface)',
              border: '1px solid var(--color-brand-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-brand-text-muted)',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Display · Fraunces · 400 · opsz 144 · SOFT 100
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 64,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariationSettings: '"opsz" 144, "SOFT" 100',
                color: 'var(--color-brand-sage)',
              }}
            >
              cactus
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-brand-surface)',
              border: '1px solid var(--color-brand-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-brand-text-muted)',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Heading · Fraunces · 500 · opsz 60 · SOFT 50
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 32,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                fontVariationSettings: '"opsz" 60, "SOFT" 50',
              }}
            >
              Where did your money go in March?
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-brand-surface)',
              border: '1px solid var(--color-brand-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-brand-text-muted)',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Body · Inter · 400/500/600/700
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0 }}>
              You spent <strong style={{ fontWeight: 600 }}>R&nbsp;8,437</strong> on dining last
              month — 38% more than your three-month average. Spotify, Uber Eats, and Mr Price
              account for most of the variance.
            </p>
          </div>

          <div
            style={{
              background: 'var(--color-brand-surface)',
              border: '1px solid var(--color-brand-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-brand-text-muted)',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Tabular lining numerals · class <code>.tabular-lining</code>
            </div>
            <table
              style={{ width: '100%', fontFamily: 'var(--font-display)', fontSize: 22 }}
              className="tabular-lining"
            >
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0' }}>Income</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-brand-sage)' }}>
                    R&nbsp;35,000
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Spent</td>
                  <td style={{ textAlign: 'right' }}>R&nbsp;20,672</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Remaining</td>
                  <td style={{ textAlign: 'right' }}>R&nbsp;14,328</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Radii ──────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
              fontVariationSettings: '"opsz" 60, "SOFT" 50',
            }}
          >
            Radii
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 16,
            }}
          >
            {radii.map((r) => (
              <div key={r.name} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    margin: '0 auto',
                    background: 'var(--color-brand-sage)',
                    borderRadius: `var(--${r.name})`,
                  }}
                />
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>{r.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-brand-text-muted)',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Primitives placeholder ─────────────── */}
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
              fontVariationSettings: '"opsz" 60, "SOFT" 50',
            }}
          >
            Primitives
          </h2>
          <p style={{ color: 'var(--color-brand-text-muted)', fontStyle: 'italic' }}>
            Components arrive in Axis H PR-2 (Button, Card, Input, Badge, Alert, Tag, Stat,
            TransactionRow). This section gets populated incrementally as each primitive lands.
          </p>
        </section>
      </div>
    </div>
  );
}

export default StyleGuidePage;
