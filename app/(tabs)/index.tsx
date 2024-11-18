import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ToastAndroid,
  Vibration,
  View
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Text from '@/components/Text';
import useTimerStore from '@/utils/useTimerStore';
import { OtpInput, OtpInputRef } from 'react-native-otp-entry';
import zustandStorage from '@/storage/storage';
import {
  Camera,
  useCameraDevice,
  useCameraFormat
} from 'react-native-vision-camera';
import useNotifications from '@/utils/useNotifications';
import saveEvidence from '@/utils/saveEvidence';
import useIsSafeStore from '@/utils/useIsSafeStore';
import * as Location from 'expo-location';
import RNShake from 'react-native-shake';
import { LinearGradient } from 'expo-linear-gradient';
import AidFill from '@/assets/icons/AidFill.svg';
import Danger from '@/assets/icons/Danger.svg';
import { sendSms, makePhoneCall } from '@/modules/emergency-contact-module';
import usePermissions from '@/utils/useRequestPermissions';
import Animated, { FadeIn } from 'react-native-reanimated';
import checkForEvidences from '@/utils/checkForEvidences';
import getCurrentLocation from '@/utils/getCurrentLocation';
import checkWithinMapBounds from '@/utils/inMapRange';
import isOnline from '@/utils/isOnline';
import uploadEvidence from '@/utils/uploadEvidence';
import supabase from '@/storage/supabase';
import { request, PERMISSIONS, Permission } from 'react-native-permissions';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import RNRestart from 'react-native-restart';
import { CONSTANTS } from '@/utils/CONSTANTS';
import isInDangerZone from '@/utils/isInDangerZone';
import checkReportData from '@/utils/checkReportData';

const AnimatedView = Animated.createAnimatedComponent(View);

type LocationDataType = {
  latitude: number;
  longitude: number;
};

