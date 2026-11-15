import { View } from 'react-native';

import { Button, H1, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

export default function Suspended() {
  const { profile, signOut } = useAuth();
  const banned = profile?.status === 'banned';
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: space(6), backgroundColor: colors.bg }}>
      <H1>{banned ? 'Your account has been banned' : 'Your account is on hold'}</H1>
      <P muted>
        {banned
          ? 'Your account broke the community rules and has been removed from Crushwave.'
          : 'Someone reported a safety concern, so your profile is hidden while our team checks. This usually takes less than 24 hours.'}
      </P>
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}
