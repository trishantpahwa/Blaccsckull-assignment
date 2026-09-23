import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { CompetitionDetail } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { colors } from '@/theme';

interface Props {
  judge: CompetitionDetail['judge'];
  onPlayIntro: (url: string) => void;
}

export function JudgeCard({ judge, onPlayIntro }: Props) {
  const { t } = useLanguage();
  const initials = judge.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <Card style={styles.row}>
      {judge.photoUrl ? (
        <Image source={{ uri: judge.photoUrl }} style={styles.photo} accessibilityLabel={judge.name} />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <AppText weight="semibold" size={28} color={colors.primary}>
            {initials}
          </AppText>
        </View>
      )}
      <View style={styles.info}>
        <AppText size={13} color={colors.textMuted}>
          {t.judge}
        </AppText>
        <AppText weight="semibold" size={18}>
          {judge.name}
        </AppText>
        <AppText size={13} color={colors.textMuted}>
          {judge.title}
        </AppText>
        {judge.experienceYears != null && (
          <AppText size={13} color={colors.textMuted}>
            {format(t.yearsExperience, { n: judge.experienceYears })}
          </AppText>
        )}
      </View>
      {judge.introVideoUrl && (
        <Pressable
          style={styles.intro}
          onPress={() => onPlayIntro(judge.introVideoUrl!)}
          accessibilityRole="button"
          accessibilityLabel={t.introVideo}
        >
          <View style={styles.play}>
            <Ionicons name="play" size={20} color={colors.primary} />
          </View>
          <AppText size={13} color={colors.textMuted}>
            {t.introVideo}
          </AppText>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photo: { width: 84, height: 84, borderRadius: 42 },
  placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  intro: { alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
});
