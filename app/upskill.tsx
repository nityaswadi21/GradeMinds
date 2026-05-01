import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Linking, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Polyline, Path, Line, Circle } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const SIDEBAR_W = 108;
const CONTENT_W = W - SIDEBAR_W;

type Tab = 'courses' | 'leetcode' | 'qbank';

// ─── BMSCE Semester subjects ───────────────────────────────────────────────────

const SEMS: Record<number, { color: string; subjects: string[] }> = {
  1: { color: '#10B981', subjects: ['Maths I', 'Applied Physics', 'C Programming', 'Python Intro', 'Intro to EE', 'Intro to ME', 'Intro to CE', 'Communication English'] },
  2: { color: '#10B981', subjects: ['Maths II', 'Applied Chemistry', 'CAD', 'Green Building', 'Renewable Energy', 'Waste Management', 'Sustainable Materials'] },
  3: { color: '#F59E0B', subjects: ['Statistics & Discrete Maths', 'Computer Organization', 'OOP Java', 'Logic Design', 'DBMS', 'Data Structures', 'Unix Shell', 'Full Stack Web Dev'] },
  4: { color: '#F59E0B', subjects: ['Linear Algebra', 'Cryptography', 'Theory of Computation', 'Operating Systems', 'ADA', 'Software Engineering', 'Mobile App Dev'] },
  5: { color: '#3B82F6', subjects: ['OO Modelling', 'Data Visualization', 'Artificial Intelligence', 'Computer Networks', 'Environmental Studies', 'Bio Inspired Systems'] },
  6: { color: '#3B82F6', subjects: ['Cloud Computing', 'Big Data Analytics', 'Machine Learning', 'Research Methodology', 'Advanced Networks', 'Blockchain', 'Advanced DSA', 'AI'] },
  7: { color: '#A78BFA', subjects: ['Network Programming', 'Management & Entrepreneurship', 'Software Architecture', 'Soft Computing', 'NLP', 'Wireless Communication', 'Information Security'] },
  8: { color: '#EF4444', subjects: ['Network Security', 'Deep Learning', 'AR/VR', 'High Performance Computing', 'Cyber Security', 'Java Advanced'] },
};

// ─── Q-Bank ───────────────────────────────────────────────────────────────────

