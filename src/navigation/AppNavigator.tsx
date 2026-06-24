import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ReportScreen } from '../screens/ReportScreen';
import { BeachDetailsScreen } from '../screens/BeachDetailsScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoadingScreen } from '../components/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: colors.background },
    }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="Report"
            component={ReportScreen}
            options={({ route }) => ({
              title: route.params?.reportId ? 'Modifier signalement' : 'Nouveau signalement',
              presentation: 'modal',
            })}
          />
          <Stack.Screen name="BeachDetails" component={BeachDetailsScreen} options={{ title: 'Détails' }} />
          <Stack.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Administration' }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
