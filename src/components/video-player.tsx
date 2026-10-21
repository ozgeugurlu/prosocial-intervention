import { Dimensions, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface VideoPlayerProps {
  /** YouTube video ID, e.g. "6RypXcD_u1w" */
  videoId: string;
  /** Height of the player in px (defaults to 16:9 ratio based on window width) */
  height?: number;
  /** Width of the player in px (defaults to window width) */
  width?: number;
}

export function VideoPlayer({ videoId, height, width }: VideoPlayerProps) {
  const { width: windowWidth } = Dimensions.get('window');
  const playerWidth = width ?? windowWidth;
  const playerHeight = height ?? Math.round((playerWidth / 16) * 9);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&autoplay=1&controls=0&modestbranding=1&iv_load_policy=3&autohide=1&mute=0`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <iframe
          src="${embedUrl}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { width: playerWidth, height: playerHeight, pointerEvents: 'none' }]}>
      <WebView
        source={{ html: html, baseUrl: "https://com.lledlow.prosocial" }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
