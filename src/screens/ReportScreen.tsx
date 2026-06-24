import React, { useEffect, useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { AppImages } from '../constants/images';
import { SEVERITY_LABELS } from '../constants/labels';
import { getSeverityColor } from '../utils/helpers';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground source={AppImages.reportKit} style={styles.hero} imageStyle={styles.heroImage} resizeMode="cover">
        <LinearGradient colors={['rgba(2, 19, 30, 0.10)', 'rgba(2, 19, 30, 0.74)']} style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>{isEditing ? 'Modifier le signalement' : 'Nouveau signalement'}</Text>
          <Text style={styles.heroText}>
            {isEditing ? 'Mettez a jour les infos et les photos de votre signalement.' : 'Ajoutez les infos essentielles pour aider la communaute a agir vite.'}
          </Text>
        </LinearGradient>
      </ImageBackground>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '70' }]}>
        <Ionicons name="information-circle" size={22} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Decrivez la pollution, ajoutez une photo si possible, puis indiquez votre position GPS.
        </Text>
      </View>

      <View style={[styles.photoPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.photoHeader}>
          <View>
            <Text style={[styles.photoTitle, { color: colors.text }]}>Ajouter des photos</Text>
            <Text style={[styles.photoSubtitle, { color: colors.textSecondary }]}>Camera ou galerie, jusqu'a {MAX_REPORT_IMAGES} photos.</Text>
          </View>
          <Text style={[styles.photoCount, { color: colors.textSecondary }]}>
            {totalImageCount}/{MAX_REPORT_IMAGES}
          </Text>
        </View>
        <View style={styles.photoActions}>
          <TouchableOpacity
            style={[
              styles.photoAction,
              { borderColor: colors.primary, backgroundColor: colors.primary + '12', opacity: totalImageCount >= MAX_REPORT_IMAGES ? 0.55 : 1 },
            ]}
            onPress={takePhoto}
            disabled={totalImageCount >= MAX_REPORT_IMAGES}
          >
            <Ionicons name="camera" size={22} color={colors.primary} />
            <Text style={[styles.photoActionText, { color: colors.text }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.photoAction,
              { borderColor: colors.primary, backgroundColor: colors.primary + '12', opacity: totalImageCount >= MAX_REPORT_IMAGES ? 0.55 : 1 },
            ]}
            onPress={pickImages}
            disabled={totalImageCount >= MAX_REPORT_IMAGES}
          >
            <Ionicons name="images" size={22} color={colors.primary} />
            <Text style={[styles.photoActionText, { color: colors.text }]}>Galerie</Text>
          </TouchableOpacity>
        </View>
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
          {totalImageCount === 0 && (
            <View style={[styles.photoEmpty, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="image-outline" size={28} color={colors.primary} />
              <Text style={[styles.photoEmptyText, { color: colors.textSecondary }]}>
                Appuyez sur Camera ou Galerie
              </Text>
            </View>
          )}
        </View>
      </View>

      <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Ex: Dechets plastiques sur la plage" />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Decrivez la situation..."
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

      <Text style={[styles.label, { color: colors.text }]}>Niveau de pollution</Text>
      <View style={styles.severityRow}>
        {(['low', 'medium', 'high'] as PollutionSeverity[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSeverity(s)}
            style={[
              styles.severityBtn,
              {
                borderColor: getSeverityColor(s, isDark),
                backgroundColor: severity === s ? getSeverityColor(s, isDark) + '30' : colors.surface,
              },
            ]}
          >
            <Text style={{ color: getSeverityColor(s, isDark), fontWeight: '700', fontSize: FontSize.sm }}>
              {SEVERITY_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title={location ? location.name : 'Obtenir ma position GPS'}
        onPress={getLocation}
        variant="outline"
        style={{ marginBottom: Spacing.md }}
      />
      <Button title={isEditing ? 'Enregistrer les modifications' : 'Envoyer le signalement'} onPress={handleSubmit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, paddingBottom: Spacing.xl },
  hero: { minHeight: 168, marginBottom: Spacing.md, overflow: 'hidden', borderRadius: BorderRadius.lg },
  heroImage: { borderRadius: BorderRadius.lg },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: Spacing.md },
  heroTitle: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800' },
  heroText: { color: '#fff', fontSize: FontSize.sm, marginTop: Spacing.xs, maxWidth: 310 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.md },
  infoText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  label: { fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm },
  severityRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  severityBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 2, alignItems: 'center' },
  photoPanel: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  photoHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  photoTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  photoSubtitle: { fontSize: FontSize.sm, marginTop: 2 },
  photoCount: { fontSize: FontSize.xs, fontWeight: '800' },
  photoActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.sm },
  photoAction: { flex: 1, minHeight: 52, borderWidth: 1, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  photoActionText: { fontSize: FontSize.sm, fontWeight: '800' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoPreviewWrap: { width: 86, height: 86, borderRadius: BorderRadius.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(15, 23, 42, 0.78)', alignItems: 'center', justifyContent: 'center' },
  photoEmpty: { width: '100%', minHeight: 86, borderWidth: 1, borderStyle: 'dashed', borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', padding: Spacing.md },
  photoEmptyText: { fontSize: FontSize.sm, fontWeight: '700', marginTop: Spacing.xs },
});
