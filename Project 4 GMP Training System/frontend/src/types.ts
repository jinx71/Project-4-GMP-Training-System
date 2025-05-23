export type Role = 'USER' | 'TRAINER' | 'DTC' | 'STC' | 'ADMIN';
export type AssignmentStatus = 'ASSIGNED' | 'PENDING' | 'COMPLETED';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  active: boolean;
  createdAt: string;
}

export interface Training {
  id: string;
  code: string;
  title: string;
  description: string;
  sopReference?: string;
  department: string;
  assessments?: AssessmentSummary[];
}

export interface AssessmentSummary {
  id: string;
  title: string;
  scheduledFrom: string;
  scheduledTo: string;
}

export interface Assignment {
  id: string;
  status: AssignmentStatus;
  dueDate: string;
  assignedAt: string;
  completedAt?: string;
  training: Training;
  user?: Pick<User, 'employeeId' | 'name' | 'department'>;
  assignedBy?: { name: string; employeeId?: string };
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  marks: number;
}

export interface Assessment {
  id: string;
  title: string;
  passMarkPct: number;
  scheduledFrom: string;
  scheduledTo: string;
  training: { code: string; title: string };
  questions: Question[];
}

export interface Attempt {
  id: string;
  score: number;
  totalMarks: number;
  status: 'SUBMITTED' | 'PASSED' | 'FAILED';
  remarks?: string;
  submittedAt: string;
  evaluatedAt?: string;
  user?: Pick<User, 'employeeId' | 'name' | 'department'>;
  evaluatedBy?: { name: string };
  assessment?: { title: string; passMarkPct: number; training: { code: string; title: string } };
}

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender: { name: string; role: Role };
}

export interface AuditLog {
  id: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
  user?: Pick<User, 'employeeId' | 'name' | 'role'>;
}
