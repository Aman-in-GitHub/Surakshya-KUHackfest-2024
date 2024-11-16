import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  check,
  PERMISSIONS,
  RESULTS,
  Permission
} from 'react-native-permissions';

type RequiredPermissions = Permission[];

const REQUIRED_PERMISSIONS: RequiredPermissions = [
  PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
  PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
  PERMISSIONS.ANDROID.CAMERA,
  PERMISSIONS.ANDROID.RECORD_AUDIO,
  PERMISSIONS.ANDROID.SEND_SMS,
  PERMISSIONS.ANDROID.CALL_PHONE,
  PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES
];

function usePermissions(): boolean {
  const [hasAllPermissions, setHasAllPermissions] = useState(false);

  const checkPermissions = async (): Promise<void> => {
    if (Platform.OS !== 'android') {
      setHasAllPermissions(false);
      return;
    }

    try {
      const statuses = await Promise.all(
        REQUIRED_PERMISSIONS.map((permission) => check(permission))
      );

      const allGranted = statuses.every((status) => status === RESULTS.GRANTED);
      setHasAllPermissions(allGranted);
    } catch (error) {
      setHasAllPermissions(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return hasAllPermissions;
}

export default usePermissions;
