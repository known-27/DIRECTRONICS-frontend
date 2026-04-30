// ─────────────────────────────────────────────
// DIRECTRONICS ServiceFlow ERP — TypeScript Types
// ─────────────────────────────────────────────

export type Role             = 'ADMIN' | 'EMPLOYEE';
export type ProjectStatus    = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
export type PaymentStatus    = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
export type PaymentMode      = 'GST' | 'CASH';
export type IdentityDocType  = 'AADHAR' | 'PAN';

// ─── Auth ─────────────────────────────────────

export interface AuthUser {
  id:                 string;
  name:               string;
  email:              string;
  role:               Role;
  fullName?:          string;
  profilePictureUrl?: string | null;
}

// ─── User ─────────────────────────────────────

export interface User {
  id:                string;
  name:              string;
  fullName:          string;
  email:             string;
  role:              Role;
  isActive:          boolean;
  deletedAt?:        string | null;
  mobileNumber1:     string;
  mobileNumber2?:    string | null;
  address?:          string | null;
  identityDocType?:  IdentityDocType | null;
  identityDocUrl?:   string | null;
  staticSalary?:     number | null;
  profilePictureUrl?: string | null;
  createdAt:         string;
  updatedAt:         string;
}

export interface UserDetail extends User {
  totalEarned:   number;
  pendingAmount: number;
  deletedAt?:    string | null;
  employeeServiceMapping: EmployeeServiceMapping[];
  payments:      PaymentSummaryRow[];
  projects?:     ProjectSummary[];
  _count:        { projects: number };
}

export interface PaymentSummaryRow {
  id:          string;
  totalPaid:   number;
  paidAt?:     string | null;
  paymentMode?: PaymentMode | null;
  project?: {
    id: string;
    invoiceNumber?: string | null;
    projectName:    string;
    service?: { id: string; name: string };
  };
}

export interface ProjectSummary {
  id:              string;
  invoiceNumber?:  string | null;
  projectName:     string;
  status:          ProjectStatus;
  calculatedAmount?: number | null;
  paymentMode?:    PaymentMode | null;
  startDate:       string;
  service?:        { id: string; name: string };
}

// ─── Service ──────────────────────────────────

export interface ServiceField {
  key:          string;
  label:        string;
  type:         'text' | 'number' | 'date' | 'select' | 'textarea';
  required:     boolean;
  options?:     string[];
  placeholder?: string;
}

export interface Service {
  id:             string;
  name:           string;
  description?:   string;
  fields:         ServiceField[];
  invoicePrefix?: string | null;
  isActive:       boolean;
  createdAt:      string;
  updatedAt:      string;
  _count?:        { employeeServiceMapping: number; projects: number };
  formulas?:      Formula[];
}

export interface EmployeeServiceMapping {
  id:        string;
  userId:    string;
  serviceId: string;
  formulaId?: string;
  assignedAt: string;
  user?:    Pick<User, 'id' | 'name' | 'email'>;
  service?: Pick<Service, 'id' | 'name' | 'description'>;
  formula?: Pick<Formula, 'id' | 'name' | 'expression'>;
}

// ─── Formula ──────────────────────────────────

export interface FormulaVariable {
  key:          string;
  label:        string;
  type:         'number' | 'string';
  sourceField?: string;
}

export interface Formula {
  id:         string;
  name:       string;
  serviceId:  string;
  expression: string;
  variables:  FormulaVariable[];
  version:    number;
  isActive:   boolean;
  createdAt:  string;
  updatedAt:  string;
  service?:   Pick<Service, 'id' | 'name'>;
  snapshots?: FormulaSnapshot[];
  _count?:    { snapshots: number };
}

export interface FormulaSnapshot {
  id:         string;
  formulaId:  string;
  expression: string;
  variables:  FormulaVariable[];
  snapshotAt: string;
}

// ─── Project ──────────────────────────────────

export interface ProjectDetail {
  id:         string;
  projectId:  string;
  fieldKey:   string;
  fieldValue: string;
}

// ─── Payment Transaction (single installment) ─

export interface PaymentTransaction {
  id:          string;
  amount:      number;
  note?:       string | null;
  paidAt:      string;
  /** Admin-only — not returned to employees */
  paidById?:   string;
  paidByName?: string;
}

