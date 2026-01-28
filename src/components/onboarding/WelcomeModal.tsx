// src/components/onboarding/WelcomeModal.tsx
// Initial welcome screen for first-time users
// Shows Aura value proposition with 3 key benefits

import { motion } from 'framer-motion';
import { Shield, Sparkles, Heart, X } from 'lucide-react';
import Logo from '../ui/Logo';

interface WelcomeModalProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

const VALUE_PROPS = [
  {
    icon: Shield,
    title: 'Spot Red Flags Early',
    description: 'AI-powered analysis reveals hidden patterns and warning signs before you invest emotionally.',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
  },
  {
    icon: Sparkles,
    title: 'Understand Their Psychology',
    description: 'Deep insights into communication styles, attachment patterns, and relationship goals.',
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30',
  },
  {
    icon: Heart,
    title: 'Make Better Choices',
    description: 'Know your compatibility before the first date with the 11 Virtues matching system.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/30',
  },
];

export default function WelcomeModal({ onGetStarted, onSkip }: WelcomeModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
      >
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Skip tutorial"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 py-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 rounded-2xl p-3">
              <Logo size="xl" showText={false} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Aura</h1>
          <p className="text-violet-100 text-sm">
            They made love a game. Let's even the odds.
          </p>
        </div>

        {/* Value Props */}
        <div className="px-6 py-5 space-y-4">
          {VALUE_PROPS.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg ${prop.bgColor} flex-shrink-0`}>
                  <Icon size={18} className={prop.color} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                    {prop.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {prop.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onGetStarted}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors"
          >
            Get Started
          </button>
          <button
            onClick={onSkip}
            className="w-full mt-2 py-2 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700 dark:hover:text-slate-300"
          >
            Skip tutorial
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
