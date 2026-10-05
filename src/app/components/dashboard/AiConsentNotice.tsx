import type { CSSProperties } from 'react';
import { aiConsentCopy } from '@/lib/aiConsent.mjs';

type NoticeMode = 'full' | 'active' | 'denied';

export function AiConsentNotice({
  lang,
  mode,
  onGrant,
  onDeny,
  onReview,
}: {
  lang: string;
  mode: NoticeMode;
  onGrant: () => void;
  onDeny: () => void;
  onReview: () => void;
}) {
  const copy = aiConsentCopy(lang);

  return (
    <div
      role="region"
      aria-label={copy.title}
      style={{
        background: 'var(--mk-card)',
        border: '1px solid var(--mk-border)',
        borderRadius: 14,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {mode === 'full' && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--mk-text)', margin: 0 }}>{copy.title}</p>
          <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--mk-text-secondary)', margin: 0 }}>{copy.body}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={onGrant} style={primaryButton}>
              {copy.grant}
            </button>
            <button type="button" onClick={onDeny} style={quietButton}>
              {copy.deny}
            </button>
          </div>
        </>
      )}
      {mode === 'active' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--mk-text-secondary)', margin: 0 }}>{copy.active}</p>
          <button type="button" onClick={onDeny} style={quietButton}>{copy.stop}</button>
        </div>
      )}
      {mode === 'denied' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--mk-text-secondary)', margin: 0 }}>{copy.denied}</p>
          <button type="button" onClick={onReview} style={quietButton}>{copy.review}</button>
        </div>
      )}
    </div>
  );
}

const primaryButton: CSSProperties = {
  border: 'none',
  borderRadius: 999,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  color: 'var(--mk-text)',
  background: 'linear-gradient(135deg, var(--mk-orange), var(--mk-red))',
};

const quietButton: CSSProperties = {
  border: '1px solid var(--mk-border)',
  borderRadius: 999,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  color: 'var(--mk-text)',
  background: 'transparent',
};
