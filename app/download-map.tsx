import {
  Alert,
  Dimensions,
  Pressable,
  ToastAndroid,
  Vibration,
  View
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Text from '@/components/Text';
import MapLibreGL, {
  OfflinePack,
  OfflinePackError
} from '@maplibre/maplibre-react-native';
import geoViewport from '@mapbox/geo-viewport';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { CONSTANTS } from '@/utils/CONSTANTS';
import getCurrentLocation from '@/utils/getCurrentLocation';
import zustandStorage from '@/storage/storage';

MapLibreGL.setAccessToken(null);

type OfflinePackDownloadState =
  (typeof MapLibreGL.OfflinePackDownloadState)[keyof typeof MapLibreGL.OfflinePackDownloadState];

function getRegionDownloadState(downloadState: OfflinePackDownloadState) {
  switch (downloadState) {
    case MapLibreGL.OfflinePackDownloadState.Active:
      return 'Active';
    case MapLibreGL.OfflinePackDownloadState.Complete:
      return 'Complete';
    case MapLibreGL.OfflinePackDownloadState.Inactive:
      return 'Inactive';
    default:
      return 'UNKNOWN';
  }
}

const MVT_SIZE = 1024;
export const PACK_NAME = 'downloaded_map';

function DownloadMap() {
  const { styles, theme } = useStyles(stylesheet);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const [offlinePack, setOfflinePack] = useState<OfflinePack | null>(null);
  const [userCoords, setCoords] = useState(CONSTANTS.CENTER_COORDINATES);
  const [shouldRun, setShouldRun] = useState(true);
  const [downloadDetails, setDownloadDetails] = useState<any>({
    state: 'Loading status',
    percentage: 'Loading progress',
    completedResourceSize: 'Loading size'
  });

  useEffect(() => {
    async function getLocation() {
      const location = await getCurrentLocation();
      setCoords(location as any);
    }

    getLocation();

    return () => {
      MapLibreGL.offlineManager.unsubscribe(PACK_NAME);
    };
  }, []);

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!shouldRun) {
        clearInterval(interval);
        return;
      }

      const data = await (
        await MapLibreGL.offlineManager.getPack(PACK_NAME)
      )?.status();

      if (!data) return;

      const state = getRegionDownloadState(data.state);
      const percentage = data?.percentage;
      const completedResourceSize = data?.completedResourceSize;

      if (percentage === 100) {
        setShouldRun(false);
      }

      setDownloadDetails({
        state,
        percentage,
        completedResourceSize
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [shouldRun]);

  function onDownloadProgress(pack: OfflinePack) {
    setOfflinePack(pack);
  }

  function onDownloadError(pack: OfflinePack, err: OfflinePackError) {
    console.error('DownloadError', pack, err);
  }

  function createPack() {
    const { width, height } = Dimensions.get('window');

    const viewportBounds = geoViewport.bounds(
      userCoords as any,
      8,
      [width, height],
      MVT_SIZE
    );

    const bounds: [GeoJSON.Position, GeoJSON.Position] = [
      [viewportBounds[0], viewportBounds[1]],
      [viewportBounds[2], viewportBounds[3]]
    ];

    zustandStorage.setItem('bounds', JSON.stringify(bounds));

    const options = {
      name: PACK_NAME,
      styleURL: CONSTANTS.MAP_STYLE_URL,
      bounds,
      minZoom: 8,
      maxZoom: 16
    };

    MapLibreGL.offlineManager.createPack(
      options,
      onDownloadProgress,
      onDownloadError
    );
  }

  async function onDidFinishLoadingStyle() {
    try {
      const pack = await MapLibreGL.offlineManager.getPack(PACK_NAME);

      if (!pack) {
        return;
      }

      setOfflinePack(pack);
    } catch (error) {
      console.error(error);
    }
  }

  async function onDownload() {
    setShouldRun(true);

    console.log('Starting map download');
    ToastAndroid.show('Downloading Map', ToastAndroid.SHORT);

    await onDelete();
    createPack();
  }

  async function onPause() {
    console.log('Pausing map download');
    ToastAndroid.show('Pausing Map Download', ToastAndroid.SHORT);

    await offlinePack?.pause();
  }

  async function onResume() {
    console.log('Starting map resume');
    ToastAndroid.show('Resuming Map Download', ToastAndroid.SHORT);

    await offlinePack?.resume();
  }

  async function onDelete() {
    console.log('Starting map deletion');

    if (!offlinePack) {
      console.log('No map packs to delete');
      return;
    }

    await MapLibreGL.offlineManager.deletePack(PACK_NAME);
    await MapLibreGL.offlineManager.invalidateAmbientCache();
    await MapLibreGL.offlineManager.clearAmbientCache();
    await MapLibreGL.offlineManager.resetDatabase();

    setOfflinePack(null);
    setDownloadDetails(null);
    zustandStorage.removeItem('bounds');

    console.log('Map Deleted');
    ToastAndroid.show('Map Deleted', ToastAndroid.SHORT);
    Vibration.vibrate(500);
  }

  async function onStatusRequest() {
    if (!offlinePack) {
      return;
    }

    const status = await offlinePack.status();

    if (status) {
      Alert.alert('Get Status', JSON.stringify(status, null, 2));
    } else {
      Alert.alert('Get Status', 'Could not get status');
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Download offline map',
          statusBarStyle: 'light',
          headerStyle: {
            backgroundColor: theme.colors.green
          },
          headerLeft: () => <></>,
          headerTintColor: theme.colors.whiteColor,
          headerTitleStyle: {
            color: theme.colors.whiteColor,
            fontFamily: 'HeadingFont',
            fontSize: theme.fontSize.xl
          }
        }}
      />
      <BottomSheetModalProvider>
        <MapLibreGL.MapView
          onDidFinishLoadingMap={onDidFinishLoadingStyle}
          style={styles.container}
          styleURL={CONSTANTS.MAP_STYLE_URL}
        >
          <MapLibreGL.Camera
            followUserLocation={true}
            defaultSettings={{
              zoomLevel: 12,
              centerCoordinate: userCoords as any
            }}
            centerCoordinate={userCoords as any}
          />

          <MapLibreGL.UserLocation
            visible={true}
            showsUserHeadingIndicator={true}
            androidRenderMode="gps"
            renderMode="native"
          />
        </MapLibreGL.MapView>

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
            <View>
              {offlinePack === null && (
                <LinearGradient
                  colors={[theme.colors.blue, theme.colors.green]}
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
                    onPress={onDownload}
                  >
                    <Text
                      style={{
                        fontSize: theme.fontSize.lg,
                        fontFamily: 'BoldBodyTextFont'
                      }}
                    >
                      Start Downloading
                    </Text>
                  </Pressable>
                </LinearGradient>
              )}

              {offlinePack !== null && (
                <>
                  <View
                    style={{
                      marginBottom: 10
                    }}
                  >
                    <Text isBlack={true}>Status: {downloadDetails?.state}</Text>
                    <Text isBlack={true}>
                      Progress:{' '}
                      {typeof downloadDetails?.percentage === 'number'
                        ? downloadDetails?.percentage.toFixed(2) + ' ' + '%'
                        : downloadDetails?.percentage}
                    </Text>
                    <Text isBlack={true}>
                      Map Size:{' '}
                      {typeof downloadDetails?.completedResourceSize ===
                      'number'
                        ? (
                            downloadDetails?.completedResourceSize /
                            1024 /
                            1024
                          ).toFixed(2) +
                          ' ' +
                          'MB'
                        : downloadDetails?.completedResourceSize}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10
                      }}
                    >
                      <Pressable
                        android_ripple={{
                          color: theme.colors.androidRipple
                        }}
                        onPress={onStatusRequest}
                      >
                        <Text
                          isBlack={true}
                          isBold={true}
                          style={{
                            textDecorationLine: 'underline'
                          }}
                        >
                          Check Status
                        </Text>
                      </Pressable>

                      <Pressable
                        android_ripple={{
                          color: theme.colors.androidRipple
                        }}
                        onPress={onPause}
                        disabled={downloadDetails?.percentage === 100}
                      >
                        <Text
                          isBlack={true}
                          isBold={true}
                          style={{
                            textDecorationLine: 'underline',
                            opacity:
                              downloadDetails?.percentage === 100 ? 0.5 : 1
                          }}
                        >
                          Pause
                        </Text>
                      </Pressable>

                      <Pressable
                        android_ripple={{
                          color: theme.colors.androidRipple
                        }}
                        onPress={onResume}
                        disabled={downloadDetails?.percentage === 100}
                      >
                        <Text
                          isBlack={true}
                          isBold={true}
                          style={{
                            textDecorationLine: 'underline',
                            opacity:
                              downloadDetails?.percentage === 100 ? 0.5 : 1
                          }}
                        >
                          Resume
                        </Text>
                      </Pressable>

                      <Pressable
                        android_ripple={{
                          color: theme.colors.androidRipple
                        }}
                        onPress={() => {
                          router.back();
                        }}
                      >
                        <Text
                          isBlack={true}
                          isBold={true}
                          style={{
                            textDecorationLine: 'underline'
                          }}
                        >
                          Go Back
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <View>
                    <LinearGradient
                      colors={[theme.colors.red, 'red']}
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
                        onPress={onDelete}
                      >
                        <Text
                          style={{
                            fontSize: theme.fontSize.lg,
                            fontFamily: 'BoldBodyTextFont'
                          }}
                        >
                          Delete Map
                        </Text>
                      </Pressable>
                    </LinearGradient>
                  </View>
                </>
              )}
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1
  }
}));

export default DownloadMap;
