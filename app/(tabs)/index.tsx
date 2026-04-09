import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Shopping'
  | 'Entertainment'
  | 'Other';

type ExpenseItem = {
  amount: number;
  date: string;
  category: ExpenseCategory;
  note?: string;
};

type FinanceData = {
  totalIncome: number;
  totalExpense: number;
  expensesList: ExpenseItem[];
  budget: number;
};

type RecurringExpense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
};

const categories: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Entertainment',
  'Other',
];

const darkTheme = {
  background: '#081631',
  card: '#162542',
  cardAlt: '#223554',
  text: '#F8FAFC',
  subText: '#AAB6CC',
  border: '#314667',
  primary: '#FF6B6B',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  blue: '#4F8CFF',
};

const lightTheme = {
  background: '#F6F8FC',
  card: '#FFFFFF',
  cardAlt: '#EEF2F7',
  text: '#101828',
  subText: '#667085',
  border: '#E4E7EC',
  primary: '#FF6B6B',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  blue: '#4F8CFF',
};

export default function HomeScreen() {
  const [incomeInput, setIncomeInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Food');
  const [recurringTitle, setRecurringTitle] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState<ExpenseCategory>('Bills');

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [currency, setCurrency] = useState('£');
  const [name, setName] = useState('');
  const [savings, setSavings] = useState(0);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadSettings();
      loadSavings();
      loadRecurringExpenses();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      const savedDarkMode = await AsyncStorage.getItem('darkMode');

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setCurrency(parsed.currency || '£');
        setDarkMode(parsed.darkMode ?? true);
        setName(parsed.name || '');
      } else if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const loadSavings = async () => {
    try {
      const savedSavings = await AsyncStorage.getItem('savings');
      setSavings(savedSavings ? Number(savedSavings) : 0);
    } catch (error) {
      console.log('Error loading savings:', error);
    }
  };

  const loadRecurringExpenses = async () => {
    try {
      const savedRecurring = await AsyncStorage.getItem('recurringExpenses');
      if (savedRecurring) {
        setRecurringExpenses(JSON.parse(savedRecurring));
      } else {
        setRecurringExpenses([]);
      }
    } catch (error) {
      console.log('Error loading recurring expenses:', error);
    }
  };

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsed: FinanceData = JSON.parse(savedData);
        setTotalIncome(parsed.totalIncome || 0);
        setTotalExpense(parsed.totalExpense || 0);
        setExpensesList(parsed.expensesList || []);
        setBudget(parsed.budget || 0);
      } else {
        setTotalIncome(0);
        setTotalExpense(0);
        setExpensesList([]);
        setBudget(0);
      }
    } catch (error) {
      console.log('Error loading finance data:', error);
    }
  };

  const saveData = async (
    income: number,
    expense: number,
    list: ExpenseItem[],
    newBudget: number
  ) => {
    try {
      const data: FinanceData = {
        totalIncome: income,
        totalExpense: expense,
        expensesList: list,
        budget: newBudget,
      };
      await AsyncStorage.setItem('financeData', JSON.stringify(data));
    } catch (error) {
      console.log('Error saving finance data:', error);
    }
  };

  const saveRecurringExpenses = async (items: RecurringExpense[]) => {
    try {
      await AsyncStorage.setItem('recurringExpenses', JSON.stringify(items));
    } catch (error) {
      console.log('Error saving recurring expenses:', error);
    }
  };

  const handleAddIncome = async () => {
    const amount = parseFloat(incomeInput);
    if (!isNaN(amount) && amount > 0) {
      const newTotalIncome = totalIncome + amount;
      setTotalIncome(newTotalIncome);
      setIncomeInput('');
      await saveData(newTotalIncome, totalExpense, expensesList, budget);
    }
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseInput);
    if (!isNaN(amount) && amount > 0) {
      const newExpense = {
        amount,
        category: selectedCategory,
        note: expenseNote.trim(),
        date: new Date().toLocaleDateString(),
      };

      const newExpensesList = [newExpense, ...expensesList];
      const newTotalExpense = totalExpense + amount;

      setExpensesList(newExpensesList);
      setTotalExpense(newTotalExpense);
      setExpenseInput('');
      setExpenseNote('');
      await saveData(totalIncome, newTotalExpense, newExpensesList, budget);
    }
  };

  const handleDeleteExpense = async (index: number) => {
    const expenseToDelete = expensesList[index];
    const updatedExpenses = expensesList.filter((_, i) => i !== index);
    const newTotalExpense = totalExpense - expenseToDelete.amount;

    setExpensesList(updatedExpenses);
    setTotalExpense(newTotalExpense);
    await saveData(totalIncome, newTotalExpense, updatedExpenses, budget);
  };

  const handleSetBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount > 0) {
      setBudget(amount);
      setBudgetInput('');
      await saveData(totalIncome, totalExpense, expensesList, amount);
    }
  };

  const handleAddRecurringExpense = async () => {
    const amount = parseFloat(recurringAmount);

    if (!recurringTitle.trim() || isNaN(amount) || amount <= 0) return;

    const newRecurring: RecurringExpense = {
      id: Date.now().toString(),
      title: recurringTitle.trim(),
      amount,
      category: recurringCategory,
    };

    const updated = [newRecurring, ...recurringExpenses];
    setRecurringExpenses(updated);
    setRecurringTitle('');
    setRecurringAmount('');
    await saveRecurringExpenses(updated);
  };

  const budgetRemaining = budget > 0 ? budget - totalExpense : 0;
  const availableBalance = totalIncome - totalExpense - savings;

  const formatMoney = (amount: number) =>
    `${currency}${Number(amount).toLocaleString()}`;

  const theme = darkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const categoryTotals = categories.map((category) => {
    const total = expensesList
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.amount, 0);

    return { category, total };
  });

  const topCategory = [...categoryTotals].sort((a, b) => b.total - a.total)[0];
  const spendingPercent = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  const savingsPercent = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
  const avgExpense = expensesList.length > 0 ? totalExpense / expensesList.length : 0;
  const greetingName = name?.trim() ? `, ${name}` : '';

  const quickInsights: { title: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [];

  if (topCategory && topCategory.total > 0) {
    quickInsights.push({
      title: 'Spending Insight',
      value: `You spend the most on ${topCategory.category}.`,
      icon: 'trending-down-outline',
    });
  }

  if (budget > 0) {
    quickInsights.push({
      title: 'Budget Insight',
      value:
        budgetRemaining >= 0
          ? `You have ${formatMoney(budgetRemaining)} remaining in your budget.`
          : `You are over budget by ${formatMoney(Math.abs(budgetRemaining))}.`,
      icon: 'pie-chart-outline',
    });
  }

  if (savings > 0) {
    quickInsights.push({
      title: 'Savings Insight',
      value: `Your savings rate is ${savingsPercent}% of your income.`,
      icon: 'wallet-outline',
    });
  }

  if (totalIncome > 0 && totalExpense > 0) {
    quickInsights.push({
      title: 'Balance Insight',
      value: `Your expenses currently represent ${spendingPercent}% of your income.`,
      icon: 'stats-chart-outline',
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Welcome back{greetingName}</Text>
      <Text style={styles.pageSubtitle}>Here’s your financial overview</Text>

      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroLabel}>Available Balance</Text>
          <Text style={styles.heroAmount}>{formatMoney(availableBalance)}</Text>
        </View>

        <View style={styles.heroIconWrap}>
          <Ionicons name="card-outline" size={30} color="#fff" />
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
            <Ionicons name="arrow-up" size={24} color={theme.success} />
          </View>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalIncome)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
            <Ionicons name="arrow-down" size={24} color={theme.danger} />
          </View>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalExpense)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
            <Ionicons name="wallet-outline" size={24} color={theme.warning} />
          </View>
          <Text style={styles.summaryLabel}>Savings</Text>
          <Text style={styles.summaryValue}>{formatMoney(savings)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <Ionicons name="sparkles-outline" size={22} color={theme.subText} />
        </View>

        {quickInsights.length === 0 ? (
          <Text style={styles.emptyState}>
            Add income and expenses to unlock smart insights.
          </Text>
        ) : (
          quickInsights.map((item, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={styles.insightIcon}>
                <Ionicons name={item.icon} size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>{item.title}</Text>
                <Text style={styles.insightValue}>{item.value}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <Ionicons name="pie-chart-outline" size={22} color={theme.subText} />
        </View>

        <Text style={styles.sectionSubtext}>
          Budget: {budget > 0 ? formatMoney(budget) : 'Not set'} • Remaining:{' '}
          {budget > 0 ? formatMoney(budgetRemaining) : 'N/A'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={`${currency}1500`}
          placeholderTextColor={theme.subText}
          keyboardType="numeric"
          value={budgetInput}
          onChangeText={setBudgetInput}
        />

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.blue }]} onPress={handleSetBudget}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Set Budget</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Add Income</Text>
          <Ionicons name="cash-outline" size={22} color={theme.subText} />
        </View>

        <TextInput
          style={styles.input}
          placeholder={`${currency}1000`}
          placeholderTextColor={theme.subText}
          keyboardType="numeric"
          value={incomeInput}
          onChangeText={setIncomeInput}
        />

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.success }]}
          onPress={handleAddIncome}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Add Income</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Add Expense</Text>
          <Ionicons name="receipt-outline" size={22} color={theme.subText} />
        </View>

        <TextInput
          style={styles.input}
          placeholder={`${currency}200`}
          placeholderTextColor={theme.subText}
          keyboardType="numeric"
          value={expenseInput}
          onChangeText={setExpenseInput}
        />

        <TextInput
          style={styles.input}
          placeholder="Optional note (e.g. Groceries, Bus fare)"
          placeholderTextColor={theme.subText}
          value={expenseNote}
          onChangeText={setExpenseNote}
        />

        <Text style={styles.categoryLabel}>Category</Text>
        <View style={styles.categoryRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.activeCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.activeCategoryButtonText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleAddExpense}
        >
          <Ionicons name="remove-circle-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recurring Expenses</Text>
          <Ionicons name="repeat-outline" size={22} color={theme.subText} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Recurring title (e.g. Rent, Netflix)"
          placeholderTextColor={theme.subText}
          value={recurringTitle}
          onChangeText={setRecurringTitle}
        />

        <TextInput
          style={styles.input}
          placeholder={`${currency} amount`}
          placeholderTextColor={theme.subText}
          keyboardType="numeric"
          value={recurringAmount}
          onChangeText={setRecurringAmount}
        />

        <View style={styles.categoryRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                recurringCategory === category && styles.activeCategoryButton,
              ]}
              onPress={() => setRecurringCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  recurringCategory === category && styles.activeCategoryButtonText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.warning }]}
          onPress={handleAddRecurringExpense}
        >
          <Ionicons name="repeat-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Add Recurring Expense</Text>
        </TouchableOpacity>

        {recurringExpenses.length > 0 && (
          <View style={{ marginTop: 16 }}>
            {recurringExpenses.map((item) => (
              <View key={item.id} style={styles.transactionItem}>
                <View style={styles.transactionIconWrap}>
                  <Ionicons name="repeat-outline" size={20} color={theme.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transactionTitle}>{item.title}</Text>
                  <Text style={styles.transactionMeta}>{item.category}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: theme.warning }]}>
                  -{formatMoney(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Spending Insights</Text>
          <Ionicons name="analytics-outline" size={22} color={theme.subText} />
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Top Category</Text>
            <Text style={styles.metricValue}>
              {topCategory && topCategory.total > 0 ? topCategory.category : 'None'}
            </Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Budget Status</Text>
            <Text style={styles.metricValue}>
              {budget > 0 ? formatMoney(budgetRemaining) : 'Not set'}
            </Text>
          </View>
        </View>

        {categoryTotals.map((item) => (
          <View key={item.category} style={styles.breakdownRow}>
            <Text style={styles.breakdownText}>{item.category}</Text>
            <Text style={styles.breakdownAmount}>{formatMoney(item.total)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Ionicons name="time-outline" size={22} color={theme.subText} />
        </View>

        {expensesList.length === 0 ? (
          <Text style={styles.emptyState}>No transactions yet. Add your first expense above.</Text>
        ) : (
          expensesList.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionIconWrap}>
                <Ionicons name="card-outline" size={20} color={theme.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.transactionTitle}>{item.category}</Text>
                <Text style={styles.transactionMeta}>{item.date}</Text>
                {!!item.note && <Text style={styles.transactionNote}>{item.note}</Text>}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.transactionAmount}>-{formatMoney(item.amount)}</Text>
                <TouchableOpacity onPress={() => handleDeleteExpense(index)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 20 }} />
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
    pageTitle: {
      fontSize: 34,
      fontWeight: '700',
      color: theme.text,
      marginTop: 10,
    },
    pageSubtitle: {
      fontSize: 14,
      color: theme.subText,
      marginTop: 4,
      marginBottom: 18,
    },
    heroCard: {
      backgroundColor: theme.primary,
      borderRadius: 24,
      padding: 22,
      marginBottom: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroLabel: {
      color: '#FFE3E3',
      fontSize: 15,
      marginBottom: 8,
    },
    heroAmount: {
      color: '#FFFFFF',
      fontSize: 34,
      fontWeight: '800',
    },
    heroIconWrap: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
      gap: 12,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      color: theme.subText,
      fontSize: 13,
      marginBottom: 4,
    },
    summaryValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
    },
    sectionSubtext: {
      color: theme.subText,
      fontSize: 14,
      marginBottom: 14,
    },
    input: {
      backgroundColor: theme.cardAlt,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 16,
      marginBottom: 14,
    },
    primaryButton: {
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    categoryLabel: {
      color: theme.subText,
      fontSize: 14,
      marginBottom: 10,
    },
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 14,
    },
    categoryButton: {
      backgroundColor: theme.cardAlt,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    activeCategoryButton: {
      backgroundColor: theme.primary,
    },
    categoryButtonText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    activeCategoryButtonText: {
      color: '#fff',
    },
    insightItem: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    insightIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,107,107,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    insightTitle: {
      color: theme.subText,
      fontSize: 12,
      marginBottom: 2,
    },
    insightValue: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '600',
    },
    emptyState: {
      color: theme.subText,
      fontSize: 14,
      lineHeight: 20,
    },
    metricsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    metricBox: {
      flex: 1,
      backgroundColor: theme.cardAlt,
      borderRadius: 16,
      padding: 14,
    },
    metricLabel: {
      color: theme.subText,
      fontSize: 13,
      marginBottom: 6,
    },
    metricValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    breakdownText: {
      color: theme.text,
      fontSize: 14,
    },
    breakdownAmount: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    transactionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    transactionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 2,
    },
    transactionMeta: {
      color: theme.subText,
      fontSize: 13,
    },
    transactionNote: {
      color: theme.subText,
      fontSize: 12,
      marginTop: 4,
      fontStyle: 'italic',
    },
    transactionAmount: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    deleteText: {
      color: theme.danger,
      marginTop: 6,
      fontSize: 13,
      fontWeight: '600',
    },
  });