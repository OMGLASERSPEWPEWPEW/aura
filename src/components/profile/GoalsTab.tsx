// src/components/profile/GoalsTab.tsx
import { Target } from 'lucide-react';
import type { DatingGoals } from '../../lib/db';

interface GoalsTabProps {
  goals: DatingGoals | undefined;
  onGoalsChange: (goals: DatingGoals) => void;
}

const GOAL_OPTIONS: Array<{ value: DatingGoals['type']; label: string; emoji: string; description: string }> = [
  { value: 'casual', label: 'Casual', emoji: '🎉', description: 'Fun without commitment' },
  { value: 'short-term', label: 'Short-term', emoji: '💫', description: 'Open to something real' },
  { value: 'long-term', label: 'Long-term', emoji: '💕', description: 'Looking for a partner' },
  { value: 'marriage', label: 'Marriage', emoji: '💍', description: 'Ready for commitment' },
  { value: 'exploring', label: 'Exploring', emoji: '🤔', description: 'Figuring it out' },
];

export default function GoalsTab({ goals, onGoalsChange }: GoalsTabProps) {
  const handleGoalSelect = (type: DatingGoals['type']) => {
    onGoalsChange({
      type,
      description: goals?.description || ''
    });
  };

  const handleDescriptionChange = (description: string) => {
    if (goals) {
      onGoalsChange({ ...goals, description });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="text-indigo-600" size={20} />
          <h2 className="font-semibold text-gray-800">What are you looking for?</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleGoalSelect(option.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                goals?.type === option.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-1">{option.emoji}</div>
              <div className={`font-medium ${goals?.type === option.value ? 'text-indigo-700' : 'text-slate-800'}`}>
                {option.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional description */}
      {goals?.type && (
        <div className="bg-white p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <h3 className="font-medium text-gray-800 mb-2">Want to add more detail?</h3>
          <p className="text-sm text-slate-500 mb-3">
            Optional: Describe what you're specifically looking for or any dealbreakers.
          </p>
          <textarea
            value={goals.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="e.g., Looking for someone who shares my love of hiking and wants kids someday..."
            className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
      )}

      {/* Status indicator */}
      {goals?.type && (
        <div className="text-center text-sm text-green-600 font-medium">
          Goal set: {GOAL_OPTIONS.find(o => o.value === goals.type)?.label}
        </div>
      )}
    </div>
  );
}
