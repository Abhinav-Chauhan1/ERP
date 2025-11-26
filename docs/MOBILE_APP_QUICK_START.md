# Mobile App Quick Start Guide

Get your School ERP mobile app up and running in minutes.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 14+ (Mac only)
- Android: Android Studio with SDK
- Clerk account (for authentication)
- Cloudinary account (for file uploads)

## Step 1: Create Project

```bash
# Create new Expo project
npx create-expo-app school-erp-mobile --template blank-typescript

# Navigate to project directory
cd school-erp-mobile
```

## Step 2: Install Dependencies

```bash
# Core dependencies
npm install @clerk/clerk-expo @tanstack/react-query axios zustand

# Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# UI Components
npm install react-native-paper react-native-vector-icons
npm install @react-native-async-storage/async-storage

# Utilities
npm install date-fns zod react-hook-form
npm install expo-image-picker expo-document-picker
npm install expo-notifications expo-secure-store
npm install expo-file-system
```

## Step 3: Configure Environment

Create `.env` file in project root:

```env
API_BASE_URL=http://localhost:3000/api
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_preset
```

## Step 4: Setup Project Structure

```bash
# Create directory structure
mkdir -p src/{api,components,screens,navigation,hooks,store,utils,types,constants,services}
mkdir -p src/components/{common,student,parent}
mkdir -p src/screens/{auth,student,parent}
```


## Step 5: Create API Client

Create `src/api/client.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('clerk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('clerk_token');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);
```

## Step 6: Setup Authentication

Create `App.tsx`:

```typescript
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

const queryClient = new QueryClient();

export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
```

## Step 7: Create Navigation

Create `src/navigation/RootNavigator.tsx`:

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import LoginScreen from '@/screens/auth/LoginScreen';
import StudentNavigator from './StudentNavigator';
import ParentNavigator from './ParentNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isSignedIn, user } = useAuth();

  if (!isSignedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  const userRole = user?.publicMetadata?.role;

  if (userRole === 'STUDENT') {
    return <StudentNavigator />;
  } else if (userRole === 'PARENT') {
    return <ParentNavigator />;
  }

  return null;
}
```


## Step 8: Create Student Navigator

Create `src/navigation/StudentNavigator.tsx`:

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '@/screens/student/DashboardScreen';
import AcademicsScreen from '@/screens/student/AcademicsScreen';
import AttendanceScreen from '@/screens/student/AttendanceScreen';
import MessagesScreen from '@/screens/student/MessagesScreen';
import ProfileScreen from '@/screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Academics':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Attendance':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Messages':
              iconName = focused ? 'mail' : 'mail-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Academics" component={AcademicsScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

## Step 9: Create Sample Screen

Create `src/screens/student/DashboardScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export default function DashboardScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/student/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error loading dashboard</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Dashboard</Title>
      
      <Card style={styles.card}>
        <Card.Content>
          <Title>Attendance</Title>
          <Paragraph>
            {data?.attendance?.percentage}% ({data?.attendance?.present}/
            {data?.attendance?.total})
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Pending Assignments</Title>
          <Paragraph>{data?.pendingAssignments} assignments due</Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
});
```


## Step 10: Run the App

```bash
# Start the development server
npx expo start

# Options:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on physical device
```

## Step 11: Test on Device

### iOS (Physical Device)
1. Install Expo Go from App Store
2. Scan QR code from terminal
3. App will load on your device

### Android (Physical Device)
1. Install Expo Go from Play Store
2. Scan QR code from terminal
3. App will load on your device

## Next Steps

### Add More Features
1. **Implement remaining screens**
   - Assignments list and detail
   - Exam results
   - Fee payment
   - Messages

2. **Add push notifications**
   ```bash
   npm install expo-notifications
   ```

3. **Implement file uploads**
   ```bash
   npm install expo-image-picker expo-document-picker
   ```

4. **Add offline support**
   ```bash
   npm install @tanstack/react-query-persist-client
   ```

5. **Setup analytics**
   ```bash
   npm install expo-firebase-analytics
   ```

### Configure for Production

1. **Update app.json**
```json
{
  "expo": {
    "name": "School ERP",
    "slug": "school-erp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.yourschool.erp",
      "supportsTablet": true
    },
    "android": {
      "package": "com.yourschool.erp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

2. **Build for production**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

## Troubleshooting

### Common Issues

**Metro bundler not starting:**
```bash
npx expo start -c
```

**Dependencies not installing:**
```bash
rm -rf node_modules
npm install
```

**iOS build fails:**
```bash
cd ios
pod install
cd ..
```

**Android build fails:**
- Check Android Studio SDK installation
- Verify ANDROID_HOME environment variable
- Update Gradle if needed

## Resources

- [Full Documentation](./MOBILE_APP_DOCUMENTATION.md)
- [API Reference](./MOBILE_APP_API_REFERENCE.md)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Clerk Documentation](https://clerk.com/docs)

## Support

For help and support:
- Email: support@yourschool.com
- Documentation: https://docs.yourschool.com
- GitHub Issues: https://github.com/yourschool/erp-mobile/issues

