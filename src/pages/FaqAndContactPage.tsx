import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  HelpCircle, 
  ChevronDown, 
  Search, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare 
} from 'lucide-react';

export const FaqAndContactPage: React.FC = () => {
  const { addToast, addFeedbackSubmission, t } = useApp();

  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [category, setCategory] = useState('General Query');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'Is JanSahayak an official government service portal?',
      a: 'JanSahayak is an automated e-Governance discovery and guidance portal designed to assist citizens. All scheme data, eligibility criteria, and helpline numbers are sourced directly from official government portals (such as myScheme.gov.in and Ministry websites). Application links redirect to official .gov.in websites.'
    },
    {
      q: 'How does the Eligibility Wizard calculate my match percentage?',
      a: 'The portal evaluates your inputs (age, income, state, gender, landholding, social category) against statutory criteria extracted from central scheme guidelines. Scores above 80% indicate high eligibility.'
    },
    {
      q: 'Is my personal or financial data stored on remote servers?',
      a: 'No. JanSahayak operates client-side for eligibility screening. Your demographic choices, income bracket, and saved document checkboxes remain stored temporarily in your own browser session storage (sessionStorage) and are cleared when you close your browser tab.'
    },
    {
      q: 'What should I do if a benefit rate or subsidy amount changes?',
      a: 'While our seed data is periodically verified against official gazettes, government schemes may update interest rates or financial caps. Always use the "Verify on Official Website" link on scheme detail pages for real-time updates.'
    },
    {
      q: 'How do I apply for PM-KISAN or Ayushman Bharat?',
      a: 'Click "View Details" on the scheme card, review the required documents checklist, and click "Apply Online". You will be redirected to the official PM-KISAN or NHA portal.'
    }
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !message.trim()) {
      addToast('Please fill in all required form fields.', 'warning');
      return;
    }

    addFeedbackSubmission({
      name,
      mobile,
      state,
      category,
      message,
    });

    setSubmitted(true);
    addToast('Your feedback/query has been submitted successfully!', 'success');

    // Reset Form
    setName('');
    setMobile('');
    setMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Helpdesk & Citizen Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-serif">
          {t('faqsAndContact')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">
          Get answers to common queries regarding government scheme eligibility, document verification, and direct application steps.
        </p>
      </div>

      {/* SECTION 1: FAQ ACCORDION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CITIZEN FEEDBACK & SUPPORT FORM */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-600" />
            <span>Submit Citizen Query / Feedback</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Need help finding a specific scheme? Submit your query to our support desk.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
              Query Submitted Successfully
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
              Thank you! Your reference query has been logged. You can view all user submissions inside the Admin Panel.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
            >
              Submit Another Response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Query Topic
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="General Query">General Scheme Query</option>
                  <option value="Eligibility Issue">Eligibility Wizard Assistance</option>
                  <option value="Document Problem">Document Certificate Help</option>
                  <option value="Portal Feedback">Portal Feedback & Suggestions</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Detailed Message / Feedback *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or feedback in detail..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Form</span>
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
