import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, BarChart2, Share2, Check, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_WEEK_MATRIX } from '../../mocks/initialData';
import { LoadingState } from '../common/LoadingState';

export const HistoryScreen: React.FC = () => {
  const { setCurrentTab, parent, isLoading, showToast } = useApp();
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading && !parent) {
    return <LoadingState message="Loading adherence history..." className="min-h-[400px]" />;
  }

  const doctorReportText = `CAREBOX FAMILY — MEDICATION ADHERENCE SUMMARY
Patient: ${parent.name} (${parent.relationName})
Period: Oct 6 – Oct 12, 2025
Summary: 12 of 14 scheduled doses confirmed (86% adherence)
Morning Doses: 6/6 confirmed
Afternoon Doses: 4/6 confirmed (2 late)
Night Doses: 6/6 confirmed

Prescribed Medications:
- Metformin 500mg: Morning & Night
- Atorvastatin 10mg: Night
- Vitamin D3 1000 IU: Morning
- Calcium + D3: Night

Note: Factual confirmation log generated via CareBox Family. Not medical advice.`;

  const handleCopyReport = () => {
    navigator.clipboard?.writeText(doctorReportText);
    setCopied(true);
    showToast('Adherence summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#FCF6EE] px-5 py-4 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentTab('today')}
          className="p-2 -ml-2 text-[#1F4E4B] hover:text-[#2E7D79] rounded-full transition-colors"
          aria-label="Back to Today"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-semibold text-base text-[#1F4E4B]">
          History
        </h1>
        <div className="w-7" />
      </div>

      {/* Segmented Toggle: Weekly / Monthly */}
      <div className="bg-[#E5EAE9]/70 p-1 rounded-2xl flex items-center mb-5">
        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
            viewMode === 'weekly'
              ? 'bg-[#2E7D79] text-white shadow-sm'
              : 'text-[#597573] hover:text-[#1F4E4B]'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
            viewMode === 'monthly'
              ? 'bg-[#2E7D79] text-white shadow-sm'
              : 'text-[#597573] hover:text-[#1F4E4B]'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between text-xs font-medium text-[#1F4E4B] mb-4 px-1">
        <button
          onClick={() => showToast('Previous week loaded.')}
          className="p-1.5 text-[#597573] hover:text-[#1F4E4B] rounded-full"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-heading font-semibold text-sm">
          Oct 6 – Oct 12, 2025
        </span>
        <button
          onClick={() => showToast('Next week loaded.')}
          className="p-1.5 text-[#597573] hover:text-[#1F4E4B] rounded-full"
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Matrix Card matching Screen 5 */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-[#E5EAE9] mb-5">
        <div className="grid grid-cols-7 gap-2 text-center mb-3">
          {INITIAL_WEEK_MATRIX.map((day) => (
            <span key={day.dayLabel} className="text-xs font-medium text-[#8E9E9C]">
              {day.dayLabel}
            </span>
          ))}
        </div>

        {/* 3 Rows of circles (Morning, Afternoon, Night) */}
        {(['morning', 'afternoon', 'night'] as const).map((slotKey) => (
          <div key={slotKey} className="grid grid-cols-7 gap-2 py-1.5">
            {INITIAL_WEEK_MATRIX.map((day, idx) => {
              const status = day[slotKey];
              return (
                <div key={idx} className="flex justify-center">
                  {status === 'taken' ? (
                    <div className="w-5 h-5 rounded-full bg-[#27A348] flex items-center justify-center text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : status === 'late' ? (
                    <div className="w-5 h-5 rounded-full bg-[#F2B33D] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#E5EAE9]" />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-[#F0F4F3] text-[11px] text-[#597573]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#27A348]" />
            <span>All taken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F2B33D]" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C3CDCC]" />
            <span>Missed</span>
          </div>
        </div>
      </div>

      {/* Insight Card matching Screen 5 */}
      <div className="bg-[#EBF7EE] border border-[#27A348]/20 rounded-2xl p-4 mb-5 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#27A348]/15 flex items-center justify-center shrink-0">
          <BarChart2 className="w-5 h-5 text-[#1E8238]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1E8238]">
            {parent.relationName} took 12 of 14 doses this week.
          </p>
          <p className="text-xs text-[#2E7D79]/80 mt-0.5">
            Routine is strong. Morning doses are 100% on time.
          </p>
        </div>
      </div>

      {/* Action Button: Share with doctor */}
      <div className="mt-auto pb-2">
        <button
          id="btn-share-doctor"
          onClick={() => setShowShareModal(true)}
          className="w-full py-4 bg-[#2E7D79] hover:bg-[#246562] active:scale-[0.99] text-white font-medium text-base rounded-2xl shadow-soft flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Share2 className="w-4 h-4" />
          <span>Share with doctor</span>
        </button>
      </div>

      {/* Share with Doctor Modal */}
      {showShareModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-float border border-[#E5EAE9]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-base text-[#1F4E4B] mb-2">
              Share with Doctor
            </h3>
            <p className="text-xs text-[#597573] mb-3">
              Copy or export a factual, plain-text medicine adherence summary.
            </p>

            <pre className="bg-[#F0F7F6] p-3 rounded-xl text-[11px] text-[#1F4E4B] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto mb-4 border border-[#2E7D79]/15">
              {doctorReportText}
            </pre>

            <div className="space-y-2">
              <button
                onClick={handleCopyReport}
                className="w-full py-3 bg-[#2E7D79] text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#246562]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 bg-gray-100 text-[#597573] text-xs font-medium rounded-xl hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
