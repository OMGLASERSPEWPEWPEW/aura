// src/pages/Settings.tsx
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { ArrowLeft, Settings as SettingsIcon, Zap } from 'lucide-react';

export default function Settings() {
  // Load user identity to get/set settings
  const userIdentity = useLiveQuery(() => db.userIdentity.get(1));

  const autoCompatibility = userIdentity?.settings?.autoCompatibility ?? false;

  const handleToggleAutoCompatibility = async () => {
    const newValue = !autoCompatibility;

    if (userIdentity) {
      // Update existing identity with new settings
      await db.userIdentity.update(1, {
        settings: {
          ...userIdentity.settings,
          autoCompatibility: newValue,
        },
        lastUpdated: new Date(),
      });
    } else {
      // Create new identity with settings (edge case)
      await db.userIdentity.add({
        id: 1,
        dataExports: [],
        textInputs: [],
        photos: [],
        manualEntry: {},
        settings: {
          autoCompatibility: newValue,
        },
        lastUpdated: new Date(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      {/* Header */}
      <div className="max-w-md mx-auto mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <SettingsIcon className="text-slate-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 text-sm">Configure app behavior</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* Auto-Compatibility Toggle */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-amber-500" />
                <h3 className="font-semibold text-slate-900">Auto-run compatibility analysis</h3>
              </div>
              <p className="text-sm text-slate-500">
                Automatically calculate virtue and aspect scores when saving new matches.
                Requires your profile to have synthesis data.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleToggleAutoCompatibility}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoCompatibility ? 'bg-violet-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  autoCompatibility ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {autoCompatibility && (
            <div className="mt-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
              <p className="text-xs text-violet-700">
                When you save a new match, Aura will automatically score their compatibility
                against your partner virtues and 23 Aspects profile in the background.
              </p>
            </div>
          )}
        </div>

        {/* Future settings sections can go here */}
      </div>
    </div>
  );
}
