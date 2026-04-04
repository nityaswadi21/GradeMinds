import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D1A',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Q-Gen AI',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Grades',
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
