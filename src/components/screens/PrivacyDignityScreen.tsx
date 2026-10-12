import React from 'react';
import {
  ArrowLeft,
  Bell,
  Clock,
  Shield,
  Users,
  Heart,
  ChevronRight,
  FileText,
  Sliders,
  Trash2,
  Download,
  UserPlus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const PrivacyDignityScreen: React.FC = () => {
  const {
    setCurrentTab,
    setCurrentStep,
    privacySettings,
    setPrivacySettings,
    familyMembers,
    parent,
    toggleSharingPause,
    setSubView,
    showToast,
  } = useApp();

  const { userRole } = useAuth();

  const handleToggle = (key: keyof typeof privacySettings) => {
    if (userRole !== 'admin') {
      showToast('Permission denied: Only family admins can modify privacy preferences.');
      return;
    }
    setPrivacySettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast(`Privacy preference updated.`);
      return updated;
    });
  };

  const handleSharingPauseToggle = () => {
    if (userRole !== 'admin') {
      showToast('Permission denied: Only family admins or Mom can toggle sharing.');
      return;
    }
    toggleSharingPause();
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
          Privacy &amp; Dignity
        </h1>
        <div className="w-7" />
      </div>

      {/* Section 1: Sharing Options */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-[#8E9E9C] uppercase tracking-wider mb-2.5">
          Sharing options
        </h2>

        <div className="bg-white rounded-2xl shadow-card border border-[#E5EAE9] divide-y divide-[#F0F4F3]">
          {/* Toggle 1: Status only */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E8F3F1] text-[#2E7D79] flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1F4E4B]">
                  Show status only (no location)
                </h3>
                <p className="text-xs text-[#597573] mt-0.5">
                  We only show medicine status, never location or live feed.
                </p>
              </div>
            </div>

            <button
              role="switch"
              aria-checked={privacySettings.showStatusOnly}
              onClick={() => handleToggle('showStatusOnly')}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                privacySettings.showStatusOnly ? 'bg-[#27A348]' : 'bg-[#C3CDCC]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  privacySettings.showStatusOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Gentle reminders only */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E8F3F1] text-[#2E7D79] flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1F4E4B]">
                  Gentle reminders only
                </h3>
                <p className="text-xs text-[#597573] mt-0.5">
                  One nudge if a dose isn&apos;t confirmed (after set time).
                </p>
              </div>
            </div>

            <button
              role="switch"
              aria-checked={privacySettings.gentleRemindersOnly}
              onClick={() => handleToggle('gentleRemindersOnly')}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                privacySettings.gentleRemindersOnly ? 'bg-[#27A348]' : 'bg-[#C3CDCC]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  privacySettings.gentleRemindersOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 3: Parent can pause sharing */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E8F3F1] text-[#2E7D79] flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1F4E4B]">
                  Parent can pause sharing
                </h3>
                <p className="text-xs text-[#597573] mt-0.5">
                  {parent.relationName} can turn off sharing anytime.
                </p>
              </div>
            </div>

            <button
              role="switch"
              aria-checked={!parent.sharingPaused}
              onClick={handleSharingPauseToggle}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                !parent.sharingPaused ? 'bg-[#27A348]' : 'bg-[#C3CDCC]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  !parent.sharingPaused ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Who can see this */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-[#8E9E9C] uppercase tracking-wider">
            Who can see this
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#597573] font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#2E7D79]" />
              <span>{familyMembers.length} people</span>
            </span>
            <button
              onClick={() => {
                if (userRole !== 'admin') {
                  showToast('Permission denied: Only family admins can invite members.');
                  return;
                }
                setCurrentStep('invite');
              }}
              className="text-xs font-semibold text-[#1F4E4B] bg-[#E8F3F1] hover:bg-[#D4EAE7] px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
              title="Invite another family member"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#2E7D79]" />
              <span>+ Invite</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-[#E5EAE9] divide-y divide-[#F0F4F3]">
          {familyMembers.map((member) => (
            <div key={member.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E8F3F1] text-[#2E7D79] flex items-center justify-center font-semibold text-xs">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#1F4E4B]">{member.name}</span>
                    <span className="text-[11px] text-[#8E9E9C]">({member.relation})</span>
                  </div>
                  <span className="text-[10px] text-[#597573] block">
                    {member.role === 'admin' ? 'Can edit schedules & members' : 'View-only calendar access'}
                  </span>
                </div>
              </div>

              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  member.role === 'admin'
                    ? 'bg-[#E8F3F1] text-[#2E7D79]'
                    : 'bg-[#F0F4F3] text-[#8E9E9C]'
                }`}
              >
                {member.role === 'admin' ? 'Admin' : 'View only'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Extra Settings & Legal Options */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-[#8E9E9C] uppercase tracking-wider mb-2.5">
          Preferences &amp; Legal
        </h2>

        <div className="bg-white rounded-2xl shadow-card border border-[#E5EAE9] divide-y divide-[#F0F4F3]">
          <button
            onClick={() => setSubView('schedules')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-[#2E7D79]" />
              <span className="text-xs font-medium text-[#1F4E4B]">Dose schedules &amp; nudge delay (60m)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C3CDCC]" />
          </button>

          <button
            onClick={() => setSubView('terms')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#2E7D79]" />
              <span className="text-xs font-medium text-[#1F4E4B]">Terms of Service</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C3CDCC]" />
          </button>

          <button
            onClick={() => setSubView('privacy-policy')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#2E7D79]" />
              <span className="text-xs font-medium text-[#1F4E4B]">Privacy Policy (India DPDP Act 2023)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C3CDCC]" />
          </button>

          <button
            onClick={() => {
              const dataBlob = JSON.stringify({ parent, familyMembers, privacySettings }, null, 2);
              const url = URL.createObjectURL(new Blob([dataBlob], { type: 'application/json' }));
              const a = document.createElement('a');
              a.href = url;
              a.download = `carebox_data_export_${Date.now()}.json`;
              a.click();
              showToast('Data exported successfully.');
            }}
            className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-[#2E7D79]" />
              <span className="text-xs font-medium text-[#1F4E4B]">Export all my data (JSON)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C3CDCC]" />
          </button>

          <button
            onClick={() => {
              if (userRole !== 'admin') {
                showToast('Permission denied: Only family admins can delete family accounts.');
                return;
              }
              if (window.confirm('Are you sure you want to delete your account and all medicine data?')) {
                showToast('Account and personal data deleted.');
              }
            }}
            className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 text-left transition-colors text-amber-700"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-[#D89825]" />
              <span className="text-xs font-medium text-[#D89825]">Delete account &amp; data</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C3CDCC]" />
          </button>
        </div>
      </div>

      {/* Dignity Banner matching Screen 7 */}
      <div className="bg-[#EBF7EE] border border-[#27A348]/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#27A348]/15 flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-[#27A348] fill-[#27A348]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#1E8238]">
            {parent.relationName} stays in control.
          </p>
          <p className="text-[11px] text-[#2E7D79]/80 mt-0.5">
            Your privacy, her choice. No tracking, ever.
          </p>
        </div>
      </div>
    </div>
  );
};
