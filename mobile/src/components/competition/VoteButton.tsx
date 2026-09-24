import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/theme';

interface Props {
  count: number;
  active: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}

const HEART = '#E0245E';

export function VoteButton({ count, active, disabled, label, onPress }: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  const press = () => {
    if (!active) {
      // A little pop on voting, not on un-voting.
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }).start();
    }
    onPress();
  };

  return (
    <Pressable
      onPress={press}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.button, active && styles.active, disabled && styles.disabled, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={active ? 'heart' : 'heart-outline'} size={18} color={active ? HEART : colors.textMuted} />
      </Animated.View>
      <AppText weight="semibold" size={13} color={active ? HEART : colors.text}>
        {count}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 58,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  active: { borderColor: '#F7C6D5', backgroundColor: '#FDEEF3' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
});
