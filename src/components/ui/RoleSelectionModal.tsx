import { useState, useRef, useEffect } from 'react';
import { setUserRole, verifyAdminPassword, UserRole } from '@/src/data/authRoleStorage';
import { playCuteSound } from '@/src/utils/soundEffects';
import { getGateViewerImage, getGateAdminImage } from '@/src/data/artStorage';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onRoleSelected: (role: UserRole) => void;
}

export default function RoleSelectionModal({ isOpen, onRoleSelected }: RoleSelectionModalProps) {
  const [mode, setMode] = useState<'select' | 'admin_prompt'>('select');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(getGateViewerImage());
  const [adminImage, setAdminImage] = useState<string | null>(getGateAdminImage());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setViewerImage(getGateViewerImage());
      setAdminImage(getGateAdminImage());
    };
    handleUpdate();
    window.addEventListener('yimeo_gate_images_updated', handleUpdate);
    return () => window.removeEventListener('yimeo_gate_images_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (mode === 'admin_prompt') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [mode]);

  if (!isOpen) return null;

  const handleSelectViewer = () => {
    playCuteSound('sparkle');
    setUserRole('viewer');
    onRoleSelected('viewer');
  };

  const handleOpenAdminPrompt = () => {
    playCuteSound('pop');
    setPassword('');
    setErrorMsg(null);
    setMode('admin_prompt');
  };

  const handleAdminSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    // Exact check - case sensitive and exact punctuation
    if (verifyAdminPassword(password)) {
      playCuteSound('bell');
      setUserRole('admin');
      onRoleSelected('admin');
    } else {
      playCuteSound('pop');
      setErrorMsg('Nhập pass sai rùi nè, kiểm tra lại nhé! ꒰(｡•́︿•̀｡)꒱');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1003] flex items-center justify-center p-4 transition-all duration-300 select-none"
      style={{
        backgroundColor: 'var(--theme-bg-overlay, rgba(255, 221, 231, 0.94))',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Decorative floating sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-[15%] left-[18%] text-2xl animate-bounce">✨</span>
        <span className="absolute top-[22%] right-[16%] text-xl animate-pulse">🌸</span>
        <span className="absolute bottom-[20%] left-[22%] text-2xl animate-pulse">🎀</span>
        <span className="absolute bottom-[24%] right-[20%] text-2xl animate-bounce">✨</span>
      </div>

      {/* Retro Window Container */}
      <div
        className={`relative w-full max-w-md rounded-3xl border-4 shadow-2xl overflow-hidden text-[#8d2d48] transition-all duration-300 ${
          isShaking ? 'animate-wiggle-soft' : ''
        }`}
        style={{
          backgroundColor: 'var(--theme-card-bg, #fffff2)',
          borderColor: 'var(--theme-border, #ffb3c6)',
          boxShadow: '0 18px 40px var(--theme-shadow, rgba(255, 179, 198, 0.5))',
        }}
      >
        {/* Retro Window Title Bar */}
        <div
          className="px-4 py-2.5 flex items-center justify-between border-b-2"
          style={{
            backgroundColor: 'var(--theme-bg, #ffdde7)',
            borderColor: 'var(--theme-border, #ffb3c6)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border inline-block shadow-inner"
              style={{
                backgroundColor: 'var(--theme-card-bg, #fffff2)',
                borderColor: 'var(--theme-border, #ffb3c6)',
              }}
            />
            <span
              className="text-xs font-black tracking-wider uppercase drop-shadow-xs"
              style={{ color: 'var(--theme-secondary, #8d2d48)' }}
            >
              welcome,my dear(˶ᵔ ᵕ ᵔ˶) ‹𝟹
            </span>
          </div>

          {/* Decorative 3 dots */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: 'var(--theme-card-bg, #fffff2)',
              borderColor: 'var(--theme-border, #ffb3c6)',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-accent, #ff8fab)' }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border, #ffb3c6)' }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border-light, #ffd4e0)' }} />
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-7 flex flex-col items-center text-center">
          {mode === 'select' ? (
            /* Main Role Selection View */
            <div className="w-full flex flex-col items-center">
              {/* Cute Badge */}
              <div
                className="px-4 py-1 rounded-full text-[11px] font-extrabold border mb-3 shadow-2xs"
                style={{
                  backgroundColor: 'var(--theme-light-bg, #ffe0df)',
                  borderColor: 'var(--theme-border, #ffb3c6)',
                  color: 'var(--theme-primary, #d45d79)',
                }}
              >
                ✦ ngọt và chỉ có ngọt ✦
              </div>

              <h2
                className="text-lg sm:text-xl font-black mb-2 leading-relaxed"
                style={{ color: 'var(--theme-primary, #d45d79)' }}
              >
                em bé,đến để thưởng thức chút mật ngọt nơi đâu lưỡi sao?
              </h2>
              <p className="text-xs mb-5 text-[#8d2d48]/85 font-medium leading-relaxed max-w-xs">
                Nếu là thích khách đến rước người thương,hãy chọn mục đầu tiên,em nhé.
              </p>

              {/* 2 Main Choice Buttons */}
              <div className="w-full flex flex-col gap-3.5">
                {/* Option 1: Người xem */}
                <button
                  type="button"
                  onClick={handleSelectViewer}
                  className="w-full p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-3.5 text-left group hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-card-bg, #fffff2)',
                    borderColor: 'var(--theme-border, #ffb3c6)',
                  }}
                >
                  <div
                    className="w-13 h-13 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110 border overflow-hidden bg-white shadow-2xs"
                    style={{
                      borderColor: 'var(--theme-border-light, #ffc2d1)',
                    }}
                  >
                    {viewerImage ? (
                      <img
                        src={viewerImage}
                        alt="Lối vào 1"
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    ) : (
                      <span>🌸</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-sm sm:text-[15px] font-black block leading-snug group-hover:opacity-90"
                      style={{ color: 'var(--theme-primary, #d45d79)' }}
                    >
                      đến gặp người trong lòng꒰ (ᵕ⸝⸝• ᴗ •) ✿..
                    </span>
                  </div>
                </button>

                {/* Option 2: Admin / Chủ khu tự trị */}
                <button
                  type="button"
                  onClick={handleOpenAdminPrompt}
                  className="w-full p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-3.5 text-left group hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--theme-light-bg, #ffe0df)',
                    borderColor: 'var(--theme-accent, #ff8fab)',
                  }}
                >
                  <div
                    className="w-13 h-13 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110 border overflow-hidden bg-white shadow-2xs"
                    style={{
                      borderColor: 'var(--theme-border, #ffb3c6)',
                    }}
                  >
                    {adminImage ? (
                      <img
                        src={adminImage}
                        alt="Lối vào 2"
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    ) : (
                      <span>⚡</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-sm sm:text-[15px] font-black block leading-snug group-hover:opacity-90"
                      style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                    >
                      đến cầm đầu khu tự trị˚ ˵ᗜ⩊ᗜ˵ ⊹.
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Admin Password Verification View */
            <form onSubmit={handleAdminSubmit} className="w-full flex flex-col items-center">
              <div
                className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl mb-3 shadow-sm animate-pulse-soft"
                style={{
                  backgroundColor: 'var(--theme-light-bg, #ffe0df)',
                  borderColor: 'var(--theme-border, #ffb3c6)',
                }}
              >
                ⚡
              </div>

              {/* The Exact Question Requested by User */}
              <h3
                className="text-base sm:text-lg font-black mb-1.5 leading-snug"
                style={{ color: 'var(--theme-secondary, #8d2d48)' }}
              >
                𖥻 ׁ ׅ  đã chuẩn bị cầm súng chích điện chưa?. ׁ ׅ
              </h3>

              <p className="text-xs mb-4 text-[#8d2d48]/75">
                Xác minh danh tính chủ khu tự trị:
              </p>

              {/* Password Input */}
              <div className="w-full relative mb-3">
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-4 py-2.5 rounded-2xl text-center text-sm font-bold border-2 focus:outline-none transition-all shadow-inner"
                  style={{
                    backgroundColor: 'var(--theme-card-bg, #fffff2)',
                    borderColor: errorMsg ? '#e53e3e' : 'var(--theme-accent, #ff8fab)',
                    color: 'var(--theme-secondary, #8d2d48)',
                  }}
                  autoComplete="off"
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold mb-3 animate-fadeIn w-full">
                  {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('select');
                    setPassword('');
                    setErrorMsg(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer hover:bg-black/5"
                  style={{
                    borderColor: 'var(--theme-border, #ffb3c6)',
                    color: 'var(--theme-secondary, #8d2d48)',
                  }}
                >
                  ← Quay lại
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: 'var(--theme-primary, #d45d79)',
                  }}
                >
                  <span>Xác nhận</span>
                  <span>➔</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
