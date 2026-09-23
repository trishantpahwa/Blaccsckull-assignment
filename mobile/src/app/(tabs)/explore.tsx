import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompetitionList } from '@/components/CompetitionList';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLanguage } from '@/context/LanguageContext';
import { colors, fonts, radius } from '@/theme';

export default function ExploreScreen() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t.tabs.explore} showBack={false} />
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textSubtle} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.list.searchPlaceholder}
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      <CompetitionList
        filter={(c) => !needle || `${c.title} ${c.category} ${c.judgeName}`.toLowerCase().includes(needle)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  input: { flex: 1, paddingVertical: 10, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
});
