import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';

export interface VideoPlayerRef {
  /** Start playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Seek to a position in seconds */
  seekTo: (seconds: number) => void;
  /** Current playing state */
  isPlaying: boolean;
}

export interface VideoPlayerProps {
  /** YouTube video ID, e.g. "6RypXcD_u1w" */
  videoId: string;
  /** Whether to start playing immediately on mount */
  autoPlay?: boolean;
  /** Height of the player in px (defaults to 16:9 ratio based on window width) */
  height?: number;
  /** Width of the player in px (defaults to window width) */
  width?: number;
  /** Called when the video finishes playing */
  onEnd?: () => void;
  /** Called when the video starts playing */
  onPlay?: () => void;
  /** Called when the video is paused */
  onPause?: () => void;
  /** Called with the current playback state string */
  onStateChange?: (state: string) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    {
      videoId,
      autoPlay = false,
      height,
      width,
      onEnd,
      onPlay,
      onPause,
      onStateChange,
    },
    ref
  ) => {
    const playerRef = useRef<YoutubeIframeRef>(null);
    const [playing, setPlaying] = useState(autoPlay);

    const { width: windowWidth } = Dimensions.get('window');
    const playerWidth = width ?? windowWidth;
    const playerHeight = height ?? Math.round((playerWidth / 16) * 9);

    // Expose imperative controls to parent via ref
    useImperativeHandle(ref, () => ({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, true);
      },
      get isPlaying() {
        return playing;
      },
    }));

    const handleStateChange = (state: string) => {
      onStateChange?.(state);
      if (state === 'playing') {
        setPlaying(true);
        onPlay?.();
      } else if (state === 'paused') {
        setPlaying(false);
        onPause?.();
      } else if (state === 'ended') {
        setPlaying(false);
        onEnd?.();
      }
    };

    return (
      <View style={[styles.container, { width: playerWidth, height: playerHeight }]}>
        <YoutubePlayer
          ref={playerRef}
          height={playerHeight}
          width={playerWidth}
          videoId={videoId}
          play={playing}
          onChangeState={handleStateChange}
        />
      </View>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
export { VideoPlayer };

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
    width: '90%',
    height: '100%',
  },
});
