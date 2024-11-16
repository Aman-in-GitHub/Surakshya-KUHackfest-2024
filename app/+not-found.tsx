import { View } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Text from '@/components/Text';

function NotFound() {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Oops!',
          statusBarStyle: 'light',
          headerStyle: {
            backgroundColor: theme.colors.red
          },
          headerTintColor: theme.colors.whiteColor,
          headerTitleStyle: {
            color: theme.colors.whiteColor,
            fontFamily: 'HeadingFont',
            fontSize: theme.fontSize.xxl
          }
        }}
      />
      <View style={styles.container}>
        <Text
          style={{
            fontSize: theme.fontSize.xl,
            textDecorationLine: 'line-through'
          }}
          isBold={true}
        >
          404 Not Found
        </Text>
      </View>
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background
  }
}));

export default NotFound;
