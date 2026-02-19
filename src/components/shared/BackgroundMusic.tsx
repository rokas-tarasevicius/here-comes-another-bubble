import { useEffect, useRef, useState, useCallback } from 'react';

const YOUTUBE_VIDEO_ID = 'I6IQ_FOCE6I';
const STORAGE_KEY = 'hcab-music-volume';

function loadSavedVolume(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) return Math.max(0, Math.min(100, Number(v)));
  } catch {}
  return 30;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

function IconSpeaker({ level }: { level: 'muted' | 'low' | 'mid' | 'high' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.15" stroke="currentColor" />
      {level === 'muted' && (
        <>
          <line x1="18" y1="9" x2="22" y2="15" />
          <line x1="22" y1="9" x2="18" y2="15" />
        </>
      )}
      {(level === 'low' || level === 'mid' || level === 'high') && (
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" opacity={level === 'low' ? 1 : 1} />
      )}
      {(level === 'mid' || level === 'high') && (
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity={level === 'mid' ? 0.5 : 1} />
      )}
    </svg>
  );
}

function speakerLevel(volume: number, muted: boolean): 'muted' | 'low' | 'mid' | 'high' {
  if (muted || volume === 0) return 'muted';
  if (volume < 35) return 'low';
  if (volume < 70) return 'mid';
  return 'high';
}

export function BackgroundMusic() {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(loadSavedVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hasStartedRef = useRef(false);
  const preMuteVolume = useRef(volume);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function createPlayer() {
      if (playerRef.current || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
        },
        events: {
          onReady: () => {
            playerRef.current?.setVolume(loadSavedVolume());
            setIsReady(true);
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => createPlayer();

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const startOnInteraction = useCallback(() => {
    if (hasStartedRef.current || !isReady || !playerRef.current) return;
    hasStartedRef.current = true;
    playerRef.current.playVideo();
    setIsPlaying(true);
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    document.addEventListener('click', startOnInteraction, { once: true });
    return () => document.removeEventListener('click', startOnInteraction);
  }, [isReady, startOnInteraction]);

  function applyVolume(v: number) {
    setVolume(v);
    setIsMuted(v === 0);
    playerRef.current?.setVolume(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
  }

  function toggleMute() {
    if (isMuted) {
      const restored = preMuteVolume.current > 0 ? preMuteVolume.current : 30;
      applyVolume(restored);
    } else {
      preMuteVolume.current = volume;
      setIsMuted(true);
      playerRef.current?.setVolume(0);
    }
  }

  function togglePlay() {
    if (!playerRef.current || !isReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  function handleMouseEnter() {
    clearTimeout(hideTimer.current);
    setShowSlider(true);
  }

  function handleMouseLeave() {
    hideTimer.current = setTimeout(() => setShowSlider(false), 400);
  }

  useEffect(() => {
    if (!isDragging) return;
    const stop = () => setIsDragging(false);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => clearTimeout(hideTimer.current);
  }, []);

  const level = speakerLevel(volume, isMuted);

  return (
    <>
      {/* Hidden YouTube player */}
      <div className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0">
        <div ref={containerRef} />
      </div>

      {/* Music control */}
      <div
        ref={wrapperRef}
        className="flex items-end gap-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Volume slider panel */}
        <div
          className="overflow-hidden transition-all duration-200 ease-out"
          style={{
            width: showSlider ? '184px' : '0px',
            opacity: showSlider ? 1 : 0,
          }}
        >
          <div className="music-button mr-1 flex items-center gap-2.5 rounded-full px-3 py-2">
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="shrink-0 text-[--color-retro-text-muted] transition-colors hover:text-[--color-retro-text]"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <IconSpeaker level={level} />
            </button>

            {/* Slider track */}
            <div className="relative flex-1" style={{ height: '20px' }}>
              {/* Track */}
              <div
                className="music-track absolute left-0 right-0 rounded-full"
                style={{ height: '6px', top: '50%', transform: 'translateY(-50%)' }}
              >
                {/* Fill */}
                <div
                  className="music-track-fill h-full rounded-full"
                  style={{
                    width: `${isMuted ? 0 : volume}%`,
                    transition: isDragging ? 'none' : 'width 0.1s ease-out',
                  }}
                />
              </div>
              {/* Thumb */}
              <div
                className="pointer-events-none absolute"
                style={{
                  left: `${isMuted ? 0 : volume}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  transition: isDragging ? 'none' : 'left 0.1s ease-out',
                }}
              >
                <div
                  className={isDragging ? 'music-thumb' : ''}
                  style={{
                    width: isDragging ? '18px' : '14px',
                    height: isDragging ? '18px' : '14px',
                    borderRadius: '50%',
                    background: `linear-gradient(to bottom, var(--theme-surface-from), var(--theme-inset-bg))`,
                    boxShadow: isDragging
                      ? '0 2px 6px rgba(51,102,153,0.35), 0 0 0 2.5px rgba(58,106,158,0.4), inset 0 1px 0 var(--theme-highlight-strong)'
                      : '0 1px 4px rgba(0,0,0,0.25), 0 0 0 1px var(--theme-glass-border), inset 0 1px 0 var(--theme-highlight-strong)',
                    transition: 'width 0.15s ease, height 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                  }}
                />
              </div>
              {/* Invisible native input */}
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => applyVolume(Number(e.target.value))}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                title={`Volume: ${isMuted ? 0 : volume}%`}
              />
            </div>
          </div>
        </div>

        {/* Main music button */}
        <button
          onClick={togglePlay}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-150 ${isPlaying ? 'music-play--active' : 'music-play'}`}
          title={isPlaying ? 'Pause music' : 'Play music'}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          style={{
            border: isPlaying ? '1px solid rgba(255,255,255,0.2)' : `1px solid var(--theme-glass-border-hover)`,
            color: isPlaying ? '#ffffff' : 'var(--color-retro-text-muted)',
          }}
        >
          {/* Musical note icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" fill="currentColor" opacity={isPlaying ? 1 : 0.5} />
            <circle cx="18" cy="16" r="3" fill="currentColor" opacity={isPlaying ? 1 : 0.5} />
          </svg>
        </button>
      </div>
    </>
  );
}
