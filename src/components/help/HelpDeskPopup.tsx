// src/components/help/HelpDeskPopup.tsx
// The emo goth help desk agent popup
// She's "so whatever" but she's here to help

import { useState } from 'react';
import { X, MessageCircle, ExternalLink } from 'lucide-react';

interface HelpDeskPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// Help topics the agent can assist with
const HELP_TOPICS = [
  {
    id: 'upload',
    label: 'How do I analyze a profile?',
    answer: 'Screen record someone scrolling through their dating profile. Upload it here. I do the rest. ...you\'re welcome.',
  },
  {
    id: 'resonance',
    label: 'What does "resonance" mean?',
    answer: 'It\'s how your energies align. Strong resonance = potential spark. Different frequencies = maybe not your person. Or maybe chemistry surprises you. Whatever.',
  },
  {
    id: 'privacy',
    label: 'Is my data private?',
    answer: 'Everything stays on your device. I don\'t save anything to servers. Your dating life is your business. ...obviously.',
  },
  {
    id: 'essence',
    label: 'What\'s an essence image?',
    answer: 'AI-generated art that captures someone\'s vibe based on their personality. It\'s like... their soul, but make it aesthetic.',
  },
];

export function HelpDeskPopup({ isOpen, onClose }: HelpDeskPopupProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showingAnswer, setShowingAnswer] = useState(false);

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
    setShowingAnswer(true);
  };

  const handleBack = () => {
    setShowingAnswer(false);
    setSelectedTopic(null);
  };

  const handleClose = () => {
    setShowingAnswer(false);
    setSelectedTopic(null);
    onClose();
  };

  const selectedTopicData = HELP_TOPICS.find(t => t.id === selectedTopic);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 animate-slide-up">
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          {/* Header with character */}
          <div className="relative bg-gradient-to-br from-purple-900/50 to-slate-900 p-4">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Character image and intro */}
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-500/30 flex-shrink-0">
                <img
                  src="/helpdesk-agent.png"
                  alt="Help desk agent"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">...what.</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {showingAnswer
                    ? '*sigh* okay, listen...'
                    : 'I guess I can help or whatever.'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {!showingAnswer ? (
              /* Topic selection */
              <div className="space-y-2">
                {HELP_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-purple-500/50 transition-all group"
                  >
                    <span className="text-slate-200 text-sm group-hover:text-white transition-colors">
                      {topic.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* Answer display */
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <p className="text-purple-300 text-xs font-medium mb-2">
                    {selectedTopicData?.label}
                  </p>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {selectedTopicData?.answer}
                  </p>
                </div>

                <button
                  onClick={handleBack}
                  className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-sm transition-colors"
                >
                  ...anything else?
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MessageCircle size={12} />
                Help Desk
              </span>
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-purple-400 transition-colors"
              >
                Report bug <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HelpDeskPopup;
