/**
 * InviteScreen — Admin invites a new family member by email.
 * Shows existing members, their role, and status.
 * Uses Supabase Auth magic link invitation flow.
 */
import React, { useState } from 'react';
import { UserPlus, Mail, CheckCircle, Crown, Eye, X, Loader2, Users, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { inviteFamilyMember } from '../../lib/dataService';
import { MOCK_FAMILY_ID } from '../../mocks/initialData';
import { sanitizeEmail, sanitizeRole, globalClientRateLimiter } from '../../lib/security';
import { canUserManageMembers } from '../../lib/authRules';

const InviteScreen: React.FC = () => {
  const { familyMembers, parent, showToast, setCurrentStep, setCurrentTab } = useApp();
  const { user, userRole } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUserManageMembers(userRole, true)) {
      setError('Access denied: Only family admins can invite members.');
      return;
    }

    if (!globalClientRateLimiter.canExecute('invite_member', 1500)) {
      setError('Please wait a moment before sending another invite.');
      return;
    }

    const { isValid, sanitized: cleanEmail } = sanitizeEmail(email);
    if (!isValid) {
      setError('Please enter a valid email address.');
      return;
    }

    const cleanRole = sanitizeRole(role) || 'viewer';

    setIsSubmitting(true);
    setError(null);

    const inviterName = user?.user_metadata?.name ?? 'A family member';
    const { error: inviteError } = await inviteFamilyMember(
      MOCK_FAMILY_ID,
      inviterName,
      cleanEmail,
      cleanRole
    );

    if (inviteError) {
      setError(inviteError);
    } else {
      setInviteSent(true);
      showToast(`Invitation sent to ${cleanEmail} as ${cleanRole}.`);
    }
    setIsSubmitting(false);
  };

  const RoleBadge: React.FC<{ role: 'admin' | 'viewer' }> = ({ role: r }) => (
    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-inter font-medium ${
      r === 'admin'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-500'
    }`}>
      {r === 'admin' ? <Crown className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      {r === 'admin' ? 'Admin' : 'Viewer'}
    </span>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 pt-safe-top pt-4 pb-4 border-b border-slate-100 flex items-center gap-3">
        <button
          onClick={() => {
            setCurrentStep('main');
            setCurrentTab('settings');
          }}
          className="p-1.5 -ml-1 text-slate-600 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-poppins">Family Circle</h2>
          <p className="text-slate-500 text-xs font-inter mt-0.5">
            Manage who can see {parent.name}'s dose status
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Current Members */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700 font-poppins">Current Members</h3>
          </div>
          <div className="space-y-2">
            {familyMembers.map((member) => {
              const initials = member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={member.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm font-poppins">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm font-poppins truncate">
                      {member.name} {member.isCurrentUser && <span className="text-teal-500 font-normal text-xs">(you)</span>}
                    </p>
                    <p className="text-slate-400 text-xs font-inter">{member.relation || 'Family member'}</p>
                  </div>
                  <RoleBadge role={member.role} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Role explanation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
            <Crown className="w-5 h-5 text-amber-600 mb-2" />
            <p className="text-sm font-semibold text-amber-800 font-poppins">Admin</p>
            <p className="text-xs text-amber-700 font-inter leading-relaxed mt-1">
              Can send nudges, edit medicines, manage members
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
            <Eye className="w-5 h-5 text-slate-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700 font-poppins">Viewer</p>
            <p className="text-xs text-slate-500 font-inter leading-relaxed mt-1">
              Can see dose status. Cannot send nudges or make changes
            </p>
          </div>
        </div>

        {/* Invite Form */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-700 font-poppins">Invite Someone</h3>
          </div>

          {inviteSent ? (
            <div className="bg-emerald-50 rounded-2xl p-5 flex flex-col items-center text-center border border-emerald-200">
              <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="font-semibold text-emerald-800 font-poppins">Invitation sent!</p>
              <p className="text-emerald-700 text-sm font-inter mt-1">
                <strong>{email}</strong> will receive an email to join the family circle.
              </p>
              <button
                onClick={() => { setInviteSent(false); setEmail(''); }}
                className="mt-4 text-sm text-teal-600 font-inter font-medium hover:underline"
              >
                Invite another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-500" />
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="family@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-inter focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>

              {/* Role selector */}
              <div className="flex gap-2">
                {(['viewer', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all font-poppins flex items-center justify-center gap-1.5 ${
                      role === r
                        ? r === 'admin'
                          ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
                          : 'bg-teal-100 text-teal-700 border-2 border-teal-400'
                        : 'bg-slate-100 text-slate-500 border-2 border-transparent hover:border-slate-300'
                    }`}
                  >
                    {r === 'admin' ? <Crown className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2">
                  <X className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-xs font-inter">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm font-poppins shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Send Invitation</>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 font-inter">
                They will receive a secure magic link. No password needed.
              </p>
            </form>
          )}
        </section>

        {/* Privacy reminder */}
        <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
          <p className="text-teal-700 text-xs font-inter leading-relaxed">
            <strong>Privacy reminder:</strong> All family members see dose status only — green, amber, or grey.
            No location, no camera. {parent.name} can pause sharing at any time.
          </p>
        </div>

        <div className="pb-6" />
      </div>
    </div>
  );
};

export default InviteScreen;
