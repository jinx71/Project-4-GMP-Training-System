import { gmpDateTime } from '../format';

// Signature element: every record event carries a GMP-format timestamp chip
export default function Stamp({ iso }: { iso?: string | null }) {
  if (!iso) return <span className="stamp">—</span>;
  return <span className="stamp">{gmpDateTime(iso)}</span>;
}
