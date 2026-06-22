import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageSchema {
  '@percy_credits': number;
  '@percy_status': string;
  '@percy_start_date': string;
  '@percy_onboarded': boolean;
  '@percy_username': string;
}

export const storage = {
  /**
   * Retrieves a typed value from local storage.
   * Parses JSON automatically. Returns defaultValue if the key is not found or fails to read.
   * Falls back to treating the stored value as a raw string if parsing fails and a string is expected.
   */
  async getItem<K extends keyof StorageSchema>(
    key: K,
    defaultValue: StorageSchema[K]
  ): Promise<StorageSchema[K]> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue;
      }
      try {
        return JSON.parse(value) as StorageSchema[K];
      } catch (parseError) {
        // Fallback for raw strings stored in storage before migration
        if (typeof defaultValue === 'string') {
          return value as unknown as StorageSchema[K];
        }
        throw parseError;
      }
    } catch (error) {
      console.error(`Error reading key "${key}" from AsyncStorage:`, error);
      return defaultValue;
    }
  },

  /**
   * Saves a typed value to local storage.
   * Serializes the value to JSON automatically.
   */
  async setItem<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing key "${key}" to AsyncStorage:`, error);
    }
  },

  /**
   * Removes a key from local storage.
   */
  async removeItem<K extends keyof StorageSchema>(key: K): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing key "${key}" from AsyncStorage:`, error);
    }
  },

  /**
   * Clears all items in local storage.
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },
};
