import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  ToastAndroid,
  Vibration,
  View
} from 'react-native';
import React, { useRef, useState } from 'react';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Skottie, SkottieViewRef } from 'react-native-skottie';
import AlertAnimation from '@/assets/animations/alert.json';
import TickAnimation from '@/assets/animations/tick.json';
import Text from '@/components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from '@react-native-community/datetimepicker';
import Calendar from '@/assets/icons/Calendar.svg';
import Pin from '@/assets/icons/Pin.svg';
import Danger from '@/assets/icons/Danger.svg';
import { Link } from 'expo-router';
import useSelectedLocationStore from '@/utils/useSelectedLocationStore';
import Animated, { FadeIn } from 'react-native-reanimated';
import supabase from '@/storage/supabase';

const AnimatedView = Animated.createAnimatedComponent(View);

function Report() {
  const { styles, theme } = useStyles(stylesheet);
  const [incident, setIncident] = useState('');
  const [typeOfIncident, setTypeOfIncident] = useState('harassment');
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(undefined);
  const [animationToShow, setAnimationToShow] = useState<any>(AlertAnimation);
  const skottieRef = useRef<SkottieViewRef>(null);

  const selectedLocation = useSelectedLocationStore(
    (state) => state.selectedLocation
  );

  const setSelectedLocation = useSelectedLocationStore(
    (state) => state.setSelectedLocation
  );

  function showDatePicker() {
    DateTimePickerAndroid.open({
      value: incidentDate || new Date(),
      onChange,
      mode: 'date',
      is24Hour: true
    });
  }

  function onChange(event: DateTimePickerEvent, newDate?: Date | undefined) {
    setIncidentDate(newDate);
  }

  async function sendReport() {
    const date = incidentDate?.toISOString();
    const type = typeOfIncident;
    const location = selectedLocation;
    const report = incident?.trim();

    if (!date || !type || !location || report === '') {
      ToastAndroid.show('Fill All The Fields', ToastAndroid.SHORT);
      Vibration.vibrate(100);
      return;
    }

    setIncident('');
    setIncidentDate(undefined);
    setSelectedLocation([]);
    setTypeOfIncident('harassment');

    try {
      const { error } = await supabase.from('reports').insert({
        date,
        type,
        location,
        report
      });

      if (error) {
        throw error;
      }

      Vibration.vibrate(500);
      ToastAndroid.show('Successfully Reported Incident', ToastAndroid.SHORT);

      setAnimationToShow(TickAnimation);
      skottieRef.current?.reset();
      skottieRef.current?.play();

      await new Promise((resolve) => setTimeout(resolve, 2700));

      setAnimationToShow(AlertAnimation);
      skottieRef.current?.reset();
      skottieRef.current?.play();
    } catch (error) {
      console.error(error);
      ToastAndroid.show('Error Reporting Incident', ToastAndroid.SHORT);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background
        }}
      >
        <AnimatedView entering={FadeIn.duration(1000)} style={styles.container}>
          <Skottie
            style={{
              width: 180,
              height: 180,
              marginHorizontal: 'auto'
            }}
            source={animationToShow}
            autoPlay={true}
            speed={0.1}
            ref={skottieRef}
          />

          <View style={styles.reportContainer}>
            <Pressable
              style={{
                paddingVertical: theme.padding.verticalButton + 4,
                paddingHorizontal: theme.padding.horizontalButton,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: theme.colors.red,
                borderRadius: theme.borderRadius.default
              }}
              android_ripple={{
                color: theme.colors.androidRipple
              }}
              onPress={showDatePicker}
            >
              <Calendar fill={theme.colors.red} width={24} height={24} />

              <Text>
                {incidentDate
                  ? 'Date: ' + incidentDate.toLocaleDateString()
                  : 'Date of the incident'}
              </Text>
            </Pressable>

            <Link href="/select-place" asChild>
              <Pressable
                style={{
                  paddingVertical: theme.padding.verticalButton + 4,
                  paddingHorizontal: theme.padding.horizontalButton,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: theme.colors.red,
                  borderRadius: theme.borderRadius.default
                }}
                android_ripple={{
                  color: theme.colors.androidRipple
                }}
              >
                <Pin fill={theme.colors.red} width={24} height={24} />

                <Text>
                  {selectedLocation.length > 0
                    ? `Lon: ${parseFloat(selectedLocation[0]).toFixed(
                        5
                      )} | Lat: ${parseFloat(selectedLocation[1]).toFixed(5)}`
                    : 'Location of the incident'}
                </Text>
              </Pressable>
            </Link>

            <View
              style={{
                borderColor: theme.colors.red,
                borderWidth: 1,
                padding: 4,
                borderRadius: theme.borderRadius.default,
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 13
              }}
            >
              <Danger fill={theme.colors.red} width={24} height={24} />

              <Picker
                prompt="Type of the incident"
                selectedValue={typeOfIncident}
                onValueChange={(itemValue, itemIndex) =>
                  setTypeOfIncident(itemValue)
                }
                selectionColor={theme.colors.red}
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.whiteColor,
                  width: '90%'
                }}
                dropdownIconColor={theme.colors.red}
              >
                <Picker.Item
                  label="Harassment or Stalking"
                  value="harassment"
                />
                <Picker.Item
                  label="Physical Safety Threat"
                  value="physical_threat"
                />
                <Picker.Item label="Sexual Assault" value="sexual_assault" />
                <Picker.Item
                  label="Public Transportation Incident"
                  value="transport"
                />
                <Picker.Item label="Other Safety Concern" value="other" />
              </Picker>
            </View>

            <TextInput
              style={styles.incidentInput}
              onChangeText={(newText) => setIncident(newText)}
              defaultValue={incident}
              placeholder="Enter your report here"
              placeholderTextColor={theme.colors.mutedWhiteColor}
              cursorColor={theme.colors.red}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <LinearGradient
              colors={[theme.colors.red, 'red']}
              style={{
                borderRadius: theme.borderRadius.default,
                marginTop: 5
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
                onPress={sendReport}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.lg,
                    fontFamily: 'BoldBodyTextFont'
                  }}
                >
                  Submit Report
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        </AnimatedView>
      </View>
    </KeyboardAvoidingView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: 25
  },
  reportContainer: {
    flexDirection: 'column',
    gap: 13
  },
  incidentInput: {
    borderWidth: 1,
    borderColor: theme.colors.red,
    borderRadius: theme.borderRadius.default,
    color: theme.colors.whiteColor,
    paddingHorizontal: theme.padding.horizontalInput,
    paddingVertical: theme.padding.verticalInput,
    fontSize: theme.fontSize.original
  }
}));

export default Report;