// ─── Payment Summary (per project) ────────────

export interface PaymentSummary {
  id:               string;
  calculatedAmount: number;
  totalPaid:        number;
  pendingAmount:    number;
  status:           PaymentStatus;
  paymentMode?:     PaymentMode | null;
  paidAt?:          string | null;
  transactions:     PaymentTransaction[];
}

/** Base project fields visible to all roles */
export interface ProjectBase {
  id:                    string;
  employeeId:            string;
  serviceId:             string;
  formulaSnapshotId?:    string;
  status:                ProjectStatus;
  projectName:           string;
  invoiceNumber?:        string | null;
  startDate:             string;
  finishDate?:           string | null;
  completionImageUrl?:   string | null;
  paymentMode?:          PaymentMode | null;
  calculatedAmount?:     number | null;
  approvalNotes?:        string | null;
  notes?:                string | null;
  isReadyForSubmission:  boolean;
  createdAt:             string;
  updatedAt:             string;
  employee?:  Pick<User, 'id' | 'name' | 'fullName' | 'email' | 'profilePictureUrl'>;
  service?:   Pick<Service, 'id' | 'name' | 'fields'>;
  formulaSnapshot?: FormulaSnapshot;
  details?:   ProjectDetail[];
  payments?:  PaymentSummary[];
}

/** Admin-only additional fields */
export interface AdminProject extends ProjectBase {
  totalProjectPrice?: number | null;
  makingCost?:        number | null;
  manualPayAmount?:   number | null;
  approvedById?:      string | null;
  approvedAt?:        string | null;
  approvedBy?:        { id: string; name: string; fullName: string } | null;
}

export type EmployeeProject = ProjectBase;

// Combined union — use when role is unknown at compile time
export type Project = AdminProject;

// ─── Payment (standalone list item) ───────────

export interface Payment {
  id:               string;
  projectId:        string;
  employeeId:       string;
  calculatedAmount: number;
  totalPaid:        number;
  pendingAmount:    number;
  status:           PaymentStatus;
  paymentMode?:     PaymentMode | null;
  paidAt?:          string | null;
  notes?:           string | null;
  processedBy?:     string | null;
  createdAt:        string;
  updatedAt:        string;
  transactions?:    PaymentTransaction[];
  _count?:          { transactions: number };
  project?: {
    id:           string;
    invoiceNumber?: string | null;
    projectName:  string;
    service:      Pick<Service, 'id' | 'name'>;
    details?:     ProjectDetail[];
  };
  employee?:         Pick<User, 'id' | 'name' | 'fullName' | 'email'>;
  processedByUser?:  Pick<User, 'id' | 'name'>;
}

// ─── Paginated Response ────────────────────────

export interface PaginatedData<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ─── Dashboard ────────────────────────────────

export interface AdminDashboard {
  kpis: {
    totalProjects:          number;
    totalEmployees:         number;
    pendingPaymentsCount:   number;
    partialPaymentsCount:   number;
    totalPaidAmount:        number;
    totalPendingAmount:     number;
    totalPendingToPay:      number;
  };
  pendingReviewCount:   number;
  projectsByStatus: Record<ProjectStatus, number>;
  recentProjects:   Project[];
  topEmployees:     Array<{
    employee?:   Pick<User, 'id' | 'name' | 'email'>;
    totalEarned: number | null;
    projectCount: number;
  }>;
  monthlyTrend: Array<{ month: string; count: number }>;
}

export interface EmployeeDashboard {
  kpis: {
    totalProjects:         number;
    approvedProjects:      number;
    totalEarned:          number;
    totalReceived:        number;
    totalPending:         number;
    totalPendingToReceive: number;
  };
  projectsByStatus: Record<string, number>;
  recentProjects:   Project[];
}

// ─── Filter Bar ───────────────────────────────

export interface FilterState {
  dateRange?:   string;
  startDate?:   string;
  endDate?:     string;
  status?:      string;
  employeeId?:  string;
  serviceId?:   string;
  paymentMode?: string;
  page?:        string;
  limit?:       string;
}

// ─── API Response ─────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
  meta?: {
    pagination?: {
      total:      number;
      page:       number;
      pageSize:   number;
      totalPages: number;
    };
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
