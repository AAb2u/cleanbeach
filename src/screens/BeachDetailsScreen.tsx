import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, BeachReport, Comment, BeachStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  addComment,
  deleteReport,
  getReport,
  subscribeToComments,
  toggleConfirm,
  toggleLike,
  updateReportStatus,
} from '../services/beachService';
import { isCloudinaryConfigured } from '../config/cloudinary';
import { uploadReportImages } from '../services/photoUploadService';
import { LoadingScreen } from '../components/LoadingScreen';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { AppImages } from '../constants/images';
import { STATUS_LABELS } from '../constants/labels';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';
import { formatDate } from '../utils/helpers';

type Props = NativeStackScreenProps<RootStackParamList, 'BeachDetails'>;

const MAX_CLEANUP_IMAGES = 3;
const STATUS_ICONS: Record<BeachStatus, keyof typeof Ionicons.glyphMap> = {
  polluted: 'warning',
  cleaning: 'construct',
  cleaned: 'checkmark-circle',
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Erreur inconnue.';
}

export function BeachDetailsScreen({ route, navigation }: Props) {
  const { beachId } = route.params;
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [report, setReport] = useState<BeachReport | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [cleanupImages, setCleanupImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<BeachStatus | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport(beachId).then((nextReport) => {
      setReport(nextReport);
      setLoading(false);
    });

    return subscribeToComments(beachId, setComments);
  }, [beachId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getReport(beachId).then((nextReport) => {
        if (!active) return;
        setReport(nextReport);
        setLoading(false);
      });

      return () => {
        active = false;
      };
    }, [beachId]),
  );

  if (loading || !report) return <LoadingScreen />;

  const liked = user ? report.likedBy.includes(user.uid) : false;
  const confirmed = user ? report.confirmedBy.includes(user.uid) : false;
  const canManageReport = Boolean(user && (report.userId === user.uid || profile?.isAdmin));
  const reportPhotos = report.imageUrls ?? [];
  const cleanupPhotos = report.cleanupImageUrls ?? [];
  const heroSource = reportPhotos[0] ? { uri: reportPhotos[0] } : AppImages.reportKit;

  const refreshReport = async () => {
    setReport(await getReport(beachId));
  };

  const handleLike = async () => {
    if (!user) return;
    await toggleLike(beachId, user.uid);
    await refreshReport();
  };

  const handleConfirm = async () => {
    if (!user) return;
    await toggleConfirm(beachId, user.uid);
    await refreshReport();
  };

  const handleComment = async () => {
    if (!user || !profile || !commentText.trim()) return;
    await addComment(beachId, user.uid, profile.displayName, commentText.trim());
    setCommentText('');
  };

  const handleStatusChange = async (status: BeachStatus) => {
    if (!user || !profile) {
      Alert.alert('Erreur', 'Vous devez etre connecte.');
      return;
    }

    if (status === 'cleaned') {
      await handleCleanupProof();
      return;
    }

    setStatusLoading(status);
    try {
      await updateReportStatus(beachId, status, {
        userId: user.uid,
        userName: profile.displayName,
      });
      await refreshReport();
      Alert.alert('Succes', `Statut mis a jour : ${STATUS_LABELS[status]}`);
    } catch (error) {
      console.error('Unable to change report status.', error);
      Alert.alert('Erreur', `Impossible de changer le statut.\n\nDetail: ${getErrorMessage(error)}`);
    } finally {
      setStatusLoading(null);
    }
  };

  const handleEditReport = () => {
    if (!canManageReport) return;
    navigation.navigate('Report', { reportId: beachId });
  };

  const handleDeleteReport = () => {
    if (!canManageReport) return;

    Alert.alert(
      'Supprimer le signalement',
      'Cette action supprimera le signalement de l app.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await deleteReport(beachId);
              Alert.alert('Succes', 'Signalement supprime.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le signalement.');
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  };

  const addCleanupImages = (assets: ImagePicker.ImagePickerAsset[]) => {
    setCleanupImages((current) => {
      const remainingSlots = MAX_CLEANUP_IMAGES - current.length;
      if (remainingSlots <= 0) return current;

      const selectedUris = new Set(current.map((image) => image.uri));
      const nextImages = assets.filter((image) => !selectedUris.has(image.uri)).slice(0, remainingSlots);
      return [...current, ...nextImages];
    });
  };

  const pickCleanupImages = async () => {
    if (cleanupImages.length >= MAX_CLEANUP_IMAGES) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter jusqu'a ${MAX_CLEANUP_IMAGES} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Acces aux photos requis.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_CLEANUP_IMAGES - cleanupImages.length,
      quality: 0.72,
      base64: true,
    });

    if (!result.canceled) {
      addCleanupImages(result.assets);
    }
  };

  const takeCleanupPhoto = async () => {
    if (cleanupImages.length >= MAX_CLEANUP_IMAGES) {
      Alert.alert('Limite atteinte', `Vous pouvez ajouter jusqu'a ${MAX_CLEANUP_IMAGES} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', 'Acces camera requis.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.72,
      base64: true,
    });

    if (!result.canceled) {
      addCleanupImages(result.assets);
    }
  };

  const removeCleanupImage = (uri: string) => {
    setCleanupImages((current) => current.filter((image) => image.uri !== uri));
  };

  const handleCleanupProof = async () => {
    if (!user || !profile) {
      Alert.alert('Erreur', 'Vous devez etre connecte.');
      return;
    }

    if (cleanupImages.length === 0) {
      Alert.alert('Photo requise', 'Ajoutez au moins une photo de preuve.');
      return;
    }

    setCleanupLoading(true);
    setStatusLoading('cleaned');
    try {
      if (!isCloudinaryConfigured()) {
        Alert.alert(
          'Photos non configurees',
          'Ajoutez EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME et EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET dans votre fichier .env.',
        );
        return;
      }

      const proofImageUrls = await uploadReportImages(cleanupImages);
      await updateReportStatus(beachId, 'cleaned', {
        proofImageUrls,
        userId: user.uid,
        userName: profile.displayName,
      });
      setCleanupImages([]);
      await refreshReport();
      Alert.alert('Succes', 'Signalement marque comme nettoye.');
    } catch (error) {
      console.error('Unable to send cleanup proof.', error);
      Alert.alert('Erreur', `Impossible d envoyer la preuve.\n\nDetail: ${getErrorMessage(error)}`);
    } finally {
      setCleanupLoading(false);
      setStatusLoading(null);
    }
  };

  const renderPhotoStrip = (title: string, uris: string[]) => {
    if (uris.length === 0) return null;

    return (
      <View style={styles.gallerySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
          {uris.map((uri, index) => (
            <TouchableOpacity
              key={`${uri}-${index}`}
              activeOpacity={0.86}
              onPress={() => setPreviewUri(uri)}
              style={styles.galleryItem}
            >
              <Image source={{ uri }} style={styles.galleryImage} contentFit="cover" />
              <View style={styles.galleryIndex}>
                <Text style={styles.galleryIndexText}>{index + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      <ScrollView style={{ backgroundColor: colors.background }}>
        <TouchableOpacity activeOpacity={0.92} onPress={() => reportPhotos[0] && setPreviewUri(reportPhotos[0])}>
          <Image source={heroSource} style={styles.hero} contentFit="cover" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{report.title}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {report.locationName} - {formatDate(report.createdAt)}
          </Text>
          <View style={styles.badges}>
            <SeverityBadge severity={report.severity} />
            <StatusBadge status={report.status} />
          </View>
          <Text style={[styles.desc, { color: colors.text }]}>{report.description}</Text>
          <Text style={[styles.author, { color: colors.textSecondary }]}>Par {report.userName}</Text>

          {canManageReport && (
            <View style={styles.ownerActions}>
              <Button title="Modifier" onPress={handleEditReport} variant="outline" icon="create" style={styles.ownerAction} />
              <Button
                title="Supprimer"
                onPress={handleDeleteReport}
                variant="danger"
                icon="trash"
                loading={deleteLoading}
                disabled={deleteLoading}
                style={styles.ownerAction}
              />
            </View>
          )}

          {renderPhotoStrip('Photos du signalement', reportPhotos)}
          {renderPhotoStrip('Preuves de nettoyage', cleanupPhotos)}
          {(cleanupPhotos.length > 0 || report.cleanedByName) && (
            <View style={[styles.cleanupSummary, { backgroundColor: colors.secondary + '14', borderColor: colors.secondary + '55' }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
              <Text style={[styles.cleanupSummaryText, { color: colors.text }]}>
                {report.cleanedByName ? `Nettoye par ${report.cleanedByName}` : 'Nettoyage confirme'}
                {report.cleanedAt ? ` - ${formatDate(report.cleanedAt)}` : ''}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={handleLike}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={colors.error} />
              <Text style={{ color: colors.text }}>{report.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={handleConfirm}>
              <Ionicons name={confirmed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={22} color={colors.secondary} />
              <Text style={{ color: colors.text }}>{report.confirmations}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.responseSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.responseHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Changer l'etat</Text>
                <Text style={[styles.responseMeta, { color: colors.textSecondary }]}>Suivi communautaire du signalement</Text>
              </View>
              <Text style={[styles.photoCount, { color: colors.textSecondary }]}>
                {cleanupImages.length}/{MAX_CLEANUP_IMAGES}
              </Text>
            </View>

            <View style={styles.statusChoiceRow}>
              {(['polluted', 'cleaning', 'cleaned'] as BeachStatus[]).map((status) => {
                const active = report.status === status;
                const loadingStatus = statusLoading === status;

                return (
                  <TouchableOpacity
                    key={status}
                    activeOpacity={0.86}
                    onPress={() => handleStatusChange(status)}
                    disabled={Boolean(statusLoading) || cleanupLoading}
                    style={[
                      styles.statusChoice,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.background,
                        opacity: Boolean(statusLoading) || cleanupLoading ? 0.68 : 1,
                      },
                    ]}
                  >
                    <Ionicons name={STATUS_ICONS[status]} size={18} color={active ? '#fff' : colors.primary} />
                    <Text style={[styles.statusChoiceText, { color: active ? '#fff' : colors.text }]} numberOfLines={2}>
                      {loadingStatus ? '...' : STATUS_LABELS[status]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.proofTitle, { color: colors.text }]}>Preuve photo de nettoyage</Text>

            <View style={styles.photoActions}>
              <TouchableOpacity
                style={[
                  styles.photoAction,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    opacity: cleanupImages.length >= MAX_CLEANUP_IMAGES ? 0.55 : 1,
                  },
                ]}
                onPress={takeCleanupPhoto}
                disabled={cleanupImages.length >= MAX_CLEANUP_IMAGES || cleanupLoading}
              >
                <Ionicons name="camera" size={22} color={colors.primary} />
                <Text style={[styles.photoActionText, { color: colors.text }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.photoAction,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    opacity: cleanupImages.length >= MAX_CLEANUP_IMAGES ? 0.55 : 1,
                  },
                ]}
                onPress={pickCleanupImages}
                disabled={cleanupImages.length >= MAX_CLEANUP_IMAGES || cleanupLoading}
              >
                <Ionicons name="images" size={22} color={colors.primary} />
                <Text style={[styles.photoActionText, { color: colors.text }]}>Galerie</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photoRow}>
              {cleanupImages.map((image) => (
                <View key={image.uri} style={styles.photoPreviewWrap}>
                  <Image source={{ uri: image.uri }} style={styles.photoPreview} contentFit="cover" />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removeCleanupImage(image.uri)}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {cleanupImages.length === 0 && (
                <View style={[styles.photoEmpty, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Ionicons name="image-outline" size={24} color={colors.primary} />
                  <Text style={[styles.photoEmptyText, { color: colors.textSecondary }]}>Aucune preuve ajoutee</Text>
                </View>
              )}
            </View>

            <Button
              title={report.status === 'cleaned' ? 'Ajouter une preuve' : 'Marquer nettoyee avec preuve'}
              onPress={handleCleanupProof}
              variant="secondary"
              icon="checkmark-circle"
              loading={cleanupLoading}
              disabled={cleanupLoading}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Commentaires ({comments.length})</Text>
          {comments.map((comment) => (
            <View key={comment.id} style={[styles.comment, { backgroundColor: colors.surface }]}>
              <Text style={[styles.commentAuthor, { color: colors.primary }]}>{comment.userName}</Text>
              <Text style={{ color: colors.text }}>{comment.text}</Text>
              <Text style={[styles.commentDate, { color: colors.textSecondary }]}>{formatDate(comment.createdAt)}</Text>
            </View>
          ))}
          <View style={styles.commentInput}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            />
            <TouchableOpacity onPress={handleComment} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={Boolean(previewUri)} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.previewBackdrop}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewUri(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {previewUri && <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="contain" />}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 220 },
  content: { padding: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800' },
  meta: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.sm },
  desc: { fontSize: FontSize.md, lineHeight: 24, marginTop: Spacing.sm },
  author: { fontSize: FontSize.sm, marginTop: Spacing.sm },
  ownerActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  ownerAction: { flex: 1 },
  gallerySection: { marginTop: Spacing.lg },
  galleryRow: { gap: Spacing.sm, paddingRight: Spacing.md },
  galleryItem: { width: 112, height: 92, borderRadius: BorderRadius.md, overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  galleryIndex: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  galleryIndexText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  cleanupSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  cleanupSummaryText: { flex: 1, fontSize: FontSize.sm, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.lg },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  responseSection: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'flex-start' },
  responseMeta: { fontSize: FontSize.sm, fontWeight: '700' },
  photoCount: { fontSize: FontSize.xs, fontWeight: '800' },
  statusChoiceRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  statusChoice: {
    flex: 1,
    minHeight: 74,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  statusChoiceText: { fontSize: FontSize.xs, fontWeight: '800', textAlign: 'center' },
  proofTitle: { fontSize: FontSize.sm, fontWeight: '800', marginTop: Spacing.md },
  photoActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.sm },
  photoAction: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoActionText: { fontSize: FontSize.sm, fontWeight: '800' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  photoPreviewWrap: { width: 86, height: 86, borderRadius: BorderRadius.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmpty: {
    width: '100%',
    minHeight: 86,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  photoEmptyText: { fontSize: FontSize.sm, fontWeight: '700', marginTop: Spacing.xs },
  adminSection: { marginBottom: Spacing.lg },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  statusButton: { flex: 1, minWidth: 108 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  comment: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  commentAuthor: { fontWeight: '700', marginBottom: 4 },
  commentDate: { fontSize: FontSize.xs, marginTop: 4 },
  commentInput: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.xl },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  previewClose: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewImage: { width: '100%', height: '82%' },
});
