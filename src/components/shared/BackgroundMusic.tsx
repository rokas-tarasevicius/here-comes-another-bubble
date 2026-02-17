import { useEffect, useRef, useState, useCallback } from 'react';

const YOUTUBE_VIDEO_ID = 'I6IQ_FOCE6I';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export function BackgroundMusic() {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const hasStartedRef = useRef(false);

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
          onReady: () => setIsReady(true),
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

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => createPlayer();

    return () => {
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

  function toggle() {
    if (!playerRef.current || !isReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  return (
    <>
      {/* Hidden YouTube player */}
      <div className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0">
        <div ref={containerRef} />
      </div>

      {/* Music toggle button */}
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-retro-border bg-retro-card text-lg shadow-md transition-all hover:shadow-lg"
        title={isPlaying ? 'Pause music' : 'Play music'}
        style={{ fontFamily: 'var(--font-retro-mono)' }}
      >
        {isPlaying ? '\u266B' : '\u266A'}
      </button>
    </>
  );
}
