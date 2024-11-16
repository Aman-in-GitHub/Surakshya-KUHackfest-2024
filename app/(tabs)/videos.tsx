import { Pressable, ToastAndroid, Vibration, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Text from '@/components/Text';
import { Stack, useRouter } from 'expo-router';
import NoConnection from '@/assets/images/no-connection.svg';
import VideosList from '@/components/VideosList';
import zustandStorage from '@/storage/storage';
import { OtpInput, OtpInputRef } from 'react-native-otp-entry';
import { LinearGradient } from 'expo-linear-gradient';
import isOnline from '@/utils/isOnline';

const AnimatedView = Animated.createAnimatedComponent(View);

function Videos() {
  const { styles, theme } = useStyles(stylesheet);
  const [unlocked, setUnlocked] = useState(false);
  const [online, setOnline] = useState(false);
  const router = useRouter();
  const [pinValue, setPinValue] = useState('');
  const userPin = zustandStorage.getItem('userPin') || '0227';
  const pinRef = useRef<OtpInputRef>(null);

  useEffect(() => {
    async function checkIsConnected() {
      const isConnected = await isOnline();
      setOnline(isConnected as boolean);
    }
    checkIsConnected();
  }, []);

  async function verifyOtp() {
    const pin = pinValue.trim();

    if (pin.length !== 4 || pin !== userPin) {
      Vibration.vibrate(100);
      // @ts-expect-error ERROR: ref type error
      pinRef.current.clear();
      setPinValue('');
      router.back();
      ToastAndroid.show('Incorrect PIN', ToastAndroid.SHORT);
      return;
    }

    Vibration.vibrate(500);
    // @ts-expect-error ERROR: ref type error
    pinRef.current.clear();
    setPinValue('');
    setUnlocked(true);
  }

  if (!unlocked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'flex-end',
          alignItems: 'center'
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
          <View style={styles.otpView}>
            <OtpInput
              numberOfDigits={4}
              onTextChange={setPinValue}
              ref={pinRef}
              focusColor={theme.colors.blue}
              secureTextEntry={true}
              theme={{
                containerStyle: styles.otpContainer,
                pinCodeContainerStyle: {
                  width: 60,
                  borderRadius: theme.borderRadius.default,
                  borderColor: theme.colors.blue
                },
                pinCodeTextStyle: {
                  color: theme.colors.blue
                }
              }}
              autoFocus={false}
            />

            <LinearGradient
              colors={[theme.colors.blue, 'blue']}
              style={{
                borderRadius: theme.borderRadius.default
              }}
            >
              <Pressable
                style={{
                  paddingVertical: theme.padding.verticalButton,
                  paddingHorizontal: theme.padding.horizontalButton,
                  borderRadius: theme.borderRadius.default,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10
                }}
                android_ripple={{
                  color: theme.colors.androidRipple
                }}
                onPress={verifyOtp}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.lg,
                    fontFamily: 'BoldBodyTextFont'
                  }}
                >
                  Unlock Evidences
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
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
  },
  otpView: {
    flexDirection: 'column',
    gap: 25
  },
  otpContainer: {
    width: '80%',
    gap: 25,
    flexDirection: 'row'
  }
}));

export default Videos;
