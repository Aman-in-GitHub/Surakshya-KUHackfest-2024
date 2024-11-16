import { Pressable, ToastAndroid, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import WebView from 'react-native-webview';
import getMapHtml from '@/utils/mapHtml';
import { CONSTANTS } from '@/utils/CONSTANTS';
import getCurrentLocation from '@/utils/getCurrentLocation';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import Text from '@/components/Text';
import isOnline from '@/utils/isOnline';
import Walking from '@/assets/icons/Walking.svg';
import Bus from '@/assets/icons/Bus.svg';
import Crosshair from '@/assets/icons/Crosshair.svg';
import CompassOutline from '@/assets/icons/CompassOutline.svg';
import X from '@/assets/icons/X.svg';
import checkSpeed from '@/utils/checkSpeed';

function MapDirections({ isNavigation, setIsNavigation, navigateTo }: any) {
  const { styles, theme } = useStyles(stylesheet);
  const [currentLocation, setCurrentLocation] = useState<number[]>(
    CONSTANTS.CENTER_COORDINATES
  );
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [speeds, setSpeeds] = useState<any>(null);

  function handleWebViewMessage(event: any) {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === 'TOTAL_DISTANCE') {
      console.log('Total Distance:', data.value);
      setTotalDistance(data.value);
    }
  }

  useEffect(() => {
    async function checkIsConnected() {
      const isConnected = await isOnline();

      if (!isConnected) {
        setIsNavigation(false);
        ToastAndroid.show('Navigation Requires Internet', ToastAndroid.SHORT);
      }
    }

    checkIsConnected();

    bottomSheetModalRef.current?.present();
  }, [isNavigation]);

  useEffect(() => {
    async function getLocation() {
      const location = await getCurrentLocation();

      if (location) {
        setCurrentLocation(CONSTANTS.CENTER_COORDINATES);
      } else {
        setCurrentLocation(CONSTANTS.CENTER_COORDINATES);
      }
    }

    getLocation();
  }, []);

  useEffect(() => {
    async function calculateSpeed() {
      const speeds = await checkSpeed(totalDistance);
      setSpeeds(speeds);
    }

    calculateSpeed();
  }, [totalDistance]);

  return (
    <View style={styles.container}>
      <WebView
        source={{
          html: getMapHtml(currentLocation, navigateTo)
        }}
        allowsLinkPreview={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
        onMessage={handleWebViewMessage}
        style={{ height: '90%' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          enablePanDownToClose={false}
        >
          <BottomSheetView
            style={{
              paddingBottom: 10,
              paddingHorizontal: 10
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 5
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: theme.fontSize.lg,
                    fontFamily: 'HeadingFont',
                    textAlign: 'center',
                    textDecorationLine: 'underline',
                    color: theme.colors.green
                  }}
                >
                  DESTINATION
                </Text>

                <View
                  style={{
                    marginTop: 5
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <CompassOutline
                      color={theme.colors.green}
                      height={20}
                      width={20}
                    />
                    <Text isBlack={true}>
                      {totalDistance > 0
                        ? (totalDistance / 1000).toFixed(2) + ' km'
                        : 'Calculating'}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Crosshair
                      color={theme.colors.green}
                      height={20}
                      width={20}
                    />
                    <Text isBlack={true}>
                      {typeof speeds?.currentSpeed === 'number'
                        ? 'Calculating time'
                        : speeds?.currentSpeed + ' mins'}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Walking
                      color={theme.colors.green}
                      height={20}
                      width={20}
                    />
                    <Text isBlack={true}>
                      {typeof speeds?.walking === 'number'
                        ? 'Calculating time'
                        : speeds?.walking + ' mins'}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Bus color={theme.colors.green} height={20} width={20} />
                    <Text isBlack={true}>
                      {typeof speeds?.vehicle === 'number'
                        ? 'Calculating time'
                        : speeds?.vehicle + ' mins'}
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={{
                  paddingVertical: theme.padding.verticalButton,
                  paddingHorizontal: theme.padding.horizontalButton,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  height: 100,
                  width: 160,
                  backgroundColor: theme.colors.red,
                  borderRadius: theme.borderRadius.default,
                  marginTop: 25
                }}
                android_ripple={{
                  color: theme.colors.androidRipple
                }}
                onPress={() => {
                  setIsNavigation(false);
                }}
              >
                <X color={theme.colors.whiteColor} height={65} width={65} />
              </Pressable>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  }
}));

export default MapDirections;
