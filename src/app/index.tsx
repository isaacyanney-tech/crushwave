import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/lib/theme';

// The Gate in _layout decides where to go; this is just the loading screen.
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.muted} />
    </View>
  );
}
