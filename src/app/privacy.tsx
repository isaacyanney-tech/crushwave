import { ScrollView } from 'react-native';

import { Card, H2, P } from '@/components/ui';
import { space } from '@/lib/theme';

// Plain-language summary. A full privacy policy reviewed by a lawyer must be
// published on a website before launch (both app stores require a link).
export default function Privacy() {
  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(16) }}>
      <Card>
        <H2>What we collect</H2>
        <P>
          Your student email (to prove you’re a student), first name, date of birth (we only show your age), gender and
          who you want to see, the profile details and photos you add, your likes, matches and chats, and reports you
          make.
        </P>
        <H2>What we never collect</H2>
        <P>Your exact location, your phone contacts, your surname or your ID card.</P>
        <H2>Who can see your profile</H2>
        <P>
          Only signed-in, verified students from your school. People you block, and people who block you, can never see
          you. Photos are stored privately and shown through links that expire after an hour. Hidden photo data such as
          GPS location is removed before upload.
        </P>
        <H2>Where your data is stored</H2>
        <P>
          On secure servers in the United Kingdom run by our provider, Supabase. Data is encrypted in transit and at rest.
        </P>
        <H2>Your rights</H2>
        <P>
          You can see and edit your profile at any time, and delete your account and all your data from Settings. This
          follows Ghana’s Data Protection Act, 2012 (Act 843).
        </P>
      </Card>
    </ScrollView>
  );
}