function Index() {
  const { styles, theme } = useStyles(stylesheet);
  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [
    { videoAspectRatio: 9 / 16 },
    { videoResolution: { width: 1080, height: 1920 } },
    { fps: 60 }
  ]);
  const hasAllPermissions = usePermissions();
  const camera = useRef<Camera>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { scheduleNotification } = useNotifications();
  const [_, setLocation] = useState<LocationDataType | null>(null);
  const locationRef = useRef<LocationDataType | null>(null);
  const timeRemaining = useTimerStore((state) => state.timeRemaining);
  const setTimeRemaining = useTimerStore((state) => state.setTimeRemaining);
  const [pinValue, setPinValue] = useState('');
  const userPin = zustandStorage.getItem('userPin') || '0227';
  const pinRef = useRef<OtpInputRef>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const smsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSafe = useIsSafeStore((state) => state.isSafe);
  const setIsSafe = useIsSafeStore((state) => state.setIsSafe);
  const isSafeRef = useRef(isSafe);
  const isSOSActive = JSON.parse(
    // @ts-expect-error ERROR: MMKV type error
    zustandStorage.getItem('isSOSActive') || 'false'
  );
  const contacts = CONSTANTS.CONTACTS;

  async function getReports() {
    try {
      const { data, error } = await supabase.from('reports').select('*');

      if (error) {
        throw error;
      }

      await checkReportData(data);

      ToastAndroid.show('Successfully Fetched Reports', ToastAndroid.SHORT);
    } catch (error) {
      console.error(error);
      ToastAndroid.show('Error Getting Reports', ToastAndroid.SHORT);
    }
  }

  useEffect(() => {
    if (!hasAllPermissions) return;

    async function initialCheck() {
      const currentLoc = await getCurrentLocation();
      const bounds = zustandStorage.getItem('bounds');
      let userId = zustandStorage.getItem('userId');

      if (!userId) {
        zustandStorage.setItem('userId', '1234567890');
        userId = zustandStorage.getItem('userId');
      }

      zustandStorage.setItem('location', JSON.stringify(currentLoc));

      if (!bounds) {
        ToastAndroid.show('Download Offline Map', ToastAndroid.SHORT);

        zustandStorage.setItem('location', JSON.stringify(currentLoc));
      } else {
        const isWithInBounds = checkWithinMapBounds(
          currentLoc,
          JSON.parse(bounds as string)
        );

        if (isWithInBounds.isWithinBounds === false) {
          await scheduleNotification({
            title: 'You are out of range.',
            body: 'Download the map of your current location to ensure offline access.'
          });

          ToastAndroid.show(isWithInBounds.message, ToastAndroid.SHORT);
        }
      }

      const isConnected = await isOnline();

      if (!isConnected) {
        ToastAndroid.show('No Internet Connection', ToastAndroid.SHORT);
        return;
      }

      await getReports();

      let evidenceUrlArray =
        // @ts-expect-error ERROR: MMKV type error
        JSON.parse(zustandStorage.getItem('evidenceObjects') || '[]');

      if (evidenceUrlArray.length === 0) {
        zustandStorage.setItem('evidenceObjects', '[]');
      }

      const evidences = await checkForEvidences();

      if (evidences.length === 0) {
        console.log('No evidence found');
        return;
      }

      const { data, error } = await supabase.storage
        .from('evidences')
        .list(userId as string, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(error);
        return;
      }

      const filteredEvidences = evidences.filter(
        (evidence) => !data.some((file) => file.name === evidence.name)
      );

      if (filteredEvidences.length === 0) {
        console.log('No new evidence found');
        return;
      }

      await scheduleNotification({
        title: `Found ${filteredEvidences.length} new evidences`,
        body: 'These files will be sent to our servers for backup in case of any issues.'
      });

      async function uploadFilteredEvidences() {
        for (const evidence of filteredEvidences) {
          try {
            await uploadEvidence(
              evidence.uri,
              evidence.name,
              evidence.modificationTime,
              userId as string
            );
          } catch (error) {
            console.log('Error uploading evidence:', error);
          }
        }

        ToastAndroid.show('All Evidences Uploaded', ToastAndroid.SHORT);
      }

      uploadFilteredEvidences();
    }

    initialCheck();
  }, [hasAllPermissions]);

  useEffect(() => {
    isSafeRef.current = isSafe;
  }, [isSafe]);

  useEffect(() => {
    if (!hasAllPermissions) return;

    startTimer(CONSTANTS.TIMER_INTERVAL);

    return () => {
      clearInterval(timerRef.current as NodeJS.Timeout);

      if (isRecording) {
        stopRecording().catch(console.error);
      }
    };
  }, [hasAllPermissions]);

  useEffect(() => {
    if (!hasAllPermissions) return;

    let watchId: Location.LocationSubscription | null = null;

    const setupLocationTracking = async () => {
      watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 30000,
          distanceInterval: 50
        },
        async (newLocation: Location.LocationObject) => {
          const latitude = newLocation.coords.latitude;
          const longitude = newLocation.coords.longitude;

          if (
            isInDangerZone(
              [longitude, latitude],
              CONSTANTS.DANGER_ZONE_RANGE,
              CONSTANTS.DANGER_ZONES
            )
          ) {
            await scheduleNotification({
              title: 'Danger Zone',
              body: 'You are in the danger zone'
            });
          } else if (
            isInDangerZone(
              [longitude, latitude],
              CONSTANTS.WARNING_ZONE_RANGE,
              CONSTANTS.WARNING_ZONES
            )
          ) {
            await scheduleNotification({
              title: 'Warning Zone',
              body: 'You are in the warning zone'
            });
          }

          locationRef.current = { latitude, longitude };
          setLocation({ latitude, longitude });
        }
      );
    };

    setupLocationTracking();

    return () => {
      if (watchId) {
        watchId.remove();
      }
    };
  }, [hasAllPermissions]);

  const handleShake = useCallback(() => {
    console.log('Shake detected');
    sendSms(
      '9868366334',
      'Help! I am in an emergency situation. Call me immediately. My current location is https://google.com/maps/search/?api=1&query=28.6139,77.2090'
    );
    makePhoneCall('9868366334');
  }, []);

  useEffect(() => {
    const subscription = RNShake.addListener(() => {
      handleShake();
    });

    return () => {
      subscription.remove();
    };
  }, [handleShake]);

  function startTimer(time: number) {
    clearInterval(timerRef.current as NodeJS.Timeout);
    clearInterval(smsIntervalRef.current as NodeJS.Timeout);

    if (isSOSActive === true || !hasAllPermissions) return;

    setIsSafe(false);
    setTimeRemaining(time);

    timerRef.current = setInterval(async () => {
      const currentTime = useTimerStore.getState().timeRemaining;

      if (currentTime <= 0) {
        clearInterval(timerRef.current as NodeJS.Timeout);

        ToastAndroid.show('SOS Activated', ToastAndroid.SHORT);
        startRecording().catch(console.error);
        await sendHelpSms();
      } else {
        setTimeRemaining(currentTime - 1);
        if (currentTime % 2 === 0) {
          Vibration.vibrate(1000);
        }
      }
    }, 1000);

    smsIntervalRef.current = setInterval(async () => {
      if (isSafeRef.current) {
        clearInterval(smsIntervalRef.current as NodeJS.Timeout);
      } else {
        await sendHelpSms();
      }
    }, 30000);

    smsIntervalRef.current = setInterval(async () => {
      if (isSafeRef.current) {
        clearInterval(smsIntervalRef.current as NodeJS.Timeout);
      } else {
        const contact = '9868366334';
        const response = await sendSms(
          contact,
          `Help! POLICE! I am in an emergency situation. Call me immediately. My current location is https://google.com/maps/search/?api=1&query=${locationRef?.current?.latitude},${locationRef?.current?.longitude}`
        );
        console.log(response, contact, 'HELP POLICE');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }, 40000);

    smsIntervalRef.current = setTimeout(() => {
      makePhoneCall('9868366334');
    }, 45000);
  }

  function stopTimer() {
    clearInterval(timerRef.current as NodeJS.Timeout);

    setIsSafe(true);
    setTimeRemaining(0);
    zustandStorage.setItem('isSOSActive', JSON.stringify(false));
  }

  async function verifyOtp() {
    const pin = pinValue.trim();

    if (pin.length !== 4 || pin !== userPin) {
      Vibration.vibrate(100);
      // @ts-expect-error ERROR: ref type error
      pinRef.current.clear();
      setPinValue('');
      ToastAndroid.show('Incorrect PIN', ToastAndroid.SHORT);
      return;
    }

    Vibration.vibrate(500);
    // @ts-expect-error ERROR: ref type error
    pinRef.current.clear();
    setPinValue('');

    if (isSafe) {
      startTimer(CONSTANTS.TIMER_INTERVAL);
      ToastAndroid.show('Activating SOS', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('SOS Cancelled', ToastAndroid.SHORT);
      stopTimer();
      await stopRecording();
      await sendOkSms();
    }
  }

  async function startRecording() {
    console.log('Started Recording');

    try {
      if (!camera.current || isRecording) return;

      zustandStorage.setItem('isSOSActive', JSON.stringify(true));

      await scheduleNotification({
        title: 'Started recording evidence',
        body: 'All your recordings are securely stored on your device and will be sent to our servers for backup in case of any issues.'
      });

      setIsRecording(true);

      camera.current.startRecording({
        onRecordingFinished: async (video) => {
          setIsRecording(false);

          const filename = `${new Date().getTime()}_${
            locationRef.current?.longitude
          }_${locationRef.current?.latitude}.mov`;

          const result = await saveEvidence(video.path, filename);

          if (result.success) {
            ToastAndroid.show(
              'Recording Saved Successfully',
              ToastAndroid.SHORT
            );
          } else {
            console.error('Save failed:', result.error);
          }
        },
        onRecordingError: (error) => {
          setIsRecording(false);
        }
      });
    } catch (error) {
      setIsRecording(false);
      console.error('Failed to start recording:', error);
    }
  }

  async function stopRecording() {
    console.log('Stopping Recording');

    try {
      if (!camera.current || !isRecording) return;

      await camera.current.stopRecording();
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  }

  async function sendHelpSms() {
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const response = await sendSms(
        contact,
        `Help! I am in an emergency situation. Call me immediately. My current location is https://google.com/maps/search/?api=1&query=${locationRef?.current?.latitude},${locationRef?.current?.longitude}`
      );
      console.log(response, contact, 'HELP');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async function sendOkSms() {
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const response = await sendSms(
        contact,
        `I am safe now you can be relieved. Call me if you can to make sure I'm Okay. My latest location is https://google.com/maps/search/?api=1&query=${locationRef?.current?.latitude},${locationRef?.current?.longitude}`
      );
      console.log(response, contact, 'OK');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async function requestPermission(permission: Permission) {
    await request(permission);
  }

  if (!hasAllPermissions) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          padding: 10
        }}
      >
        <AnimatedView
          entering={FadeIn.duration(1000)}
          style={{
            flex: 1,
            gap: 10
          }}
        >
          <Pressable
            style={{
              paddingVertical: theme.padding.verticalButton,
              paddingHorizontal: theme.padding.horizontalButton,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: theme.colors.blue
            }}
            android_ripple={{
              color: theme.colors.androidRipple
            }}
            onPress={async () => {
              await Notifications.requestPermissionsAsync();
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontFamily: 'BoldBodyTextFont'
              }}
            >
              Enable Notifications
            </Text>
          </Pressable>
          <Pressable
            style={{
              paddingVertical: theme.padding.verticalButton,
              paddingHorizontal: theme.padding.horizontalButton,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: theme.colors.orange
            }}
            android_ripple={{
              color: theme.colors.androidRipple
            }}
            onPress={async () => {
              await requestPermission(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
              await requestPermission(
                PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION
              );
              await requestPermission(
                PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
              );
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontFamily: 'BoldBodyTextFont'
              }}
            >
              Enable Location Permissions
            </Text>
          </Pressable>
          <Pressable
            style={{
              paddingVertical: theme.padding.verticalButton,
              paddingHorizontal: theme.padding.horizontalButton,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: theme.colors.purple
            }}
            android_ripple={{
              color: theme.colors.androidRipple
            }}
            onPress={async () => {
              await requestPermission(PERMISSIONS.ANDROID.CAMERA);
              await requestPermission(PERMISSIONS.ANDROID.RECORD_AUDIO);
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontFamily: 'BoldBodyTextFont'
              }}
            >
              Enable Camera Permissions
            </Text>
          </Pressable>
          <Pressable
            style={{
              paddingVertical: theme.padding.verticalButton,
              paddingHorizontal: theme.padding.horizontalButton,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: theme.colors.pink
            }}
            android_ripple={{
              color: theme.colors.androidRipple
            }}
            onPress={async () => {
              await requestPermission(PERMISSIONS.ANDROID.SEND_SMS);
              await requestPermission(PERMISSIONS.ANDROID.CALL_PHONE);
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontFamily: 'BoldBodyTextFont'
              }}
            >
              Enable Sms/Call Permissions
            </Text>
          </Pressable>
          <Pressable
            style={{
              paddingVertical: theme.padding.verticalButton,
              paddingHorizontal: theme.padding.horizontalButton,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: theme.colors.green
            }}
            android_ripple={{
              color: theme.colors.androidRipple
            }}
            onPress={async () => {
              await requestPermission(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
              await requestPermission(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
              await requestPermission(PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES);
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontFamily: 'BoldBodyTextFont'
              }}
            >
              Enable Bluetooth Permissions
            </Text>
          </Pressable>
          <Pressable
            style={{
              paddingVertical: theme.padding.verticalButton,
              paddingHorizontal: theme.padding.horizontalButton,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: theme.colors.red
            }}
            android_ripple={{
              color: theme.colors.androidRipple
            }}
            onPress={async () => {
              await requestPermission(
                PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
              );
              await requestPermission(
                PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
              );

              await MediaLibrary.requestPermissionsAsync();
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontFamily: 'BoldBodyTextFont'
              }}
            >
              Enable File Permissions
            </Text>
          </Pressable>

          <Pressable
            style={{
              paddingVertical: theme.padding.verticalButton,
              paddingHorizontal: theme.padding.horizontalButton,
              borderRadius: theme.borderRadius.rounded,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: theme.colors.whiteColor,
              marginTop: 20
            }}
            android_ripple={{
              color: theme.colors.androidRipple
            }}
            onPress={() => {
              RNRestart.restart();
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontFamily: 'BoldBodyTextFont'
              }}
              isBlack={true}
            >
              Restart Application
            </Text>
          </Pressable>
        </AnimatedView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background
        }}
      >
        <AnimatedView entering={FadeIn.duration(1000)} style={styles.container}>
          <Text
            style={{
              fontSize: theme.fontSize.lg + 10,
              fontFamily: 'HeadingFont',
              textAlign: 'center'
            }}
          >
            {isSOSActive && timeRemaining == 0
              ? 'Shake To Request Help'
              : isSafe
              ? 'Enter pin to activate'
              : 'Seek A Safer Place'}
          </Text>
          <Text
            style={{
              textAlign: 'center',
              borderBottomWidth: 3,
              borderColor: isSafe ? theme.colors.green : theme.colors.red,
              fontSize: theme.fontSize.lg,
              marginTop: 2,
              marginBottom: 35
            }}
          >
            {isSOSActive && timeRemaining == 0
              ? 'Help is on the way'
              : isSafe
              ? 'You are in safe mode'
              : 'Activating SOS'}
          </Text>

          <LinearGradient
            colors={
              isSafe ? [theme.colors.green, 'green'] : [theme.colors.red, 'red']
            }
            style={styles.timerView}
          >
            {isSOSActive && timeRemaining === 0 ? (
              <Danger fill={theme.colors.whiteColor} width={150} height={150} />
            ) : isSafe ? (
              <AidFill
                fill={theme.colors.whiteColor}
                width={150}
                height={150}
              />
            ) : (
              <Text style={styles.timerText}>
                {timeRemaining > 9 ? timeRemaining : `0${timeRemaining}`}
              </Text>
            )}
          </LinearGradient>

          <View style={styles.otpView}>
            <OtpInput
              numberOfDigits={4}
              onTextChange={setPinValue}
              ref={pinRef}
              focusColor={isSafe ? theme.colors.green : theme.colors.red}
              secureTextEntry={true}
              theme={{
                containerStyle: styles.otpContainer,
                pinCodeContainerStyle: {
                  width: 60,
                  borderRadius: theme.borderRadius.default,
                  borderColor: isSafe ? theme.colors.green : theme.colors.red
                },
                pinCodeTextStyle: {
                  color: isSafe ? theme.colors.green : theme.colors.red
                }
              }}
              autoFocus={false}
            />

            <LinearGradient
              colors={
                isSafe
                  ? [theme.colors.green, 'green']
                  : [theme.colors.red, 'red']
              }
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
                  {isSafe ? `Help! I'm in danger` : `I'm safe now`}
                </Text>
              </Pressable>
            </LinearGradient>
          </View>

          {!isSafe && timeRemaining <= 2 && (
            <Camera
              // @ts-expect-error ERROR: vision-camera type error
              device={device}
              isActive={true}
              video={true}
              audio={true}
              lowLightBoost={device?.supportsLowLightBoost}
              enableLocation={true}
              ref={camera}
              enableBufferCompression={true}
              fps={15}
              format={format}
            />
          )}
        </AnimatedView>
      </View>
    </KeyboardAvoidingView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 300
  },
  infoContainer: {
    paddingBottom: 30
  },
  timerView: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.rounded
  },
  timerText: {
    fontSize: theme.fontSize.xxl + 90,
    fontFamily: 'HeadingFont'
  },
  otpView: {
    position: 'absolute',
    flexDirection: 'column',
    gap: 25,
    marginVertical: 10,
    bottom: 100
  },
  otpContainer: {
    width: '80%',
    gap: 25,
    flexDirection: 'row'
  }
}));

export default Index;
