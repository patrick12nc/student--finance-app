import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const darkTheme = {
  background: '#081631',
  card: '#162542',
  text: '#FFFFFF',
  subText: '#AAB6CC',
  green: '#22C55E',
  red: '#FF6B6B',
};

const lightTheme = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#0F172A',
  subText: '#667085',
  green: '#22C55E',
  red: '#FF6B6B',
};

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !darkMode;
      setDarkMode(newValue);

      await AsyncStorage.setItem('darkMode', JSON.stringify(newValue));

      const savedSettings = await AsyncStorage.getItem('settings');
      const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};

      await AsyncStorage.setItem(
        'settings',
        JSON.stringify({
          ...parsedSettings,
          darkMode: newValue,
        })
      );

      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.log('Error saving dark mode:', error);
    }
  };

  const loadDemoData = async () => {
    try {
      const demoFinanceData = {
        totalIncome: 1500,
        totalExpense: 520,
        budget: 800,
        expensesList: [
          {
            amount: 120,
            category: 'Food',
            date: new Date().toLocaleDateString(),
            note: 'Groceries',
          },
          {
            amount: 60,
            category: 'Transport',
            date: new Date().toLocaleDateString(),
            note: 'Bus and train',
          },
          {
            amount: 200,
            category: 'Shopping',
            date: new Date().toLocaleDateString(),
            note: 'Clothes',
          },
          {
            amount: 140,
            category: 'Bills',
            date: new Date().toLocaleDateString(),
            note: 'Phone and utilities',
          },
        ],
      };

      await AsyncStorage.setItem('financeData', JSON.stringify(demoFinanceData));
      await AsyncStorage.setItem('savings', '300');
      await AsyncStorage.setItem('savingsGoal', '1000');

      Alert.alert('Demo Loaded', 'Sample data has been added successfully.');

      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.log('Demo data error:', error);
      Alert.alert('Error', 'Could not load demo data.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset App',
      'This will delete all saved data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All app data has been cleared.');

              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            } catch (error) {
              console.log('Reset error:', error);
              Alert.alert('Error', 'Could not clear data.');
            }
          },
        },
      ]
    );
  };

  const theme = darkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your app preferences and demo data</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Dark Mode</Text>
            <Text style={styles.helperText}>Switch between light and dark theme</Text>
          </View>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Presentation Tools</Text>
        <Text style={styles.helperText}>
          Load realistic sample data before presenting your app.
        </Text>

        <TouchableOpacity style={styles.demoButton} onPress={loadDemoData}>
          <Text style={styles.buttonText}>Load Demo Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Danger Zone</Text>
        <Text style={styles.helperText}>
          Resetting will permanently remove all saved app data.
        </Text>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.infoText}>
          This application helps users track income, expenses, savings, budgets,
          and recurring costs. It also includes an intelligent coaching feature
          that provides personalised financial advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: typeof darkTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: theme.text,
      marginTop: 10,
    },
    subtitle: {
      color: theme.subText,
      fontSize: 14,
      marginTop: 4,
      marginBottom: 20,
    },
    card: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
    },
    cardTitle: {
      color: theme.text,
      fontWeight: '700',
      fontSize: 16,
      marginBottom: 10,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    label: {
      color: theme.text,
      fontSize: 15,
      marginBottom: 4,
    },
    helperText: {
      color: theme.subText,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 10,
    },
    demoButton: {
      backgroundColor: theme.green,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    resetButton: {
      backgroundColor: theme.red,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
    infoText: {
      color: theme.subText,
      fontSize: 13,
      lineHeight: 19,
    },
  });
