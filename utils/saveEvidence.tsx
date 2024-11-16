import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import isOnline from '@/utils/isOnline';
import uploadEvidence from '@/utils/uploadEvidence';
import zustandStorage from '@/storage/storage';

type SaveResultType = {
  path: string;
  album: {};
  success: boolean;
  error?: string;
};

async function saveEvidence(
  sourcePath: string,
  fileName: string
): Promise<SaveResultType> {
  try {
    const normalizedSourcePath = sourcePath.startsWith('file://')
      ? sourcePath
      : `file://${sourcePath}`;

    const newPath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.copyAsync({
      from: normalizedSourcePath,
      to: newPath
    });

    const asset = await MediaLibrary.createAssetAsync(newPath);
    const album = await MediaLibrary.createAlbumAsync('Evidences', asset);

    const isConnected = await isOnline();

    if (isConnected) {
      const userId = zustandStorage.getItem('userId');

      await uploadEvidence(asset.uri, fileName, Date.now(), userId as string);
    }

    return {
      path: asset.uri,
      album: album,
      success: true
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error saving file:', errorMessage);

    return {
      path: '',
      success: false,
      album: {},
      error: errorMessage
    };
  }
}

export default saveEvidence;
