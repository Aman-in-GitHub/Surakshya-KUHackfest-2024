import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useStyles } from 'react-native-unistyles';
import { BlurView } from 'expo-blur';
import AidFill from '@/assets/icons/AidFill.svg';
import AidOutline from '@/assets/icons/AidOutline.svg';
import CompassFill from '@/assets/icons/CompassFill.svg';
import CompassOutline from '@/assets/icons/CompassOutline.svg';
import WarningFill from '@/assets/icons/WarningFill.svg';
import WarningOutline from '@/assets/icons/WarningOutline.svg';
import VideoFill from '@/assets/icons/VideoFill.svg';
import VideoOutline from '@/assets/icons/VideoOutline.svg';

export default function TabLayout() {
  const { theme } = useStyles();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.activeTintColor,
        tabBarInactiveTintColor: theme.colors.inActiveTintColor,
        headerBackground: () => (
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={10}
            style={{
              ...StyleSheet.absoluteFillObject,
              overflow: 'hidden',
              backgroundColor: theme.colors.background
            }}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          borderRadius: theme.borderRadius.rounded,
          borderTopWidth: 0,
          height: 69,
          width: '90%',
          bottom: 20,
          left: '5%',
          right: '4%'
        },
        tabBarBackground: () => (
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={10}
            style={{
              ...StyleSheet.absoluteFillObject,
              overflow: 'hidden',
              borderRadius: theme.borderRadius.rounded
            }}
          />
        ),
        tabBarShowLabel: false,
        headerTitleStyle: {
          fontFamily: 'HeadingFont',
          color: theme.colors.whiteColor,
          fontSize: theme.fontSize.xxl
        },
        headerStyle: {
          backgroundColor: theme.colors.background
        },
        headerStatusBarHeight: 28
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <AidFill fill={color} width={36} height={36} />
            ) : (
              <AidOutline fill={color} width={36} height={36} />
            )
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Navigation',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <CompassFill fill={color} width={36} height={36} />
            ) : (
              <CompassOutline fill={color} width={36} height={36} />
            ),
          tabBarStyle: {
            display: 'none'
          },
          headerShown: false
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <WarningFill fill={color} width={36} height={36} />
            ) : (
              <WarningOutline fill={color} width={36} height={36} />
            )
        }}
      />

      <Tabs.Screen
        name="videos"
        options={{
          title: 'Evidences',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <VideoFill fill={color} width={36} height={36} />
            ) : (
              <VideoOutline fill={color} width={36} height={36} />
            )
        }}
      />
    </Tabs>
  );
}
