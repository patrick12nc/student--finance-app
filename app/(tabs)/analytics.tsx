import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

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

const categories: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Entertainment',
  'Other',
];

const categoryColors: Record<ExpenseCategory, string> = {
  Food: '#22C55E',
  Transport: '#3B82F6',
  Bills: '#F59E0B',
  Shopping: '#FF6B6B',
  Entertainment: '#8B5CF6',
  Other: '#94A3B8',
};

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
  export: '#0EA5E9',
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
  export: '#0EA5E9',
};

export default function AnalyticsScreen() {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [budget, setBudget] = useState(0);
  const [savings, setSavings] = useState(0);

  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('£');
  const [name, setName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
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
        setName(parsed.name || '');
      }

      if (savedDarkMode) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
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

      const savedSavings = await AsyncStorage.getItem('savings');
      setSavings(savedSavings ? Number(savedSavings) : 0);
    } catch (error) {
      console.log('Error loading analytics data:', error);
    }
  };

  const theme = darkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 76;

  const formatMoney = (amount: number) =>
    `${currency}${Number(amount).toLocaleString()}`;

  const parseExpenseDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed;

    const parts = dateString.split(/[\/\-]/);
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const year = Number(parts[2]);
      const fallback = new Date(year, month, day);
      if (!isNaN(fallback.getTime())) return fallback;
    }

    return new Date();
  };

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const weeklyExpenses = expensesList.filter((item) => {
    const d = parseExpenseDate(item.date);
    return d >= sevenDaysAgo && d <= now;
  });

  const monthlyExpenses = expensesList.filter((item) => {
    const d = parseExpenseDate(item.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const weeklySpent = weeklyExpenses.reduce((sum, item) => sum + item.amount, 0);
  const monthlySpent = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);

  const weeklyTopCategory = categories
    .map((category) => ({
      category,
      total: weeklyExpenses
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.amount, 0),
    }))
    .sort((a, b) => b.total - a.total)[0];

  const monthlyTopCategory = categories
    .map((category) => ({
      category,
      total: monthlyExpenses
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.amount, 0),
    }))
    .sort((a, b) => b.total - a.total)[0];

  const transactionCount = expensesList.length;
  const averageExpense = transactionCount > 0 ? totalExpense / transactionCount : 0;

  const balance = totalIncome - totalExpense - savings;
  const budgetUsedPercent = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const expenseRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const budgetRemaining = budget > 0 ? budget - totalExpense : 0;

  const categoryTotals = categories.map((category) => {
    const total = expensesList
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.amount, 0);

    const percent = totalExpense > 0 ? (total / totalExpense) * 100 : 0;

    return {
      category,
      total,
      percent,
      color: categoryColors[category],
    };
  });

  const topCategory = [...categoryTotals].sort((a, b) => b.total - a.total)[0];
  const greetingName = name?.trim();

  const smartInsights = [
    expensesList.length === 0
      ? 'No spending data yet. Add transactions on the Home screen to generate analytics.'
      : `Your highest spending category is ${
          topCategory && topCategory.total > 0 ? topCategory.category : 'None'
        }.`,
    budget > 0
      ? budgetRemaining < 0
        ? `You have gone over budget by ${formatMoney(Math.abs(budgetRemaining))}.`
        : `You have ${formatMoney(budgetRemaining)} remaining in your budget.`
      : 'You have not set a budget yet.',
    savings > 0
      ? `Your savings rate is ${savingsRate.toFixed(0)}% of your income.`
      : 'You have not built savings yet.',
    totalIncome > 0
      ? `Your expenses currently represent ${expenseRate.toFixed(0)}% of your income.`
      : 'Add income to generate more meaningful financial ratios.',
  ];

  const spendingByCategoryChartData = {
    labels: ['Food', 'Trans', 'Bills', 'Shop', 'Fun', 'Other'],
    datasets: [
      {
        data: categoryTotals.map((item) => item.total || 0),
      },
    ],
  };

  const comparisonChartData = {
    labels: ['Income', 'Spent', 'Savings'],
    datasets: [
      {
        data: [totalIncome || 0, totalExpense || 0, savings || 0],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
    labelColor: (opacity = 1) =>
      darkMode
        ? `rgba(248, 250, 252, ${opacity})`
        : `rgba(16, 24, 40, ${opacity})`,
    fillShadowGradient: theme.primary,
    fillShadowGradientOpacity: 1,
    barPercentage: 0.6,
    propsForBackgroundLines: {
      stroke: darkMode ? '#314667' : '#E4E7EC',
      strokeDasharray: '',
    },
    formatYLabel: (value: string) => `${currency}${value}`,
  };

  const shareFile = async (fileUri: string, mimeType: string, dialogTitle: string) => {
    try {
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle,
        UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.plain-text',
      });
    } catch (error) {
      console.log('Error sharing file:', error);
      Alert.alert('Export failed', 'Could not share the exported file.');
    }
  };

  const exportCsvReport = async () => {
    try {
      const header = 'Date,Category,Amount,Note\n';
      const rows = expensesList
        .map((item) => {
          const safeNote = (item.note || '').replace(/"/g, '""');
          return `${item.date},${item.category},${item.amount},"${safeNote}"`;
        })
        .join('\n');

      const csv = `${header}${rows}`;
      const fileUri = `${FileSystem.documentDirectory}finance-report.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await shareFile(fileUri, 'text/csv', 'Share finance CSV report');
    } catch (error) {
      console.log('Error exporting CSV:', error);
      Alert.alert('Export failed', 'Could not generate CSV report.');
    }
  };

  const exportSummaryReport = async () => {
    try {
      const report = `
STUDENT FINANCE APP REPORT

Name: ${greetingName || 'User'}
Date: ${new Date().toLocaleString()}

OVERVIEW
Income: ${formatMoney(totalIncome)}
Expenses: ${formatMoney(totalExpense)}
Savings: ${formatMoney(savings)}
Balance: ${formatMoney(balance)}
Budget: ${budget > 0 ? formatMoney(budget) : 'Not set'}
Budget Remaining: ${budget > 0 ? formatMoney(budgetRemaining) : 'Not set'}

PERFORMANCE
Savings Rate: ${savingsRate.toFixed(0)}%
Expense Rate: ${expenseRate.toFixed(0)}%
Transactions: ${transactionCount}
Average Expense: ${formatMoney(averageExpense)}

WEEKLY SUMMARY
Spent This Week: ${formatMoney(weeklySpent)}
Top Category This Week: ${
        weeklyTopCategory && weeklyTopCategory.total > 0 ? weeklyTopCategory.category : 'None'
      }

MONTHLY SUMMARY
Spent This Month: ${formatMoney(monthlySpent)}
Top Category This Month: ${
        monthlyTopCategory && monthlyTopCategory.total > 0 ? monthlyTopCategory.category : 'None'
      }

CATEGORY BREAKDOWN
${categoryTotals.map((item) => `- ${item.category}: ${formatMoney(item.total)}`).join('\n')}

SMART INSIGHTS
${smartInsights.map((item) => `- ${item}`).join('\n')}
      `.trim();

      const fileUri = `${FileSystem.documentDirectory}finance-summary.txt`;

      await FileSystem.writeAsStringAsync(fileUri, report, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await shareFile(fileUri, 'text/plain', 'Share finance summary report');
    } catch (error) {
      console.log('Error exporting summary:', error);
      Alert.alert('Export failed', 'Could not generate summary report.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.pageTitle}>Analytics</Text>
          <Text style={styles.pageSubtitle}>
            Spending overview {greetingName ? `for ${greetingName}` : ''}
          </Text>

          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroLabel}>Current Balance</Text>
              <Text style={styles.heroAmount}>{formatMoney(balance)}</Text>
            </View>

            <View style={styles.heroIconWrap}>
              <Ionicons name="stats-chart-outline" size={26} color="#fff" />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Export Reports</Text>
              <Ionicons name="share-social-outline" size={18} color={theme.subText} />
            </View>

            <TouchableOpacity onPress={exportCsvReport} style={[styles.exportButton, { backgroundColor: theme.export }]}>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.exportButtonText}>Export CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={exportSummaryReport} style={[styles.exportButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.exportButtonText}>Export Summary Report</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Smart Insights</Text>
              <Ionicons name="sparkles-outline" size={18} color={theme.subText} />
            </View>

            {smartInsights.map((item, index) => (
              <View key={index} style={styles.smartRow}>
                <View style={styles.smartDot} />
                <Text style={styles.smartText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Transactions</Text>
              <Text style={styles.summaryValue}>{transactionCount}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Average Expense</Text>
              <Text style={styles.summaryValue}>{formatMoney(averageExpense)}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Summary</Text>
              <Ionicons name="calendar-outline" size={18} color={theme.subText} />
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Spent This Week</Text>
                <Text style={styles.infoValue}>{weeklySpent > 0 ? formatMoney(weeklySpent) : 'No data'}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Top Category</Text>
                <Text style={styles.infoValue}>
                  {weeklyTopCategory && weeklyTopCategory.total > 0 ? weeklyTopCategory.category : 'No data'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Monthly Summary</Text>
              <Ionicons name="today-outline" size={18} color={theme.subText} />
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Spent This Month</Text>
                <Text style={styles.infoValue}>{monthlySpent > 0 ? formatMoney(monthlySpent) : 'No data'}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Top Category</Text>
                <Text style={styles.infoValue}>
                  {monthlyTopCategory && monthlyTopCategory.total > 0 ? monthlyTopCategory.category : 'No data'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>{formatMoney(totalIncome)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>{formatMoney(totalExpense)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Savings</Text>
              <Text style={styles.statValue}>{formatMoney(savings)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Budget</Text>
              <Text style={styles.statValue}>
                {budget > 0 ? formatMoney(budget) : 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Income vs Spending</Text>
              <Ionicons name="bar-chart-outline" size={18} color={theme.subText} />
            </View>

            <BarChart
              data={comparisonChartData}
              width={chartWidth}
              height={220}
              yAxisLabel=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={chartConfig}
              style={styles.chart}
              verticalLabelRotation={0}
            />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              <Ionicons name="analytics-outline" size={18} color={theme.subText} />
            </View>

            <BarChart
              data={spendingByCategoryChartData}
              width={chartWidth}
              height={260}
              yAxisLabel=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={chartConfig}
              style={styles.chart}
              verticalLabelRotation={0}
            />

            {categoryTotals.map((item) => (
              <View key={item.category} style={styles.categoryLegendRow}>
                <View style={styles.categoryLegendLeft}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.categoryName}>{item.category}</Text>
                </View>
                <Text style={styles.categoryAmount}>{formatMoney(item.total)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Key Insights</Text>
              <Ionicons name="pie-chart-outline" size={18} color={theme.subText} />
            </View>

            <View style={styles.insightGrid}>
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Top Category</Text>
                <Text style={styles.insightValue}>
                  {topCategory && topCategory.total > 0 ? topCategory.category : 'None'}
                </Text>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Budget Used</Text>
                <Text style={styles.insightValue}>
                  {budget > 0 ? `${budgetUsedPercent.toFixed(0)}%` : 'Not set'}
                </Text>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Savings Rate</Text>
                <Text style={styles.insightValue}>{savingsRate.toFixed(0)}%</Text>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>Expense Rate</Text>
                <Text style={styles.insightValue}>{expenseRate.toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Budget Progress</Text>
              <Ionicons name="timer-outline" size={18} color={theme.subText} />
            </View>

            <Text style={styles.progressLabel}>
              {budget > 0
                ? `${formatMoney(totalExpense)} of ${formatMoney(budget)} used`
                : 'Set a budget on the Home screen to track progress.'}
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${budget > 0 ? Math.min(budgetUsedPercent, 100) : 0}%`,
                    backgroundColor: budgetUsedPercent >= 100 ? theme.danger : theme.primary,
                  },
                ]}
              />
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
      fontSize: 32,
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
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
    },
    exportButton: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    exportButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    smartRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    smartDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      marginTop: 6,
      marginRight: 10,
    },
    smartText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    summaryCard: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryLabel: {
      color: theme.subText,
      fontSize: 13,
      marginBottom: 8,
    },
    summaryValue: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    infoCard: {
      width: '48%',
      backgroundColor: theme.cardAlt,
      borderRadius: 16,
      padding: 14,
    },
    infoLabel: {
      color: theme.subText,
      fontSize: 12,
      marginBottom: 6,
    },
    infoValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statLabel: {
      color: theme.subText,
      fontSize: 13,
      marginBottom: 8,
    },
    statValue: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
    },
    chart: {
      borderRadius: 16,
      marginTop: 8,
    },
    categoryLegendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    categoryLegendLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    categoryName: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
    },
    categoryAmount: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },
    insightGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    insightCard: {
      width: '48%',
      backgroundColor: theme.cardAlt,
      borderRadius: 16,
      padding: 14,
    },
    insightLabel: {
      color: theme.subText,
      fontSize: 12,
      marginBottom: 6,
    },
    insightValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
    progressLabel: {
      color: theme.subText,
      fontSize: 13,
      marginBottom: 12,
    },
    progressTrack: {
      height: 14,
      width: '100%',
      backgroundColor: theme.cardAlt,
      borderRadius: 999,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
    },
  });