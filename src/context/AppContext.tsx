import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Language, 
  ThemeMode, 
  FontSize, 
  AccentColor,
  Scheme, 
  UserEligibilityProfile, 
  UserDocumentState, 
  FeedbackSubmission, 
  SearchLog 
} from '../types';
import { SCHEMES_DATA } from '../data/schemesData';
import { TRANSLATIONS } from '../i18n/translations';
import { getLocalizedScheme } from '../utils/schemeLocalizer';
import { 
  saveFeedbackToFirestore, 
  saveSearchLogToFirestore, 
  trackAnalyticsEvent, 
  subscribeToFeedback, 
  subscribeToSearchLogs, 
  deleteFeedbackFromFirestore, 
  deleteSearchLogFromFirestore,
  subscribeToAuthState 
} from '../lib/firebase';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (theme: ThemeMode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  schemes: Scheme[];
  savedSchemeIds: string[];
  toggleSaveScheme: (schemeId: string) => void;
  isSchemeSaved: (schemeId: string) => boolean;
  clearSavedSchemes: () => void;
  
  compareSchemeIds: string[];
  toggleCompareScheme: (schemeId: string) => void;
  clearCompare: () => void;
  
  selectedSchemeForDetail: Scheme | null;
  setSelectedSchemeForDetail: (scheme: Scheme | null) => void;
  
  userProfile: UserEligibilityProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserEligibilityProfile>>;
  
  userDocuments: UserDocumentState;
  toggleUserDocument: (docName: string) => void;
  
  feedbackList: FeedbackSubmission[];
  feedbackSubmissions: FeedbackSubmission[];
  addFeedback: (fb: Omit<FeedbackSubmission, 'id' | 'timestamp'>) => void;
  addFeedbackSubmission: (fb: Omit<FeedbackSubmission, 'id' | 'timestamp'>) => void;
  deleteFeedbackSubmission: (id: string) => void;
  clearAllFeedback: () => void;
  
  searchLogs: SearchLog[];
  logSearchQuery: (query: string, count: number, category?: string) => void;
  clearSearchLogs: () => void;
  deleteSearchLog: (id: string) => void;
  
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Admin functions
  addCustomScheme: (scheme: Scheme) => void;
  updateCustomScheme: (scheme: Scheme) => void;
  deleteCustomScheme: (schemeId: string) => void;
  addScheme: (scheme: Scheme) => void;
  updateScheme: (scheme: Scheme) => void;
  deleteScheme: (schemeId: string) => void;
  
  // Translation helper
  t: (key: string) => string;
  
  // Analytics helper
  trackAnalyticsEvent: (eventName: string, params?: Record<string, any>) => void;
  
  // Toast
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const DEFAULT_PROFILE: UserEligibilityProfile = {
  age: 32,
  gender: 'Male',
  state: 'Maharashtra',
  socialCategory: 'General',
  annualIncomeLakhs: 2.5,
  isBpl: false,
  occupation: 'Farmer',
  isDisabled: false,
  isGirlChildInFamily: true,
  girlChildAge: 6,
  isPregnantOrLactating: false,
  isWidow: false,
  landholdingHectares: 1.5,
  hasHouse: true,
  isSeniorCitizen: false,
};

const DEFAULT_DOCUMENTS: UserDocumentState = {
  "Aadhaar card": true,
  "Bank account details": true,
  "Income certificate": true,
  "Ration card / SECC family ID": false,
  "Land ownership records / khatauni": true,
  "Caste certificate": false,
  "Disability certificate (UDID)": false,
  "Educational certificates": true,
  "MCP card (Mother-Child Protection)": false,
  "Udyam registration": false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('jansahayak_lang') as Language) || 'en';
  });
  
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('jansahayak_theme') as ThemeMode) || 'light';
  });
  
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('jansahayak_font') as FontSize) || 'md';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('jansahayak_accent_color') as AccentColor) || 'emerald';
  });
  
  const [activeTab, setActiveTabState] = useState<string>('home');
  const [selectedSchemeForDetail, setSelectedSchemeForDetailState] = useState<Scheme | null>(null);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    trackAnalyticsEvent('page_view', { page: tab });
  };

  const setSelectedSchemeForDetail = (scheme: Scheme | null) => {
    setSelectedSchemeForDetailState(scheme);
    if (scheme) {
      trackAnalyticsEvent('scheme_view', { 
        schemeId: scheme.id, 
        schemeName: scheme.name, 
        category: scheme.category 
      });
    }
  };
  
  // Schemes state (merges static data with localStorage custom edits)
  const [schemes, setSchemes] = useState<Scheme[]>(() => {
    const custom = localStorage.getItem('jansahayak_custom_schemes');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse custom schemes", e);
      }
    }
    return SCHEMES_DATA;
  });
  
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('jansahayak_saved_schemes');
    return saved ? JSON.parse(saved) : ['pm-kisan', 'ab-pmjay', 'sukanya-samriddhi'];
  });
  
  const [compareSchemeIds, setCompareSchemeIds] = useState<string[]>([]);
  
  const [userProfile, setUserProfile] = useState<UserEligibilityProfile>(() => {
    try {
      const sessionProf = sessionStorage.getItem('jansahayak_user_profile');
      if (sessionProf) return JSON.parse(sessionProf);
      // Clean up any legacy sensitive profile data stored in localStorage by previous versions
      localStorage.removeItem('jansahayak_user_profile');
    } catch (e) {
      // Non-blocking in restricted storage environments
    }
    return DEFAULT_PROFILE;
  });
  
  const [userDocuments, setUserDocuments] = useState<UserDocumentState>(() => {
    try {
      const sessionDocs = sessionStorage.getItem('jansahayak_user_docs');
      if (sessionDocs) return JSON.parse(sessionDocs);
      // Clean up any legacy sensitive documents checklist stored in localStorage
      localStorage.removeItem('jansahayak_user_docs');
    } catch (e) {
      // Non-blocking in restricted storage environments
    }
    return DEFAULT_DOCUMENTS;
  });
  
  // In-memory state for citizen feedback and search audit telemetry (not persisted to unencrypted localStorage)
  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>(() => {
    try {
      localStorage.removeItem('jansahayak_feedback');
    } catch {}
    return [];
  });
  
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>(() => {
    try {
      localStorage.removeItem('jansahayak_search_logs');
    } catch {}
    return [];
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('jansahayak_recent_searches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
    return ['PM Kisan', 'Ayushman Bharat', 'Health', 'Students', 'Housing Grant'];
  });
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('jansahayak_lang', lang);
    trackAnalyticsEvent('language_changed', { language: lang });
  };

  // Persist theme
  const setThemeMode = (theme: ThemeMode) => {
    setThemeModeState(theme);
    localStorage.setItem('jansahayak_theme', theme);
  };

  // Persist font size
  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('jansahayak_font', size);
  };

  // Persist accent color
  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem('jansahayak_accent_color', color);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark' || themeMode === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (themeMode === 'high-contrast') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [themeMode]);

  useEffect(() => {
    try {
      sessionStorage.setItem('jansahayak_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      // Non-blocking in restricted storage environments
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      sessionStorage.setItem('jansahayak_user_docs', JSON.stringify(userDocuments));
    } catch (e) {
      // Non-blocking in restricted storage environments
    }
  }, [userDocuments]);

  useEffect(() => {
    localStorage.setItem('jansahayak_saved_schemes', JSON.stringify(savedSchemeIds));
  }, [savedSchemeIds]);

  useEffect(() => {
    localStorage.setItem('jansahayak_custom_schemes', JSON.stringify(schemes));
  }, [schemes]);

  useEffect(() => {
    localStorage.setItem('jansahayak_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Cross-tab & Real-Time Firestore Sync Listener
  useEffect(() => {
    let unsubscribeFeedback = () => {};
    let unsubscribeLogs = () => {};

    // Only subscribe to administrative Firestore streams if a verified administrator is logged in
    const unsubscribeAuth = subscribeToAuthState((user, isAdmin) => {
      if (user && isAdmin) {
        unsubscribeFeedback = subscribeToFeedback((remoteFeedbacks) => {
          if (remoteFeedbacks && remoteFeedbacks.length > 0) {
            setFeedbackList((prevLocal) => {
              const combinedMap = new Map();
              prevLocal.forEach((item) => combinedMap.set(item.id, item));
              remoteFeedbacks.forEach((item) => combinedMap.set(item.id, item));
              return Array.from(combinedMap.values());
            });
          }
        });

        unsubscribeLogs = subscribeToSearchLogs((remoteLogs) => {
          if (remoteLogs && remoteLogs.length > 0) {
            setSearchLogs((prevLocal) => {
              const combinedMap = new Map();
              prevLocal.forEach((item) => combinedMap.set(item.id, item));
              remoteLogs.forEach((item) => combinedMap.set(item.id, item));
              return Array.from(combinedMap.values()).slice(0, 50);
            });
          }
        });
      } else {
        unsubscribeFeedback();
        unsubscribeLogs();
        // Clear in-memory administrative records and purge cached keys upon logout or loss of admin claims
        setFeedbackList([]);
        setSearchLogs([]);
        try {
          localStorage.removeItem('jansahayak_feedback');
          localStorage.removeItem('jansahayak_search_logs');
        } catch {}
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jansahayak_custom_schemes' && e.newValue) {
        try { setSchemes(JSON.parse(e.newValue)); } catch (err) {}
      }
    };

    const handleCustomSync = () => {
      const savedSchemes = localStorage.getItem('jansahayak_custom_schemes');
      if (savedSchemes) {
        try { setSchemes(JSON.parse(savedSchemes)); } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('jansahayak_data_updated', handleCustomSync);
    return () => {
      unsubscribeAuth();
      unsubscribeFeedback();
      unsubscribeLogs();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jansahayak_data_updated', handleCustomSync);
    };
  }, []);

  const addRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 5);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('jansahayak_recent_searches');
    addToast('Recent search history cleared', 'info');
  };

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleSaveScheme = (schemeId: string) => {
    if (savedSchemeIds.includes(schemeId)) {
      setSavedSchemeIds(savedSchemeIds.filter((id) => id !== schemeId));
      addToast('Scheme removed from saved list', 'info');
    } else {
      setSavedSchemeIds([...savedSchemeIds, schemeId]);
      addToast('Scheme saved to your bookmarks!', 'success');
    }
  };

  const isSchemeSaved = (schemeId: string) => savedSchemeIds.includes(schemeId);

  const clearSavedSchemes = () => {
    setSavedSchemeIds([]);
    localStorage.setItem('jansahayak_saved_schemes', JSON.stringify([]));
    addToast('Saved schemes cleared', 'info');
  };

  const toggleCompareScheme = (schemeId: string) => {
    if (compareSchemeIds.includes(schemeId)) {
      setCompareSchemeIds(compareSchemeIds.filter((id) => id !== schemeId));
      addToast('Removed from comparison', 'info');
    } else {
      if (compareSchemeIds.length >= 4) {
        addToast('You can compare a maximum of 4 schemes at a time.', 'warning');
        return;
      }
      setCompareSchemeIds([...compareSchemeIds, schemeId]);
      addToast('Added to comparison matrix', 'success');
    }
  };

  const clearCompare = () => {
    setCompareSchemeIds([]);
  };

  const toggleUserDocument = (docName: string) => {
    setUserDocuments((prev) => ({
      ...prev,
      [docName]: !prev[docName],
    }));
  };

  const addFeedback = (fb: Omit<FeedbackSubmission, 'id' | 'timestamp'>) => {
    const newFb: FeedbackSubmission = {
      ...fb,
      id: 'fb-' + Date.now(),
      timestamp: new Date().toLocaleString(),
    };
    const updated = [newFb, ...feedbackList];
    setFeedbackList(updated);
    window.dispatchEvent(new Event('jansahayak_data_updated'));
    
    // Save to Firestore asynchronously
    saveFeedbackToFirestore(fb).catch(() => {});
    addToast('Feedback submitted successfully!', 'success');
  };

  const deleteFeedbackSubmission = (id: string) => {
    const updated = feedbackList.filter((f) => f.id !== id);
    setFeedbackList(updated);
    window.dispatchEvent(new Event('jansahayak_data_updated'));
    
    // Delete from Firestore asynchronously
    deleteFeedbackFromFirestore(id).catch(() => {});
    addToast('Feedback entry deleted.', 'info');
  };

  const clearAllFeedback = () => {
    setFeedbackList([]);
    try {
      localStorage.removeItem('jansahayak_feedback');
    } catch {}
    window.dispatchEvent(new Event('jansahayak_data_updated'));
    addToast('All feedback records cleared from session.', 'info');
  };

  const logSearchQuery = (query: string, resultsCount: number, categoryFilter?: string) => {
    if (!query.trim()) return;
    addRecentSearch(query);
    const newLog: SearchLog = {
      id: 'log-' + Date.now(),
      query,
      resultsCount,
      categoryFilter,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    const updated = [newLog, ...searchLogs.slice(0, 49)];
    setSearchLogs(updated);
    window.dispatchEvent(new Event('jansahayak_data_updated'));

    // Save to Firestore asynchronously
    saveSearchLogToFirestore(query, resultsCount, categoryFilter).catch(() => {});
  };

  const clearSearchLogs = () => {
    setSearchLogs([]);
    try {
      localStorage.removeItem('jansahayak_search_logs');
    } catch {}
    window.dispatchEvent(new Event('jansahayak_data_updated'));
    addToast('Search query audit log cleared from session.', 'info');
  };

  const deleteSearchLog = (id: string) => {
    const updated = searchLogs.filter((l) => l.id !== id);
    setSearchLogs(updated);
    window.dispatchEvent(new Event('jansahayak_data_updated'));

    // Delete from Firestore asynchronously
    deleteSearchLogFromFirestore(id).catch(() => {});
    addToast('Search log entry removed.', 'info');
  };

  const addCustomScheme = (newScheme: Scheme) => {
    setSchemes([newScheme, ...schemes]);
    addToast(`New scheme "${newScheme.name}" added!`, 'success');
  };

  const updateCustomScheme = (updatedScheme: Scheme) => {
    setSchemes(schemes.map((s) => (s.id === updatedScheme.id ? updatedScheme : s)));
    addToast(`Scheme "${updatedScheme.name}" updated!`, 'success');
  };

  const deleteCustomScheme = (schemeId: string) => {
    const sName = schemes.find((s) => s.id === schemeId)?.name || 'Scheme';
    setSchemes(schemes.filter((s) => s.id !== schemeId));
    addToast(`Scheme "${sName}" deleted.`, 'info');
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || key;
  };

  const localizedSchemes = schemes.map((s) => getLocalizedScheme(s, language));
  const localizedSelectedScheme = selectedSchemeForDetail ? getLocalizedScheme(selectedSchemeForDetail, language) : null;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        themeMode,
        setThemeMode,
        fontSize,
        setFontSize,
        accentColor,
        setAccentColor,
        activeTab,
        setActiveTab,
        schemes: localizedSchemes,
        savedSchemeIds,
        toggleSaveScheme,
        isSchemeSaved,
        clearSavedSchemes,
        compareSchemeIds,
        toggleCompareScheme,
        clearCompare,
        selectedSchemeForDetail: localizedSelectedScheme,
        setSelectedSchemeForDetail,
        userProfile,
        setUserProfile,
        userDocuments,
        toggleUserDocument,
        feedbackList,
        feedbackSubmissions: feedbackList,
        addFeedback,
        addFeedbackSubmission: addFeedback,
        deleteFeedbackSubmission,
        clearAllFeedback,
        searchLogs,
        logSearchQuery,
        clearSearchLogs,
        deleteSearchLog,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        addCustomScheme,
        updateCustomScheme,
        deleteCustomScheme,
        addScheme: addCustomScheme,
        updateScheme: updateCustomScheme,
        deleteScheme: deleteCustomScheme,
        t,
        trackAnalyticsEvent,
        toasts,
        addToast,
        removeToast,
      }}
    >
      <div
        className={`${themeMode === 'dark' ? 'dark' : ''} ${
          themeMode === 'high-contrast' ? 'high-contrast' : ''
        }`}
      >
        <div
          className={`min-h-screen transition-colors duration-200 ${
            themeMode === 'high-contrast'
              ? 'bg-black text-yellow-300'
              : themeMode === 'dark'
              ? 'bg-slate-950 text-slate-100'
              : 'bg-slate-50 text-slate-900'
          } ${
            fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'
          }`}
        >
          {children}
        </div>
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
