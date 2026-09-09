import React, { useEffect, useRef } from 'react';

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const prevXRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      targetTimeRef.current = video.currentTime || 0;
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    const handleSeeked = () => {
      isSeekingRef.current = false;
      if (Math.abs(video.currentTime - targetTimeRef.current) > 0.05) {
        isSeekingRef.current = true;
        video.currentTime = targetTimeRef.current;
      }
    };
    video.addEventListener('seeked', handleSeeked);

    const handleMouseMove = (e: MouseEvent) => {
      if (prevXRef.current === null) {
        prevXRef.current = e.clientX;
        return;
      }

      const delta = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;

      if (!video.duration || isNaN(video.duration)) return;

      const SENSITIVITY = 0.8;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      const newTarget = Math.max(0, Math.min(video.duration, targetTimeRef.current + timeOffset));
      targetTimeRef.current = newTarget;

      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = newTarget;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4"
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 z-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: '70% center' }}
      />
      {/* Dark gradient overlay for high contrast readability */}
      <div className="fixed inset-0 z-0 bg-black/65 pointer-events-none backdrop-blur-[1px]" />
    </>
  );
}
export default BackgroundVideo;
