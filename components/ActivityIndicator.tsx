import {
  BlurMask,
  Canvas,
  Path,
  Skia,
  SweepGradient,
  vec
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

type ActivityIndicatorProps = {
  size: number;
  delayMs?: number;
};

function ActivityIndicator({ size, delayMs = 1000 }: ActivityIndicatorProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const canvasSize = size + 30;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  const circle = useMemo(() => {
    const skPath = Skia.Path.Make();
    skPath.addCircle(canvasSize / 2, canvasSize / 2, radius);
    return skPath;
  }, [canvasSize, radius]);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (shouldShow) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [progress, shouldShow]);

  const rContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${2 * Math.PI * progress.value}rad` }]
    };
  });

  const startPath = useDerivedValue(() => {
    return interpolate(progress.value, [0, 0.5, 1], [0.6, 0.3, 0.6]);
  }, []);

  if (!shouldShow) {
    return null;
  }

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Animated.View
        entering={FadeIn.duration(1000)}
        exiting={FadeOut.duration(1000)}
        style={rContainerStyle}
      >
        <Canvas
          style={{
            width: canvasSize,
            height: canvasSize
          }}
        >
          <Path
            path={circle}
            color="red"
            style="stroke"
            strokeWidth={strokeWidth}
            start={startPath}
            end={1}
            strokeCap={'round'}
          >
            <SweepGradient
              c={vec(canvasSize / 2, canvasSize / 2)}
              colors={['cyan', 'magenta', 'yellow', 'cyan']}
            />
            <BlurMask blur={5} style="solid" />
          </Path>
        </Canvas>
      </Animated.View>
    </View>
  );
}

export default ActivityIndicator;
