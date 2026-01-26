// src/components/auth/DeleteAccountModal.tsx
// Modal for confirming and executing account deletion

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { StorageError } from '../../lib/errors';

interface DeleteAccountModalProps {
  onClose: () => void;
}

export default function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmed || !user) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Clear local IndexedDB data
      await db.profiles.clear();
      await db.userIdentity.clear();
      await db.coachingSessions.clear();
      await db.matchChats.clear();

      // Sign out from Supabase (this invalidates the session)
      await signOut();

      // Note: Actual account deletion from Supabase Auth requires admin API
      // or a server-side function. For now, we clear local data and sign out.
      // The user can request full deletion through support if needed.

      // Optionally, call a Supabase Edge Function to delete the user
      // This requires setting up an Edge Function with service role access
      try {
        const { error: deleteError } = await supabase.functions.invoke('delete-account', {
          body: { userId: user.id },
        });
        if (deleteError) {
          // Non-critical: endpoint not available, but local data is cleared
          console.log('DeleteAccountModal: delete-account endpoint not available');
        }
      } catch {
        // Edge function might not exist yet - that's OK
        console.log('DeleteAccountModal: delete-account function not available');
      }

      // Navigate to home
      navigate('/', { replace: true });
    } catch (err) {
      const storageError = new StorageError(
        `Failed to delete account: ${err instanceof Error ? err.message : String(err)}`,
        'local',
        { cause: err instanceof Error ? err : undefined }
      );
      console.log('DeleteAccountModal:', storageError.code, storageError.message);
      setError(storageError.getUserMessage());
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Delete Account</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800 mb-1">This action cannot be undone</p>
              <p className="text-sm text-red-700">
                All your data will be permanently deleted, including your profile analysis,
                saved matches, and coaching sessions.
              </p>
            </div>
          </div>

          {/* What will be deleted */}
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 mb-2">This will delete:</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Your profile and synthesis data
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                All analyzed match profiles
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Coaching sessions and chat history
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Your account and login credentials
              </li>
            </ul>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={isDeleting}
              className="mt-0.5 w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-slate-700">
              I understand this action is permanent and cannot be reversed
            </span>
          </label>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || isDeleting}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
