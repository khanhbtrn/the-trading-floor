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
      <aside className="dash-left" aria-label="Career sidebar">
        <div className="dash-section-label">Career</div>
        {leftSidebarContent}
      </aside>
      <main className="dash-center" aria-label="Trading desk">
        <div className="dash-section-label">Desk</div>
        {centerContent}
      </main>
      <aside className="dash-right" aria-label="NPC chats">
        <div className="dash-section-label">Comms</div>
        {rightSidebarContent}
      </aside>
      <footer className="dash-bottom">{bottomBarContent}</footer>
    </div>
  );
}
