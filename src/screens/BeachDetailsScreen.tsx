import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, BeachReport, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getReport, subscribeToComments, toggleLike, toggleConfirm, addComment, updateReportStatus,
} from '../services/beachService';
import { LoadingScreen } from '../components/LoadingScreen';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { AppImages } from '../constants/images';
import { formatDate } from '../utils/helpers';
import { STATUS_LABELS } from '../constants/labels';
import { BeachStatus } from '../types';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BeachDetails'>;

export function BeachDetailsScreen({ route }: Props) {
  const { beachId } = route.params;
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [report, setReport] = useState<BeachReport | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport(beachId).then((r) => { setReport(r); setLoading(false); });
    return subscribeToComments(beachId, setComments);
  }, [beachId]);

  if (loading || !report) return <LoadingScreen />;

  const liked = user ? report.likedBy.includes(user.uid) : false;
  const confirmed = user ? report.confirmedBy.includes(user.uid) : false;
  const heroSource = report.imageUrls[0] ? { uri: report.imageUrls[0] } : AppImages.reportKit;

  const handleLike = async () => { if (user) { await toggleLike(beachId, user.uid); setReport(await getReport(beachId)); } };
  const handleConfirm = async () => { if (user) { await toggleConfirm(beachId, user.uid); setReport(await getReport(beachId)); } };
  const handleComment = async () => {
    if (!user || !profile || !commentText.trim()) return;
    await addComment(beachId, user.uid, profile.displayName, commentText.trim());
    setCommentText('');
  };

  const handleStatusChange = async (status: BeachStatus) => {
    if (!profile?.isAdmin) return;
    await updateReportStatus(beachId, status);
    setReport(await getReport(beachId));
    Alert.alert('Succès', `Statut mis à jour : ${STATUS_LABELS[status]}`);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <Image source={heroSource} style={styles.hero} contentFit="cover" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{report.title}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{report.locationName} · {formatDate(report.createdAt)}</Text>
        <View style={styles.badges}><SeverityBadge severity={report.severity} /><StatusBadge status={report.status} /></View>
        <Text style={[styles.desc, { color: colors.text }]}>{report.description}</Text>
        <Text style={[styles.author, { color: colors.textSecondary }]}>Par {report.userName}</Text>

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

        {profile?.isAdmin && (
          <View style={styles.adminSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Changer le statut</Text>
            <View style={styles.statusRow}>
              {(['polluted', 'cleaning', 'cleaned'] as BeachStatus[]).map((s) => (
                <Button key={s} title={STATUS_LABELS[s]} onPress={() => handleStatusChange(s)} variant={report.status === s ? 'primary' : 'outline'} style={{ flex: 1 }} />
              ))}
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Commentaires ({comments.length})</Text>
        {comments.map((c) => (
          <View key={c.id} style={[styles.comment, { backgroundColor: colors.surface }]}>
            <Text style={[styles.commentAuthor, { color: colors.primary }]}>{c.userName}</Text>
            <Text style={{ color: colors.text }}>{c.text}</Text>
            <Text style={[styles.commentDate, { color: colors.textSecondary }]}>{formatDate(c.createdAt)}</Text>
          </View>
        ))}
        <View style={styles.commentInput}>
          <TextInput value={commentText} onChangeText={setCommentText} placeholder="Ajouter un commentaire..."
            placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} />
          <TouchableOpacity onPress={handleComment} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  actions: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.lg },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  adminSection: { marginBottom: Spacing.lg },
  statusRow: { flexDirection: 'row', gap: Spacing.xs },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  comment: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  commentAuthor: { fontWeight: '700', marginBottom: 4 },
  commentDate: { fontSize: FontSize.xs, marginTop: 4 },
  commentInput: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.xl },
  input: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  sendBtn: { width: 44, height: 44, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
});
