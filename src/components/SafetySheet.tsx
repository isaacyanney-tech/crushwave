import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { REPORT_REASONS, type ReportReason } from '@/lib/constants';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Button, Field, H2, P } from './ui';

type Props = {
  visible: boolean;
  targetId: string;
  targetName: string;
  matchId?: string;
  messageId?: number;
  /** Show "Unmatch" as well (only inside a chat). */
  canUnmatch?: boolean;
  onClose: () => void;
  /** Called after a block, report or unmatch, so the screen can move on. */
  onDone: () => void;
};

export function SafetySheet({ visible, targetId, targetName, matchId, messageId, canUnmatch, onClose, onDone }: Props) {
  const { session } = useAuth();
  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMode('menu');
    setReason(null);
    setDetails('');
    onClose();
  };

  const block = () => {
    Alert.alert(`Block ${targetName}?`, 'They won’t be able to see you or message you again. They are not told.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase
            .from('blocks')
            .insert({ blocker_id: session!.user.id, blocked_id: targetId });
          setBusy(false);
          if (error && !/duplicate/i.test(error.message)) return Alert.alert('Could not block', friendlyError(error));
          close();
          onDone();
        },
      },
    ]);
  };

  const unmatch = () => {
    if (!matchId) return;
    Alert.alert(`Unmatch ${targetName}?`, 'This chat will disappear for both of you.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unmatch',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.rpc('unmatch', { p_match: matchId });
          setBusy(false);
          if (error) return Alert.alert('Could not unmatch', friendlyError(error));
          close();
          onDone();
        },
      },
    ]);
  };

  const submitReport = async () => {
    if (!reason) return;
    setBusy(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: session!.user.id,
      reported_id: targetId,
      reason,
      details: details.trim(),
      match_id: matchId ?? null,
      message_id: messageId ?? null,
    });
    setBusy(false);
    if (error) return Alert.alert('Could not send report', friendlyError(error));
    close();
    Alert.alert(
      'Thank you for reporting',
      `We’ll review this within 24 hours. ${targetName} has been blocked for you and is never told who reported them.`,
    );
    onDone();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {mode === 'menu' ? (
            <>
              <H2>Safety options for {targetName}</H2>
              <Button title={`Report ${targetName}`} variant="danger" onPress={() => setMode('report')} style={styles.gap} />
              <Button title={`Block ${targetName}`} variant="secondary" onPress={block} loading={busy} style={styles.gap} />
              {canUnmatch ? <Button title="Unmatch" variant="secondary" onPress={unmatch} style={styles.gap} /> : null}
              <Button title="Cancel" variant="ghost" onPress={close} />
            </>
          ) : (
            <>
              <H2>Why are you reporting {targetName}?</H2>
              <P muted>Your report is private. Reporting also blocks them for you.</P>
              {REPORT_REASONS.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setReason(r.value)}
                  style={[styles.reason, reason === r.value && { borderColor: colors.primary, backgroundColor: '#FFF0F3' }]}
                >
                  <Text style={styles.reasonText}>{r.label}</Text>
                </Pressable>
              ))}
              <View style={{ height: space(3) }} />
              <Field
                label="Anything else we should know? (optional)"
                value={details}
                onChangeText={setDetails}
                multiline
                maxLength={1000}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
              {reason === 'under_18' || reason === 'threats' ? (
                <P muted>
                  If you are in danger right now, call the police on 191 or the DOVVSU helpline on 055 100 0900.
                </P>
              ) : null}
              <Button title="Send report" variant="danger" onPress={submitReport} disabled={!reason} loading={busy} style={styles.gap} />
              <Button title="Back" variant="ghost" onPress={() => setMode('menu')} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space(5),
    paddingBottom: space(10),
    maxHeight: '85%',
  },
  gap: { marginBottom: space(3) },
  reason: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space(4),
    marginBottom: space(2),
  },
  reasonText: { fontSize: 15, color: colors.ink, fontWeight: '500' },
});
