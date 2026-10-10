import React, { useState, useMemo, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { useApp } from '../context/AppContext';
import { Scheme, SchemeCategory } from '../types';
import { 
  adminSignIn, 
  adminSignOut, 
  subscribeToAuthState 
} from '../lib/firebase';
import { isValidHttpUrl } from '../utils/urlSecurity';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  MessageSquare, 
  Layers, 
  BarChart2, 
  X, 
  LogOut, 
  Activity, 
  RefreshCw, 
  Sparkles, 
  Star, 
  Clock, 
  Zap, 
  TrendingUp, 
  Filter,
  Mail
} from 'lucide-react';

export const AdminPanelPage: React.FC = () => {
  const { 
    schemes, 
    addScheme, 
    updateScheme, 
    deleteScheme, 
    searchLogs, 
    logSearchQuery,
    clearSearchLogs,
    deleteSearchLog,
    feedbackSubmissions, 
    feedbackList,
    addFeedbackSubmission,
    deleteFeedbackSubmission,
    clearAllFeedback,
    addToast, 
    t 
  } = useApp();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminUser, setAdminUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'schemes' | 'searches' | 'feedback'>('analytics');

  // Filters for tables
  const [logSearchFilter, setLogSearchFilter] = useState('');
  const [feedbackSearchFilter, setFeedbackSearchFilter] = useState('');

  // Live Auto-Refresh State
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [syncPulse, setSyncPulse] = useState(false);

  // Scheme Modal Form State
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<SchemeCategory>('Agriculture');
  const [formMinistry, setFormMinistry] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [formGender, setFormGender] = useState('All');
  const [formAgeLimit, setFormAgeLimit] = useState('');
  const [formIncomeLimit, setFormIncomeLimit] = useState('');
  const [formOccupation, setFormOccupation] = useState('');
  const [formDocs, setFormDocs] = useState('');
  const [formSteps, setFormSteps] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formApplyLink, setFormApplyLink] = useState('');
  const [formHelpline, setFormHelpline] = useState('');

  // Listen to Firebase Auth state for authenticated administrator session with verified custom claims
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user, isAdmin) => {
      if (user && !user.isAnonymous) {
        setAdminUser(user);
        setIsAuthenticated(true);
        setIsAdminAuthorized(isAdmin);
      } else {
        setAdminUser(null);
        setIsAuthenticated(false);
        setIsAdminAuthorized(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Pulse effect on log or feedback change
  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString());
    setSyncPulse(true);
    const timer = setTimeout(() => setSyncPulse(false), 1200);
    return () => clearTimeout(timer);
  }, [searchLogs, feedbackList, schemes]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      addToast('Please enter both email and password.', 'warning');
      return;
    }

    setIsAuthenticating(true);
    try {
      const { user, isAdmin } = await adminSignIn(emailInput.trim(), passwordInput);
      setAdminUser(user);
      setIsAuthenticated(true);
      setIsAdminAuthorized(isAdmin);

      if (isAdmin) {
        addToast(`Logged in as Administrator (${user.email || 'Admin'})`, 'success');
      } else {
        addToast('Signed in successfully, but this account lacks administrator custom claims.', 'warning');
      }
    } catch (err: any) {
      console.error('Admin authentication error:', err);
      let errorMsg = 'Authentication failed. Please verify your administrator credentials.';
      if (
        err?.code === 'auth/invalid-credential' || 
        err?.code === 'auth/wrong-password' || 
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-email'
      ) {
        errorMsg = 'Invalid email or password.';
      } else if (err?.code === 'auth/user-disabled') {
        errorMsg = 'This administrator account has been disabled.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMsg = 'Access temporarily disabled due to multiple failed attempts. Try again later.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/Password sign-in provider is not enabled in Firebase Console.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      addToast(errorMsg, 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminSignOut();
      setIsAuthenticated(false);
      setIsAdminAuthorized(false);
      setAdminUser(null);
      addToast('Logged out of Admin Portal.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Recharts: Scheme Count per Category
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    schemes.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.keys(counts).map((cat) => ({
      name: cat,
      count: counts[cat],
    }));
  }, [schemes]);

  // Recharts: Search Term Frequency
  const searchFreqChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    searchLogs.forEach((l) => {
      const q = l.query.trim().toLowerCase();
      if (q) {
        counts[q] = (counts[q] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([term, count]) => ({
        term: term.length > 15 ? term.substring(0, 15) + '...' : term,
        count,
      }));
  }, [searchLogs]);

  // Top Search Term
  const topSearchTerm = useMemo(() => {
    if (searchFreqChartData.length > 0) {
      return searchFreqChartData[0].term;
    }
    return 'None yet';
  }, [searchFreqChartData]);

  // Average Feedback Rating
  const allFeedbacks = useMemo(() => {
    return feedbackSubmissions || feedbackList || [];
  }, [feedbackSubmissions, feedbackList]);

  const avgFeedbackRating = useMemo(() => {
    if (allFeedbacks.length === 0) return 5.0;
    const total = allFeedbacks.reduce((acc, f) => acc + (f.rating || 5), 0);
    return (total / allFeedbacks.length).toFixed(1);
  }, [allFeedbacks]);

  // Filtered Search Logs
  const filteredSearchLogs = useMemo(() => {
    if (!logSearchFilter.trim()) return searchLogs;
    const lower = logSearchFilter.toLowerCase();
    return searchLogs.filter(
      (l) =>
        l.query.toLowerCase().includes(lower) ||
        (l.categoryFilter && l.categoryFilter.toLowerCase().includes(lower)) ||
        (l.timestamp && l.timestamp.toLowerCase().includes(lower))
    );
  }, [searchLogs, logSearchFilter]);

  // Filtered Feedback Submissions
  const filteredFeedbacks = useMemo(() => {
    if (!feedbackSearchFilter.trim()) return allFeedbacks;
    const lower = feedbackSearchFilter.toLowerCase();
    return allFeedbacks.filter(
      (f: any) =>
        (f.name && f.name.toLowerCase().includes(lower)) ||
        (f.message && f.message.toLowerCase().includes(lower)) ||
        (f.category && f.category.toLowerCase().includes(lower)) ||
        (f.state && f.state.toLowerCase().includes(lower)) ||
        (f.mobile && f.mobile.toLowerCase().includes(lower))
    );
  }, [allFeedbacks, feedbackSearchFilter]);

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#ec4899', '#f97316', '#a855f7', '#6366f1', '#059669'];

  // Simulate Live Search
  const handleSimulateLiveSearch = () => {
    const sampleQueries = [
      { query: 'PM Kisan 2026 Installment Status', cat: 'Agriculture' },
      { query: 'Post Matric Student Scholarship Portal', cat: 'Students' },
      { query: 'Ayushman Bharat Golden Card Hospital List', cat: 'Health' },
      { query: 'Lado Lakshmi Yojana Registration', cat: 'Women' },
      { query: 'PMAY Urban Subsidy Calculator', cat: 'Housing' },
      { query: 'Mudra Loan 10 Lakh Business Grant', cat: 'Business' },
      { query: 'PM Vishwakarma Artisan Toolkit Grant', cat: 'Employment' },
    ];
    const picked = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
    const simulatedCount = Math.floor(Math.random() * 8) + 1;
    logSearchQuery(picked.query, simulatedCount, picked.cat);
    addToast(`Live search simulated: "${picked.query}" (${simulatedCount} matches)`, 'success');
  };

  // Simulate Live Feedback
  const handleSimulateLiveFeedback = () => {
    const names = ['Aarav Patel', 'Ananya Deshmukh', 'Sunil Kumar', 'Meera Joshi', 'Ramesh Yadav'];
    const categories = ['Eligibility Wizard', 'Document Vault', 'Scheme Application', 'General Support'];
    const messages = [
      'Found the eligibility wizard extremely accurate! Got selected for PM-KISAN in under 2 minutes.',
      'Can you please add more state-specific scholarships for OBC female students?',
      'Document checklist saved me hours of waiting at the CSC center.',
      'Direct link to Ayushman Bharat portal was super helpful!',
    ];
    const pickedName = names[Math.floor(Math.random() * names.length)];
    const pickedCat = categories[Math.floor(Math.random() * categories.length)];
    const pickedMsg = messages[Math.floor(Math.random() * messages.length)];
    const randomMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);

    addFeedbackSubmission({
      name: pickedName,
      email: `${pickedName.toLowerCase().replace(' ', '.')}@example.com`,
      mobile: randomMobile,
      state: 'Maharashtra',
      category: pickedCat,
      message: pickedMsg,
      rating: 5,
    });
    addToast(`Live feedback simulated from ${pickedName}`, 'success');
  };

  // Open Edit Form
  const handleOpenEdit = (s: Scheme) => {
    setEditingScheme(s);
    setFormName(s.name);
    setFormCategory(s.category);
    setFormMinistry(s.ministry);
    setFormShortDesc(s.short_description);
    setFormFullDesc(s.full_description);
    setFormBenefits(s.benefits.join('\n'));
    setFormGender(s.eligibility.gender || 'All');
    setFormAgeLimit(s.eligibility.age_limit || '');
    setFormIncomeLimit(s.eligibility.income_limit || '');
    setFormOccupation(s.eligibility.occupation || '');
    setFormDocs(s.required_documents.join(', '));
    setFormSteps(s.application_steps.join('\n'));
    setFormWebsite(s.official_website);
    setFormApplyLink(s.apply_link);
    setFormHelpline(s.helpline);
    setShowSchemeModal(true);
  };

  // Open Add Form
  const handleOpenAdd = () => {
    setEditingScheme(null);
    setFormName('');
    setFormCategory('Agriculture');
    setFormMinistry('Ministry of Agriculture & Farmers Welfare');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormBenefits('Direct benefit transfer (DBT)\nFinancial assistance\nSubsidized inputs');
    setFormGender('All');
    setFormAgeLimit('18 to 60 Years');
    setFormIncomeLimit('Below ₹2.5 Lakhs');
    setFormOccupation('Farmer');
    setFormDocs('Aadhaar Card, Bank Passbook, Land Ownership Proof');
    setFormSteps('Visit official portal\nFill digital application form\nUpload required documents');
    setFormWebsite('https://www.myscheme.gov.in');
    setFormApplyLink('https://www.myscheme.gov.in');
    setFormHelpline('1800-111-222');
    setShowSchemeModal(true);
  };

  const handleSaveScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMinistry.trim()) {
      addToast('Please enter scheme name and ministry.', 'warning');
      return;
    }

    if (formWebsite.trim() && !isValidHttpUrl(formWebsite)) {
      addToast('Official Website must be a valid http:// or https:// URL.', 'error');
      return;
    }

    if (formApplyLink.trim() && !isValidHttpUrl(formApplyLink)) {
      addToast('Application Link must be a valid http:// or https:// URL.', 'error');
      return;
    }

    const newSchemeData: Scheme = {
      id: editingScheme ? editingScheme.id : `custom-${Date.now()}`,
      name: formName,
      category: formCategory,
      ministry: formMinistry,
      short_description: formShortDesc,
      full_description: formFullDesc,
      benefits: formBenefits.split('\n').filter(Boolean),
      eligibility: {
        gender: formGender,
        age_limit: formAgeLimit,
        income_limit: formIncomeLimit,
        occupation: formOccupation,
      },
      required_documents: formDocs.split(',').map((d) => d.trim()).filter(Boolean),
      application_steps: formSteps.split('\n').filter(Boolean),
      keywords: [formName.toLowerCase(), formCategory.toLowerCase()],
      official_website: formWebsite,
      apply_link: formApplyLink,
      helpline: formHelpline,
      last_verified_date: new Date().toISOString().split('T')[0],
      source_url: formWebsite,
    };

    if (editingScheme) {
      updateScheme(newSchemeData);
      addToast('Scheme updated successfully!', 'success');
    } else {
      addScheme(newSchemeData);
      addToast('New scheme added to dataset!', 'success');
    }

    setShowSchemeModal(false);
  };

  // ADMIN LOGIN GATE IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-left space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-serif">
            {t('adminPanel')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in with your administrator credentials to manage the schemes dataset and access real-time telemetry.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Administrator Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Administrator Email</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@jansahayak.gov.in"
                disabled={isAuthenticating}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter administrator password"
                disabled={isAuthenticating}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-4 pr-11 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{isAuthenticating ? 'Authenticating...' : 'Sign In as Administrator'}</span>
          </button>
        </form>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Administrator Security Architecture</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Admin access is authenticated through Firebase Authentication. Administrator accounts must be registered in your Firebase Console project. Client-side authentication bypasses and hardcoded credentials are not permitted.
          </p>
        </div>
      </div>
    );
  }

  // ACCESS RESTRICTED SCREEN IF AUTHENTICATED BUT NOT AUTHORIZED (CUSTOM CLAIM MISSING)
  if (isAuthenticated && !isAdminAuthorized) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl text-left space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-serif">
            Access Restricted
          </h2>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
            Administrator Custom Claims Required
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-2 text-slate-800 dark:text-slate-200">
          <p>
            You are signed in as: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{adminUser?.email}</strong>
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            While your account credentials are valid, this account has not been assigned the <code className="font-mono font-bold text-rose-700 dark:text-rose-300">admin: true</code> custom claim. Ordinary user accounts cannot access administrative telemetry or modify welfare schemes.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200">How to assign admin privileges:</p>
          <p className="text-[11px] leading-relaxed">
            In accordance with security best practices, roles cannot be self-assigned by client code. Run the server provisioning script using the Firebase Admin SDK to grant the claim:
          </p>
          <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 text-[10px] font-mono overflow-x-auto">
            node scripts/set-admin-claim.mjs {adminUser?.email || 'admin@jansahayak.gov.in'}
          </pre>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Account</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md relative">
            <ShieldCheck className="w-6 h-6" />
            {syncPulse && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white font-serif">
                JanSahayak Admin Portal
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>LIVE REAL-TIME</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-2">
              <span>Real-time scheme management, search query audit, and feedback telemetry.</span>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">Synced at {lastSyncTime}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateLiveSearch}
            className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 dark:bg-sky-950/80 dark:hover:bg-sky-900 dark:text-sky-200 text-xs font-bold transition-all border border-sky-300 dark:border-sky-800 flex items-center gap-1.5"
            title="Simulate a real-time citizen search event"
          >
            <Zap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>+ Test Live Search</span>
          </button>

          <button
            onClick={handleSimulateLiveFeedback}
            className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 dark:bg-purple-950/80 dark:hover:bg-purple-900 dark:text-purple-200 text-xs font-bold transition-all border border-purple-300 dark:border-purple-800 flex items-center gap-1.5"
            title="Simulate a real-time citizen feedback entry"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>+ Test Live Feedback</span>
          </button>

          {adminUser?.email && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>{adminUser.email}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            title="Sign out of Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* METRICS STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schemes */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Published Schemes</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {schemes.length}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Central & State Datasets
          </p>
        </div>

        {/* Real-time Searches */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Live Search Queries</span>
            <Search className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <span>{searchLogs.length}</span>
            {searchLogs.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                +1 Live
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
            Top: <strong className="text-slate-900 dark:text-white">{topSearchTerm}</strong>
          </p>
        </div>

        {/* Feedback Submissions */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Citizen Feedbacks</span>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <span>{allFeedbacks.length}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{avgFeedbackRating}</span>
            </span>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold">
            Avg Rating: {avgFeedbackRating} / 5.0
          </p>
        </div>

        {/* System Health */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Telemetry Status</span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            100%
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Local & Client-Side Active
          </p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'analytics'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Analytics Dashboard</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('searches')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'searches'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Real-Time Search Logs ({searchLogs.length})</span>
          {searchLogs.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('feedback')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'feedback'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Citizen Feedback ({allFeedbacks.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('schemes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'schemes'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Scheme Manager ({schemes.length})</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS DASHBOARD */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Bar Chart: Schemes per Category */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Scheme Entries Count by Category</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">{schemes.length} Total</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Top Search Query Terms */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  <span>Most Frequently Searched Query Terms</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">{searchLogs.length} Logs</span>
              </div>
              {searchFreqChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={searchFreqChartData} layout="vertical">
                      <XAxis type="number" stroke="#888888" fontSize={10} tickLine={false} />
                      <YAxis dataKey="term" type="category" stroke="#888888" fontSize={10} tickLine={false} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#0284c7" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <Search className="w-8 h-8 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No search activity logged yet.</p>
                  <button
                    onClick={handleSimulateLiveSearch}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
                  >
                    Simulate Sample Searches
                  </button>
                </div>
              )}
            </div>

            {/* Pie Chart: Sector Distribution */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 lg:col-span-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sectoral Scheme Ratio Overview
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME SEARCH QUERY LOGS */}
      {activeAdminTab === 'searches' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-600" />
                <span>Real-Time Citizen Search Query Telemetry</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Every search performed on the home screen, schemes search bar, or voice assistant is logged here instantly in real-time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateLiveSearch}
                className="px-3 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Add Test Search</span>
              </button>

              {searchLogs.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all search logs?')) {
                      clearSearchLogs();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-xs font-bold hover:bg-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Logs</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={logSearchFilter}
              onChange={(e) => setLogSearchFilter(e.target.value)}
              placeholder="Filter search logs by query term or category..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Search Logs Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Search Query Term</th>
                  <th className="p-3.5">Category Context</th>
                  <th className="p-3.5">Results Count</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredSearchLogs.length > 0 ? (
                  filteredSearchLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{log.timestamp || 'Just now'}</span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        "{log.query}"
                      </td>
                      <td className="p-3.5 font-semibold">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {log.categoryFilter || 'All Categories'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                          {log.resultsCount} Matches
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => deleteSearchLog(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove log entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 space-y-3">
                      <Search className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold">No search query logs found.</p>
                      <button
                        onClick={handleSimulateLiveSearch}
                        className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-sm"
                      >
                        Simulate Real-Time Search Query
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CITIZEN FEEDBACK SUBMISSIONS */}
      {activeAdminTab === 'feedback' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>Citizen Helpdesk & Feedback Stream</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Submissions received from the Helpdesk & Contact Us page are logged here in real-time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateLiveFeedback}
                className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Test Feedback</span>
              </button>

              {allFeedbacks.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all citizen feedback?')) {
                      clearAllFeedback();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-xs font-bold hover:bg-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Submissions</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Filter for Feedback */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={feedbackSearchFilter}
              onChange={(e) => setFeedbackSearchFilter(e.target.value)}
              placeholder="Filter feedback by name, category, mobile, state or text..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Feedback Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((fb: any) => (
                <div key={fb.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative group">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{fb.name || 'Anonymous Citizen'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                          {fb.category || 'General Query'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {fb.mobile || fb.email ? `${fb.mobile || fb.email}${fb.state ? ` • ${fb.state}` : ''}` : 'Direct Submission'}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteFeedbackSubmission(fb.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete submission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    "{fb.message}"
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{fb.timestamp || 'Just now'}</span>
                    </span>

                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{fb.rating || 5} Stars</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">No citizen feedback records found.</p>
                <button
                  onClick={handleSimulateLiveFeedback}
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-sm"
                >
                  Simulate Citizen Feedback Submission
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SCHEME MANAGER (CRUD) */}
      {activeAdminTab === 'schemes' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Central Scheme Dataset Manager</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Add, edit, or remove official government scheme entries.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Scheme</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">Scheme Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Ministry</th>
                  <th className="p-3.5">Last Verified</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {schemes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold border border-slate-200 dark:border-slate-700">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-3.5 truncate max-w-[180px] font-medium text-slate-600 dark:text-slate-300">{s.ministry}</td>
                    <td className="p-3.5 font-mono text-slate-500">{s.last_verified_date}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 hover:bg-amber-200 transition-colors"
                        title="Edit Scheme"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete scheme "${s.name}"?`)) {
                            deleteScheme(s.id);
                            addToast('Scheme deleted.', 'info');
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 hover:bg-rose-200 transition-colors"
                        title="Delete Scheme"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHEME ADD / EDIT MODAL FORM */}
      {showSchemeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>{editingScheme ? 'Edit Scheme Entry' : 'Add New Central Scheme'}</span>
              </h3>
              <button onClick={() => setShowSchemeModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Scheme Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Agriculture">Agriculture</option>
                    <option value="Students">Students</option>
                    <option value="Health">Health</option>
                    <option value="Women">Women</option>
                    <option value="Housing">Housing</option>
                    <option value="Business">Business</option>
                    <option value="Employment">Employment</option>
                    <option value="Senior Citizens">Senior Citizens</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Ministry *</label>
                  <input
                    type="text"
                    required
                    value={formMinistry}
                    onChange={(e) => setFormMinistry(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Short Summary *</label>
                  <textarea
                    rows={2}
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Full Scheme Description</label>
                  <textarea
                    rows={3}
                    value={formFullDesc}
                    onChange={(e) => setFormFullDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Key Benefits (One per line)</label>
                  <textarea
                    rows={3}
                    value={formBenefits}
                    onChange={(e) => setFormBenefits(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Age Window</label>
                  <input
                    type="text"
                    value={formAgeLimit}
                    onChange={(e) => setFormAgeLimit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Income Cap</label>
                  <input
                    type="text"
                    value={formIncomeLimit}
                    onChange={(e) => setFormIncomeLimit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Required Documents (Comma separated)</label>
                  <input
                    type="text"
                    value={formDocs}
                    onChange={(e) => setFormDocs(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2.5 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Official Website URL</label>
                  <input
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSchemeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md transition-colors"
                >
                  Save Scheme Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
