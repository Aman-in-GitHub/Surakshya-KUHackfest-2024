import * as MediaLibrary from 'expo-media-library';
import { ToastAndroid } from 'react-native';

async function checkForEvidences() {
  try {
    ToastAndroid.show('Checking For Evidences', ToastAndroid.SHORT);

    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.video,
      first: 50
    });

    const videoFiles = assets
      .filter((asset) => {
        return asset.uri.includes('Pictures/Evidences');
      })
      .map((asset) => ({
        name: asset.filename,
        uri: asset.uri,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        modificationTime: asset.modificationTime,
        id: asset.id
      }));

    return videoFiles;
  } catch (error) {
    console.error('Error accessing video files:', error);
    throw error;
  }
}

export default checkForEvidences;
