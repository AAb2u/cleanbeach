import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { BeachListScreen } from '../screens/BeachListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { colors } = useTheme();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Home: 'home', Map: 'map', ReportTab: 'add-circle', List: 'list', Profile: 'person',
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
      <Tab.Screen
        name="ReportTab"
        component={HomeScreen}
        options={{
          title: 'Signaler',
          tabBarLabel: 'Signaler',
          tabBarButton: ({ children, style, accessibilityState }) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={accessibilityState}
              activeOpacity={0.86}
              onPress={() => rootNavigation.navigate('Report')}
              style={[
                style,
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              {children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen name="List" component={BeachListScreen} options={{ title: 'Liste', tabBarLabel: 'Liste' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}
