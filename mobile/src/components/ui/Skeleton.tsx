import { useEffect, useState } from 'react';
import { Animated, StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

interface Props {
  width?: DimensionValue;
  height: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height, style }: Props) {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { width, height, opacity }, style]} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border, borderRadius: radius.md },
});
