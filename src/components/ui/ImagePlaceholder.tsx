interface ImagePlaceholderProps {
  size?: 'sm' | 'md';
}

export default function ImagePlaceholder({ size = 'md' }: ImagePlaceholderProps) {
  const sizeClasses = size === 'sm' ? 'w-16 h-16 text-xl' : 'w-32 h-32 text-4xl';
  
  return (
    <div className={`${sizeClasses} bg-gradient-to-br from-[#ffdde7] via-[#ffe0df] to-[#ffc2d1] rounded-full flex items-center justify-center border-2 border-[#ffb3c6] shadow-2xs`}>
      <span>💖</span>
    </div>
  );
}
