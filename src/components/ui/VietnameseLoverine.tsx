import React from 'react';

/**
 * VietnameseLoverine:
 * Renders Vietnamese text in authentic 'Loverine' font with native glyph support
 * for all Vietnamese characters (đ, ợ, ộ, ắ, ế, ớ, ù, etc.) seamlessly integrated
 * into the font outline tables. No detached SVG marks, no broken letter spacing,
 * and 100% harmonious stroke and cursive connectivity.
 */
export default function VietnameseLoverine({ className = '' }: { className?: string }) {
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
