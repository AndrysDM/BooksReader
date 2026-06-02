import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';

export type RootStackParamList = {
  library: undefined;
  reader: { bookId: string };
  bookDetail: { bookId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="library"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="library" component={LibraryScreen} />
      <Stack.Screen name="reader" component={ReaderScreen} />
      <Stack.Screen name="bookDetail" component={BookDetailScreen} />
    </Stack.Navigator>
  );
};
