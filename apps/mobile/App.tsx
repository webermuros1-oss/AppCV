import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import SessionScreen from './src/screens/SessionScreen';
import ReportScreen from './src/screens/ReportScreen';

export type RootStackParamList = {
  Home: undefined;
  Session: undefined;
  Report: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" options={{ title: 'AppEntrevistasCV' }}>
            {({ navigation }) => (
              <HomeScreen onStarted={() => navigation.navigate('Session')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Session" options={{ title: 'Entrevista' }}>
            {({ navigation }) => (
              <SessionScreen onEnded={() => navigation.replace('Report')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Report" options={{ title: 'Reporte' }}>
            {({ navigation }) => (
              <ReportScreen
                onBackHome={() =>
                  navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
                }
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
