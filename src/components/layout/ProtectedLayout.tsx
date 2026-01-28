// src/components/layout/ProtectedLayout.tsx
// Layout wrapper for protected routes with bottom navigation
// Provides consistent layout and spacing for authenticated pages

import BottomNavBar from './BottomNavBar';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <>
      {children}
      <BottomNavBar />
    </>
  );
}
