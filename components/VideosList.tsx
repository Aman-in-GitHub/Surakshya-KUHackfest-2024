import { Pressable, ToastAndroid, Vibration, View } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import Text from '@/components/Text';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import NoFiles from '@/assets/images/no-files.svg';
import zustandStorage from '@/storage/storage';
import { WebView } from 'react-native-webview';
import { FlashList } from '@shopify/flash-list';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import daysBetween from '@/utils/daysBetween';
import * as Linking from 'expo-linking';
import supabase from '@/storage/supabase';

function renderVideo(
  item: any,
  theme: any,
  handlePresentModalPress: () => void,
  setSelectedVideo: any
) {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #222222;
        }
        video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <video controls playsinline>
        <source src="${item.uri}" type="video/mp4">
        Your browser does not support the video tag.
    </video>
</body>
</html>`;

  return (
    <Pressable
      style={{
        padding: 10,
        backgroundColor: '#222222',
        borderRadius: theme.borderRadius.default
      }}
      android_ripple={{
        color: theme.colors.androidRipple
      }}
      onLongPress={() => {
        handlePresentModalPress();
        setSelectedVideo(item);
      }}
    >
      <WebView
        style={{
          width: '100%',
          height: 200,
          borderRadius: theme.borderRadius.default
        }}
        source={{ html: htmlContent }}
        allowsLinkPreview={true}
      />
      <View
        style={{
          gap: 5,
          marginTop: 10
        }}
      >
        <Text isBold={true} style={{ fontSize: theme.fontSize.lg }}>
          {item.name}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Text>
            {daysBetween(Date.now(), item.date) === 0
              ? 'Today'
              : daysBetween(Date.now(), item.date) === 1
              ? '1 day ago'
              : `${daysBetween(Date.now(), item.date)} days ago`}
          </Text>
          <Pressable
            onPress={() => {
              const [timestamp, long, latWithExt] = item.name.split('_');
              const lat = latWithExt.split('.')[0];
              const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
              Linking.openURL(url);
            }}
          >
            <Text
              style={{
                textDecorationLine: 'underline'
              }}
            >
              {item.name.split('_').slice(1, 3)[0] +
                ' | ' +
                item.name.split('_').slice(1, 3)[1].replace('.mov', '')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function VideosList() {
  const { styles, theme } = useStyles(stylesheet);
  const [videos, setVideos] = useState<any>(
    JSON.parse(
      // @ts-expect-error ERROR: MMKV type error
      zustandStorage.getItem('evidenceObjects') || '[]'
    )
  );
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>();

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  async function deleteVideo(name: string) {
    const newArr = videos.filter((video: any) => video.name !== name);
    zustandStorage.setItem('evidenceObjects', JSON.stringify(newArr));
    setVideos(newArr);
    setSelectedVideo(null);

    const userId = zustandStorage.getItem('userId');

    const { error } = await supabase.storage
      .from('evidences')
      .remove([`${userId}/${name}`]);

    if (error) {
      console.error(error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      return () => bottomSheetModalRef.current?.close();
    }, [])
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  if (videos.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 150
        }}
      >
        <NoFiles width={350} height={350} />

        <Text
          style={{
            fontFamily: 'HeadingFont',
            fontSize: theme.fontSize.lg + 3,
            textDecorationLine: 'underline',
            marginTop: -50
          }}
        >
          No Evidences Found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={videos}
        renderItem={({ item }) =>
          renderVideo(item, theme, handlePresentModalPress, setSelectedVideo)
        }
        estimatedItemSize={200}
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
      />

      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView
            style={{
              paddingBottom: 10,
              paddingHorizontal: 10,
              gap: 10
            }}
          >
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
                onPress={() => {
                  deleteVideo(selectedVideo.name);
                  bottomSheetModalRef.current?.dismiss();
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.lg,
                    fontFamily: 'BoldBodyTextFont'
                  }}
                >
                  Delete Evidence
                </Text>
              </Pressable>
            </LinearGradient>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    padding: 10,
    marginBottom: 95
  }
}));

export default VideosList;
