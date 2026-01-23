// src/components/profile/ManualEntryTab.tsx
import { User, Plus, X, Sparkles, Heart } from 'lucide-react';
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

const RELATIONSHIP_STYLES = [
  { value: 'monogamous', label: 'Monogamous', description: 'Exclusive romantic relationship with one person' },
  { value: 'enm', label: 'Ethically Non-Monogamous', description: 'Open to multiple ethical connections with transparency' },
  { value: 'polyamorous', label: 'Polyamorous', description: 'Multiple loving relationships with the knowledge of all involved' },
  { value: 'open', label: 'Open Relationship', description: 'Primary partnership with openness to other connections' },
  { value: 'exploring', label: 'Still Exploring', description: 'Learning what works best for you' },
];

const ZODIAC_SIGNS = [
  { value: 'aries', label: 'Aries', symbol: '\u2648', dates: 'Mar 21 - Apr 19' },
  { value: 'taurus', label: 'Taurus', symbol: '\u2649', dates: 'Apr 20 - May 20' },
  { value: 'gemini', label: 'Gemini', symbol: '\u264A', dates: 'May 21 - Jun 20' },
  { value: 'cancer', label: 'Cancer', symbol: '\u264B', dates: 'Jun 21 - Jul 22' },
  { value: 'leo', label: 'Leo', symbol: '\u264C', dates: 'Jul 23 - Aug 22' },
  { value: 'virgo', label: 'Virgo', symbol: '\u264D', dates: 'Aug 23 - Sep 22' },
  { value: 'libra', label: 'Libra', symbol: '\u264E', dates: 'Sep 23 - Oct 22' },
  { value: 'scorpio', label: 'Scorpio', symbol: '\u264F', dates: 'Oct 23 - Nov 21' },
  { value: 'sagittarius', label: 'Sagittarius', symbol: '\u2650', dates: 'Nov 22 - Dec 21' },
  { value: 'capricorn', label: 'Capricorn', symbol: '\u2651', dates: 'Dec 22 - Jan 19' },
  { value: 'aquarius', label: 'Aquarius', symbol: '\u2652', dates: 'Jan 20 - Feb 18' },
  { value: 'pisces', label: 'Pisces', symbol: '\u2653', dates: 'Feb 19 - Mar 20' },
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

  const toggleRelationshipStyle = (styleValue: string) => {
    const currentStyles = manualEntry.relationshipStyle || [];
    if (currentStyles.includes(styleValue)) {
      updateField('relationshipStyle', currentStyles.filter(s => s !== styleValue));
    } else {
      updateField('relationshipStyle', [...currentStyles, styleValue]);
    }
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

      {/* Zodiac Sign */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-600" size={20} />
          <h2 className="font-semibold text-gray-800">Zodiac Sign</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Used for compatibility insights with matches
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {ZODIAC_SIGNS.map((sign) => (
            <button
              key={sign.value}
              onClick={() => updateField('zodiac_sign', sign.value)}
              className={`p-2 rounded-lg border-2 text-center transition-all ${
                manualEntry.zodiac_sign === sign.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-1">{sign.symbol}</div>
              <div className={`text-xs font-medium ${manualEntry.zodiac_sign === sign.value ? 'text-purple-700' : 'text-slate-800'}`}>
                {sign.label}
              </div>
              <div className="text-xs text-slate-400">{sign.dates}</div>
            </button>
          ))}
        </div>
        {manualEntry.zodiac_sign && (
          <button
            onClick={() => updateField('zodiac_sign', undefined)}
            className="mt-3 text-sm text-slate-500 hover:text-slate-700"
          >
            Clear selection
          </button>
        )}
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

      {/* Relationship Style */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="text-rose-500" size={20} />
          <h3 className="font-semibold text-gray-800">Relationship Style</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          What type of relationship structure are you open to? Select all that apply.
        </p>

        <div className="space-y-2">
          {RELATIONSHIP_STYLES.map((style) => {
            const isSelected = (manualEntry.relationshipStyle || []).includes(style.value);
            return (
              <button
                key={style.value}
                onClick={() => toggleRelationshipStyle(style.value)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${isSelected ? 'text-rose-700' : 'text-slate-800'}`}>
                      {style.label}
                    </div>
                    <div className="text-xs text-slate-500">{style.description}</div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                      <X size={12} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {(manualEntry.relationshipStyle?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {manualEntry.relationshipStyle?.map(style => {
              const styleInfo = RELATIONSHIP_STYLES.find(s => s.value === style);
              return (
                <span
                  key={style}
                  className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-medium"
                >
                  {styleInfo?.label || style}
                </span>
              );
            })}
          </div>
        )}
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
