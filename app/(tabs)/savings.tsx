import { useState, useCallback } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const darkTheme = {
  background: '#081631',
  card: '#162542',
  cardAlt: '#223554',
  text: '#F8FAFC',
  subText: '#AAB6CC',
  border: '#314667',
  success: '#22C55E',
  danger: '#EF4444',
  primary: '#FF6B6B',
  warning: '#F59E0B',
  input: '#2B3D5A',
};

const lightTheme = {
  background: '#F6F8FC',
  card: '#FFFFFF',
  cardAlt: '#EEF2F7',
  text: '#101828',
  subText: '#667085',
  border: '#E4E7EC',
  success: '#22C55E',
  danger: '#EF4444',
  primary: '#FF6B6B',
  warning: '#F59E0B',
  input: '#F2F4F7',
};

export default function Savings() {
  const [amount, setAmount] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [savings, setSavings] = useState(0);
  const [goal, setGoal] = useState(0);

  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('£');

  useFocusEffect(
    useCallback(() => {
      loadSavings();
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      const savedDarkMode = await AsyncStorage.getItem('darkMode');

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setCurrency(parsed.currency || '£');
        setDarkMode(parsed.darkMode ?? false);
      }

      if (savedDarkMode) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const loadSavings = async () => {
    try {
      const savedSavings = await AsyncStorage.getItem('savings');
      const savedGoal = await AsyncStorage.getItem('savingsGoal');

      setSavings(savedSavings ? Number(savedSavings) : 0);
      setGoal(savedGoal ? Number(savedGoal) : 0);
    } catch (error) {
      console.log('Error loading savings:', error);
    }
  };

  const saveGoal = async () => {
    if (!goalInput || isNaN(Number(goalInput))) return;

    Keyboard.dismiss();

    const newGoal = Number(goalInput);
    setGoal(newGoal);
    setGoalInput('');

    try {
      await AsyncStorage.setItem('savingsGoal', newGoal.toString());
    } catch (error) {
      console.log('Error saving goal:', error);
    }
  };

  const clearGoal = async () => {
    Alert.alert('Clear Goal', 'Do you want to remove your current savings goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('savingsGoal');
            setGoal(0);
            setGoalInput('');
          } catch (error) {
            console.log('Error clearing goal:', error);
          }
        },
      },
    ]);
  };

  const addToSavings = async () => {
    if (!amount || isNaN(Number(amount))) return;

    Keyboard.dismiss();

    const newSavings = savings + Number(amount);
    setSavings(newSavings);
    setAmount('');

    try {
      await AsyncStorage.setItem('savings', newSavings.toString());

      if (goal > 0 && newSavings >= goal) {
        Alert.alert('Goal Reached 🎉', 'Congratulations! You reached your savings goal.');
      }
    } catch (error) {
      console.log('Error saving savings:', error);
    }
  };

  const withdrawSavings = async () => {
    if (!amount || isNaN(Number(amount))) return;

    if (Number(amount) > savings) {
      Alert.alert('Not enough savings', 'You cannot withdraw more than your saved amount.');
      return;
    }

    Keyboard.dismiss();

    const newSavings = savings - Number(amount);
    setSavings(newSavings);
    setAmount('');

    try {
      await AsyncStorage.setItem('savings', newSavings.toString());
    } catch (error) {
      console.log('Error updating savings:', error);
    }
  };

  const theme = darkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const formatMoney = (value: number) => `${currency}${Number(value).toLocaleString()}`;

  const progress = goal > 0 ? Math.min((savings / goal) * 100, 100) : 0;
  const remaining = goal > 0 ? Math.max(goal - savings, 0) : 0;

  const goalMessage =
    goal <= 0
      ? 'Set a savings goal to track your progress.'
      : savings >= goal
      ? 'Amazing work — you have reached your goal.'
      : progress >= 75
      ? 'You are very close to your goal.'
      : progress >= 40
      ? 'You are making strong progress.'
      : 'Keep going — every contribution counts.';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.pageTitle}>Savings</Text>
          <Text style={styles.pageSubtitle}>Track and manage your saved money</Text>

          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroLabel}>Total Savings</Text>
              <Text style={styles.heroAmount}>{formatMoney(savings)}</Text>
            </View>

            <View style={styles.heroIconWrap}>
              <Ionicons name="wallet-outline" size={26} color="#fff" />
            </View>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Savings Goal</Text>
              <Ionicons name="flag-outline" size={18} color={theme.subText} />
            </View>

            <Text style={styles.goalMessage}>{goalMessage}</Text>

            <View style={styles.goalSummaryRow}>
              <View style={styles.goalSummaryBox}>
                <Text style={styles.goalSummaryLabel}>Goal</Text>
                <Text style={styles.goalSummaryValue}>
                  {goal > 0 ? formatMoney(goal) : 'Not set'}
                </Text>
              </View>

              <View style={styles.goalSummaryBox}>
                <Text style={styles.goalSummaryLabel}>Remaining</Text>
                <Text style={styles.goalSummaryValue}>
                  {goal > 0 ? formatMoney(remaining) : formatMoney(0)}
                </Text>
              </View>
            </View>

            <Text style={styles.progressLabel}>
              {goal > 0
                ? `${formatMoney(savings)} of ${formatMoney(goal)} saved`
                : 'No savings goal set yet.'}
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: savings >= goal && goal > 0 ? theme.success : theme.primary,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressPercent}>
              {goal > 0 ? `${progress.toFixed(0)}% complete` : '0% complete'}
            </Text>

            <TextInput
              placeholder={`Set goal (${currency})`}
              placeholderTextColor={theme.subText}
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              returnKeyType="done"
              onSubmitEditing={saveGoal}
              style={styles.input}
            />

            <TouchableOpacity onPress={saveGoal} style={[styles.button, styles.primaryButton]}>
              <Ionicons name="flag-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Set Goal</Text>
            </TouchableOpacity>

            {goal > 0 && (
              <TouchableOpacity onPress={clearGoal} style={[styles.button, styles.clearGoalButton]}>
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Clear Goal</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Manage Savings</Text>
            <Text style={styles.cardSubtitle}>
              Add money to your savings or withdraw when needed
            </Text>

            <TextInput
              placeholder={`Enter amount (${currency})`}
              placeholderTextColor={theme.subText}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit
              style={styles.input}
            />

            <TouchableOpacity onPress={addToSavings} style={[styles.button, styles.successButton]}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Add to Savings</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={withdrawSavings} style={[styles.button, styles.dangerButton]}>
              <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.smallCard}>
              <Text style={styles.smallLabel}>Progress</Text>
              <Text style={styles.smallValue}>{goal > 0 ? `${progress.toFixed(0)}%` : '0%'}</Text>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.smallLabel}>Currency</Text>
              <Text style={styles.smallValue}>{currency}</Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: typeof darkTheme) =>
  StyleSheet.create({
    pageTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.text,
      marginTop: 8,
    },
    pageSubtitle: {
      fontSize: 14,
      color: theme.subText,
      marginTop: 4,
      marginBottom: 20,
    },
    heroCard: {
      backgroundColor: theme.success,
      borderRadius: 24,
      padding: 22,
      marginBottom: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroLabel: {
      color: '#EFFFF1',
      fontSize: 15,
      marginBottom: 8,
    },
    heroAmount: {
      color: '#FFFFFF',
      fontSize: 34,
      fontWeight: '800',
    },
    heroIconWrap: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    goalCard: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.subText,
      marginBottom: 16,
      lineHeight: 18,
    },
    goalMessage: {
      fontSize: 13,
      color: theme.subText,
      marginBottom: 16,
      lineHeight: 18,
    },
    goalSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    goalSummaryBox: {
      width: '48%',
      backgroundColor: theme.cardAlt,
      borderRadius: 16,
      padding: 14,
    },
    goalSummaryLabel: {
      color: theme.subText,
      fontSize: 12,
      marginBottom: 6,
    },
    goalSummaryValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
    progressLabel: {
      color: theme.subText,
      fontSize: 13,
      marginBottom: 10,
    },
    progressTrack: {
      height: 14,
      width: '100%',
      backgroundColor: theme.cardAlt,
      borderRadius: 999,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
    },
    progressPercent: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 16,
    },
    input: {
      backgroundColor: theme.input,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    button: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    primaryButton: {
      backgroundColor: theme.primary,
    },
    successButton: {
      backgroundColor: theme.success,
    },
    dangerButton: {
      backgroundColor: theme.danger,
      marginBottom: 0,
    },
    clearGoalButton: {
      backgroundColor: theme.warning,
      marginBottom: 0,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    smallCard: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    smallLabel: {
      color: theme.subText,
      fontSize: 13,
      marginBottom: 6,
    },
    smallValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
  });