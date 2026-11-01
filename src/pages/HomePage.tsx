import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBunniesArt, getImageDecorSettings, ImageDecorSettings } from '@/src/data/artStorage';
import CustomIcon from '@/src/components/ui/CustomIcon';
import DecoratedImage from '@/src/components/ui/DecoratedImage';

export default function HomePage() {
  const [userArt, setUserArt] = useState<string | null>(getBunniesArt());
  const [decorSettings, setDecorSettings] = useState<ImageDecorSettings>(getImageDecorSettings());

  useEffect(() => {
    setUserArt(getBunniesArt());
    setDecorSettings(getImageDecorSettings());

    const handleUpdate = () => {
      setUserArt(getBunniesArt());
      setDecorSettings(getImageDecorSettings());
    };
    window.addEventListener('yimeo_image_decor_updated', handleUpdate);
    window.addEventListener('caomei_art_updated', handleUpdate);
    return () => {
      window.removeEventListener('yimeo_image_decor_updated', handleUpdate);
      window.removeEventListener('caomei_art_updated', handleUpdate);
    };
  }, []);

  return (
    <div className="flex flex-col items-center text-center py-8 px-2 text-[#8d2d48]">
      {/* Aesthetic tag - without icons as requested */}
      <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#ffdde7] text-[#8d2d48] text-xs sm:text-sm font-bold border border-[#ffb3c6] shadow-xs mb-6 select-none">
        <span>welcome,my dear(˶ᵔ ᵕ ᵔ˶) ‹𝟹</span>
      </div>

      {/* ONLY display user's art if they explicitly uploaded it, with AI-supported decor effects */}
      {userArt && (
        <div className="mb-6">
          <DecoratedImage
            src={userArt}
            alt="Your Artwork"
            effect={decorSettings.mascotEffect || 'bunny-jump'}
            showAura={true}
            imageClassName="max-h-52 w-auto object-contain drop-shadow-md rounded-2xl select-none"
          />
        </div>
      )}

      <h1
        className="font-try-happiness text-5xl sm:text-7xl tracking-[0.08em] mb-4 drop-shadow-sm select-none transition-colors"
        style={{
          fontFamily: "'Try Happiness', 'Try-Happiness', cursive, sans-serif",
          color: 'var(--theme-primary, #d45d79)',
        }}
      >
        little by little.
      </h1>
    </div>
  );
}
