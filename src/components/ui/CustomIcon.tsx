import { useState, useEffect } from 'react';
import { getCustomIconSlots, CustomIconSlots } from '@/src/data/artStorage';

interface CustomIconProps {
  name: keyof CustomIconSlots;
  fallback: string | React.ReactNode;
  className?: string;
  alt?: string;
}

export default function CustomIcon({
  name,
  fallback,
  className = 'w-4 h-4 inline-block',
  alt = 'icon',
}: CustomIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(() => {
    return getCustomIconSlots()[name] || null;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const current = getCustomIconSlots();
      setIconUrl(current[name] || null);
    };

    window.addEventListener('caomei_icons_updated', handleUpdate);
    return () => window.removeEventListener('caomei_icons_updated', handleUpdate);
  }, [name]);

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={alt}
        className={`${className} object-contain align-middle inline-block select-none`}
      />
    );
  }

  return <span className="inline-flex items-center justify-center align-middle">{fallback}</span>;
}
