import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../auth';
import { Role } from '../types';

interface Props {
  children: ReactNode;
  minLevel?: Role;     // training-hierarchy requirement
  adminOnly?: boolean; // administrator-only screens
}

export default function Protected({ children, minLevel, adminOnly }: Props) {
  const { user, loading, hasLevel } = useAuth();
  if (loading) return <p className="p-8 text-sm text-slate-500">Loading session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (minLevel && !hasLevel(minLevel)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
