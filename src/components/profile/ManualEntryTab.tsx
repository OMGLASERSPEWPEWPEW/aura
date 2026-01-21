// src/components/profile/ManualEntryTab.tsx
import { User, Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { ManualEntry } from '../../lib/db';

interface ManualEntryTabProps {
  manualEntry: ManualEntry;
  onManualEntryChange: (entry: ManualEntry) => void;
}

const ATTACHMENT_STYLES = [
  { value: 'secure', label: 'Secure', description: 'Comfortable with intimacy and independence' },
  { value: 'anxious', label: 'Anxious', description: 'Seeks closeness, worries about abandonment' },
  { value: 'avoidant', label: 'Avoidant', description: 'Values independence, uncomfortable with too much closeness' },
  { value: 'fearful-avoidant', label: 'Fearful-Avoidant', description: 'Desires closeness but fears getting hurt' },
  { value: 'unsure', label: 'Not Sure', description: 'Still figuring it out' },
];

export default function ManualEntryTab({ manualEntry, onManualEntryChange }: ManualEntryTabProps) {
  const [newInterest, setNewInterest] = useState('');

  const updateField = <K extends keyof ManualEntry>(field: K, value: ManualEntry[K]) => {
    onManualEntryChange({ ...manualEntry, [field]: value });
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    const interests = manualEntry.interests || [];
    if (!interests.includes(newInterest.trim())) {
      updateField('interests', [...interests, newInterest.trim()]);
    }
    setNewInterest('');
  };

  const removeInterest = (interest: string) => {
    const interests = manualEntry.interests || [];
    updateField('interests', interests.filter(i => i !== interest));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-blue-600" size={20} />
          <h2 className="font-semibold text-gray-800">Basic Info</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={manualEntry.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your name"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
            <input
              type="number"
              value={manualEntry.age || ''}
              onChange={(e) => updateField('age', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Your age"
              min={18}
              max={100}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
            <input
              type="text"
              value={manualEntry.occupation || ''}
              onChange={(e) => updateField('occupation', e.target.value)}
              placeholder="What you do"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={manualEntry.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="City, State"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Interests & Hobbies</h3>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addInterest()}
            placeholder="Add an interest..."
            className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addInterest}
            disabled={!newInterest.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {manualEntry.interests && manualEntry.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {manualEntry.interests.map((interest) => (
              <span
                key={interest}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {interest}
                <button
                  onClick={() => removeInterest(interest)}
                  className="hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attachment Style */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Attachment Style</h3>
        <p className="text-sm text-slate-500 mb-4">
          How do you typically relate to partners in relationships?
        </p>

        <div className="space-y-2">
          {ATTACHMENT_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => updateField('attachmentStyle', style.value)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                manualEntry.attachmentStyle === style.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`font-medium ${manualEntry.attachmentStyle === style.value ? 'text-blue-700' : 'text-slate-800'}`}>
                {style.label}
              </div>
              <div className="text-xs text-slate-500">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Relationship History */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Relationship History (Optional)</h3>
        <p className="text-sm text-slate-500 mb-3">
          Brief notes about past relationships, patterns you've noticed, or what hasn't worked.
        </p>
        <textarea
          value={manualEntry.relationshipHistory || ''}
          onChange={(e) => updateField('relationshipHistory', e.target.value)}
          placeholder="e.g., 'Tend to date people who are emotionally unavailable', 'Last relationship ended because of communication issues'..."
          className="w-full h-28 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}
