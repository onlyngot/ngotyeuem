import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  getLobbyBgmSettings,
  setLobbyBgmSettings,
  LobbyBgmSettings,
  MusicTrack,
  compressImage,
} from '@/src/data/artStorage';
import { isAdminUser } from '@/src/data/authRoleStorage';
import { parseMusicUrl, cuteSynth } from '@/src/utils/audioHelper';
import ImageEditorModal from '@/src/components/ui/ImageEditorModal';

export default function LobbyMusicPlayer() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminUser());
  const [settings, setSettings] = useState<LobbyBgmSettings>(getLobbyBgmSettings());
  // Nhạc sảnh mặc định luôn mở khi vào web
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCoverEditorModal, setShowCoverEditorModal] = useState(false);
  const [volume, setVolume] = useState(settings.volume ?? 0.6);
  const [pausedByProfile, setPausedByProfile] = useState(false);

  // Sync admin role reactively
  useEffect(() => {
    const handleRoleSync = () => {
      setIsAdmin(isAdminUser());
    };
    window.addEventListener('yimeo_role_changed', handleRoleSync);
    return () => window.removeEventListener('yimeo_role_changed', handleRoleSync);
  }, []);

  // Playback Progress & Duration
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Admin Editing states
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [isEditingPlaylistTitle, setIsEditingPlaylistTitle] = useState(false);
  const [playlistTitleInput, setPlaylistTitleInput] = useState(settings.playlistName || 'motive playlist ♡');
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);

  // Form states for adding / editing a track
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formDuration, setFormDuration] = useState('3:30');
  const [formUrl, setFormUrl] = useState('');
  const [formCover, setFormCover] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackCoverInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  const playlist: MusicTrack[] = settings.playlist && settings.playlist.length > 0
    ? settings.playlist
    : (settings.url ? [{ id: 'track_legacy', title: settings.title || 'BGM', url: settings.url }] : []);

  const currentIndex = Math.max(0, Math.min(settings.currentTrackIndex ?? 0, Math.max(0, playlist.length - 1)));
  const currentTrack: MusicTrack | undefined = playlist[currentIndex];
  const parsed = parseMusicUrl(currentTrack?.url || settings.url);

  // Auto detect duration whenever formUrl is pasted or entered
  useEffect(() => {
    if (!formUrl || !formUrl.trim() || formUrl.trim() === 'synth:lofi') return;
    try {
      const probeAudio = new Audio();
      probeAudio.src = formUrl.trim();
      probeAudio.preload = 'metadata';
      const onMeta = () => {
        if (probeAudio.duration && !isNaN(probeAudio.duration) && probeAudio.duration > 0) {
          const m = Math.floor(probeAudio.duration / 60);
          const s = Math.floor(probeAudio.duration % 60);
          setFormDuration(`${m}:${s < 10 ? '0' : ''}${s}`);
        }
      };
      probeAudio.addEventListener('loadedmetadata', onMeta);
      return () => {
        probeAudio.removeEventListener('loadedmetadata', onMeta);
      };
    } catch {}
  }, [formUrl]);

  // Sync settings when storage updates
  useEffect(() => {
    const handleUpdate = () => {
      const current = getLobbyBgmSettings();
      setSettings(current);
      setVolume(current.volume ?? 0.6);
      setPlaylistTitleInput(current.playlistName || 'motive playlist ♡');
    };

    window.addEventListener('caomei_bgm_updated', handleUpdate);
    return () => window.removeEventListener('caomei_bgm_updated', handleUpdate);
  }, []);

  // Luôn mở sẵn là bài đầu tiên của danh sách phát khi vào web
  useEffect(() => {
    if (playlist.length > 0 && settings.currentTrackIndex !== 0) {
      const first = playlist[0];
      const next: LobbyBgmSettings = {
        ...settings,
        currentTrackIndex: 0,
        url: first.url,
        title: first.title,
      };
      setLobbyBgmSettings(next);
      setSettings(next);
    }
  }, []);

  // Sync synth volume
  useEffect(() => {
    cuteSynth.setVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Parse track duration from string if duration state is 0
  useEffect(() => {
    if (currentTrack?.duration) {
      const parts = currentTrack.duration.split(':');
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10) || 0;
        const s = parseInt(parts[1], 10) || 0;
        const total = m * 60 + s;
        if (total > 0 && duration <= 0) {
          setDuration(total);
        }
      }
    }
  }, [currentTrack?.duration, duration]);

  // Auto-play on web entrance with user-gesture unlock
  useEffect(() => {
    const startAudio = () => {
      if (pausedByProfile) return;
      if (currentTrack?.url && currentTrack.url !== 'synth:lofi' && audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          cuteSynth.setVolume(volume);
          cuteSynth.start();
          setIsPlaying(true);
        });
      } else {
        cuteSynth.setVolume(volume);
        cuteSynth.start();
        setIsPlaying(true);
      }
    };

    startAudio();

    const onFirstClick = () => {
      startAudio();
      window.removeEventListener('pointerdown', onFirstClick);
      window.removeEventListener('keydown', onFirstClick);
    };

    window.addEventListener('pointerdown', onFirstClick, { once: true });
    window.addEventListener('keydown', onFirstClick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstClick);
      window.removeEventListener('keydown', onFirstClick);
    };
  }, [pausedByProfile, currentTrack?.url, volume]);

  // Update audio source when currentTrack changes
  useEffect(() => {
    if (audioRef.current && currentTrack?.url && currentTrack.url !== 'synth:lofi') {
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
        audioRef.current.volume = volume;
        if (isPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
  }, [currentIndex, currentTrack?.url, isPlaying, volume]);

  // Progress ticker: continuous smooth progress whenever isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused && audioRef.current.duration > 0) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration);
      } else {
        setCurrentTime((prev) => {
          const targetDuration = duration > 0 ? duration : 210;
          return prev >= targetDuration ? 0 : prev + 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Audio pause/resume coordination with Character Profile Music
  useEffect(() => {
    const handlePauseFromProfile = () => {
      if (isPlaying) {
        if (parsed.type === 'youtube' && ytIframeRef.current?.contentWindow) {
          ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        cuteSynth.stop();
        setIsPlaying(false);
        setPausedByProfile(true);
      }
    };

    const handleResumeFromProfile = () => {
      if (pausedByProfile && settings.enabled && currentTrack?.url) {
        if (parsed.type === 'youtube' && ytIframeRef.current?.contentWindow) {
          ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          setIsPlaying(true);
          setPausedByProfile(false);
        } else if (audioRef.current && currentTrack.url !== 'synth:lofi') {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            setPausedByProfile(false);
          }).catch(() => {
            cuteSynth.start();
            setIsPlaying(true);
            setPausedByProfile(false);
          });
        } else {
          cuteSynth.start();
          setIsPlaying(true);
          setPausedByProfile(false);
        }
      }
    };

    window.addEventListener('caomei_pause_lobby_bgm', handlePauseFromProfile);
    window.addEventListener('caomei_resume_lobby_bgm', handleResumeFromProfile);

    return () => {
      window.removeEventListener('caomei_pause_lobby_bgm', handlePauseFromProfile);
      window.removeEventListener('caomei_resume_lobby_bgm', handleResumeFromProfile);
    };
  }, [pausedByProfile, settings.enabled, currentTrack?.url, isPlaying, parsed.type]);

  const togglePlay = () => {
    if (isPlaying) {
      if (parsed.type === 'youtube' && ytIframeRef.current?.contentWindow) {
        ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      cuteSynth.stop();
      setIsPlaying(false);
      setPausedByProfile(false);
    } else {
      setPausedByProfile(false);
      if (currentTrack?.url === 'synth:lofi') {
        cuteSynth.start();
        setIsPlaying(true);
      } else if (parsed.type === 'youtube' && ytIframeRef.current?.contentWindow) {
        ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        setIsPlaying(true);
      } else if (parsed.type === 'direct' && audioRef.current) {
        cuteSynth.stop();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((e) => {
          console.warn('Playback fallback to synth:', e);
          cuteSynth.start();
          setIsPlaying(true);
        });
      } else {
        cuteSynth.start();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (v: number) => {
    const safeV = Math.max(0, Math.min(1, v));
    setVolume(safeV);
    if (audioRef.current) {
      audioRef.current.volume = safeV;
    }
    cuteSynth.setVolume(safeV);
    const next: LobbyBgmSettings = { ...settings, volume: safeV };
    setLobbyBgmSettings(next);
    setSettings(next);
  };

  const handleAdjustFeaturedImage = (panXDelta: number, panYDelta: number, zoomDelta: number) => {
    if (!isAdmin) return;
    const currentPanX = settings.featuredImagePanX || 0;
    const currentPanY = settings.featuredImagePanY || 0;
    const currentZoom = settings.featuredImageZoom || 1;
    const nextPanX = Math.max(-150, Math.min(150, currentPanX + panXDelta));
    const nextPanY = Math.max(-150, Math.min(150, currentPanY + panYDelta));
    const nextZoom = Math.max(0.5, Math.min(3, +(currentZoom + zoomDelta).toFixed(2)));
    const next: LobbyBgmSettings = {
      ...settings,
      featuredImagePanX: nextPanX,
      featuredImagePanY: nextPanY,
      featuredImageZoom: nextZoom,
    };
    setLobbyBgmSettings(next);
    setSettings(next);
  };

  const handleResetFeaturedAlignment = () => {
    if (!isAdmin) return;
    const next: LobbyBgmSettings = {
      ...settings,
      featuredImagePanX: 0,
      featuredImagePanY: 0,
      featuredImageZoom: 1,
    };
    setLobbyBgmSettings(next);
    setSettings(next);
  };

  const playTrackAtIndex = (index: number) => {
    if (playlist.length === 0) return;
    const safeIdx = Math.max(0, Math.min(index, playlist.length - 1));
    const targetTrack = playlist[safeIdx];
    const next: LobbyBgmSettings = {
      ...settings,
      currentTrackIndex: safeIdx,
      url: targetTrack.url,
      title: targetTrack.title,
    };
    setLobbyBgmSettings(next);
    setSettings(next);
    setIsPlaying(true);
    setCurrentTime(0);

    if (targetTrack.url === 'synth:lofi') {
      if (audioRef.current) audioRef.current.pause();
      cuteSynth.start();
    } else if (audioRef.current && targetTrack.url) {
      cuteSynth.stop();
      audioRef.current.src = targetTrack.url;
      audioRef.current.play().catch((err) => {
        console.warn('Audio play error, falling back to synth:', err);
        cuteSynth.start();
      });
    }
  };

  const playNextTrack = () => {
    if (playlist.length === 0) return;
    if (settings.shuffle) {
      const nextIdx = Math.floor(Math.random() * playlist.length);
      playTrackAtIndex(nextIdx);
    } else {
      const nextIdx = (currentIndex + 1) % playlist.length;
      playTrackAtIndex(nextIdx);
    }
  };

  const playPrevTrack = () => {
    if (playlist.length === 0) return;
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrackAtIndex(prevIdx);
  };

  const handleAudioEnded = () => {
    if (settings.repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    if (playlist.length > 1) {
      if (!settings.shuffle && currentIndex === playlist.length - 1 && settings.repeatMode === 'off') {
        setIsPlaying(false);
        return;
      }
      playNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  const toggleFavoriteTrack = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedList = playlist.map((t) =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    );
    const next: LobbyBgmSettings = { ...settings, playlist: updatedList };
    setLobbyBgmSettings(next);
    setSettings(next);
  };

  // Admin playlist rename
  const handleSavePlaylistName = () => {
    if (!isAdmin) return;
    const name = playlistTitleInput.trim() || 'motive playlist ♡';
    const next: LobbyBgmSettings = { ...settings, playlistName: name };
    setLobbyBgmSettings(next);
    setSettings(next);
    setIsEditingPlaylistTitle(false);
  };

  // Admin featured banner upload
  const handleFeaturedImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 600, 0.85);
      const next: LobbyBgmSettings = { ...settings, featuredImage: dataUrl };
      setLobbyBgmSettings(next);
      setSettings(next);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        const next: LobbyBgmSettings = { ...settings, featuredImage: res };
        setLobbyBgmSettings(next);
        setSettings(next);
      };
      reader.readAsDataURL(file);
    }
  };

  // Admin track cover image upload
  const handleTrackCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 200, 0.85);
      setFormCover(dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormCover(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Admin audio file upload
  const handleAudioFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormUrl(dataUrl);
      if (!formTitle) {
        setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Admin save track (Add or Edit)
  const handleSaveTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (editingTrack) {
      // Update existing track
      const updatedList = playlist.map((t) =>
        t.id === editingTrack.id
          ? {
              ...t,
              title: formTitle.trim() || t.title,
              artist: formArtist.trim() || t.artist,
              duration: formDuration.trim() || t.duration,
              url: formUrl.trim() || t.url,
              coverImage: formCover !== undefined ? formCover : t.coverImage,
            }
          : t
      );
      const next: LobbyBgmSettings = { ...settings, playlist: updatedList };
      setLobbyBgmSettings(next);
      setSettings(next);
      setEditingTrack(null);
    } else {
      // Add new track
      const newTrack: MusicTrack = {
        id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: formTitle.trim() || 'NEW TRACK',
        artist: formArtist.trim() || 'ARTIST',
        duration: formDuration.trim() || '3:30',
        url: formUrl.trim() || 'synth:lofi',
        coverImage: formCover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
        isFavorite: false,
      };
      const updatedList = [...playlist, newTrack];
      const next: LobbyBgmSettings = { ...settings, playlist: updatedList };
      setLobbyBgmSettings(next);
      setSettings(next);
      setShowAddTrackModal(false);
    }

    setFormTitle('');
    setFormArtist('');
    setFormDuration('3:30');
    setFormUrl('');
    setFormCover(null);
  };

  const handleOpenEditTrack = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingTrack(track);
    setFormTitle(track.title);
    setFormArtist(track.artist || '');
    setFormDuration(track.duration || '3:30');
    setFormUrl(track.url);
    setFormCover(track.coverImage || null);
    setShowAddTrackModal(true);
  };

  const handleDeleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (playlist.length <= 1) {
      alert('Playlist cần giữ lại ít nhất 1 bài hát nhé!');
      return;
    }
    const filtered = playlist.filter((t) => t.id !== id);
    const newIdx = Math.max(0, Math.min(currentIndex, filtered.length - 1));
    const next: LobbyBgmSettings = {
      ...settings,
      playlist: filtered,
      currentTrackIndex: newIdx,
      url: filtered[newIdx].url,
      title: filtered[newIdx].title,
    };
    setLobbyBgmSettings(next);
    setSettings(next);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayTime = duration > 0 ? formatTime(currentTime) : (currentTrack?.duration || '3:45');

  return (
    <div className="relative flex items-center">
      {/* Hidden Native Audio Element */}
      {parsed.type === 'direct' && currentTrack?.url && currentTrack.url !== 'synth:lofi' && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              setDuration(audioRef.current.duration || 0);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration || 0);
            }
          }}
          onEnded={handleAudioEnded}
          onError={() => {
            console.warn('Audio tag failed to load track, activating cute synth');
            cuteSynth.start();
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* Hidden YouTube iframe */}
      {parsed.type === 'youtube' && parsed.youtubeVideoId && (
        <div className="hidden pointer-events-none" aria-hidden="true">
          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube.com/embed/${parsed.youtubeVideoId}?enablejsapi=1&autoplay=0&loop=1&playlist=${parsed.youtubeVideoId}`}
            title="YouTube Lobby BGM"
            allow="autoplay"
            className="w-1 h-1 opacity-0 pointer-events-none"
          />
        </div>
      )}

      {/* Playlist / Lobby BGM Mini Pill Controller on Navbar */}
      <div
        className="flex items-center gap-1.5 p-1 px-2.5 rounded-full border shadow-xs text-xs transition cursor-pointer select-none"
        style={{
          backgroundColor: 'var(--theme-light-bg, #ffe0df)',
          borderColor: 'var(--theme-border, #ffb3c6)',
        }}
      >
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-1 font-bold hover:opacity-80 cursor-pointer"
          style={{ color: 'var(--theme-secondary, #8d2d48)' }}
          title={isPlaying ? 'Tạm dừng nhạc nền' : 'Phát nhạc nền'}
        >
          <span className={`text-xs ${isPlaying ? 'animate-bounce' : ''}`}>
            {isPlaying ? '🎵' : '💤'}
          </span>
          <span className="hidden md:inline font-bold text-[11px] max-w-[85px] truncate">
            {currentTrack?.title || 'MOTIVE'}
          </span>
        </button>

        {/* Prev & Next in mini controller */}
        <button
          type="button"
          onClick={playPrevTrack}
          className="w-4 h-4 rounded-full text-[9px] hover:bg-white/60 flex items-center justify-center cursor-pointer"
          style={{ color: 'var(--theme-secondary, #8d2d48)' }}
          title="Bài trước đó"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={playNextTrack}
          className="w-4 h-4 rounded-full text-[9px] hover:bg-white/60 flex items-center justify-center cursor-pointer"
          style={{ color: 'var(--theme-secondary, #8d2d48)' }}
          title="Bài tiếp theo"
        >
          ▶
        </button>

        {/* Open Playlist Modal Button (Matching [Ảnh 1]) */}
        <button
          type="button"
          onClick={() => setShowPlaylistModal(true)}
          className="w-5 h-5 rounded-full bg-white text-[10px] font-bold border flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105 transition"
          style={{
            borderColor: 'var(--theme-border, #ffb3c6)',
            color: 'var(--theme-primary, #d45d79)',
          }}
          title={`Xem playlist đầy đủ ([Ảnh 1]) • ${playlist.length} bài hát`}
        >
          💿
        </button>
      </div>

      {/* FULL AESTHETIC PLAYLIST MODAL - EXACT LAYOUT OF [ẢNH 1] */}
      {showPlaylistModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowPlaylistModal(false)}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 backdrop-blur-md animate-fadeIn"
          style={{
            backgroundColor: 'var(--theme-bg-overlay, rgba(30, 25, 38, 0.72))',
          }}
        >
          {/* Main Modal Outer Frame - Styled to sync with Active Theme Palette */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-[32px] p-4 sm:p-6 shadow-2xl relative animate-fadeIn flex flex-col gap-4 max-h-[92vh] overflow-y-auto custom-scrollbar border-4"
            style={{
              backgroundColor: 'var(--theme-bg, #ffdde7)',
              borderColor: 'var(--theme-border, #ffb3c6)',
              boxShadow: '0 20px 50px var(--theme-shadow, rgba(255, 179, 198, 0.45))',
            }}
          >
            {/* Top Bar with Star & Title & Close */}
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <div className="flex items-center gap-2">
                <span className="text-base animate-pulse">✦</span>
                <span className="font-serif tracking-widest uppercase font-bold text-sm" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
                  {settings.playlistName || 'MOTIVE PLAYLIST'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPlaylistModal(false)}
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-base font-black flex items-center justify-center cursor-pointer border shadow-xs transition"
                style={{
                  borderColor: 'var(--theme-border, #ffb3c6)',
                  color: 'var(--theme-secondary, #8d2d48)',
                }}
              >
                ×
              </button>
            </div>

            {/* [ẢNH 1] PHẦN TRÊN: CARD NOW PLAYING & FEATURED ARTWORK */}
            <div
              className="rounded-3xl border-3 p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-stretch"
              style={{
                backgroundColor: 'var(--theme-card-bg, #fffff2)',
                borderColor: 'var(--theme-border, #ffb3c6)',
              }}
            >
              {/* TRÁI: Tag, Title, Artist/Duration, Scrubber, Media Controls (Luôn thấy rõ ràng, không bao giờ bị rơi vào điểm mù) */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  {/* Playlist Name Tag with subtle aesthetic rule */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[11px] font-medium tracking-wide lowercase shrink-0"
                      style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                    >
                      {settings.playlistName || 'motive playlist'}
                    </span>
                    <span className="text-[10px] text-pink-400">♡</span>
                    <div className="h-[1px] flex-1 bg-[var(--theme-border-light,#ffd4e0)]" />
                    {/* Admin Rename Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPlaylistTitle(true)}
                        className="text-[10px] text-pink-600 hover:underline cursor-pointer ml-1 font-bold shrink-0"
                        title="Đổi tên playlist (Admin)"
                      >
                        ✏️ Sửa tên
                      </button>
                    )}
                  </div>

                  {/* Main Large Song Title - Always prominent and visible */}
                  <h2
                    className="text-2xl sm:text-3xl font-black tracking-wider uppercase truncate mt-1"
                    style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                  >
                    {currentTrack?.title || 'MOTIVE'}
                  </h2>

                  {/* Artist & Timestamp row */}
                  <div
                    className="flex items-center justify-between text-xs font-bold tracking-wider uppercase mt-1"
                    style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                  >
                    <span className="truncate pr-2">{currentTrack?.artist || 'ARIANA GRANDE FT DOJA CAT'}</span>
                    <span className="font-mono shrink-0">{displayTime}</span>
                  </div>
                </div>

                {/* Progress bar line matching [Ảnh 1] */}
                <div className="my-3">
                  <div
                    className="w-full h-1.5 rounded-full relative cursor-pointer group"
                    style={{ backgroundColor: 'var(--theme-border-light, #ffd4e0)' }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, clickX / rect.width));
                      const targetDuration = duration > 0 ? duration : 210;
                      const newTime = pct * targetDuration;
                      if (audioRef.current && duration > 0) {
                        audioRef.current.currentTime = newTime;
                      }
                      setCurrentTime(newTime);
                    }}
                  >
                    <div
                      className="h-full rounded-full relative"
                      style={{
                        width: duration > 0 ? `${Math.min(100, (currentTime / duration) * 100)}%` : '15%',
                        backgroundColor: 'var(--theme-secondary, #8d2d48)',
                      }}
                    >
                      {/* Active scrub handle */}
                      <span
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: 'var(--theme-secondary, #8d2d48)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Media Controls Row below progress line: < ◁◁ ▷ ▷▷ ♡ matching [Ảnh 1] */}
                <div
                  className="flex items-center justify-between text-base sm:text-lg select-none"
                  style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Back icon (<) */}
                    <button
                      type="button"
                      onClick={() => setShowPlaylistModal(false)}
                      className="hover:scale-110 active:scale-95 transition cursor-pointer text-sm"
                      title="Thu nhỏ playlist"
                    >
                      &lt;
                    </button>

                    {/* Prev track (◁◁) */}
                    <button
                      type="button"
                      onClick={playPrevTrack}
                      className="hover:scale-110 active:scale-95 transition cursor-pointer"
                      title="Bài trước đó"
                    >
                      ◁◁
                    </button>

                    {/* Play / Pause circular button (▷ / ❚❚) */}
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:scale-110 active:scale-95 transition cursor-pointer text-sm"
                      style={{ borderColor: 'var(--theme-secondary, #8d2d48)' }}
                      title={isPlaying ? 'Tạm dừng' : 'Phát'}
                    >
                      {isPlaying ? '❚❚' : '▷'}
                    </button>

                    {/* Next track (▷▷) */}
                    <button
                      type="button"
                      onClick={playNextTrack}
                      className="hover:scale-110 active:scale-95 transition cursor-pointer"
                      title="Bài kế tiếp"
                    >
                      ▷▷
                    </button>

                    {/* Heart Favorite toggle (♡ / ♥) */}
                    <button
                      type="button"
                      onClick={() => currentTrack && toggleFavoriteTrack(currentTrack.id)}
                      className="hover:scale-110 active:scale-95 transition cursor-pointer text-base"
                      title="Yêu thích bài hát"
                    >
                      {currentTrack?.isFavorite ? '♥' : '♡'}
                    </button>
                  </div>

                  {/* Volume slider */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{volume === 0 ? '🔇' : '🔈'}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 sm:w-20 cursor-pointer h-1.5 accent-[var(--theme-secondary,#8d2d48)]"
                      title={`Âm lượng: ${Math.round(volume * 100)}%`}
                    />
                  </div>
                </div>
              </div>

              {/* PHẢI: FEATURED ARTWORK CARD MATCHING [ẢNH 1] */}
              <div
                className="w-full sm:w-48 md:w-56 h-36 sm:h-auto min-h-[140px] rounded-2xl overflow-hidden border-2 relative shrink-0 shadow-inner group bg-pink-50/50"
                style={{
                  borderColor: 'var(--theme-border, #ffb3c6)',
                }}
              >
                <img
                  src={
                    settings.featuredImage ||
                    '/assets/aistudio/c22426f514266cf541ad9d9848c28126_5dca0237.jpg'
                  }
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/c22426f514266cf541ad9d9848c28126_5dca0237.jpg';
                  }}
                  alt="Featured Playlist Artwork"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Sparkling aesthetic corner sticker */}
                <span className="absolute bottom-2 right-2 text-white/90 text-sm filter drop-shadow-md select-none pointer-events-none">
                  ✦
                </span>

                {/* Admin Chỉnh sửa ảnh bìa: Mở ImageEditorModal căn chỉnh ảnh theo đúng yêu cầu */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCoverEditorModal(true);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white/95 hover:bg-white text-pink-700 text-[11px] font-black border border-pink-300 shadow-md transition cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Chỉnh sửa & Căn chỉnh ảnh bìa trong Studio Chỉnh Sửa Ảnh"
                    >
                      <span>✂️</span>
                      <span>Chỉnh sửa ảnh</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* [ẢNH 1] PHẦN DƯỚI: 2-COLUMN SONG LIST GRID */}
            <div
              className="rounded-3xl border-3 p-4 sm:p-5 shadow-sm relative overflow-hidden"
              style={{
                backgroundColor: 'var(--theme-card-bg, #fffff2)',
                borderColor: 'var(--theme-border, #ffb3c6)',
              }}
            >
              {/* Header with Admin Add Track button */}
              <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--theme-border-light, #ffd4e0)' }}>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                  >
                    Danh Sách Bài Hát ({playlist.length})
                  </span>
                  <span className="text-[10px] opacity-60 font-medium">♡ Bấm để phát bài</span>
                </div>

                {/* Admin Add button */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTrack(null);
                      setFormTitle('');
                      setFormArtist('');
                      setFormDuration('3:30');
                      setFormUrl('');
                      setFormCover(null);
                      setShowAddTrackModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full text-white text-xs font-black shadow-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1 active:scale-95"
                    style={{ backgroundColor: 'var(--theme-primary, #d45d79)' }}
                  >
                    <span>➕</span>
                    <span>Thêm bài hát</span>
                  </button>
                )}
              </div>

              {/* 2-Column Grid matching [Ảnh 1] with natural scrolling in outer container (no inner nested scroll trap) */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-0.5 pb-6"
              >
                {playlist.map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => playTrackAtIndex(idx)}
                      className={`p-2.5 rounded-2xl border-2 flex items-center justify-between gap-3 cursor-pointer transition select-none group hover:shadow-md ${
                        isCurrent
                          ? 'shadow-sm'
                          : 'bg-white hover:bg-[var(--theme-light-bg,#ffe0df)]/30'
                      }`}
                      style={{
                        backgroundColor: isCurrent ? 'var(--theme-light-bg, #ffe0df)' : '#ffffff',
                        borderColor: isCurrent ? 'var(--theme-accent, #ff8fab)' : 'var(--theme-border-light, #ffd4e0)',
                      }}
                    >
                      {/* Left: Square Rounded Album Cover Thumbnail */}
                      <div className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border bg-pink-50 flex items-center justify-center shadow-xs">
                        {track.coverImage ? (
                          <img
                            src={track.coverImage}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/c22426f514266cf541ad9d9848c28126_5dca0237.jpg';
                            }}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">💿</span>
                        )}

                        {/* Animated Playing Equalizer overlay */}
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-0.5">
                            <span className="w-0.5 h-3 bg-white animate-pulse" />
                            <span className="w-0.5 h-4 bg-white animate-ping" />
                            <span className="w-0.5 h-2 bg-white animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Middle: Title & Artist in bold caps */}
                      <div className="min-w-0 flex-1">
                        <h4
                          className="font-black text-xs sm:text-sm tracking-wide uppercase truncate"
                          style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                        >
                          {track.title}
                        </h4>
                        <p
                          className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase truncate opacity-80"
                          style={{ color: 'var(--theme-secondary, #8d2d48)' }}
                        >
                          {track.artist || 'ARTIST'}
                        </p>
                      </div>

                      {/* Right: Heart favorite icon & Admin action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Admin edit & delete icons - always clearly visible and tap-friendly */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditTrack(track, e)}
                              className="w-7 h-7 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-700 flex items-center justify-center text-xs font-bold cursor-pointer transition active:scale-95 shadow-2xs"
                              title="Sửa bài hát"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTrack(track.id, e)}
                              className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center text-xs font-bold cursor-pointer transition active:scale-95 shadow-2xs"
                              title="Xóa bài hát"
                            >
                              🗑️
                            </button>
                          </div>
                        )}

                        {/* Heart icon matching [Ảnh 1] */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavoriteTrack(track.id, e)}
                          className="w-7 h-7 flex items-center justify-center text-base cursor-pointer hover:scale-125 transition"
                          style={{ color: track.isFavorite ? 'var(--theme-primary, #d45d79)' : 'var(--theme-border, #ffb3c6)' }}
                          title="Thích bài hát"
                        >
                          {track.isFavorite ? '♥' : '♡'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Playlist Rename Popup */}
            {isEditingPlaylistTitle && isAdmin && (
              <div className="p-3 rounded-2xl bg-white border-2 border-[var(--theme-accent,#ff8fab)] shadow-md flex items-center gap-2">
                <input
                  type="text"
                  value={playlistTitleInput}
                  onChange={(e) => setPlaylistTitleInput(e.target.value)}
                  placeholder="Nhập tên playlist mới..."
                  className="flex-1 px-3 py-1.5 border rounded-xl text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleSavePlaylistName}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-primary,#d45d79)] text-white text-xs font-bold cursor-pointer"
                >
                  Lưu tên
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPlaylistTitle(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Admin Add / Edit Track Modal */}
      {showAddTrackModal && isAdmin && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setShowAddTrackModal(false)}
          className="fixed inset-0 z-[1002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl border-3 border-[var(--theme-border,#ffb3c6)] p-5 shadow-2xl text-xs text-[#8d2d48] animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-3 font-bold text-[#d45d79]">
              <span className="text-sm font-black">
                {editingTrack ? '✏️ Chỉnh sửa bài hát' : '➕ Thêm bài hát vào Album'}
              </span>
              <button
                type="button"
                onClick={() => setShowAddTrackModal(false)}
                className="w-6 h-6 rounded-full bg-pink-100 text-[#8d2d48] font-black flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Tên bài hát (Title):</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: MOTIVE"
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Nghệ sĩ (Artist):</label>
                <input
                  type="text"
                  value={formArtist}
                  onChange={(e) => setFormArtist(e.target.value)}
                  placeholder="Ví dụ: ARIANA GRANDE FT DOJA CAT"
                  className="w-full px-3 py-2 border rounded-xl text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Thời lượng (Duration):</label>
                <input
                  type="text"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="Ví dụ: 3:45"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Đường dẫn nhạc (URL / YouTube / File):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://... hoặc synth:lofi"
                    className="flex-1 px-3 py-2 border rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold text-xs cursor-pointer shrink-0"
                  >
                    📁 Chọn file
                  </button>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block font-bold mb-1">Ảnh bìa bài hát:</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    {formCover ? (
                      <img src={formCover} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">💿</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => trackCoverInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-dashed text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 cursor-pointer"
                  >
                    📷 Tải ảnh vuông
                  </button>
                  {formCover && (
                    <button
                      type="button"
                      onClick={() => setFormCover(null)}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTrackModal(false)}
                  className="px-4 py-2 rounded-xl border hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold cursor-pointer shadow-xs"
                  style={{ backgroundColor: 'var(--theme-primary, #d45d79)' }}
                >
                  💾 Lưu bài hát
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden file inputs for admin uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAudioFileUpload}
        accept="audio/*"
        className="hidden"
      />
      <input
        type="file"
        ref={trackCoverInputRef}
        onChange={handleTrackCoverUpload}
        accept="image/*"
        className="hidden"
      />
      {/* Image Editor Modal for Playlist Featured Cover */}
      {showCoverEditorModal && (
        <ImageEditorModal
          isOpen={showCoverEditorModal}
          onClose={() => setShowCoverEditorModal(false)}
          initialImage={settings.featuredImage || '/assets/aistudio/c22426f514266cf541ad9d9848c28126_5dca0237.jpg'}
          targetTitle="Chỉnh Sửa & Căn Chỉnh Ảnh Bìa Playlist"
          targetType="playlist_cover"
          onSaved={(bakedUrl) => {
            const next: LobbyBgmSettings = {
              ...settings,
              featuredImage: bakedUrl,
              featuredImagePanX: 0,
              featuredImagePanY: 0,
              featuredImageZoom: 1,
            };
            setLobbyBgmSettings(next);
            setSettings(next);
          }}
        />
      )}
    </div>
  );
}
