import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PollutionSeverity, RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isCloudinaryConfigured } from '../config/cloudinary';
import { createReport, getReport, updateReport } from '../services/beachService';
import { uploadReportImages } from '../services/photoUploadService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LoadingScreen } from '../components/LoadingScreen';
import { SEVERITY_LABELS } from '../constants/labels';
import { getSeverityColor } from '../utils/helpers';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

const SEVERITY_HINTS: Record<PollutionSeverity, string> = {
  low: 'Quelques déchets isolés',
  medium: 'Pollution visible et étendue',
  high: 'Site fortement pollué, urgent',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;
const MAX_REPORT_IMAGES = 3;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Erreur inconnue.';
}

export function ReportScreen({ route, navigation }: Props) {
  const reportId = route.params?.reportId;
  const isEditing = Boolean(reportId);
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<PollutionSeverity>('medium');
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [initialLoading, setInitialLoading] = useState(Boolean(reportId));
  const [loading, setLoading] = useState(false);

  const totalImageCount = existingImageUrls.length + images.length;

  useEffect(() => {
    if (!reportId || !user) return;

    let active = true;
    setInitialLoading(true);
    getReport(reportId)
      .then((report) => {
        if (!active) return;

        if (!report) {
          Alert.alert('Erreur', 'Signalement introuvable.');
          navigation.goBack();
          return;
        }

        if (report.userId !== user.uid && !profile?.isAdmin) {
          Alert.alert('Action impossible', 'Vous ne pouvez modifier que vos propres signalements.');
          navigation.goBack();
          return;
        }

        setTitle(report.title);
        setDescription(report.description);
        setSeverity(report.severity);
        setLocation({ lat: report.latitude, lng: report.longitude, name: report.locationName });
        setExistingImageUrls(report.imageUrls ?? []);
      })
      .finally(() => {
        if (active) setInitialLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reportId, user, profile?.isAdmin, navigation]);

  const addImages = (assets: ImagePicker.ImagePickerAsset[]) => {
    setImages((current) => {
      const remainingSlots = MAX_REPORT_IMAGES - existingImageUrls.length - current.length;
      if (remainingSlots <= 0) return current;

      const selectedUris = new Set(current.map((image) => image.uri));
      const nextImages = assets.filter((image) => !selectedUris.has(image.uri)).slice(0, remainingSlots);
      return [...current, ...nextImages];
    });
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Acces localisation requis.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    const name = geo ? [geo.city, geo.region].filter(Boolean).join(', ') : 'Position GPS';
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude, name });
  };

  const pickImages = async () => {
    if (totalImageCount >= MAX_REPORT_IMAGES) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter jusqu'a ${MAX_REPORT_IMAGES} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Acces aux photos requis pour ajouter une image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_REPORT_IMAGES - totalImageCount,
      quality: 0.72,
      base64: true,
    });

    if (!result.canceled) {
      addImages(result.assets);
    }
  };

  const takePhoto = async () => {
    if (totalImageCount >= MAX_REPORT_IMAGES) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter jusqu'a ${MAX_REPORT_IMAGES} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Acces camera requis pour prendre une photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.72,
      base64: true,
    });

    if (!result.canceled) {
      addImages(result.assets);
    }
  };

  const removeImage = (uri: string) => {
    setImages((current) => current.filter((image) => image.uri !== uri));
  };

  const removeExistingImage = (uri: string) => {
    setExistingImageUrls((current) => current.filter((imageUri) => imageUri !== uri));
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !user || (!profile && !isEditing)) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et obtenir votre position GPS.');
      return;
    }
    setLoading(true);
    try {
      if (images.length > 0 && !isCloudinaryConfigured()) {
        Alert.alert(
          'Photos non configurees',
          'Ajoutez EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME et EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET dans votre fichier .env.',
        );
        return;
      }

      const uploadedImageUrls = await uploadReportImages(images);
      const imageUrls = [...existingImageUrls, ...uploadedImageUrls];
      const reportData = {
        title,
        description,
        severity,
        latitude: location.lat,
        longitude: location.lng,
        locationName: location.name,
        imageUrls,
      };

      if (reportId) {
        await updateReport(reportId, reportData);
        Alert.alert('Succes', 'Signalement modifie avec succes.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        return;
      }

      await createReport({
        ...reportData,
        userId: user.uid,
        userName: profile?.displayName ?? 'Utilisateur',
      });
      Alert.alert('Succes', 'Signalement cree avec succes.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Unable to save report.', error);
      Alert.alert(
        'Erreur',
        `Impossible de ${isEditing ? 'modifier' : 'creer'} le signalement.\n\nDetail: ${getErrorMessage(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <LoadingScreen />;

  const hasLocation = Boolean(location);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>INFORMATIONS</Text>
      <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Ex: Dechets plastiques sur la plage" />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Decrivez la situation..."
        multiline
        numberOfLines={4}
        style={{ minHeight: 110, textAlignVertical: 'top' }}
      />

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NIVEAU DE POLLUTION</Text>
      <View style={styles.severityRow}>
        {(['low', 'medium', 'high'] as PollutionSeverity[]).map((s) => {
          const c = getSeverityColor(s, isDark);
          const active = severity === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSeverity(s)}
              activeOpacity={0.85}
              style={[
                styles.severityBtn,
                { borderColor: active ? c : colors.border, backgroundColor: active ? c + '1F' : colors.surface },
              ]}
            >
              <View style={[styles.severityDot, { backgroundColor: c }]} />
              <Text style={{ color: active ? c : colors.text, fontWeight: '700', fontSize: FontSize.sm }}>
                {SEVERITY_LABELS[s]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>{SEVERITY_HINTS[severity]}</Text>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LOCALISATION</Text>
      <TouchableOpacity
        onPress={getLocation}
        activeOpacity={0.85}
        style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: hasLocation ? colors.secondary : colors.border }]}
      >
        <View style={[styles.locationIcon, { backgroundColor: (hasLocation ? colors.secondary : colors.primary) + '1A' }]}>
          <Ionicons name={hasLocation ? 'checkmark-circle' : 'location'} size={22} color={hasLocation ? colors.secondary : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.locationTitle, { color: colors.text }]} numberOfLines={1}>
            {hasLocation ? location!.name : 'Obtenir ma position GPS'}
          </Text>
          <Text style={[styles.locationSub, { color: colors.textSecondary }]}>
            {hasLocation ? 'Appuyez pour actualiser' : 'Requis pour valider le signalement'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.photoLabelRow}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>PHOTOS (OPTIONNEL)</Text>
        <Text style={[styles.photoCount, { color: colors.textSecondary }]}>{totalImageCount}/{MAX_REPORT_IMAGES}</Text>
      </View>
      <View style={styles.photoActions}>
        <TouchableOpacity
          style={[styles.photoAction, { borderColor: colors.border, backgroundColor: colors.surface, opacity: totalImageCount >= MAX_REPORT_IMAGES ? 0.5 : 1 }]}
          onPress={takePhoto}
          disabled={totalImageCount >= MAX_REPORT_IMAGES}
        >
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={[styles.photoActionText, { color: colors.text }]}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.photoAction, { borderColor: colors.border, backgroundColor: colors.surface, opacity: totalImageCount >= MAX_REPORT_IMAGES ? 0.5 : 1 }]}
          onPress={pickImages}
          disabled={totalImageCount >= MAX_REPORT_IMAGES}
        >
          <Ionicons name="images-outline" size={20} color={colors.primary} />
          <Text style={[styles.photoActionText, { color: colors.text }]}>Galerie</Text>
        </TouchableOpacity>
      </View>
      {totalImageCount > 0 && (
        <View style={styles.photoRow}>
          {existingImageUrls.map((uri) => (
            <View key={uri} style={styles.photoPreviewWrap}>
              <Image source={{ uri }} style={styles.photoPreview} contentFit="cover" />
              <TouchableOpacity style={styles.removePhoto} onPress={() => removeExistingImage(uri)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {images.map((image) => (
            <View key={image.uri} style={styles.photoPreviewWrap}>
              <Image source={{ uri: image.uri }} style={styles.photoPreview} contentFit="cover" />
              <TouchableOpacity style={styles.removePhoto} onPress={() => removeImage(image.uri)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Button
        title={isEditing ? 'Enregistrer les modifications' : 'Envoyer le signalement'}
        onPress={handleSubmit}
        loading={loading}
        icon={isEditing ? 'save' : 'send'}
        style={{ marginTop: Spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  severityRow: { flexDirection: 'row', gap: Spacing.sm },
  severityBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  severityDot: { width: 9, height: 9, borderRadius: 5 },
  hint: { fontSize: FontSize.xs, marginTop: Spacing.xs, fontStyle: 'italic' },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5 },
  locationIcon: { width: 42, height: 42, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  locationTitle: { fontSize: FontSize.md, fontWeight: '700' },
  locationSub: { fontSize: FontSize.xs, marginTop: 2 },
  photoLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  photoCount: { fontSize: FontSize.xs, fontWeight: '800' },
  photoActions: { flexDirection: 'row', gap: Spacing.sm },
  photoAction: { flex: 1, minHeight: 50, borderWidth: 1.5, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  photoActionText: { fontSize: FontSize.sm, fontWeight: '700' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  photoPreviewWrap: { width: 86, height: 86, borderRadius: BorderRadius.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(15, 23, 42, 0.78)', alignItems: 'center', justifyContent: 'center' },
});
