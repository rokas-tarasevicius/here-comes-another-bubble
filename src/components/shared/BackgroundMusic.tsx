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
  const hasStartedRef = useRef(false);
  const preMuteVolume = useRef(volume);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
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
        className="fixed bottom-4 right-4 z-50 flex items-end gap-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Volume slider panel */}
        <div
          className="overflow-hidden transition-all duration-200 ease-out"
          style={{
            width: showSlider ? '148px' : '0px',
            opacity: showSlider ? 1 : 0,
          }}
        >
          <div
            className="mr-1 flex items-center gap-2 rounded-full px-3 py-2"
            style={{
              background: 'linear-gradient(to bottom, #ffffff, #f5f3f0)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
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
                className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, #d8d4cf, #e2dedb)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.6)',
                }}
              >
                {/* Fill */}
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${isMuted ? 0 : volume}%`,
                    background: 'linear-gradient(to bottom, #5e91c4, #3a6a9e)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                    transition: 'width 0.1s ease-out',
                  }}
                />
              </div>
              {/* Thumb */}
              <div
                className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                style={{
                  left: `${isMuted ? 0 : volume}%`,
                  transform: `translate(-50%, -50%)`,
                  transition: 'left 0.1s ease-out',
                }}
              >
                <div
                  className="h-3.5 w-3.5 rounded-full"
                  style={{
                    background: 'linear-gradient(to bottom, #ffffff, #e8e5e0)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
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
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                title={`Volume: ${isMuted ? 0 : volume}%`}
              />
            </div>
          </div>
        </div>

        {/* Main music button */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          title={isPlaying ? 'Pause music' : 'Play music'}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          style={{
            background: isPlaying
              ? 'linear-gradient(to bottom, #5e91c4, #3a6a9e)'
              : 'linear-gradient(to bottom, #ffffff, #f0ede8)',
            boxShadow: isPlaying
              ? '0 2px 8px rgba(51,102,153,0.35), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.25)'
              : '0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            border: isPlaying
              ? '1px solid rgba(255,255,255,0.2)'
              : '1px solid rgba(0,0,0,0.1)',
            color: isPlaying ? '#ffffff' : 'var(--color-retro-text-muted)',
            transition: 'all 0.15s ease',
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
