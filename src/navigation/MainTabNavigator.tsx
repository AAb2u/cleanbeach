import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { BeachListScreen } from '../screens/BeachListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Home: 'home', Map: 'map', List: 'list', Profile: 'person',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil', tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Carte', tabBarLabel: 'Carte' }} />
      <Tab.Screen name="List" component={BeachListScreen} options={{ title: 'Liste', tabBarLabel: 'Liste' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}