const QBANK_DATA: Record<string, { q: string; type: 'FAQ' | 'PYQ' }[]> = {
  'DBMS':              [{ q: 'Explain normalisation up to BCNF with examples.', type: 'FAQ' }, { q: 'Write SQL to find the second highest salary.', type: 'PYQ' }, { q: 'What are ACID properties?', type: 'FAQ' }],
  'Data Structures':   [{ q: 'Explain AVL trees and rotations.', type: 'PYQ' }, { q: 'Difference between BFS and DFS?', type: 'FAQ' }, { q: 'Explain Dijkstra\'s algorithm.', type: 'PYQ' }],
  'OOP Java':          [{ q: 'Explain the four pillars of OOP.', type: 'FAQ' }, { q: 'Difference between interface and abstract class?', type: 'PYQ' }],
  'Operating Systems': [{ q: 'What is deadlock? State conditions and prevention.', type: 'FAQ' }, { q: 'Explain virtual memory and page replacement.', type: 'PYQ' }],
  'Computer Networks': [{ q: 'Explain TCP/IP vs OSI model.', type: 'PYQ' }, { q: 'What is subnetting? Give an example.', type: 'FAQ' }],
  'Machine Learning':  [{ q: 'Explain bias-variance tradeoff.', type: 'FAQ' }, { q: 'What is gradient descent? Explain variants.', type: 'PYQ' }],
  'Deep Learning':     [{ q: 'Explain backpropagation step by step.', type: 'FAQ' }, { q: 'What is vanishing gradient problem?', type: 'PYQ' }],
  'Cloud Computing':   [{ q: 'Explain IaaS vs PaaS vs SaaS.', type: 'FAQ' }, { q: 'What is containerisation? Explain Docker.', type: 'PYQ' }],
  'Cryptography':      [{ q: 'Explain RSA encryption with example.', type: 'PYQ' }, { q: 'What is symmetric vs asymmetric encryption?', type: 'FAQ' }],
  'Software Engineering': [{ q: 'Compare Agile and Waterfall models.', type: 'FAQ' }, { q: 'Explain SDLC phases.', type: 'PYQ' }],
  'ADA':               [{ q: 'Explain divide and conquer with merge sort.', type: 'PYQ' }, { q: 'What is dynamic programming?', type: 'FAQ' }],
  'C Programming':     [{ q: 'What is a pointer? Explain with examples.', type: 'FAQ' }, { q: 'Call by value vs call by reference?', type: 'PYQ' }],
  'Python':            [{ q: 'What are decorators in Python?', type: 'FAQ' }, { q: 'Explain list comprehension.', type: 'PYQ' }],
  'Maths':             [{ q: 'Explain Laplace Transform and its applications.', type: 'PYQ' }, { q: 'What is eigenvalue and eigenvector?', type: 'FAQ' }],
  'Statistics':        [{ q: 'Explain Bayes theorem with example.', type: 'FAQ' }, { q: 'What is hypothesis testing?', type: 'PYQ' }],
  'Logic Design':      [{ q: 'Explain K-map simplification.', type: 'PYQ' }, { q: 'What are flip-flops and their types?', type: 'FAQ' }],
  'Blockchain':        [{ q: 'What is a consensus mechanism?', type: 'FAQ' }, { q: 'Explain smart contracts.', type: 'PYQ' }],
  'NLP':               [{ q: 'What is tokenization in NLP?', type: 'FAQ' }, { q: 'Explain word embeddings.', type: 'PYQ' }],
  'Network Security':  [{ q: 'What is SSL/TLS handshake?', type: 'FAQ' }, { q: 'Explain common network attacks.', type: 'PYQ' }],
  'Artificial Intelligence': [{ q: 'Explain A* search algorithm.', type: 'PYQ' }, { q: 'What is the difference between AI and ML?', type: 'FAQ' }],
  'Software Architecture': [{ q: 'Explain microservices vs monolithic architecture.', type: 'FAQ' }, { q: 'What is REST API design?', type: 'PYQ' }],
};

// ─── Courses ──────────────────────────────────────────────────────────────────

