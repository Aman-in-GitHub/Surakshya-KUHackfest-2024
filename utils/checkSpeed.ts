import { CONSTANTS } from '@/utils/CONSTANTS';
import * as Location from 'expo-location';

async function checkSpeed(distanceInMeters: number) {
  const distanceInKm = distanceInMeters / 1000;

  let location = await Location.getCurrentPositionAsync({});
  const vehicleSpeed = CONSTANTS.VEHICLE_SPEED;
  const walkingSpeed = CONSTANTS.WALKING_SPEED;

  const currentSpeedInMetersPerSecond = location.coords.speed;
  const currentSpeedKmHr = (currentSpeedInMetersPerSecond as number) * 3.6;

  const vehicleSpeedKmMin = vehicleSpeed / 60;
  const walkingSpeedKmMin = walkingSpeed / 60;
  const currentSpeedKmMin = currentSpeedKmHr / 60;

  const timeByVehicle = (distanceInKm / vehicleSpeedKmMin).toFixed(2);
  const timeByWalking = (distanceInKm / walkingSpeedKmMin).toFixed(2);
  const timeByCurrentSpeed =
    currentSpeedKmMin > 0
      ? (distanceInKm / currentSpeedKmMin).toFixed(2)
      : '0.00';

  return {
    vehicle: timeByVehicle,
    walking: timeByWalking,
    currentSpeed:
      Number(timeByCurrentSpeed) > 1000000 ? 'Infinity' : timeByCurrentSpeed
  };
}

export default checkSpeed;
