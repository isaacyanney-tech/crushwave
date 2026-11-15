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
}: {
  userId: string;
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  const urls = usePhotoUrls(photos);
  const [uploading, setUploading] = useState(false);

  const add = async () => {
    try {
      setUploading(true);
      const path = await pickProfilePhoto(userId);
      if (path) onChange([...photos, path]);
    } catch (e) {
      Alert.alert('Could not add photo', friendlyError(e));
    } finally {
      setUploading(false);
    }
  };

  const remove = (path: string) => {
    Alert.alert('Remove this photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onChange(photos.filter((p) => p !== path)) },
    ]);
  };

  const makeMain = (path: string) => onChange([path, ...photos.filter((p) => p !== path)]);

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);

  return (
    <View>
      <View style={styles.grid}>
        {slots.map((path, i) =>
          path ? (
            <Pressable key={path} style={styles.slot} onLongPress={() => makeMain(path)} onPress={() => remove(path)}>
              {urls[path] ? <Image source={{ uri: urls[path] }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
              {i === 0 ? (
                <View style={styles.mainTag}>
                  <Text style={styles.mainTagText}>Main</Text>
                </View>
              ) : null}
              <View style={styles.removeIcon}>
                <Ionicons name="close" size={16} color="#fff" />
              </View>
            </Pressable>
          ) : (
            <Pressable
              key={`empty-${i}`}
              style={[styles.slot, styles.empty]}
              onPress={add}
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
      <Text style={styles.help}>Tap a photo to remove it. Press and hold to make it your main photo.</Text>
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
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
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
  removeIcon: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.pill,
    padding: 2,
  },
  help: { fontSize: 12, color: colors.muted, marginTop: space(2) },
});
