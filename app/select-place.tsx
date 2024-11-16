import React, { useEffect, useRef, useState } from 'react';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { feature, featureCollection } from '@turf/helpers';
import PinIcon from '@/assets/images/pin.png';
import { Stack, useRouter } from 'expo-router';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider
} from '@gorhom/bottom-sheet';
import Text from '@/components/Text';
import { Pressable, ToastAndroid, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import getCurrentLocation from '@/utils/getCurrentLocation';
import useSelectedLocationStore from '@/utils/useSelectedLocationStore';
import { CONSTANTS } from '@/utils/CONSTANTS';

MapLibreGL.setAccessToken(null);

function SelectPlace() {
  const { styles, theme } = useStyles(stylesheet);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const setSelectedLocation = useSelectedLocationStore(
    (state) => state.setSelectedLocation
  );
  const router = useRouter();

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    MapLibreGL.locationManager.start();

    return () => {
      MapLibreGL.locationManager.stop();
    };
  }, []);

  async function handlePress(e: any) {
    const aPoint = feature(e.geometry);
    aPoint.id = `${Date.now()}`;

    setSelectedPoint(aPoint);
  }

  async function handleSubmit(type: string) {
    let location = null;

    if (type === 'current') {
      location = await getCurrentLocation();
    } else {
      if (selectedPoint === null) {
        ToastAndroid.show('Select A Location', ToastAndroid.SHORT);
        Vibration.vibrate(100);
        return;
      }
      location = selectedPoint.geometry.coordinates;
    }

    setSelectedLocation(location);

    router.back();
  }

  return (
    <BottomSheetModalProvider>
      <Stack.Screen
        options={{
          title: 'Select the incident point',
          headerTitleAlign: 'center',
          statusBarStyle: 'light',
          headerStyle: {
            backgroundColor: theme.colors.red
          },
          headerLeft: () => <></>,
          headerTitleStyle: {
            color: theme.colors.whiteColor,
            fontFamily: 'HeadingFont',
            fontSize: theme.fontSize.lg + 5
          }
        }}
      />

      <BottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose={false}>
        <BottomSheetView
          style={{
            paddingBottom: 10,
            paddingHorizontal: 10,
            gap: 10
          }}
        >
          <LinearGradient
            colors={[theme.colors.blue, theme.colors.purple]}
            style={{
              borderRadius: theme.borderRadius.default,
              width: '100%'
            }}
          >
            <Pressable
              style={{
                paddingVertical: theme.padding.verticalButton,
                paddingHorizontal: theme.padding.horizontalButton,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10
              }}
              android_ripple={{
                color: theme.colors.androidRipple
              }}
              onPress={() => handleSubmit('current')}
            >
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontFamily: 'BoldBodyTextFont'
                }}
              >
                Submit Current Location
              </Text>
            </Pressable>
          </LinearGradient>

          <LinearGradient
            colors={[theme.colors.orange, theme.colors.red]}
            style={{
              borderRadius: theme.borderRadius.default,
              width: '100%',
              opacity: selectedPoint === null ? 0.5 : 1
            }}
          >
            <Pressable
              style={{
                paddingVertical: theme.padding.verticalButton,
                paddingHorizontal: theme.padding.horizontalButton,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10
              }}
              android_ripple={{
                color: theme.colors.androidRipple
              }}
              onPress={() => handleSubmit('selected')}
            >
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontFamily: 'BoldBodyTextFont'
                }}
              >
                {selectedPoint === null
                  ? 'Select Incident Location'
                  : 'Submit Selected Location'}
              </Text>
            </Pressable>
          </LinearGradient>
        </BottomSheetView>
      </BottomSheetModal>
      <MapLibreGL.MapView
        style={styles.container}
        attributionEnabled={false}
        onPress={handlePress}
        styleURL={CONSTANTS.MAP_STYLE_URL}
      >
        <MapLibreGL.Camera
          followUserLocation={true}
          zoomLevel={12}
          followPitch={45}
        />

        <MapLibreGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          androidRenderMode="gps"
          renderMode="native"
        />

        {selectedPoint && (
          <MapLibreGL.ShapeSource
            id="symbolLocationSource"
            hitbox={{ width: 20, height: 20 }}
            shape={featureCollection([selectedPoint])}
          >
            <MapLibreGL.SymbolLayer
              id="symbolLocationSymbols"
              minZoomLevel={1}
              style={{
                iconImage: PinIcon,
                iconAllowOverlap: true
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
        <MapLibreGL.UserLocation />
      </MapLibreGL.MapView>
    </BottomSheetModalProvider>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1
  }
}));

export default SelectPlace;
