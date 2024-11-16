import * as Location from 'expo-location';

async function getCurrentLocation() {
  try {
    let location = await Location.getCurrentPositionAsync({});

    const long = location.coords.longitude;
    const lat = location.coords.latitude;

    return [long, lat];
  } catch (error) {
    return [];
  }
}

export default getCurrentLocation;
