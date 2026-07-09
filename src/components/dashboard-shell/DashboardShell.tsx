import type { ReactNode } from 'react';
import './DashboardShell.css';

export interface DashboardShellProps {
  topBarContent: ReactNode;
  leftSidebarContent: ReactNode;
  centerContent: ReactNode;
  rightSidebarContent: ReactNode;
  bottomBarContent: ReactNode;
}

export function DashboardShell({
  topBarContent,
  leftSidebarContent,
  centerContent,
  rightSidebarContent,
  bottomBarContent,
}: DashboardShellProps) {
  return (
    <div className="dash-shell">
      <header className="dash-top">{topBarContent}</header>
      <aside className="dash-left">{leftSidebarContent}</aside>
      <main className="dash-center">{centerContent}</main>
      <aside className="dash-right">{rightSidebarContent}</aside>
      <footer className="dash-bottom">{bottomBarContent}</footer>
    </div>
  );
}
