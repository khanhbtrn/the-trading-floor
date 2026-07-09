import type { AuditEntry } from '@/lib/types';

const TYPE_COLORS: Record<AuditEntry['type'], string> = {
  AI_INSTRUCTED: '#4caf50',
  OVERRIDE: '#ff9800',
  DISCRETIONARY: '#2196f3',
  BLOCKED: '#f44336',
  GLITCH_RELATED: '#9c27b0',
};

interface AuditTableProps {
  entries: AuditEntry[];
}

export function AuditTable({ entries }: AuditTableProps) {
  if (entries.length === 0) {
    return <p className="audit-empty">No audit entries recorded.</p>;
  }

  return (
    <div className="audit-table-wrap">
      <table className="audit-table">
        <thead>
          <tr>
            <th>Tick</th>
            <th>Type</th>
            <th>Action</th>
            <th>Size</th>
            <th>Price</th>
            <th>P&amp;L Δ</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i}>
              <td>{entry.tick}</td>
              <td>
                <span
                  className="audit-type-badge"
                  style={{ backgroundColor: TYPE_COLORS[entry.type] }}
                >
                  {entry.type}
                </span>
              </td>
              <td>{entry.action}</td>
              <td>{entry.size > 0 ? entry.size.toLocaleString() : '—'}</td>
              <td>${entry.price.toFixed(2)}</td>
              <td className={entry.pnlDelta >= 0 ? 'positive' : 'negative'}>
                {entry.pnlDelta !== 0
                  ? `$${entry.pnlDelta.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : '—'}
              </td>
              <td className="audit-note">{entry.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
