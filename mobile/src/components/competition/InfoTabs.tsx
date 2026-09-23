import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { CompetitionDetail } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';

type TabKey = 'about' | 'judging' | 'rules';

const COLLAPSED_HEIGHT = 72;

export function InfoTabs({ competition }: { competition: CompetitionDetail }) {
  const { t } = useLanguage();
  const [active, setActive] = useState<TabKey>('about');
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'about', label: t.aboutCompetition },
    { key: 'judging', label: t.judgingParameters },
    { key: 'rules', label: t.rulesEligibility },
  ];

  const lines =
    active === 'about'
      ? competition.about.split('\n').filter(Boolean)
      : active === 'judging'
        ? competition.judgingParameters
        : competition.rules;
  const bulleted = active !== 'about';
  const overflows = contentHeight > COLLAPSED_HEIGHT + 4;

  const selectTab = (key: TabKey) => {
    setActive(key);
    setExpanded(false);
    setContentHeight(0);
  };

  return (
    <Card>
      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => selectTab(tab.key)}
              style={[styles.tab, selected && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <AppText weight={selected ? 'semibold' : 'medium'} size={12} color={selected ? colors.primary : colors.textMuted} numberOfLines={1}>
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.body, !expanded && { maxHeight: COLLAPSED_HEIGHT }]}>
        <View onLayout={(e: LayoutChangeEvent) => setContentHeight(e.nativeEvent.layout.height)}>
          {lines.map((line, i) => (
            <View key={i} style={styles.line}>
              {bulleted && <AppText color={colors.textMuted}>•</AppText>}
              <AppText size={14} color={colors.textMuted} style={styles.lineText}>
                {line}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      {overflows && (
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.more} accessibilityRole="button">
          <AppText weight="medium" color={colors.primary}>
            {expanded ? t.viewLess : t.viewMore}
          </AppText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.primary },
  body: { overflow: 'hidden', marginTop: 12 },
  line: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  lineText: { flex: 1, lineHeight: 22 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 },
});
