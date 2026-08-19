import React from 'react';
import { Dimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const HEIGHT = 180;

export function AuthWaveHeader() {
  return (
    <View style={{ width, height: HEIGHT, overflow: 'hidden' }}>
      <Svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0052D4" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#4364F7" stopOpacity="1" />
            <Stop offset="1" stopColor="#6FB1FC" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="waveSubGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#00c6ff" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#0072ff" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* Background Base Fill */}
        <Path
          d={`M0,0 L${width},0 L${width},${HEIGHT - 30} C${width * 0.75},${HEIGHT + 10} ${width * 0.45},${HEIGHT - 60} 0,${HEIGHT - 20} Z`}
          fill="url(#waveSubGrad)"
        />

        {/* Foreground Main Wave */}
        <Path
          d={`M0,0 L${width},0 L${width},${HEIGHT - 65} C${width * 0.7},${HEIGHT - 10} ${width * 0.35},${HEIGHT - 80} 0,${HEIGHT - 35} Z`}
          fill="url(#waveGrad)"
        />
      </Svg>
    </View>
  );
}
