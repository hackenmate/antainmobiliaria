interface AlasoLogoProps {
  variant?: 'light-surface' | 'dark-surface';
  height?: number;
  className?: string;
}

/**
 * Official ALASO — Constructora e Inmobiliaria logotype.
 * On dark/granate surfaces, renders the exact provided official brand mark (/assets/aistudio/image_449d371c.png).
 * On light marfil (#F5F3F0) headers, pairs the crisp official granate mark & Montserrat wordmark.
 */
export function AlasoLogo({
  variant = 'light-surface',
  height = 42,
  className = '',
}: AlasoLogoProps) {
  if (variant === 'dark-surface') {
    return (
      <img
        src="/assets/aistudio/image_449d371c.png"
        alt="ALASO — Constructora e Inmobiliaria"
        style={{ height: `${height}px`, width: 'auto' }}
        className={`alaso-logo-img ${className}`.trim()}
      />
    );
  }

  return (
    <span className={`alaso-lockup ${className}`.trim()}>
      <span className="alaso-crest-badge" aria-hidden="true">
        <img
          src="/assets/aistudio/image_449d371c.png"
          alt=""
          className="alaso-crest-img"
        />
      </span>
      <span className="alaso-lockup-text">
        <span className="alaso-wordmark">ALASO</span>
        <span className="alaso-submark">CONSTRUCTORA E INMOBILIARIA</span>
      </span>
    </span>
  );
}
