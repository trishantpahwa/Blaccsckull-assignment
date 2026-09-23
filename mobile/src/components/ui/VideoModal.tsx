import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

interface Props {
  url: string | null;
  onClose: () => void;
}

export function VideoModal({ url, onClose }: Props) {
  return (
    <Modal visible={Boolean(url)} animationType="fade" transparent statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider>{url && <Player url={url} onClose={onClose} />}</SafeAreaProvider>
    </Modal>
  );
}

function Player({ url, onClose }: { url: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <View style={styles.backdrop}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
      <Pressable
        onPress={onClose}
        style={[styles.close, { top: insets.top + 12 }]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close video"
      >
        <Ionicons name="close" size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  close: { position: 'absolute', right: 20 },
});