const COURSES = [
  { title: 'Data Structures & Algorithms', provider: 'Coursera · UC San Diego', tag: 'DSA', color: '#7C3AED', sems: [3,4,5], url: 'https://www.coursera.org/specializations/data-structures-algorithms' },
  { title: 'OOP with Java', provider: 'Coursera · Duke University', tag: 'Java', color: '#3B82F6', sems: [3,7,8], url: 'https://www.coursera.org/specializations/java-programming' },
  { title: 'Full Stack Web Development', provider: 'Udemy · Angela Yu', tag: 'Web', color: '#10B981', sems: [3,4,5], url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/' },
  { title: 'Database Management Systems', provider: 'NPTEL · IIT Madras', tag: 'DBMS', color: '#8B5CF6', sems: [3,4], url: 'https://nptel.ac.in/courses/106106093' },
  { title: 'Operating Systems', provider: 'OSTEP · Free', tag: 'OS', color: '#EC4899', sems: [4,5], url: 'https://ostep.org' },
  { title: 'Machine Learning Specialization', provider: 'Coursera · Andrew Ng', tag: 'ML', color: '#3B82F6', sems: [6,7], url: 'https://www.coursera.org/specializations/machine-learning-introduction' },
  { title: 'Deep Learning Specialization', provider: 'Coursera · deeplearning.ai', tag: 'DL', color: '#6366F1', sems: [7,8], url: 'https://www.coursera.org/specializations/deep-learning' },
  { title: 'Cloud Computing with AWS', provider: 'Coursera · AWS', tag: 'Cloud', color: '#EF4444', sems: [6,7,8], url: 'https://www.coursera.org/learn/aws-cloud-technical-essentials' },
  { title: 'Blockchain Fundamentals', provider: 'Coursera · UC Berkeley', tag: 'Blockchain', color: '#F59E0B', sems: [6,7], url: 'https://www.coursera.org/learn/blockchain-foundations' },
  { title: 'Computer Networks', provider: 'Coursera · Stanford', tag: 'Networks', color: '#06B6D4', sems: [5,6,7], url: 'https://www.coursera.org/learn/computer-networking' },
  { title: 'Cryptography I', provider: 'Coursera · Stanford', tag: 'Crypto', color: '#A78BFA', sems: [4,7,8], url: 'https://www.coursera.org/learn/crypto' },
  { title: 'Python for Data Science', provider: 'Coursera · IBM', tag: 'Python', color: '#06B6D4', sems: [1,2,3], url: 'https://www.coursera.org/professional-certificates/ibm-data-science' },
  { title: 'Engineering Mathematics', provider: 'NPTEL · IIT Roorkee', tag: 'Math', color: '#64748B', sems: [1,2], url: 'https://nptel.ac.in/courses/111107105' },
  { title: 'Mobile App Dev with React Native', provider: 'Udemy', tag: 'Mobile', color: '#F97316', sems: [4,5], url: 'https://www.udemy.com/course/the-complete-react-native-and-redux-course/' },
  { title: 'NLP with Transformers', provider: 'Hugging Face · Free', tag: 'NLP', color: '#A78BFA', sems: [7,8], url: 'https://huggingface.co/learn/nlp-course' },
  { title: 'Artificial Intelligence', provider: 'Coursera · Stanford', tag: 'AI', color: '#10B981', sems: [5,6], url: 'https://www.coursera.org/learn/ai-for-everyone' },
  { title: 'Linux & Unix Shell Scripting', provider: 'Udemy', tag: 'Unix', color: '#64748B', sems: [3], url: 'https://www.udemy.com/course/linux-command-line-volume1/' },
  { title: 'High Performance Computing', provider: 'NPTEL · IIT Madras', tag: 'HPC', color: '#EF4444', sems: [8], url: 'https://nptel.ac.in/courses/106106048' },
];

// ─── LeetCode problems ────────────────────────────────────────────────────────

const LEET_PROBLEMS = [
  { id: 'l1',  title: 'Two Sum',                              difficulty: 'Easy',   tag: 'Arrays',          url: 'https://leetcode.com/problems/two-sum' },
  { id: 'l2',  title: 'Valid Parentheses',                    difficulty: 'Easy',   tag: 'Stack',           url: 'https://leetcode.com/problems/valid-parentheses' },
  { id: 'l3',  title: 'Merge Two Sorted Lists',               difficulty: 'Easy',   tag: 'LinkedList',      url: 'https://leetcode.com/problems/merge-two-sorted-lists' },
  { id: 'l4',  title: 'Binary Search',                        difficulty: 'Easy',   tag: 'Binary Search',   url: 'https://leetcode.com/problems/binary-search' },
  { id: 'l5',  title: 'Climbing Stairs',                      difficulty: 'Easy',   tag: 'DP',              url: 'https://leetcode.com/problems/climbing-stairs' },
  { id: 'l6',  title: 'Best Time to Buy and Sell Stock',      difficulty: 'Easy',   tag: 'Arrays',          url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock' },
  { id: 'l7',  title: 'Longest Substring Without Repeating',  difficulty: 'Medium', tag: 'Sliding Window',  url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters' },
  { id: 'l8',  title: 'Number of Islands',                    difficulty: 'Medium', tag: 'Graphs',          url: 'https://leetcode.com/problems/number-of-islands' },
  { id: 'l9',  title: 'Coin Change',                          difficulty: 'Medium', tag: 'DP',              url: 'https://leetcode.com/problems/coin-change' },
  { id: 'l10', title: 'Merge Intervals',                      difficulty: 'Medium', tag: 'Arrays',          url: 'https://leetcode.com/problems/merge-intervals' },
  { id: 'l11', title: 'LRU Cache',                            difficulty: 'Medium', tag: 'Design',          url: 'https://leetcode.com/problems/lru-cache' },
  { id: 'l12', title: '3Sum',                                 difficulty: 'Medium', tag: 'Two Pointers',    url: 'https://leetcode.com/problems/3sum' },
  { id: 'l13', title: 'Word Break',                           difficulty: 'Medium', tag: 'DP',              url: 'https://leetcode.com/problems/word-break' },
  { id: 'l14', title: 'Container With Most Water',            difficulty: 'Medium', tag: 'Two Pointers',    url: 'https://leetcode.com/problems/container-with-most-water' },
  { id: 'l15', title: 'Trapping Rain Water',                  difficulty: 'Hard',   tag: 'Two Pointers',    url: 'https://leetcode.com/problems/trapping-rain-water' },
  { id: 'l16', title: 'Median of Two Sorted Arrays',          difficulty: 'Hard',   tag: 'Binary Search',   url: 'https://leetcode.com/problems/median-of-two-sorted-arrays' },
  { id: 'l17', title: 'Serialize and Deserialize Binary Tree',difficulty: 'Hard',   tag: 'Trees',           url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree' },
  { id: 'l18', title: 'Word Ladder',                          difficulty: 'Hard',   tag: 'Graphs',          url: 'https://leetcode.com/problems/word-ladder' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STREAK_KEY   = 'upskill_streak';
const SOLVED_KEY   = 'upskill_solved';
const LAST_DAY_KEY = 'upskill_lastday';
const GOAL_KEY     = 'upskill_goal';
const TODAY_KEY    = 'upskill_today';
const GOAL_OPTIONS = [1, 2, 3, 5];

function diffColor(d: string) {
  if (d === 'Easy')   return '#10B981';
  if (d === 'Medium') return '#F59E0B';
  return '#EF4444';
}

function matchKey(subject: string, key: string) {
  return (
    key.toLowerCase().includes(subject.split(' ')[0].toLowerCase()) ||
    subject.toLowerCase().includes(key.split(' ')[0].toLowerCase())
  );
}

// ─── Icon components (no emojis) ─────────────────────────────────────────────

function IconBook({ color = '#fff', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconCode({ color = '#fff', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="16 18 22 12 16 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="8 6 2 12 8 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconQuestion({ color = '#fff', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconBolt({ color = '#A78BFA', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

function IconArrow({ color = '#7C3AED', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconCheck({ color = '#fff', size = 10 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconExternalLink({ color = '#7C3AED', size = 10 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Polyline points="15 3 21 3 21 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="10" y1="14" x2="21" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Upskill() {
  const router = useRouter();
  const [tab, setTab]             = useState<Tab>('courses');
  const [selSem, setSelSem]       = useState(3);
  const [selSubj, setSelSubj]     = useState('All');
  const [streak, setStreak]       = useState(0);
  const [solved, setSolved]       = useState<Set<string>>(new Set());
  const [dailyGoal, setDailyGoal] = useState(2);
  const [todaySolved, setTodaySolved] = useState(0);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(2);

  useEffect(() => {
    (async () => {
      const s  = await AsyncStorage.getItem(STREAK_KEY);
      const sv = await AsyncStorage.getItem(SOLVED_KEY);
      const g  = await AsyncStorage.getItem(GOAL_KEY);
      const td = await AsyncStorage.getItem(TODAY_KEY);
      const ld = await AsyncStorage.getItem(LAST_DAY_KEY);
      const today = new Date().toDateString();

      if (s)  setStreak(parseInt(s));
      if (sv) setSolved(new Set(JSON.parse(sv)));
      if (g)  { setDailyGoal(parseInt(g)); setGoalInput(parseInt(g)); }
      else    setShowGoalModal(true);

      if (ld !== today) {
        setTodaySolved(0);
        await AsyncStorage.setItem(TODAY_KEY, '0');
        await AsyncStorage.setItem(LAST_DAY_KEY, today);
      } else if (td) {
        setTodaySolved(parseInt(td));
      }
    })();
  }, []);

  const saveGoal = async () => {
    setDailyGoal(goalInput);
    setShowGoalModal(false);
    await AsyncStorage.setItem(GOAL_KEY, String(goalInput));
  };

  const markSolved = async (id: string) => {
    const newSolved = new Set(solved);
    let newToday = todaySolved;
    if (newSolved.has(id)) {
      newSolved.delete(id);
      newToday = Math.max(0, newToday - 1);
    } else {
      newSolved.add(id);
      newToday += 1;
      if (newToday === dailyGoal) {
        const ns = streak + 1;
        setStreak(ns);
        await AsyncStorage.setItem(STREAK_KEY, String(ns));
      }
    }
    setSolved(newSolved);
    setTodaySolved(newToday);
    await AsyncStorage.setItem(SOLVED_KEY, JSON.stringify([...newSolved]));
    await AsyncStorage.setItem(TODAY_KEY, String(newToday));
  };

  const semSubjects = SEMS[selSem]?.subjects ?? [];

  const availableSubjects = semSubjects.filter(s =>
    Object.keys(QBANK_DATA).some(k => matchKey(s, k))
  );

  const getQBankItems = () => {
    const items: { q: string; type: 'FAQ' | 'PYQ'; subject: string }[] = [];
    const seen = new Set<string>();
    const toSearch = selSubj === 'All' ? semSubjects : [selSubj];
    toSearch.forEach(s => {
      Object.entries(QBANK_DATA).forEach(([k, qs]) => {
        if (matchKey(s, k)) {
          qs.forEach(q => {
            if (!seen.has(q.q)) { seen.add(q.q); items.push({ ...q, subject: k }); }
          });
        }
      });
    });
    return items;
  };

  const filteredCourses = COURSES.filter(c => c.sems.includes(selSem));
  const pct = Math.min(100, Math.round((todaySolved / dailyGoal) * 100));
  const goalMet = todaySolved >= dailyGoal;

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const renderSidebar = () => {
    if (tab === 'leetcode') {
      return (
        <View style={styles.sidebar}>
          <Text style={styles.sideHeading}>UNIVERSAL</Text>
          <View style={styles.leetNote}>
            <IconCode color="#7C3AED" size={16} />
            <Text style={styles.leetNoteText}>No semester filter for LeetCode</Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.sidebar} showsVerticalScrollIndicator={false}>
        <Text style={styles.sideHeading}>SEMESTER</Text>
        {[1,2,3,4,5,6,7,8].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.semItem, selSem === s && styles.semItemActive]}
            onPress={() => { setSelSem(s); setSelSubj('All'); }}
          >
            <View style={[styles.semDot, { backgroundColor: SEMS[s].color }]} />
            <Text style={[styles.semLabel, selSem === s && styles.semLabelActive]}>Sem {s}</Text>
          </TouchableOpacity>
        ))}

        {tab === 'qbank' && availableSubjects.length > 0 && (
          <>
            <View style={styles.sideDivider} />
            <Text style={styles.sideHeading}>SUBJECT</Text>
            {['All', ...availableSubjects].map(s => {
              const active = selSubj === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={styles.subjItem}
                  onPress={() => setSelSubj(s)}
                >
                  <View style={[styles.subjCheck, active && styles.subjCheckDone]}>
                    {active && <IconCheck size={8} />}
                  </View>
                  <Text style={[styles.subjLabel, active && styles.subjLabelActive]} numberOfLines={2}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.root}>

      {/* ── Goal Modal ── */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTitleRow}>
              <IconBolt size={20} />
              <Text style={styles.modalTitle}>Set your daily goal</Text>
            </View>
            <Text style={styles.modalSub}>
              How many LeetCode problems per day? Streak only counts once you hit this target.
            </Text>
            <View style={styles.goalRow}>
              {GOAL_OPTIONS.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.goalChip, goalInput === n && styles.goalChipSel]}
                  onPress={() => setGoalInput(n)}
                >
                  <Text style={[styles.goalChipText, goalInput === n && styles.goalChipTextSel]}>{n} / day</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.goalBtn} onPress={saveGoal}>
              <Text style={styles.goalBtnText}>Start Tracking</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upskill</Text>
        <TouchableOpacity style={styles.streakBadge} onPress={() => setShowGoalModal(true)}>
          <IconBolt size={13} />
          <Text style={styles.streakCount}>{streak}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {([
          { key: 'courses' as Tab,  Icon: IconBook,     label: 'Courses' },
          { key: 'leetcode' as Tab, Icon: IconCode,     label: 'LeetCode' },
          { key: 'qbank' as Tab,    Icon: IconQuestion, label: 'Q-Bank' },
        ]).map(({ key, Icon, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnOn]}
            onPress={() => { setTab(key); setSelSubj('All'); }}
          >
            <Icon color={tab === key ? '#fff' : '#64748B'} size={12} />
            <Text style={[styles.tabBtnText, tab === key && styles.tabBtnTextOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Body: sidebar + content ── */}
      <View style={styles.body}>
        {renderSidebar()}

        <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentList}>

          {/* COURSES */}
          {tab === 'courses' && (
            filteredCourses.length === 0
              ? <Text style={styles.empty}>No courses for Sem {selSem}</Text>
              : filteredCourses.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.courseCard, { borderLeftColor: c.color }]}
                  onPress={() => Linking.openURL(c.url)}
                  activeOpacity={0.8}
                >
                  <View style={styles.courseTop}>
                    <View style={[styles.tagPill, { backgroundColor: c.color + '22' }]}>
                      <Text style={[styles.tagText, { color: c.color }]}>{c.tag}</Text>
                    </View>
                    <Text style={styles.provider} numberOfLines={1}>{c.provider}</Text>
                  </View>
                  <Text style={styles.courseTitle}>{c.title}</Text>
                  <View style={[styles.courseBtn, { backgroundColor: c.color + '11', borderColor: c.color + '44' }]}>
                    <IconExternalLink color={c.color} size={10} />
                    <Text style={[styles.courseBtnText, { color: c.color }]}>View Course</Text>
                  </View>
                </TouchableOpacity>
              ))
          )}

          {/* LEETCODE */}
          {tab === 'leetcode' && (
            <>
              <View style={styles.streakCard}>
                <View style={styles.streakTop}>
                  <View style={styles.streakLeft}>
                    <View style={styles.streakIconBg}>
                      <IconBolt size={16} />
                    </View>
                    <View>
                      <Text style={styles.streakNum}>{streak} day streak</Text>
                      <Text style={styles.streakGoalText}>Goal: {dailyGoal} / day</Text>
                    </View>
                  </View>
                  <View style={styles.streakRight}>
                    <Text style={styles.streakSolved}>{solved.size}</Text>
                    <Text style={styles.streakSolvedLabel}>solved</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: goalMet ? '#10B981' : '#7C3AED' }]} />
                </View>
                <View style={styles.streakBottom}>
                  <Text style={styles.streakProgress}>
                    {todaySolved}/{dailyGoal} today{goalMet ? '  ·  Goal reached' : ''}
                  </Text>
                  <TouchableOpacity onPress={() => setShowGoalModal(true)}>
                    <Text style={styles.changeGoal}>Edit goal</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {LEET_PROBLEMS.map(p => (
                <View key={p.id} style={[styles.leetCard, solved.has(p.id) && styles.leetCardDone]}>
                  <TouchableOpacity
                    style={[styles.checkbox, solved.has(p.id) && styles.checkboxDone]}
                    onPress={() => markSolved(p.id)}
                  >
                    {solved.has(p.id) && <IconCheck size={9} />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.leetTitle, solved.has(p.id) && styles.leetTitleDone]} numberOfLines={2}>
                      {p.title}
                    </Text>
                    <View style={styles.leetMeta}>
                      <Text style={[styles.leetDiff, { color: diffColor(p.difficulty) }]}>{p.difficulty}</Text>
                      <Text style={styles.leetTag}>{p.tag}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(p.url)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <IconArrow size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Q-BANK */}
          {tab === 'qbank' && (() => {
            const items = getQBankItems();
            return items.length === 0
              ? <Text style={styles.empty}>No questions for this selection</Text>
              : items.map((q, i) => (
                <View key={i} style={styles.qCard}>
                  <View style={styles.qTop}>
                    <View style={[styles.tagPill, { backgroundColor: q.type === 'PYQ' ? 'rgba(124,58,237,0.15)' : 'rgba(16,185,129,0.15)' }]}>
                      <Text style={[styles.tagText, { color: q.type === 'PYQ' ? '#7C3AED' : '#10B981' }]}>{q.type}</Text>
                    </View>
                    <Text style={styles.qSubject}>{q.subject}</Text>
                  </View>
                  <Text style={styles.qText}>{q.q}</Text>
                </View>
              ));
          })()}

        </ScrollView>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D1A' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  back: { fontSize: 22, color: '#F8FAFC', width: 32 },
  headerTitle: { fontFamily: 'Georgia', fontSize: 20, color: '#FFFFFF', flex: 1, textAlign: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  streakCount: { color: '#A78BFA', fontSize: 13, fontWeight: '700' },

  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  tabBtnOn: { backgroundColor: '#7C3AED' },
  tabBtnText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  tabBtnTextOn: { color: '#FFFFFF', fontWeight: '600' },

  body: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: { width: SIDEBAR_W, backgroundColor: '#111127', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' },
  sideHeading: { fontSize: 9, color: '#475569', letterSpacing: 1.5, paddingHorizontal: 10, paddingTop: 12, paddingBottom: 6, textTransform: 'uppercase' },
  semItem: { paddingVertical: 9, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  semItemActive: { backgroundColor: 'rgba(124,58,237,0.12)', borderLeftColor: '#7C3AED' },
  semDot: { width: 7, height: 7, borderRadius: 4 },
  semLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  semLabelActive: { color: '#A78BFA', fontWeight: '600' },
  sideDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 6 },
  subjItem: { paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  subjCheck: { width: 13, height: 13, borderRadius: 3, borderWidth: 1.5, borderColor: '#334155', marginTop: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  subjCheckDone: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  subjLabel: { fontSize: 10, color: '#64748B', lineHeight: 14, flex: 1 },
  subjLabelActive: { color: '#A78BFA' },
  leetNote: { margin: 10, backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)', alignItems: 'center', gap: 6 },
  leetNoteText: { fontSize: 9, color: '#64748B', textAlign: 'center', lineHeight: 14 },

  // Content
  contentArea: { flex: 1 },
  contentList: { padding: 10, gap: 8, paddingBottom: 100 },
  empty: { color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 40, lineHeight: 20 },

  // Course card
  courseCard: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  courseTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tagPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 9, fontWeight: '700' },
  provider: { fontSize: 10, color: '#64748B', flex: 1 },
  courseTitle: { fontSize: 12, color: '#FFFFFF', fontWeight: '600', marginBottom: 10, lineHeight: 18 },
  courseBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  courseBtnText: { fontSize: 10, fontWeight: '600' },

  // Streak card
  streakCard: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakIconBg: { width: 32, height: 32, backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  streakNum: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  streakGoalText: { color: '#64748B', fontSize: 9, marginTop: 2 },
  streakRight: { alignItems: 'flex-end' },
  streakSolved: { color: '#A78BFA', fontSize: 20, fontWeight: '700', fontFamily: 'Georgia' },
  streakSolvedLabel: { color: '#64748B', fontSize: 9 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  streakBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  streakProgress: { fontSize: 9, color: '#64748B' },
  changeGoal: { fontSize: 9, color: '#7C3AED', fontWeight: '600' },

  // LeetCode card
  leetCard: { backgroundColor: '#1A1A2E', borderRadius: 11, padding: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  leetCardDone: { opacity: 0.5 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  leetTitle: { fontSize: 12, color: '#FFFFFF', marginBottom: 4 },
  leetTitleDone: { textDecorationLine: 'line-through', color: '#64748B' },
  leetMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leetDiff: { fontSize: 9, fontWeight: '700' },
  leetTag: { fontSize: 9, color: '#475569', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },

  // Q-Bank card
  qCard: { backgroundColor: '#1A1A2E', borderRadius: 11, padding: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  qTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  qSubject: { fontSize: 10, color: '#64748B' },
  qText: { fontSize: 12, color: '#FFFFFF', lineHeight: 19 },

  // Goal modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  modalTitle: { fontFamily: 'Georgia', fontSize: 18, color: '#FFFFFF' },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 20 },
  goalRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  goalChip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0D0D1A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  goalChipSel: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)' },
  goalChipText: { color: '#64748B', fontSize: 13 },
  goalChipTextSel: { color: '#A78BFA', fontWeight: '600' },
  goalBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  goalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
