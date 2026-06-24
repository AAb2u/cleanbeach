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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ImageBackground source={AppImages.authBeach} style={styles.background} resizeMode="cover">
        <LinearGradient colors={['rgba(3, 24, 38, 0.32)', 'rgba(3, 24, 38, 0.82)']} style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.brand}>
              <View style={styles.logoMark}>
                <Ionicons name="water" size={32} color="#0EA5E9" />
              </View>
              <Text style={styles.logo}>CleanBeach</Text>
              <Text style={styles.subtitle}>Protegeons nos plages ensemble</Text>
            </View>

            <View style={styles.form}>
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
                placeholder="Mot de passe"
              />
              <Button title="Se connecter" onPress={handleLogin} loading={loading} />
              <Button
                title="Creer un compte"
                onPress={() => navigation.navigate('Register')}
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
    gap: Spacing.xxl,
    padding: Spacing.lg,
    paddingTop: 48,
    paddingBottom: 48,
  },
  brand: { alignItems: 'center' },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logo: { color: '#fff', fontSize: FontSize.hero, fontWeight: '800' },
  subtitle: { color: '#fff', fontSize: FontSize.md, marginTop: Spacing.xs, textAlign: 'center' },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  secondaryButton: { marginTop: Spacing.sm, backgroundColor: 'rgba(255, 255, 255, 0.58)' },
});
