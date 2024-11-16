import { Pressable, ToastAndroid, Vibration, View } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { feature, featureCollection } from '@turf/helpers';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '@/components/Text';
import { Link, useRouter } from 'expo-router';
import LeftArrow from '@/assets/icons/LeftArrow.svg';
import { CONSTANTS } from '@/utils/CONSTANTS';
import HomeIcon from '@/assets/images/home.png';
import OfficeIcon from '@/assets/images/office.png';
import PinIcon from '@/assets/images/pin.png';
import MapDirections from '@/components/MapDirections';
import circle from '@turf/circle';
import isInDangerZone from '@/utils/isInDangerZone';
import useNotifications from '@/utils/useNotifications';
import POLICE_STATIONS from '@/assets/stations.json';
import PoliceIcon from '@/assets/images/police.png';
import HOSPITALS from '@/assets/hospitals.json';
import HospitalIcon from '@/assets/images/hospital.png';

MapLibreGL.setAccessToken(null);

const AnimatedView = Animated.createAnimatedComponent(View);

const lineStyle = {
  homeLayer: {
    lineColor: 'transparent',
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth: 5
  },
  officeLayer: {
    lineColor: 'transparent',
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth: 5
  }
};

function Map() {
  const { styles, theme } = useStyles(stylesheet);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const [hasOfflineMaps, setHasOfflineMaps] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [isNavigation, setIsNavigation] = useState(false);
  const { scheduleNotification } = useNotifications();
  const [policeStations, setPoliceStations] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [navigateTo, setNavigateTo] = useState<any>(null);

  useEffect(() => {
    let stations: any[] = [];

    POLICE_STATIONS.features.forEach((feature) => {
      if (
        !feature.properties.name ||
        feature.geometry.coordinates.length === 0
      ) {
        return;
      }
      const name = feature.properties.name;
      let firstCoord;

      if (feature.geometry.type === 'Point') {
        firstCoord = feature.geometry.coordinates;
      } else if (feature.geometry.type === 'Polygon') {
        // @ts-expect-error ERROR: My type error
        firstCoord = feature.geometry.coordinates[0][0];
      }

      stations.push({
        name,
        coordinates: firstCoord
      });
    });

    setPoliceStations(stations);

    let hospitals: any[] = [];

    HOSPITALS.features.forEach((feature) => {
      if (
        !feature.properties.name ||
        feature.geometry.coordinates.length === 0
      ) {
        return;
      }
      const name = feature.properties.name;
      let firstCoord;

      if (feature.geometry.type === 'Point') {
        firstCoord = feature.geometry.coordinates;
      } else if (feature.geometry.type === 'Polygon') {
        // @ts-expect-error ERROR: My type error
        firstCoord = feature.geometry.coordinates[0][0];
      }

      hospitals.push({
        name,
        coordinates: firstCoord
      });
    });

    setHospitals(hospitals);

    async function getHasOfflineMaps() {
      const offlineMaps = await MapLibreGL.offlineManager.getPacks();
      setHasOfflineMaps(offlineMaps.length > 0);
    }

    getHasOfflineMaps();

    bottomSheetModalRef.current?.present();
  }, [isNavigation]);

  const onUserLocationUpdate = useCallback((location: any) => {
    // console.log('Location update:', location);

    if (location && location.coords) {
      setUserLocation(location.coords);
    }
  }, []);

  async function handlePress(e: any) {
    const aPoint = feature(e.geometry);
    aPoint.id = `${Date.now()}`;

    const coords = aPoint.geometry.coordinates;

    if (
      isInDangerZone(
        [coords[0], coords[1]],
        CONSTANTS.DANGER_ZONE_RANGE,
        CONSTANTS.DANGER_ZONES
      )
    ) {
      await scheduleNotification({
        title: 'Danger Zone',
        body: 'Your selected location is in the danger zone'
      });

      return;
    } else if (
      isInDangerZone(
        [coords[0], coords[1]],
        CONSTANTS.WARNING_ZONE_RANGE,
        CONSTANTS.WARNING_ZONES
      )
    ) {
      await scheduleNotification({
        title: 'Warning Zone',
        body: 'Your selected location is in the warning zone'
      });
    }

    setSelectedPoint(aPoint);
  }

  if (isNavigation) {
    return (
      <MapDirections
        isNavigation={isNavigation}
        setIsNavigation={setIsNavigation}
        navigateTo={navigateTo}
      />
    );
  }

  return (
    <BottomSheetModalProvider>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background
        }}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => {
            router.back();
          }}
          android_ripple={{
            color: theme.colors.androidRipple
          }}
        >
          <LeftArrow fill={theme.colors.whiteColor} width={36} height={36} />
        </Pressable>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          enablePanDownToClose={false}
        >
          <BottomSheetView
            style={{
              paddingBottom: 10,
              paddingHorizontal: 10,
              gap: 10
            }}
          >
            {selectedPoint && (
              <Pressable
                onPress={() => {
                  setNavigateTo(selectedPoint.geometry.coordinates);
                  setIsNavigation(true);
                  ToastAndroid.show(
                    `Navigating to ${
                      selectedPoint.geometry.coordinates[0].toFixed(3) +
                      ',' +
                      selectedPoint.geometry.coordinates[1].toFixed(3)
                    }`,
                    ToastAndroid.SHORT
                  );
                }}
              >
                <Text
                  isBlack={true}
                  style={{
                    fontSize: theme.fontSize.lg,
                    fontFamily: 'BoldBodyTextFont',
                    textAlign: 'center',
                    textDecorationLine: 'underline'
                  }}
                >
                  Navigate to{' '}
                  {selectedPoint.geometry.coordinates[0].toFixed(3) +
                    ',' +
                    selectedPoint.geometry.coordinates[1].toFixed(3)}
                </Text>
              </Pressable>
            )}

            <LinearGradient
              colors={[theme.colors.red, theme.colors.blue]}
              style={{
                borderRadius: theme.borderRadius.default,
                width: '100%'
              }}
            >
              <Link href="/download-map" asChild>
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
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.lg,
                      fontFamily: 'BoldBodyTextFont'
                    }}
                  >
                    {hasOfflineMaps
                      ? 'Change Map Area'
                      : 'Download Offline Map'}
                  </Text>
                </Pressable>
              </Link>
            </LinearGradient>
          </BottomSheetView>
        </BottomSheetModal>

        <AnimatedView entering={FadeIn.duration(1000)} style={styles.container}>
          <MapLibreGL.MapView
            style={styles.container}
            attributionEnabled={false}
            styleURL={CONSTANTS.MAP_STYLE_URL}
            onPress={handlePress}
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
              onUpdate={onUserLocationUpdate}
            />

            {policeStations.length > 0 &&
              policeStations.map((station, index) => (
                <MapLibreGL.ShapeSource
                  key={`police-station-${index}`}
                  id={`policeStationSource-${index}`}
                  onPress={() => {
                    Vibration.vibrate(100);
                    setNavigateTo(station.coordinates);
                    setIsNavigation(true);
                    ToastAndroid.show(
                      `Navigating to ${station.name}`,
                      ToastAndroid.SHORT
                    );
                  }}
                  shape={featureCollection([
                    {
                      geometry: {
                        coordinates: station.coordinates,
                        type: 'Point'
                      },
                      id: `policeStation-${index}`,
                      properties: {},
                      type: 'Feature'
                    }
                  ])}
                >
                  <MapLibreGL.SymbolLayer
                    id={`policeStationSymbols-${index}`}
                    minZoomLevel={1}
                    style={{
                      iconImage: PoliceIcon,
                      iconAllowOverlap: true,
                      iconSize: 0.6
                    }}
                  />
                </MapLibreGL.ShapeSource>
              ))}

            {hospitals.length > 0 &&
              hospitals.map((station, index) => (
                <MapLibreGL.ShapeSource
                  key={`hospital-${index}`}
                  id={`hospitalSource-${index}`}
                  onPress={() => {
                    Vibration.vibrate(100);
                    setNavigateTo(station.coordinates);
                    setIsNavigation(true);
                    ToastAndroid.show(
                      `Navigating to ${station.name}`,
                      ToastAndroid.SHORT
                    );
                  }}
                  shape={featureCollection([
                    {
                      geometry: {
                        coordinates: station.coordinates,
                        type: 'Point'
                      },
                      id: `hospital-${index}`,
                      properties: {},
                      type: 'Feature'
                    }
                  ])}
                >
                  <MapLibreGL.SymbolLayer
                    id={`hospitalSymbols-${index}`}
                    minZoomLevel={1}
                    style={{
                      iconImage: HospitalIcon,
                      iconAllowOverlap: true,
                      iconSize: 0.6
                    }}
                  />
                </MapLibreGL.ShapeSource>
              ))}

            <MapLibreGL.ShapeSource
              id="homeLocationSource"
              hitbox={{ width: 20, height: 20 }}
              onPress={() => {
                Vibration.vibrate(100);
                setNavigateTo(CONSTANTS.HOME_COORDS);
                setIsNavigation(true);
                ToastAndroid.show('Navigating to Home', ToastAndroid.SHORT);
              }}
              shape={featureCollection([
                {
                  geometry: {
                    coordinates: CONSTANTS.HOME_COORDS,
                    type: 'Point'
                  },
                  id: '123456789002',
                  properties: {},
                  type: 'Feature'
                }
              ])}
            >
              <MapLibreGL.SymbolLayer
                id="homeLocationSymbols"
                minZoomLevel={1}
                aboveLayerID="layer1"
                style={{
                  iconImage: HomeIcon,
                  iconAllowOverlap: true,
                  iconSize: 0.8
                }}
              />
            </MapLibreGL.ShapeSource>

            <MapLibreGL.ShapeSource
              id="officeLocationSource"
              onPress={() => {
                Vibration.vibrate(100);
                setNavigateTo(CONSTANTS.OFFICE_COORDS);
                setIsNavigation(true);
                ToastAndroid.show('Navigating to Office', ToastAndroid.SHORT);
              }}
              hitbox={{ width: 20, height: 20 }}
              shape={featureCollection([
                {
                  geometry: {
                    coordinates: CONSTANTS.OFFICE_COORDS,
                    type: 'Point'
                  },
                  id: '123456789001',
                  properties: {},
                  type: 'Feature'
                }
              ])}
            >
              <MapLibreGL.SymbolLayer
                id="officeLocationSymbols"
                minZoomLevel={1}
                aboveLayerID="layer2"
                style={{
                  iconImage: OfficeIcon,
                  iconAllowOverlap: true,
                  iconSize: 0.8
                }}
              />
            </MapLibreGL.ShapeSource>

            {CONSTANTS.DANGER_ZONES.map((dangerZone, index) => (
              <MapLibreGL.ShapeSource
                key={`danger-circle-${index}`}
                id={`dangerCircleSource-${index}`}
                shape={featureCollection([
                  circle(dangerZone, CONSTANTS.DANGER_ZONE_RANGE, {
                    steps: 64,
                    units: 'kilometers'
                  })
                ])}
              >
                <MapLibreGL.FillLayer
                  id={`dangerCircleFill-${index}`}
                  style={{
                    fillColor: '#e64553',
                    fillOpacity: 0.3
                  }}
                />
                <MapLibreGL.LineLayer
                  id={`dangerCircleOutline-${index}`}
                  style={{
                    lineColor: '#e64553',
                    lineWidth: 3
                  }}
                />
              </MapLibreGL.ShapeSource>
            ))}

            {CONSTANTS.WARNING_ZONES.map((warningZone, index) => (
              <MapLibreGL.ShapeSource
                key={`warning-circle-${index}`}
                id={`warningCircleSource-${index}`}
                shape={featureCollection([
                  circle(warningZone, CONSTANTS.WARNING_ZONE_RANGE, {
                    steps: 64,
                    units: 'kilometers'
                  })
                ])}
              >
                <MapLibreGL.FillLayer
                  id={`warningCircleFill-${index}`}
                  style={{
                    fillColor: '#fab387',
                    fillOpacity: 0.3
                  }}
                />
                <MapLibreGL.LineLayer
                  id={`warningCircleOutline-${index}`}
                  style={{
                    lineColor: '#fab387',
                    lineWidth: 3
                  }}
                />
              </MapLibreGL.ShapeSource>
            ))}

            <MapLibreGL.ShapeSource
              id="source1"
              lineMetrics
              // @ts-expect-error ERROR: My type error
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [userLocation?.longitude, userLocation?.latitude],
                    CONSTANTS.HOME_COORDS
                  ]
                }
              }}
            >
              {/* @ts-expect-error ERROR: My type error  */}
              <MapLibreGL.LineLayer id="layer1" style={lineStyle.homeLayer} />
            </MapLibreGL.ShapeSource>

            <MapLibreGL.ShapeSource
              id="source2"
              lineMetrics
              // @ts-expect-error ERROR: My type error
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [userLocation?.longitude, userLocation?.latitude],
                    CONSTANTS.OFFICE_COORDS
                  ]
                }
              }}
            >
              {/* @ts-expect-error ERROR: My type error  */}
              <MapLibreGL.LineLayer id="layer2" style={lineStyle.officeLayer} />
            </MapLibreGL.ShapeSource>

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
        </AnimatedView>
      </View>
    </BottomSheetModalProvider>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1
  },
  backButton: {
    top: 25,
    left: 15,
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: theme.borderRadius.rounded,
    backgroundColor: '#00000050',
    zIndex: theme.zIndex.outOfTheWorld,
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

export default Map;
