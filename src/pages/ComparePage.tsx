import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORY_THEMES } from '../utils/categoryColors';
import { CATEGORY_NAMES } from '../utils/schemeLocalizer';
import { sanitizeSafeUrl } from '../utils/urlSecurity';
import { BarChart2, X, Plus, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const { 
    schemes, 
    compareSchemeIds, 
    toggleCompareScheme, 
    clearCompare, 
    setSelectedSchemeForDetail, 
    language,
    t 
  } = useApp();

  const comparedSchemes = schemes.filter((s) => compareSchemeIds.includes(s.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-serif flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-emerald-600" />
            <span>{t('compareMatrix')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {t('selectToCompare')} ({comparedSchemes.length}/4 selected)
          </p>
        </div>

        {comparedSchemes.length > 0 && (
          <button
            onClick={clearCompare}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300"
          >
            Clear Matrix
          </button>
        )}
      </div>

      {/* Selector Dropdown to add scheme */}
      {comparedSchemes.length < 4 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Plus className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Add Scheme to Matrix:
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                toggleCompareScheme(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="">-- Choose a Scheme to Add --</option>
            {schemes
              .filter((s) => !compareSchemeIds.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Matrix Table */}
      {comparedSchemes.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <th className="p-4 w-48 font-bold text-slate-500 uppercase tracking-wider">
                  Attribute / Parameter
                </th>
                {comparedSchemes.map((scheme) => {
                  const theme = CATEGORY_THEMES[scheme.category];
                  return (
                    <th key={scheme.id} className="p-4 min-w-[260px] align-top">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                          {CATEGORY_NAMES[language]?.[scheme.category] || scheme.category}
                        </span>
                        <button
                          onClick={() => toggleCompareScheme(scheme.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 font-serif leading-snug">
                        {scheme.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{scheme.ministry}</span>
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              
              {/* Row 1: Key Benefits */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  {t('benefits')}
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 align-top space-y-1.5">
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                      {s.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Row 2: Age Limit */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  Age Window
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 font-semibold">
                    {s.eligibility.age_limit || 'No specific limit'}
                  </td>
                ))}
              </tr>

              {/* Row 3: Income Cap */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  Income Limit
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 font-semibold text-emerald-700 dark:text-emerald-400">
                    {s.eligibility.income_limit || 'Not income-restricted'}
                  </td>
                ))}
              </tr>

              {/* Row 4: Gender */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  Gender Criteria
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 font-semibold">
                    {s.eligibility.gender || 'All genders'}
                  </td>
                ))}
              </tr>

              {/* Row 5: Target Occupation */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  Target Role
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 font-semibold">
                    {s.eligibility.occupation || 'All citizens'}
                  </td>
                ))}
              </tr>

              {/* Row 6: Required Documents */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  Required Documents
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 align-top">
                    <div className="flex flex-wrap gap-1">
                      {s.required_documents.map((doc, i) => (
                        <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[11px] font-medium">
                          • {doc}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 7: Advisory Notes if present */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  Rate Advisory
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 align-top">
                    {s.notes ? (
                      <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
                        {s.notes}
                      </div>
                    ) : (
                      <span className="text-slate-400">Stable scheme parameters</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 8: Action Links */}
              <tr>
                <td className="p-4 font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase">
                  Official Portals
                </td>
                {comparedSchemes.map((s) => (
                  <td key={s.id} className="p-4 space-y-2">
                    <button
                      onClick={() => setSelectedSchemeForDetail(s)}
                      className="w-full py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
                    >
                      {t('viewDetails')}
                    </button>
                    <a
                      href={sanitizeSafeUrl(s.apply_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 flex items-center justify-center gap-1"
                    >
                      <span>Apply Online</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <BarChart2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            No Schemes Selected for Comparison
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Browse schemes and click the "Compare" button on any card to place 2 to 4 schemes in a side-by-side comparison matrix.
          </p>
        </div>
      )}

    </div>
  );
};
