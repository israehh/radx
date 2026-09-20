import { useEffect, useMemo, useRef, useState } from "react";

import type { TrackRecord } from "../types";

interface AudioPlayerProps {
  tracks: TrackRecord[];
  initialTrackIndex?: number;
}

function AudioPlayer({ tracks, initialTrackIndex = 0 }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialTrackIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const currentTrack = useMemo(
    () => tracks[currentIndex] ?? tracks[0],
    [currentIndex, tracks]
  );

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!currentTrack || !audioRef.current) {
      return;
    }

    const audio = audioRef.current;
    audio.src = currentTrack.localPath;
    audio.load();
    void audio.play().catch(() => {
      setIsPlaying(false);
    });
    setIsPlaying(true);
  }, [currentTrack]);

  const handlePlay = async () => {
    if (!audioRef.current) {
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (!tracks.length) {
      return;
    }

    setCurrentIndex((previous) => (previous + 1) % tracks.length);
  };

  const handlePrevious = () => {
    if (!tracks.length) {
      return;
    }

    setCurrentIndex((previous) => (previous - 1 + tracks.length) % tracks.length);
  };

  const handleSeek = (value: number) => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  if (!tracks.length) {
    return (
      <div className="welcome-card">
        <h2>Audio Player</h2>
        <p>No hay pistas cargadas en la biblioteca.</p>
      </div>
    );
  }

  return (
    <div className="welcome-card audio-player">
      <h2>🎵 Reproductor RAD X</h2>

      <p>
        <strong>{currentTrack.title}</strong>
        <span> — {currentTrack.channel}</span>
      </p>

      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current) {
            return;
          }

          setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (!audioRef.current) {
            return;
          }

          setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          handleNext();
        }}
      />

      <div className="audio-controls">
        <button className="action-btn" onClick={handlePrevious}>
          ⏮
        </button>
        <button className="action-btn" onClick={isPlaying ? handlePause : handlePlay}>
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button className="action-btn" onClick={handleStop}>
          ⏹
        </button>
        <button className="action-btn" onClick={handleNext}>
          ⏭
        </button>
      </div>

      <div className="player-progress">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(event) => handleSeek(Number(event.target.value))}
        />
        <div className="player-meta">
          <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}</span>
          <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
        </div>
      </div>

      <label className="volume-control">
        Volume
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </label>
    </div>
  );
}

export default AudioPlayer;
