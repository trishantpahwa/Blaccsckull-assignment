import { Image, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './AppText';

const TINTS = ['#03717B', '#7A4CC2', '#C2410C', '#1D6FB8', '#B83280', '#2F855A'];

// Stable colour per name, so the same person looks the same everywhere.
function tintFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

function initials(name: string) {
  const parts = name.replace(/\./g, '').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts.at(-1)![0] : '')).toUpperCase();
}

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
  ringColor?: string;
}

export function Avatar({ name, uri, size = 44, ringColor }: Props) {
  const ring = ringColor ? { borderWidth: 3, borderColor: ringColor } : null;
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (uri) return <Image source={{ uri }} style={[shape, ring]} accessible={false} />;
  return (
    <View style={[styles.fallback, shape, { backgroundColor: tintFor(name) }, ring]}>
      <AppText weight="semibold" size={size * 0.38} color={colors.white}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
