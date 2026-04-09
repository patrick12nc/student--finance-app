import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type ExpenseItem = {
  amount: number;
  date: string;
  category: string;
  note?: string;
};

type FinanceData = {
  totalIncome: number;
  totalExpense: number;
  expensesList: ExpenseItem[];
  budget: number;
};

const darkTheme = {
  background: '#081631',
  card: '#162542',
  cardAlt: '#10203C',
  text: '#FFFFFF',
  subText: '#AAB6CC',
  primary: '#FF6B6B',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#FF6B6B',
};

const lightTheme = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  cardAlt: '#EEF2F7',
  text: '#0F172A',
  subText: '#667085',
  primary: '#FF6B6B',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#FF6B6B',
};

export default function CoachScreen() {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [budget, setBudget] = useState(0);
  const [topCategory, setTopCategory] = useState('None');
  const [name, setName] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState('Unknown');
  const [statusMessage, setStatusMessage] = useState('');
  const [scoreReasons, setScoreReasons] = useState<string[]>([]);

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
        setName(parsed.name || '');
        setDarkMode(parsed.darkMode ?? true);
      } else if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('financeData');
      const savedSavings = await AsyncStorage.getItem('savings');

      if (data) {
        const parsed: FinanceData = JSON.parse(data);

        setIncome(parsed.totalIncome || 0);
        setExpenses(parsed.totalExpense || 0);
        setBudget(parsed.budget || 0);

        const list = parsed.expensesList || [];
        const totals: Record<string, number> = {};

        list.forEach((item) => {
          totals[item.category] = (totals[item.category] || 0) + item.amount;
        });

        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

        if (sorted.length > 0) {
          setTopCategory(sorted[0][0]);
        } else {
          setTopCategory('None');
        }
      } else {
        setIncome(0);
        setExpenses(0);
        setBudget(0);
        setTopCategory('None');
      }

      setSavings(savedSavings ? Number(savedSavings) : 0);
    } catch (e) {
      console.log('Error loading coach data:', e);
    }
  };

  const theme = darkMode ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const formatMoney = (amount: number) =>
    `£${Number(amount).toLocaleString()}`;

  const getScoreColor = () => {
    if (healthScore === null) return theme.text;
    if (healthScore >= 70) return theme.green;
    if (healthScore >= 40) return theme.amber;
    return theme.red;
  };

  const getRiskColor = () => {
    if (riskLevel === 'Low') return theme.green;
    if (riskLevel === 'Medium') return theme.amber;
    if (riskLevel === 'High') return theme.red;
    return theme.subText;
  };

  const getAdvice = async () => {
    setLoading(true);
    setTips([]);
    setScoreReasons([]);
    setStatusMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const generatedTips: string[] = [];
      const reasons: string[] = [];

      const balance = income - expenses - savings;
      const savingsRate = income > 0 ? (savings / income) * 100 : 0;
      const expenseRate = income > 0 ? (expenses / income) * 100 : 0;
      const budgetRemaining = budget > 0 ? budget - expenses : 0;

      let score = 100;

      if (income === 0 && expenses === 0) {
        score = 50;
        reasons.push('No financial data has been entered yet, so the score is neutral.');
      } else {
        if (income === 0) {
          score -= 40;
          reasons.push('No income has been added.');
        }

        if (expenses > income && income > 0) {
          score -= 30;
          reasons.push('Your expenses are higher than your income.');
        }

        if (savings === 0 && income > 0) {
          score -= 15;
          reasons.push('You have not built any savings yet.');
        }

        if (income > 0 && expenseRate > 80) {
          score -= 15;
          reasons.push('A large percentage of your income is being spent.');
        }

        if (budget > 0 && expenses > budget) {
          score -= 20;
          reasons.push('You are currently over your budget.');
        }

        if (topCategory === 'Shopping' || topCategory === 'Entertainment') {
          score -= 5;
          reasons.push(`Your highest category is ${topCategory}, which may include non-essential spending.`);
        }

        if (income > 0 && savingsRate >= 20) {
          reasons.push('Your savings rate is strong.');
        }

        if (income > 0 && expenses < income * 0.5) {
          reasons.push('Your spending is relatively low compared to your income.');
        }
      }

      score = Math.max(0, Math.min(100, score));
      setHealthScore(score);
      setScoreReasons(reasons.slice(0, 4));

      if (score >= 70) {
        setRiskLevel('Low');
        setStatusMessage('Your finances are in a strong position. Keep this up.');
      } else if (score >= 40) {
        setRiskLevel('Medium');
        setStatusMessage('Your finances are stable but there is room for improvement.');
      } else {
        setRiskLevel('High');
        setStatusMessage('Your finances need attention. Focus on controlling spending and improving savings.');
      }

      if (income === 0 && expenses === 0) {
        generatedTips.push('Add income and expenses first so I can analyse your finances.');
      }

      if (income > 0 && expenses > income) {
        generatedTips.push('You are spending more than you earn. Focus on reducing non-essential costs this week.');
      }

      if (income > 0 && expenseRate >= 80) {
        generatedTips.push('Your expenses use most of your income. Try lowering one spending category this month.');
      }

      if (income > 0 && savings === 0) {
        generatedTips.push('You have not started saving yet. Even a small weekly amount can build good habits.');
      }

      if (income > 0 && savingsRate > 0 && savingsRate < 10) {
        generatedTips.push('Your savings are growing slowly. Aim to save a slightly higher percentage of your income.');
      }

      if (income > 0 && savingsRate >= 20) {
        generatedTips.push('You are saving well. Keep this habit consistent to build long-term financial stability.');
      }

      if (budget > 0 && budgetRemaining < 0) {
        generatedTips.push(`You are over budget by ${formatMoney(Math.abs(budgetRemaining))}. Review your highest spending category.`);
      }

      if (budget > 0 && budgetRemaining >= 0 && budgetRemaining < budget * 0.2) {
        generatedTips.push('You are close to your budget limit. Be careful with extra spending for the rest of the period.');
      }

      if (topCategory === 'Food') {
        generatedTips.push('Food is your highest category. Meal planning could help you reduce repeated spending.');
      }

      if (topCategory === 'Shopping') {
        generatedTips.push('Shopping is your highest category. Try delaying non-essential purchases before buying.');
      }

      if (topCategory === 'Entertainment') {
        generatedTips.push('Entertainment is your biggest expense. Setting a limit here could improve your balance.');
      }

      if (topCategory === 'Transport') {
        generatedTips.push('Transport costs are high. Check whether cheaper travel options are available regularly.');
      }

      if (topCategory === 'Bills') {
        generatedTips.push('Bills are your main expense. Tracking recurring costs can help you plan more accurately.');
      }

      if (income > 0 && expenses < income * 0.5 && savingsRate >= 10) {
        generatedTips.push('Your finances look healthy. You are balancing spending and saving well.');
      }

      if (balance < 0) {
        generatedTips.push('Your available balance is negative. Prioritise essentials and pause optional spending.');
      }

      if (generatedTips.length === 0) {
        generatedTips.push('Your finances are looking stable. Keep tracking consistently to maintain progress.');
      }

      setTips(generatedTips.slice(0, 3));
    } catch (e) {
      console.log('Advice error:', e);
      setTips(['Could not generate advice right now.']);
      setHealthScore(null);
      setRiskLevel('Unknown');
      setStatusMessage('');
      setScoreReasons([]);
    } finally {
      setLoading(false);
    }
  };

  const greetingName = name?.trim();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {greetingName ? `AI Coach, ${greetingName}` : 'AI Coach'}
      </Text>
      <Text style={styles.subtitle}>Get smart financial advice instantly</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Data</Text>
        <Text style={styles.item}>Income: {formatMoney(income)}</Text>
        <Text style={styles.item}>Expenses: {formatMoney(expenses)}</Text>
        <Text style={styles.item}>Savings: {formatMoney(savings)}</Text>
        <Text style={styles.item}>
          Budget: {budget ? formatMoney(budget) : 'Not set'}
        </Text>
        <Text style={styles.item}>Top Category: {topCategory}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={getAdvice}>
        <Ionicons name="sparkles" size={18} color="#fff" />
        <Text style={styles.buttonText}>Generate Advice</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Analysing your financial behaviour...</Text>
        </View>
      )}

      {healthScore !== null && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Financial Health Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor() }]}>
            {healthScore}/100
          </Text>

          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Risk Level:</Text>
            <Text style={[styles.riskValue, { color: getRiskColor() }]}>
              {riskLevel}
            </Text>
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {scoreReasons.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why this score?</Text>
          {scoreReasons.map((reason, index) => (
            <Text key={index} style={styles.tip}>
              • {reason}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Tips</Text>

        {!loading && tips.length === 0 ? (
          <Text style={styles.empty}>Tap the button to get personalised financial advice.</Text>
        ) : (
          tips.map((tip, i) => (
            <Text key={i} style={styles.tip}>
              • {tip}
            </Text>
          ))
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How this works</Text>
        <Text style={styles.infoText}>
          This coach analyses your income, spending, savings, budget, and highest expense category
          to generate personalised financial recommendations, a financial health score, and a risk level.
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
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginTop: 10,
    },
    subtitle: {
      color: theme.subText,
      marginBottom: 20,
      fontSize: 14,
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
      marginBottom: 10,
      fontSize: 16,
    },
    item: {
      color: theme.subText,
      marginBottom: 6,
      fontSize: 14,
    },
    button: {
      backgroundColor: theme.primary,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 16,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    loadingWrap: {
      alignItems: 'center',
      marginBottom: 16,
    },
    loadingText: {
      color: theme.subText,
      marginTop: 10,
      fontSize: 14,
    },
    scoreCard: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    scoreTitle: {
      color: theme.subText,
      marginBottom: 8,
      fontSize: 14,
    },
    scoreValue: {
      fontSize: 30,
      fontWeight: '800',
      marginBottom: 10,
    },
    riskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    riskLabel: {
      color: theme.subText,
      fontSize: 14,
    },
    riskValue: {
      fontSize: 15,
      fontWeight: '700',
    },
    statusText: {
      color: theme.subText,
      fontSize: 13,
      marginTop: 10,
      textAlign: 'center',
      lineHeight: 18,
    },
    tip: {
      color: theme.text,
      marginBottom: 10,
      fontSize: 14,
      lineHeight: 20,
    },
    empty: {
      color: theme.subText,
      fontSize: 14,
    },
    infoCard: {
      backgroundColor: theme.cardAlt,
      padding: 16,
      borderRadius: 16,
    },
    infoTitle: {
      color: theme.text,
      fontWeight: '700',
      fontSize: 15,
      marginBottom: 8,
    },
    infoText: {
      color: theme.subText,
      fontSize: 13,
      lineHeight: 19,
    },
  });
