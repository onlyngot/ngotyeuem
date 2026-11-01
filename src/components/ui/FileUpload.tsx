import { useState, useRef, useEffect, ChangeEvent } from 'react';
import ImagePlaceholder from './ImagePlaceholder';

export interface FileUploadProps {
  onImageSelected?: (fileOrUrl: any) => void;
  onImageChange?: (dataUrl: string | null) => void;
  currentImageUrl?: string | null;
  label?: string;
  shape?: 'circle' | 'rect';
}

// Compress client-side images using Canvas to prevent localStorage QuotaExceededError
function compressImage(file: File, maxDim = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        let compressed = canvas.toDataURL(mimeType, quality);

        // If PNG is still large (> 350KB), convert to JPEG to ensure local storage safety
        if (compressed.length > 400000 && mimeType === 'image/png') {
          compressed = canvas.toDataURL('image/jpeg', 0.85);
        }

        resolve(compressed);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// Render image with zoom and horizontal pan onto an HTML5 canvas to bake the crop
function bakeTransformedImage(
  dataUrl: string,
  zoom: number,
  panX: number,
  targetWidth = 400,
  targetHeight = 400
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Translate to center + pan offset, then scale
      ctx.save();
      // Relative pan based on canvas width
      const actualPanX = (panX / 100) * targetWidth;
      ctx.translate(targetWidth / 2 + actualPanX, targetHeight / 2);
      ctx.scale(zoom, zoom);

      // Draw aspect-ratio cover
      const aspect = img.width / img.height;
      let drawW = targetWidth;
      let drawH = targetHeight;
      if (aspect > 1) {
        drawW = targetHeight * aspect;
      } else {
        drawH = targetWidth / aspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      resolve(canvas.toDataURL('image/png', 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function FileUpload({
  onImageSelected,
  onImageChange,
  currentImageUrl,
  label,
  shape = 'circle',
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdjustToolbar, setShowAdjustToolbar] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [isBaking, setIsBaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep preview synced when parent updates currentImageUrl
  useEffect(() => {
    setPreview(currentImageUrl || null);
    setZoom(1);
    setPanX(0);
    setShowAdjustToolbar(true);
  }, [currentImageUrl]);

  const notifyChange = (value: string | null) => {
    setPreview(value);
    if (onImageChange) {
      onImageChange(value);
    }
    if (onImageSelected) {
      onImageSelected(value);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setZoom(1);
      setPanX(0);
      notifyChange(compressedDataUrl);
      setShowAdjustToolbar(true); // Open adjust panel automatically so user can pan/zoom
    } catch {
      // Fallback direct read
      const reader = new FileReader();
      reader.onloadend = () => {
        setZoom(1);
        setPanX(0);
        notifyChange(reader.result as string);
        setShowAdjustToolbar(true);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    notifyChange(null);
    setUrlInput('');
    setZoom(1);
    setPanX(0);
    setShowAdjustToolbar(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setZoom(1);
      setPanX(0);
      notifyChange(urlInput.trim());
      setIsUrlMode(false);
      setShowAdjustToolbar(true);
    }
  };

  const handleApplyBake = async () => {
    if (!preview) return;
    setIsBaking(true);
    try {
      const baked = await bakeTransformedImage(
        preview,
        zoom,
        panX,
        shape === 'circle' ? 360 : 500,
        shape === 'circle' ? 360 : 380
      );
      setZoom(1);
      setPanX(0);
      notifyChange(baked);
    } finally {
      setIsBaking(false);
    }
  };

  const handleResetAdjustments = () => {
    setZoom(1);
    setPanX(0);
  };

  return (
    <div className="flex flex-col items-center gap-2.5 p-3.5 border-2 border-[#ffc2d1] rounded-2xl bg-[#fffff2]/85 shadow-2xs w-full transition-all">
      {label && (
        <span className="text-[11px] font-bold text-[#8d2d48] self-start mb-0.5">
          {label}
        </span>
      )}

      {/* Image Preview Container */}
      <div className="relative flex items-center justify-center">
        {preview ? (
          <div className="relative group">
            {/* Mask frame with overflow hidden for live zoom & pan */}
            <div
              className={`overflow-hidden border-[3px] border-[#ffb3c6] shadow-xs bg-[#ffe0df]/30 relative flex items-center justify-center ${
                shape === 'circle' ? 'w-24 h-24 rounded-full' : 'w-36 h-28 rounded-2xl'
              }`}
            >
              <img
                src={preview}
                alt="Preview"
                style={{
                  transform: `scale(${zoom}) translateX(${panX}px)`,
                  transformOrigin: 'center center',
                }}
                className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-75"
              />
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-[#ff8fab] hover:bg-[#e56b82] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md cursor-pointer transition active:scale-90 z-10"
              title="Xóa ảnh"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="p-1">
            {shape === 'circle' ? (
              <ImagePlaceholder size="sm" />
            ) : (
              <div className="w-36 h-24 rounded-xl border-2 border-dashed border-[#ffb3c6] bg-[#ffe0df]/30 flex flex-col items-center justify-center text-[#b33959] gap-1">
                <span className="text-xl">🖼️</span>
                <span className="text-[10px] font-medium">Chưa có ảnh</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Upload / Edit Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full mt-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="cursor-pointer bg-[#ffdde7] hover:bg-[#ffe0df] text-[#8d2d48] border border-[#ffb3c6] px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50"
        >
          <span>{isProcessing ? '⏳' : '📁'}</span>
          <span>{isProcessing ? 'Đang nén...' : preview ? 'Đổi ảnh từ máy' : 'Tải ảnh từ máy'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="cursor-pointer bg-[#fffff2] hover:bg-[#ffe0df] text-[#8d2d48] border border-[#ffc2d1] px-2.5 py-1.5 rounded-full text-xs font-semibold transition active:scale-95"
          title="Dán link ảnh"
        >
          🔗 Link URL
        </button>

        {preview && (
          <>
            <button
              type="button"
              onClick={() => setShowAdjustToolbar(!showAdjustToolbar)}
              className={`cursor-pointer px-2.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 border flex items-center gap-1 ${
                showAdjustToolbar
                  ? 'bg-[#ff9ebb] text-white border-[#f888a7]'
                  : 'bg-[#ffe0df] text-[#8d2d48] border-[#ffb3c6] hover:bg-[#ffdde7]'
              }`}
              title="Phóng to, thu nhỏ, di chuyển phải trái"
            >
              <span>🔍</span>
              <span>{showAdjustToolbar ? 'Thu gọn' : 'Căn nhanh'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('caomei_open_image_editor', {
                    detail: {
                      initialImage: preview,
                      targetTitle: label ? `Chỉnh sửa: ${label}` : 'Chỉnh Sửa & Cắt Ảnh',
                      targetType: shape === 'circle' ? 'avatar' : 'artwork',
                      onSaved: (baked: string) => {
                        notifyChange(baked);
                      },
                    },
                  })
                );
              }}
              className="cursor-pointer bg-gradient-to-r from-[#ff8fab] to-[#e56b82] hover:from-[#ff7b99] hover:to-[#d4556f] text-white px-2.5 py-1.5 rounded-full text-xs font-black transition active:scale-95 border border-[#e56b82] flex items-center gap-1 shadow-2xs"
              title="Mở Studio sửa ảnh toàn diện: xoay, lật, zoom, di chuyển và bộ lọc"
            >
              <span>✂️</span>
              <span>Sửa nâng cao</span>
            </button>
          </>
        )}
      </div>

      {/* Direct URL input */}
      {isUrlMode && (
        <div className="w-full flex items-center gap-1.5 mt-1 pt-2 border-t border-[#ffc2d1]/50">
          <input
            type="url"
            placeholder="https://... ảnh.jpg/png"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs border border-[#ffc2d1] rounded-lg bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-2.5 py-1 bg-[#ff9ebb] hover:bg-[#ff8fab] text-white text-xs font-bold rounded-lg cursor-pointer transition"
          >
            Lưu
          </button>
        </div>
      )}

      {/* Dedicated Zoom & Pan Left/Right Control Panel */}
      {preview && showAdjustToolbar && (
        <div className="w-full mt-2.5 p-3 rounded-2xl bg-[#ffdde7]/60 border-2 border-[#ffb3c6] flex flex-col gap-2.5 text-[11px] text-[#8d2d48] shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between font-black border-b border-[#ffb3c6] pb-1.5 text-xs text-[#d45d79]">
            <span className="flex items-center gap-1.5">
              <span>✂️</span>
              <span>Căn chỉnh ảnh (Zoom & Di chuyển)</span>
            </span>
            <button
              type="button"
              onClick={handleResetAdjustments}
              className="text-[10px] font-bold text-[#b33959] hover:underline cursor-pointer"
            >
              ↺ Đặt lại
            </button>
          </div>

          {/* 1. Zoom In / Zoom Out Control */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-semibold">
              <span>Phóng to / Thu nhỏ:</span>
              <span className="font-mono font-bold text-[#b33959]">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.5, +(prev - 0.1).toFixed(2)))}
                className="w-6 h-6 rounded-md bg-[#fffff2] border border-[#ffb3c6] font-bold text-xs flex items-center justify-center hover:bg-[#ffdde7] cursor-pointer"
                title="Thu nhỏ"
              >
                −
              </button>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#ff8fab] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3.0, +(prev + 0.1).toFixed(2)))}
                className="w-6 h-6 rounded-md bg-[#fffff2] border border-[#ffb3c6] font-bold text-xs flex items-center justify-center hover:bg-[#ffdde7] cursor-pointer"
                title="Phóng to"
              >
                +
              </button>
            </div>
          </div>

          {/* 2. Move Left / Right (Pan X) Control */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-semibold">
              <span>Di chuyển Trái / Phải:</span>
              <span className="font-mono font-bold text-[#b33959]">
                {panX > 0 ? `+${panX}px` : `${panX}px`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPanX((prev) => Math.max(-80, prev - 5))}
                className="w-6 h-6 rounded-md bg-[#fffff2] border border-[#ffb3c6] font-bold text-[10px] flex items-center justify-center hover:bg-[#ffdde7] cursor-pointer"
                title="Di chuyển sang trái"
              >
                ◄
              </button>
              <input
                type="range"
                min="-80"
                max="80"
                step="2"
                value={panX}
                onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                className="flex-1 accent-[#ff8fab] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setPanX((prev) => Math.min(80, prev + 5))}
                className="w-6 h-6 rounded-md bg-[#fffff2] border border-[#ffb3c6] font-bold text-[10px] flex items-center justify-center hover:bg-[#ffdde7] cursor-pointer"
                title="Di chuyển sang phải"
              >
                ►
              </button>
            </div>
          </div>

          {/* 3. Apply / Bake button */}
          <button
            type="button"
            onClick={handleApplyBake}
            disabled={isBaking}
            className="w-full mt-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{isBaking ? '⏳' : '💾'}</span>
            <span>{isBaking ? 'Đang lưu góc ảnh...' : 'Lưu góc căn chỉnh này'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
