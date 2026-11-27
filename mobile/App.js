import React, { useContext } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import UploadScreen from './src/screens/UploadScreen';
import StaffRecordsScreen from './src/screens/StaffRecordsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FilesScreen from './src/screens/FilesScreen';

const Stack = createNativeStackNavigator();

function Navigator() {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  if (loading) return <View style={s.ld}><ActivityIndicator size="large" color="#5b8ff9" /></View>;
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0b1118' }, headerTintColor: '#fff', contentStyle: { backgroundColor: '#08101a' } }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'HealthLedger' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      {isAuthenticated && (
        <>
          <Stack.Screen name="Records" component={RecordsScreen} options={{ title: 'My Records' }} />
          {user?.role !== 'Patient' && <Stack.Screen name="StaffRecords" component={StaffRecordsScreen} options={{ title: 'Patients' }} />}
          <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload File' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          <Stack.Screen name="Files" component={FilesScreen} options={{ title: 'My Files' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const s = StyleSheet.create({ ld: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08101a' } });
