export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isFreelancer: boolean;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  desc: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  clientName: string;
  budget: number;
  currency: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: string;
  endDate?: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  moduleId: number;
  estimateHours: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: User[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  taskId: number;
  userId: number;
  user: User;
  isSystem: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: number;
  taskId: number;
  userId: number;
  user: User;
  startTime: string;
  endTime?: string;
  durationMins?: number;
  notes?: string;
  billed: boolean;
  createdAt: string;
}

export interface Invoice {
  id: number;
  projectId: number;
  project: Project;
  clientJson: string;
  amount: number;
  currency: string;
  dueDate?: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';
  lineItems: string;
  fromDate?: string;
  toDate?: string;
  createdById: number;
  createdBy: User;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  method: string;
  notes?: string;
  recordedById: number;
  recordedBy: User;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  totalTimeEntries: number;
  totalInvoices: number;
  pendingInvoices: number;
}

export interface File {
  id: number;
  taskId: number;
  userId: number;
  user: User;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

export interface Activity {
  id: number;
  taskId: number;
  userId: number;
  user: User;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface TimesheetEntry {
  userId: number;
  userName: string;
  userEmail: string;
  isFreelancer: boolean;
  hourlyRate: number;
  totalMinutes: number;
  totalAmount: number;
}

export interface QuotationModule {
  moduleName: string;
  developerHours: number;
  designerHours: number;
  testerHours: number;
  developerRate: number;
  designerRate: number;
  testerRate: number;
  total: number;
}

export interface Quotation {
  id: number;
  projectName: string;
  projectType: string;
  clientName: string;
  platform: string;
  description?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  modules: QuotationModule[];
  totalDevelopmentCost: number;
  infrastructureCost: number;
  designBrandingCost: number;
  projectManagementPct: number;
  projectManagementCost: number;
  commissionPct: number;
  commissionCost: number;
  profitMarginPct: number;
  profitMarginCost: number;
  subtotal: number;
  gstPct: number;
  gstAmount: number;
  totalAmount: number;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationData {
  projectName: string;
  clientName: string;
  platform: 'Web' | 'Android' | 'iOS' | 'All';
  projectType: 'Website' | 'Mobile App' | 'CRM' | 'LMS' | 'E-commerce' | 'Custom';
  description?: string;
  developmentModules: QuotationModule[];
  infrastructureCost: number;
  designBrandingCost: number;
  projectManagementPct: number;
  commissionPct: number;
  profitMarginPct: number;
  gstPct: number;
  validUntil?: string;
}

export interface QuotationFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface QuotationListResponse {
  quotations: Quotation[];
  pagination: Pagination;
}
