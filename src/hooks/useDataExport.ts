/**
 * useDataExport — downloads all user data from Supabase as a JSON file.
 * Implements DPDP Act 2023 data portability right.
 */
import { useState, useCallback } from 'react';
import { supabase, IS_SUPABASE_CONFIGURED } from '../lib/supabase';

interface ExportState {
  isExporting: boolean;
  error: string | null;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isDeleting: boolean;
}

export function useDataExport(parentId: string): ExportState {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      if (!IS_SUPABASE_CONFIGURED) {
        // Demo mode: export mock data stub
        const mockExport = {
          export_version: '1.0',
          exported_at: new Date().toISOString(),
          note: 'Demo mode — no real data. Connect Supabase to export live data.',
          parent: { id: parentId, name: 'Demo Parent' },
          dose_events: [],
          medicines: [],
          family_members: [],
          consent_records: [],
        };
        const blob = new Blob([JSON.stringify(mockExport, null, 2)], {
          type: 'application/json',
        });
        downloadBlob(blob, `carebox-data-export-${Date.now()}.json`);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all user data in parallel
      const [
        { data: parentData },
        { data: doseEvents },
        { data: medicines },
        { data: familyMembers },
        { data: consentRecords },
        { data: reminders },
      ] = await Promise.all([
        supabase.from('parents').select('*').eq('id', parentId),
        supabase.from('dose_events').select('*').eq('parent_id', parentId),
        supabase.from('medicines').select('*').eq('parent_id', parentId),
        supabase.from('family_members').select('*'),
        supabase.from('consent_records').select('*').eq('user_id', user.id),
        supabase.from('reminders').select('*').eq('parent_id', parentId),
      ]);

      const exportPayload = {
        export_version: '1.0',
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        parent: parentData?.[0] || null,
        dose_events: doseEvents || [],
        medicines: medicines || [],
        family_members: familyMembers || [],
        consent_records: consentRecords || [],
        reminders: reminders || [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      downloadBlob(blob, `carebox-export-${user.id}-${Date.now()}.json`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
      console.error('[Export] Error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [parentId]);

  const deleteAccount = useCallback(async () => {
    if (!IS_SUPABASE_CONFIGURED) {
      alert('Demo mode: Account deletion requires a live Supabase connection.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Soft-delete: anonymise PII first, then sign out
      // The Supabase Edge Function / trigger handles full purge after 30 days
      await supabase.from('parents').update({
        name: '[DELETED]',
        phone: null,
        sharing_paused: true,
      }).eq('id', parentId);

      await supabase.from('consent_records').update({
        withdrawn_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      // Sign out of all sessions
      await supabase.auth.signOut({ scope: 'global' });

      // Reload to show login screen
      window.location.href = '/';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      setError(msg);
      console.error('[Delete] Error:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [parentId]);

  return { isExporting, isDeleting, error, exportData, deleteAccount };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
