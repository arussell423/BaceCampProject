import React from 'react';
import { Platform, View } from 'react-native';

// Native: use the community Slider; Web: native HTML range input
const NativeSlider = Platform.OS !== 'web'
  ? require('@react-native-community/slider').default
  : null;

export default function CrossPlatformSlider({
  value, onValueChange, minimumValue = 0, maximumValue = 1,
  step = 0, minimumTrackTintColor = '#008000', thumbTintColor = '#008000', style,
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={[{ flex: 1, justifyContent: 'center' }, style]}>
        {/* eslint-disable-next-line react-native/no-raw-text */}
        <input
          type="range"
          min={minimumValue}
          max={maximumValue}
          step={step || 1}
          value={value}
          onChange={e => onValueChange && onValueChange(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: minimumTrackTintColor || thumbTintColor,
            cursor: 'pointer',
            height: 6,
            outline: 'none',
          }}
        />
      </View>
    );
  }
  return (
    <NativeSlider
      value={value}
      onValueChange={onValueChange}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      minimumTrackTintColor={minimumTrackTintColor}
      thumbTintColor={thumbTintColor}
      style={style}
    />
  );
}
