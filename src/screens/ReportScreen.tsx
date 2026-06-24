import React, { useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PollutionSeverity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createReport } from '../services/beachService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AppImages } from '../constants/images';
import { SEVERITY_LABELS } from '../constants/labels';
import { getSeverityColor } from '../utils/helpers';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

export function ReportScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<PollutionSeverity>('medium');
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!title || !description || !location || !user || !profile) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et obtenir votre position GPS.');
      return;
    }
    setLoading(true);
    try {
      await createReport({
        title,
        description,
        severity,
        latitude: location.lat,
        longitude: location.lng,
        locationName: location.name,
        imageUrls: [],
        userId: user.uid,
        userName: profile.displayName,
      });
      Alert.alert('Succes', 'Signalement cree avec succes.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Erreur', 'Impossible de creer le signalement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground source={AppImages.reportKit} style={styles.hero} imageStyle={styles.heroImage} resizeMode="cover">
        <LinearGradient colors={['rgba(2, 19, 30, 0.10)', 'rgba(2, 19, 30, 0.74)']} style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Nouveau signalement</Text>
          <Text style={styles.heroText}>Ajoutez les infos essentielles pour aider la communaute a agir vite.</Text>
        </LinearGradient>
      </ImageBackground>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '70' }]}>
        <Ionicons name="information-circle" size={22} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Decrivez la pollution et indiquez votre position GPS. Les photos pourront etre ajoutees plus tard.
        </Text>
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
      <Button title="Envoyer le signalement" onPress={handleSubmit} loading={loading} />
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
});
