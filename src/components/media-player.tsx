/**
 * Plays a library item (video or audio) inline.
 *
 * Privacy: YouTube items load from youtube-nocookie.com (no tracking cookies
 * until playback), and nothing about the participant is added to the URL.
 * For the strictest setup, host files in Firebase Storage and use `url`
 * instead, so no third-party video service is contacted at all.
 *
 * The player only loads after the participant taps play, so we can record
 * that they started the video without any third-party tracking script.
 */
import { Headphones, Play } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEMO } from '@/utils/demo';
import type { MediaItem } from '@/utils/schema';

interface MediaPlayerProps {
  item: Pick<MediaItem, 'type' | 'youtubeId' | 'url' | 'title' | 'durationLabel'>;
  width: number;
  onPlay?: () => void;
}

function buildHtml(item: MediaPlayerProps['item']): string | null {
  const shell = (inner: string) => `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <meta name="referrer" content="no-referrer">
    <style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}
    iframe,video{width:100%;height:100%;border:0}audio{width:100%;margin-top:12px}body.a{background:transparent}</style>
    </head>${inner}</html>`;

  if (item.youtubeId) {
    const id = encodeURIComponent(item.youtubeId);
    return shell(`<body><iframe src="https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&autoplay=1&modestbranding=1"
      allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="no-referrer"></iframe></body>`);
  }
  if (item.url) {
    const src = item.url.replace(/"/g, '&quot;');
    return item.type === 'audio'
      ? shell(`<body class="a"><audio src="${src}" controls autoplay></audio></body>`)
      : shell(`<body><video src="${src}" controls autoplay playsinline></video></body>`);
  }
  return null;
}

export function MediaPlayer({ item, width, onPlay }: MediaPlayerProps) {
  const theme = useTheme();
  const [started, setStarted] = useState(false);
  const isAudio = item.type === 'audio';
  const height = isAudio ? 64 : Math.round((width / 16) * 9);
  const html = buildHtml(item);

  const start = () => {
    setStarted(true);
    onPlay?.();
    if (Platform.OS === 'web' && !DEMO) {
      const href = item.youtubeId ? `https://www.youtube-nocookie.com/embed/${item.youtubeId}` : item.url;
      if (href) Linking.openURL(href);
    }
  };

  if (!html) {
    return (
      <View style={[styles.poster, { width, height: 64, backgroundColor: theme.muted }]}>
        <ThemedText themeColor="textSecondary">This item is not available yet.</ThemedText>
      </View>
    );
  }

  if (DEMO && started) {
    return (
      <View style={[styles.poster, { width, height, backgroundColor: isAudio ? theme.muted : '#1d1a15' }]}>
        <ThemedText style={[styles.posterTitle, isAudio && { color: theme.text, fontSize: 15 }]}>
          {isAudio ? 'Audio plays here in the app' : 'Video plays here in the app'}
        </ThemedText>
      </View>
    );
  }

  if (!started || Platform.OS === 'web') {
    return (
      <Pressable
        onPress={start}
        accessibilityRole="button"
        accessibilityLabel={`Play ${item.title}`}
        style={[styles.poster, { width, height, backgroundColor: isAudio ? theme.muted : '#1d1a15' }]}
      >
        <View style={[styles.playCircle, { backgroundColor: theme.primary }]}>
          {isAudio ? <Headphones size={20} color="#3D3428" /> : <Play size={20} color="#3D3428" fill="#3D3428" />}
        </View>
        <ThemedText style={[styles.posterTitle, isAudio && { color: theme.text, fontSize: 15 }]} numberOfLines={2}>
          {item.title}
        </ThemedText>
        {item.durationLabel ? (
          <ThemedText style={[styles.duration, isAudio && { color: theme.textSecondary }]}>{item.durationLabel}</ThemedText>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View style={[styles.frame, { width, height, backgroundColor: isAudio ? 'transparent' : '#000' }]}>
      <WebView
        source={{ html, baseUrl: 'https://localhost' }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        javaScriptEnabled
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        incognito
        thirdPartyCookiesEnabled={false}
        sharedCookiesEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  playCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  posterTitle: { color: '#FDFCF9', fontFamily: Fonts.serif, fontSize: 18, lineHeight: 22, flexShrink: 1 },
  duration: { position: 'absolute', right: 12, bottom: 8, fontSize: 12, color: '#FDFCF9' },
  frame: { borderRadius: 14, overflow: 'hidden' },
});
