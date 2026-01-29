// src/components/layout/BottomNavBar.tsx
// Fixed bottom navigation bar for mobile-first UX
// Replaces the FAB pattern with standard mobile navigation

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, User, Settings } from 'lucide-react';
import { HelpDeskPopup } from '../help';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  disabled?: boolean;
  comingSoon?: boolean;
  dataTutorial?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/upload', label: 'Analyze', icon: PlusCircle, dataTutorial: 'nav-analyze' },
  { to: '/my-profile', label: 'Me', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNavBar() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-40 safe-area-pb">
        <div className="max-w-md mx-auto h-full flex items-center justify-around px-2">
          {/* Sorry Button - character avatar with pulse glow */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-400 dark:border-purple-500 animate-pulse-glow">
              <img
                src="/helpdesk-agent.png"
                alt="Sorry"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">Sorry</span>
          </button>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            // Render disabled items as plain divs
            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed relative"
                >
                  {/* Coming Soon badge */}
                  {item.comingSoon && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      Soon
                    </span>
                  )}
                  <Icon size={22} className="stroke-[1.5px]" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                data-tutorial={item.dataTutorial}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[56px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={22}
                      className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}
                    />
                    <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Help Desk Popup */}
      <HelpDeskPopup isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
