import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { MAX_PHOTOS } from '@/lib/constants';
import { pickProfilePhoto } from '@/lib/photos';
import { friendlyError } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import { usePhotoUrls } from './ProfileCard';

export function PhotoGrid({
  userId,
  photos,
  onChange,
  max = MAX_PHOTOS,
}: {
  userId: string;
  photos: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const urls = usePhotoUrls(photos);
  const [uploading, setUploading] = useState(false);

  const add = async (replace?: string) => {
    try {
      setUploading(true);
      const path = await pickProfilePhoto(userId);
      if (!path) return;
      onChange(replace ? photos.map((p) => (p === replace ? path : p)) : [...photos, path]);
    } catch (e) {
      Alert.alert('Could not add photo', friendlyError(e));
    } finally {
      setUploading(false);
    }
  };

  const options = (path: string, index: number) => {
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    buttons.push({ text: 'Change photo', onPress: () => add(path) });
    if (index > 0) buttons.push({ text: 'Make main photo', onPress: () => onChange([path, ...photos.filter((p) => p !== path)]) });
    if (photos.length > 1) {
      buttons.push({ text: 'Remove', style: 'destructive', onPress: () => onChange(photos.filter((p) => p !== path)) });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(index === 0 ? 'Main photo' : 'Photo', photos.length === 1 ? 'You need at least one photo.' : undefined, buttons);
  };

  // One big slot during sign-up.
  if (max === 1) {
    const path = photos[0];
    return (
      <Pressable
        style={[styles.single, !path && styles.empty]}
        onPress={() => (path ? options(path, 0) : add())}
        disabled={uploading}
        accessibilityLabel={path ? 'Change photo' : 'Add photo'}
      >
        {path && urls[path] ? <Image source={{ uri: urls[path] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : null}
        {uploading ? (
          <View style={styles.uploading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.uploadingText}>Uploading…</Text>
          </View>
        ) : !path ? (
          <View style={{ alignItems: 'center', gap: space(2) }}>
            <Ionicons name="camera" size={40} color={colors.primary} />
            <Text style={styles.addText}>Tap to add a photo</Text>
          </View>
        ) : (
          <View style={styles.changeTag}>
            <Ionicons name="pencil" size={14} color="#fff" />
            <Text style={styles.changeText}>Change</Text>
          </View>
        )}
      </Pressable>
    );
  }

  const slots = Array.from({ length: max }, (_, i) => photos[i] ?? null);

  return (
    <View>
      <View style={styles.grid}>
        {slots.map((path, i) =>
          path ? (
            <Pressable key={path} style={styles.slot} onPress={() => options(path, i)} accessibilityLabel="Photo options">
              {urls[path] ? (
                <Image source={{ uri: urls[path] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
              ) : (
                <ActivityIndicator color={colors.primary} />
              )}
              {i === 0 ? (
                <View style={styles.mainTag}>
                  <Text style={styles.mainTagText}>Main</Text>
                </View>
              ) : null}
              <View style={styles.editIcon}>
                <Ionicons name="ellipsis-horizontal" size={14} color="#fff" />
              </View>
            </Pressable>
          ) : (
            <Pressable
              key={`empty-${i}`}
              style={[styles.slot, styles.empty]}
              onPress={() => add()}
              disabled={uploading || i !== photos.length}
              accessibilityLabel="Add photo"
            >
              {uploading && i === photos.length ? (
                <ActivityIndicator color={colors.primary} />
              ) : i === photos.length ? (
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              ) : null}
            </Pressable>
          ),
        )}
      </View>
      <Text style={styles.help}>Tap a photo to change it, remove it or make it your main photo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  slot: {
    width: '31.5%',
    aspectRatio: 4 / 5,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  single: {
    width: '72%',
    alignSelf: 'center',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addText: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  uploading: { alignItems: 'center', gap: space(2) },
  uploadingText: { fontSize: 13, color: colors.muted },
  changeTag: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  mainTag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mainTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  editIcon: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    padding: 3,
  },
  help: { fontSize: 12, color: colors.muted, marginTop: space(2) },
});
