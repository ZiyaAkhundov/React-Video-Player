import React, { useState, useRef, useEffect } from 'react';
import '../videoPlayer.css'
function VideoPlayer( src) {
  const [wasPaused, setWasPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState('');
  const [isPaused, setIsPaused] = useState(true);
  const [theaterMode, settheaterMode] = useState(false);
  const [percent, setPercent] = useState(0);
  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);
  const volumeSliderRef = useRef(null);
  const loaderRef = useRef(null);
  const timelineContainerRef = useRef(null);

  //Fullscreen
  const toggleFullScreenMode = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen()
        .catch((error) => console.error('Error attempting to enable fullscreen:', error));
    } else {
      document.exitFullscreen()
        .catch((error) => console.error('Error attempting to exit fullscreen:', error));
    }
  }

  //MiniPlayer
  const toggleMiniPlayerMode = () => {
    if (videoContainerRef.current.classList.contains("mini-player")) {
      document.exitPictureInPicture();
      videoContainerRef.current.classList.remove("mini-player")
    } else {
      videoRef.current.requestPictureInPicture()
      videoContainerRef.current.classList.add("mini-player")
    }
  }

  //Play
  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setIsPaused(false)
      video.addEventListener("play", () => {
        videoContainerRef.current.classList.remove("paused")
      })
    }
    else {
      video.pause()
      setIsPaused(true);
      video.addEventListener("pause", () => {
        videoContainerRef.current.classList.add("paused")
      })
    }
  };

  //Theater Mode
  const toggleTheaterMode = () => {
    settheaterMode((prevTheaterMode) => !prevTheaterMode);
  }

  //Volume
  const volumeInput = (e) => {
    const newVolume = e.target.value;
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === "0";
    setVolume(newVolume);
    // volumeSliderRef.current.value = volume
  }

  //Mute
  const toggleMute = () => {
    videoRef.current.muted = !videoRef.current.muted;
    if (videoRef.current.muted) {
      setVolume(0)
    }
  }

  //Time
  const TimeUpdate = () => {
    setCurrentTime(formatDuration(videoRef.current.currentTime))
    const percentage = videoRef.current.currentTime / videoRef.current.duration
    setPercent(percentage)
  }
  const leadingZeroFormatter = new Intl.NumberFormat(undefined, {
    minimumIntegerDigits: 2,
  })
  function formatDuration(time) {
    const seconds = Math.floor(time % 60)
    const minutes = Math.floor(time / 60) % 60
    const hours = Math.floor(time / 3600)
    if (hours === 0) {
      return `${minutes}:${leadingZeroFormatter.format(seconds)}`
    } else {
      return `${hours}:${leadingZeroFormatter.format(
        minutes
      )}:${leadingZeroFormatter.format(seconds)}`
    }
  }
  // Speed
  const changePlaybackSpeed = () => {
    let newPlaybackRate = videoRef.current.playbackRate + 0.25
    if (newPlaybackRate > 2) newPlaybackRate = 0.25
    videoRef.current.playbackRate = newPlaybackRate
    setPlaybackSpeed(`${newPlaybackRate}x`)
  }
  //loader
  function showLoader() {
    loaderRef.current.style.display = 'block';
  }
  function hideLoader() {
    loaderRef.current.style.display = 'none';
  }
  //TimeLine moving
  const handleTimelineUpdate = (e) => {
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
    timelineContainerRef.current.style.setProperty("--preview-position", percent);

    if (isScrubbing) {
      e.preventDefault();
      timelineContainerRef.current.style.setProperty("--progress-position", percent);
    }
  };

  let isScrubbing = false
  const toggleScrubbing = (e) => {
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.x), rect.width) / rect.width;
    setPercent(percent);
    const btn = (e.buttons & 1) === 1;
    isScrubbing=btn;
    
    videoContainerRef.current.classList.toggle("scrubbing", isScrubbing);
    if (isScrubbing) {
      setWasPaused(videoRef.current.paused);
      videoRef.current.pause();
    } else {
      let value=(percent * videoRef.current.duration).toFixed(2)
      videoRef.current.currentTime = value;
      if (!wasPaused) videoRef.current.play();
    }

    handleTimelineUpdate(e);
  };
  // Skip
  const skip = (duration)=> {
    videoRef.current.currentTime += duration
  }
  useEffect(() => {
    videoRef.current.addEventListener("volumechange", () => {
      volumeSliderRef.current.value = videoRef.current.volume
      let volumeLevel
      if (videoRef.current.muted || volume === 0) {
        volumeSliderRef.current.value = 0;
        volumeLevel = "muted"
      } else if (videoRef.current.volume >= 0.5) {
        volumeLevel = "high"
        setVolume(videoRef.current.volume)
      } else if (videoRef.current.volume === 0) {
        volumeLevel = "muted"
      }
      else {
        volumeLevel = "low"
      }
      videoContainerRef.current.dataset.volumeLevel = volumeLevel
    })

    videoRef.current.addEventListener("timeupdate", TimeUpdate)
    videoRef.current.addEventListener("loadeddata", () => {
      setTotalTime(formatDuration(videoRef.current.duration))
    })
    //timeLine
    timelineContainerRef.current.addEventListener("mousemove", handleTimelineUpdate);
    timelineContainerRef.current.addEventListener("mousedown", toggleScrubbing);
    document.addEventListener("mouseup", (e) => {
      if (isScrubbing) toggleScrubbing(e);
    });
    document.addEventListener("mousemove", (e) => {
      if (isScrubbing) handleTimelineUpdate(e);
    });
    //loader
    videoRef.current.addEventListener('waiting', showLoader);
    videoRef.current.addEventListener('canplay', hideLoader);
    videoRef.current.addEventListener('progress', function () {
      if (videoRef.current.readyState < 4) {
        showLoader();
      } else {
        hideLoader();
      }
    });


    const handleKeyDown = (e) => {
      const tagName = e.target.tagName.toLowerCase();
      const key = e.key.toLowerCase();

      if (tagName === 'input') return;

      switch (key) {
        case ' ':
        case 'k':
          togglePlay();
          break;
        case 'f':
          toggleFullScreenMode()
          break;
        case 't':
          toggleTheaterMode();
          break;
        case 'i':
          toggleMiniPlayerMode();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowleft':
        case 'j':
          skip(-5);
          break;
        case 'arrowright':
        case 'l':
          skip(5);
          break;
        case 'c':
          // toggleCaptions();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      timelineContainerRef.current.removeEventListener("mousemove", handleTimelineUpdate);
      timelineContainerRef.current.removeEventListener("mousedown", toggleScrubbing);
      document.removeEventListener("mouseup", (e) => {
        if (isScrubbing) toggleScrubbing(e);
      });
      document.removeEventListener("mousemove", (e) => {
        if (isScrubbing) handleTimelineUpdate(e);
      });
    };
  }, []);
  return (
    <div ref={videoContainerRef} className={`video-container ${isPaused ? 'paused' : ''} ${theaterMode ? 'theater' : ''}`} data-volume-level="high">
      <img className="thumbnail-img" />
      <div className="video-controls-container">
        <div className="timeline-container" ref={timelineContainerRef} style={{ "--progress-position": percent }}>
          <div className="timeline">
            <div className="thumb-indicator"></div>
          </div>
        </div>
        <div className="controls">
          <button className="play-pause-btn" onClick={togglePlay}>
            <svg className="play-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
            <svg className="pause-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
            </svg>
          </button>
          <div className="volume-container">
            <button className="mute-btn" onClick={toggleMute}>
              <svg className="volume-high-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
              </svg>
              <svg className="volume-low-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z" />
              </svg>
              <svg className="volume-muted-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z" />
              </svg>
            </button>
            <input ref={volumeSliderRef} onChange={volumeInput} className="volume-slider" type="range" min="0" max="1" step="any" />
          </div>
          <div className="duration-container">
            <div className="current-time">{currentTime ? currentTime : '0:00'}</div>
            /
            <div className="total-time">{totalTime ? totalTime : '0:00'}</div>
          </div>
          <button className="captions-btn">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M18,11H16.5V10.5H14.5V13.5H16.5V13H18V14A1,1 0 0,1 17,15H14A1,1 0 0,1 13,14V10A1,1 0 0,1 14,9H17A1,1 0 0,1 18,10M11,11H9.5V10.5H7.5V13.5H9.5V13H11V14A1,1 0 0,1 10,15H7A1,1 0 0,1 6,14V10A1,1 0 0,1 7,9H10A1,1 0 0,1 11,10M19,4H5C3.89,4 3,4.89 3,6V18A2,2 0 0,0 5,20H19A2,2 0 0,0 21,18V6C21,4.89 20.1,4 19,4Z" />
            </svg>
          </button>
          <button className="speed-btn wide-btn" onClick={changePlaybackSpeed}>
            {playbackSpeed ? playbackSpeed : '1x'}
          </button>
          <button className="mini-player-btn" onClick={toggleMiniPlayerMode}>
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z" />
            </svg>
          </button>
          <button className="theater-btn" onClick={toggleTheaterMode}>
            <svg className="tall" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
            </svg>
            <svg className="wide" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
            </svg>
          </button>
          <button className="full-screen-btn" onClick={toggleFullScreenMode}>
            <svg className="open" viewBox="0 0 24 24">
              <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            <svg className="close" viewBox="0 0 24 24">
              <path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            </svg>
          </button>
        </div>
      </div>
      <video ref={videoRef} src={src.src} onClick={togglePlay}>
      </video>
      <svg ref={loaderRef} className="loader" viewBox="25 25 50 50">
        <circle r="20" cy="50" cx="50"></circle>
      </svg>
    </div>
  )
}
export default VideoPlayer;