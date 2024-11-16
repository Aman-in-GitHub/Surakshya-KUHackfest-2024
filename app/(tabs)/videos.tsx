import { ToastAndroid, Vibration, View } from 'react-native';
import React, { useCallback, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Text from '@/components/Text';
import { authenticateAsync } from 'expo-local-authentication';
import { useFocusEffect, useRouter } from 'expo-router';
import ActivityIndicator from '@/components/ActivityIndicator';
import isOnline from '@/utils/isOnline';
import NoConnection from '@/assets/images/no-connection.svg';
import VideosList from '@/components/VideosList';

const AnimatedView = Animated.createAnimatedComponent(View);

function Videos() {
  const { styles, theme } = useStyles(stylesheet);
  const [unlocked, setUnlocked] = useState(false);
  const [online, setOnline] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      async function authenticateUser() {
        const isConnected = await isOnline();
        setOnline(isConnected as boolean);

        const res = await authenticateAsync();
        if (res.success) {
          setUnlocked(true);
        } else {
          router.back();
          ToastAndroid.show('Incorrect Biometrics', ToastAndroid.SHORT);
          Vibration.vibrate(100);
        }
      }

      authenticateUser();
    }, [router])
  );

  if (!unlocked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 100
        }}
      >
        <AnimatedView
          entering={FadeIn.duration(1000)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ActivityIndicator size={200} delayMs={100} />
        </AnimatedView>
      </View>
    );
  }

  if (!online) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <AnimatedView
          entering={FadeIn.duration(1000)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 100
          }}
        >
          <NoConnection width={300} height={300} />
          <Text
            style={{
              fontFamily: 'HeadingFont',
              fontSize: theme.fontSize.lg + 3,
              textDecorationLine: 'underline',
              marginTop: 10
            }}
          >
            No Internet Connection
          </Text>
        </AnimatedView>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background
      }}
    >
      <AnimatedView entering={FadeIn.duration(1000)} style={styles.container}>
        <VideosList />
      </AnimatedView>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1
  }
}));

export default Videos;
