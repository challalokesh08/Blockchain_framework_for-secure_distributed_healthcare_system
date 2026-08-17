import React, { useContext } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import UploadScreen from './src/screens/UploadScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#5b8ff9" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0b1118' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#08101a' }
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'HealthLedger' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Records" component={RecordsScreen} options={{ title: 'My Records' }} />
          <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload File' }} />
        </>
      ) : null}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08101a' }
});
