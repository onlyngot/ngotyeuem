import React from 'react';

/**
 * VietnamesePacifico:
 * Renders Vietnamese romantic calligraphy text in authentic 'Pacifico' font (Dafont / Google Fonts).
 * Pacifico provides 100% native Vietnamese unicode character support with harmonious
 * diacritics, smooth connected brush cursive curves, and zero misplaced accents.
 */
export default function VietnamesePacifico({ className = '' }: { className?: string }) {
  return (
    <p
      className={`font-pacifico tracking-wide text-center select-none leading-relaxed drop-shadow-xs transition-colors ${className}`}
      style={{
        fontFamily: "'Pacifico', cursive, sans-serif",
      }}
    >
      ♡ Bé iu đợi một lát nhaa,yêu sắp đến với em gùiiᲘ⑅𐑼 ♡
    </p>
  );
}
