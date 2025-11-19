import AsyncStorage from '@react-native-async-storage/async-storage';

//  Store data
export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`Stored data for key: ${key}`);
  } catch (error) {
    console.error('Error storing data:', error);
  }
};

//  Get data
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    return null;
  }
};
