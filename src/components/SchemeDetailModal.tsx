import React, { useState } from 'react';
import { Scheme } from '../types';
import { CATEGORY_THEMES } from '../utils/categoryColors';
import { CATEGORY_NAMES } from '../utils/schemeLocalizer';
import { useApp } from '../context/AppContext';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine';
import { generateSchemePDF } from '../utils/pdfGenerator';
import { sanitizeSafeUrl } from '../utils/urlSecurity';
import { 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Printer, 
  Download,
  Share2, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Sparkles, 
  CheckSquare, 
  Bookmark, 
  BookmarkCheck,
  Building2,
  ChevronRight
} from 'lucide-react';

interface SchemeDetailModalProps {
  scheme: Scheme;
  onClose: () => void;
}

export const SchemeDetailModal: React.FC<SchemeDetailModalProps> = ({ scheme, onClose }) => {
  const { 
    schemes,
    setSelectedSchemeForDetail,
    isSchemeSaved, 
    toggleSaveScheme, 
    userProfile, 
    userDocuments, 
    toggleUserDocument, 
    language,
    t 
  } = useApp();

  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'eligibility' | 'documents' | 'application'>('overview');

  const theme = CATEGORY_THEMES[scheme.category] || CATEGORY_THEMES['Agriculture'];
  const saved = isSchemeSaved(scheme.id);
  const localizedCategory = CATEGORY_NAMES[language]?.[scheme.category] || scheme.category;

  // Find up to 3 related schemes from the same ministry or category
  const relatedSchemes = React.useMemo(() => {
    if (!schemes || schemes.length === 0) return [];
    
    // Filter out current scheme
    const others = schemes.filter(s => s.id !== scheme.id);
    
    // 1. Same ministry AND same category
    const sameBoth = others.filter(s => s.ministry === scheme.ministry && s.category === scheme.category);
    
    // 2. Same ministry only
    const sameMinistry = others.filter(s => s.ministry === scheme.ministry && s.category !== scheme.category);
    
    // 3. Same category only
    const sameCategory = others.filter(s => s.category === scheme.category && s.ministry !== scheme.ministry);
    
    // Combine in order of priority
    const candidates = [...sameBoth, ...sameMinistry, ...sameCategory];
    
    // Deduplicate
    const uniqueCandidates: Scheme[] = [];
    const seenIds = new Set<string>();
    for (const item of candidates) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueCandidates.push(item);
      }
    }
    
    return uniqueCandidates.slice(0, 3);
  }, [schemes, scheme.id, scheme.ministry, scheme.category]);

  // Instant eligibility evaluation for current user profile
  const evalResult = evaluateSchemeEligibility(scheme, userProfile);

  // Document readiness calculation
  const totalDocs = scheme.required_documents.length;
  const ownedDocsCount = scheme.required_documents.filter(doc => userDocuments[doc] === true).length;
  const docReadinessPct = totalDocs > 0 ? Math.round((ownedDocsCount / totalDocs) * 100) : 100;

  const handleDownloadPDF = () => {
    generateSchemePDF(scheme);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(`Check out ${scheme.name} on JanSahayak Portal: ${scheme.official_website}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in print:static print:bg-white print:p-0">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Header */}
        <div className={`p-6 border-b ${theme.bgLight} ${theme.bgDark} ${theme.border} flex items-start justify-between gap-4 print:bg-white print:border-b-2 print:border-slate-900`}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                {localizedCategory}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                {scheme.ministry}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif leading-tight">
              {scheme.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={() => toggleSaveScheme(scheme.id)}
              className={`p-2.5 rounded-xl border transition-colors ${
                saved 
                  ? 'bg-emerald-600 text-white border-emerald-500' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title={saved ? 'Bookmarked' : 'Bookmark Scheme'}
            >
              {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="p-2.5 px-3 rounded-xl border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title={t('downloadSummary')}
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">{t('downloadSummary')}</span>
            </button>

            <button
              onClick={handleShareWhatsapp}
              className="p-2.5 rounded-xl border bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
              title="Share on WhatsApp"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950 text-sm font-bold overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveDetailTab('overview')}
            className={`py-3.5 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeDetailTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Overview & Benefits
          </button>

          <button
            onClick={() => setActiveDetailTab('eligibility')}
            className={`py-3.5 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeDetailTab === 'eligibility'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Eligibility Analysis</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              evalResult.status === 'eligible' 
                ? 'bg-emerald-500 text-white' 
                : evalResult.status === 'possibly_eligible' 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-rose-500 text-white'
            }`}>
              {evalResult.matchScore}% Match
            </span>
          </button>

          <button
            onClick={() => setActiveDetailTab('documents')}
            className={`py-3.5 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeDetailTab === 'documents'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Documents Checklist</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.2 rounded-full">
              {docReadinessPct}% Ready
            </span>
          </button>

          <button
            onClick={() => setActiveDetailTab('application')}
            className={`py-3.5 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeDetailTab === 'application'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Application Steps
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Print-Only Header Banner */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-serif">
                  JanSahayak Government Scheme Portal
                </h1>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  Official Citizen Welfare Scheme Summary & Requirement Roadmap
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p className="font-bold">Printed: {new Date().toLocaleDateString()}</p>
                <p className="text-emerald-700 font-bold">www.jansahayak.gov.in</p>
              </div>
            </div>
          </div>

          {/* Volatile Rate Warning Note Badge (as required by prompt) */}
          {scheme.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 p-4 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Official Rate / Figure Advisory:</p>
                <p className="leading-relaxed">{scheme.notes}</p>
                {(() => {
                  const safeWebsite = sanitizeSafeUrl(scheme.official_website, '');
                  if (!safeWebsite) return null;
                  return (
                    <div className="pt-1">
                      <a
                        href={safeWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 underline hover:text-amber-800"
                      >
                        <span>{t('verifyOnSite')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW & BENEFITS */}
          <div className={activeDetailTab === 'overview' ? 'space-y-6 block' : 'space-y-6 hidden print:block'}>
            {/* Full Description */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs border-l-4 border-emerald-600 pl-2">
                Scheme Background & Description
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {scheme.full_description}
              </p>
            </div>

            {/* Key Benefits List */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs border-l-4 border-emerald-600 pl-2">
                Key Benefits & Direct Assistance
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {scheme.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TAB 2: ELIGIBILITY ANALYSIS */}
          <div className={activeDetailTab === 'eligibility' ? 'space-y-6 block' : 'space-y-6 hidden print:block'}>
            {/* Automated Evaluation Header Card */}
            <div className={`p-5 rounded-2xl border ${
              evalResult.status === 'eligible' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100'
                : evalResult.status === 'possibly_eligible'
                ? 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100'
                : 'bg-rose-50 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100'
            }`}>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-bold text-sm uppercase tracking-wider">
                  {evalResult.status === 'eligible' ? '✅ Eligible for Application' : evalResult.status === 'possibly_eligible' ? '⚠️ Possibly Eligible' : '❌ Likely Ineligible'}
                </span>
                <span className="text-lg font-black font-mono">
                  Match: {evalResult.matchScore}%
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed">
                {evalResult.primaryReason}
              </p>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Age Window</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {scheme.eligibility.age_limit || 'No specific limit'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Income Cap</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {scheme.eligibility.income_limit || 'Not income-restricted'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Gender Criteria</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {scheme.eligibility.gender || 'All genders'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Target Occupation</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {scheme.eligibility.occupation || 'All citizens'}
                </p>
              </div>
            </div>

            {/* Exclusions if present */}
            {scheme.eligibility.exclusions && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 space-y-1 text-rose-900 dark:text-rose-200">
                <span className="text-xs font-bold uppercase tracking-wider">Specific Scheme Exclusions</span>
                <p className="text-xs leading-relaxed">
                  {scheme.eligibility.exclusions}
                </p>
              </div>
            )}
          </div>

          {/* TAB 3: DOCUMENTS CHECKLIST */}
          <div className={activeDetailTab === 'documents' ? 'space-y-6 block' : 'space-y-6 hidden print:block'}>
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Your Application Readiness Score
                </h4>
                <p className="text-xs text-slate-500">
                  You possess {ownedDocsCount} of {totalDocs} required documents.
                </p>
              </div>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {docReadinessPct}%
              </span>
            </div>

            <div className="space-y-2">
              {scheme.required_documents.map((doc, idx) => {
                const isChecked = userDocuments[doc] === true;
                return (
                  <label
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleUserDocument(doc)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {doc}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isChecked ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {isChecked ? 'Ready' : 'Missing'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* TAB 4: APPLICATION STEPS */}
          <div className={activeDetailTab === 'application' ? 'space-y-6 block' : 'space-y-6 hidden print:block'}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs border-l-4 border-emerald-600 pl-2">
              Step-by-Step Application Roadmap
            </h3>

            <div className="relative pl-6 border-l-2 border-emerald-500 space-y-6 my-4">
              {scheme.application_steps.map((step, idx) => (
                <div key={idx} className="relative group">
                  <span className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                    {idx + 1}
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Schemes Section */}
          {relatedSchemes.length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('relatedSchemes')}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {scheme.ministry} • {localizedCategory}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedSchemes.map((rel) => {
                  const relTheme = CATEGORY_THEMES[rel.category] || CATEGORY_THEMES['Agriculture'];
                  const relCategoryName = CATEGORY_NAMES[language]?.[rel.category] || rel.category;
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => {
                        setSelectedSchemeForDetail(rel);
                        setActiveDetailTab('overview');
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all text-left flex flex-col justify-between group shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${relTheme.badgeBg} ${relTheme.badgeText}`}>
                            {relCategoryName}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[90px]">
                            {rel.ministry.replace('Ministry of ', '')}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-normal">
                          {rel.short_description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <span>View Scheme</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verification & Metadata Section (Mandatory Prompt Requirements) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Verified Date: <strong className="text-slate-700 dark:text-slate-300">{scheme.last_verified_date}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Source:</span>
              <a
                href={sanitizeSafeUrl(scheme.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-400 font-bold underline hover:text-emerald-800 truncate max-w-[200px]"
              >
                {scheme.source_url}
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Helpline: <strong className="text-slate-900 dark:text-white font-mono">{scheme.helpline}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 rounded-xl border border-emerald-600 dark:border-emerald-500 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadSummary')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
              title="Print Summary"
            >
              <Printer className="w-4 h-4 text-slate-500" />
            </button>

            <a
              href={sanitizeSafeUrl(scheme.official_website)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5"
            >
              <span>Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={sanitizeSafeUrl(scheme.apply_link)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-md flex items-center gap-1.5"
            >
              <span>{t('applyOnline')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
