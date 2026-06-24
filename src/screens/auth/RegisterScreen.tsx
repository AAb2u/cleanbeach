import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AppImages } from '../../constants/images';
import { BorderRadius, FontSize, Spacing } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
    } catch {
      Alert.alert('Erreur', "Impossible de creer le compte. L'email est peut-etre deja utilise.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ImageBackground source={AppImages.authBeach} style={styles.background} resizeMode="cover">
        <LinearGradient colors={['rgba(3, 24, 38, 0.28)', 'rgba(3, 24, 38, 0.84)']} style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.brand}>
              <View style={styles.logoMark}>
                <Ionicons name="leaf" size={30} color="#10B981" />
              </View>
              <Text style={styles.title}>Rejoindre CleanBeach</Text>
              <Text style={styles.subtitle}>Un compte, des plages mieux suivies.</Text>
            </View>

            <View style={styles.form}>
              <Input label="Nom d'affichage" value={name} onChangeText={setName} placeholder="Votre nom" />
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="votre@email.com"
              />
              <Input
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Min. 6 caracteres"
              />
              <Button title="S'inscrire" onPress={handleRegister} loading={loading} icon="person-add" />
              <Button
                title="Deja un compte ? Se connecter"
                onPress={() => navigation.goBack()}
                variant="outline"
                style={styles.secondaryButton}
              />
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  background: { flex: 1 },
  overlay: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
    padding: Spacing.lg,
    paddingTop: 42,
    paddingBottom: 42,
  },
  brand: { alignItems: 'center', marginBottom: Spacing.lg },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#fff', fontSize: FontSize.sm, marginTop: Spacing.xs, textAlign: 'center' },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  secondaryButton: { marginTop: Spacing.sm, backgroundColor: 'rgba(255, 255, 255, 0.58)' },
});
