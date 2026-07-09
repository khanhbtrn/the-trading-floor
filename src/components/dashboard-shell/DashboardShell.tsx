import type { ReactNode } from 'react';
import './DashboardShell.css';

export interface DashboardShellProps {
  topBarContent: ReactNode;
  leftSidebarContent: ReactNode;
  centerContent: ReactNode;
  rightSidebarContent?: ReactNode;
  bottomBarContent: ReactNode;
  /** When true, center gets padding so floating NPC dock does not cover desk content. */
  floatingComms?: boolean;
}

export function DashboardShell({
  topBarContent,
  leftSidebarContent,
  centerContent,
  rightSidebarContent,
  bottomBarContent,
  floatingComms = false,
}: DashboardShellProps) {
  const hasRightSidebar = rightSidebarContent != null;
  const shellClass = [
    'dash-shell',
    floatingComms ? 'dash-shell--floating-comms' : '',
    !hasRightSidebar ? 'dash-shell--no-comms' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <header className="dash-top">{topBarContent}</header>
      <aside className="dash-left" aria-label="Career sidebar">
        <div className="dash-section-label">Career</div>
        {leftSidebarContent}
      </aside>
      <main className="dash-center" aria-label="Trading desk">
        <div className="dash-section-label">Desk</div>
        {centerContent}
      </main>
      {hasRightSidebar && (
        <aside className="dash-right" aria-label="NPC chats">
          <div className="dash-section-label">Comms</div>
          {rightSidebarContent}
        </aside>
      )}
      <footer className="dash-bottom">{bottomBarContent}</footer>
    </div>
  );
}
