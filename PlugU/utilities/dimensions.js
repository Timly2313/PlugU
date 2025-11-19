import { Dimensions } from 'react-native';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

/**
 * Convert percentage to device height
 * @param {number} percentage (0–100)
 */
export const hp = (percentage) => {
  return (percentage * deviceHeight) / 100;
};

/**
 * Convert percentage to device width
 * @param {number} percentage (0–100)
 */
export const wp = (percentage) => {
  return (percentage * deviceWidth) / 100;
};
