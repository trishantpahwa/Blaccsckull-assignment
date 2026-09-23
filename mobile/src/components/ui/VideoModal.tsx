import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

interface Props {
  url: string | null;
  onClose: () => void;
}

export function VideoModal({ url, onClose }: Props) {
  return (
    <Modal visible={Boolean(url)} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {url && <Player url={url} />}
        <Pressable onPress={onClose} style={styles.close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close video">
          <Ionicons name="close" size={28} color={colors.white} />
        </Pressable>
      </View>
    </Modal>
  );
}

function Player({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  close: { position: 'absolute', top: 48, right: 20 },
});
