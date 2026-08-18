export type MeterStatus =
  | 'AVAILABLE'
  | 'ASSIGNMENT_PENDING'
  | 'ASSIGNED'
  | 'INSTALLATION_PENDING'
  | 'INSTALLED'
  | 'RETURN_PENDING'
  | 'RETURNED'
  | 'CANCELLED'
  | 'TEMPORARY'
  | 'REPLACED';

export type MeterHistoryEvent = {
  id: string;
  action: string;
  detail: string;
  by: string;
  date: string;
  icon: string;
  tone: 'navy' | 'amber' | 'mint' | 'red';
};

export type Meter = {
  id: string;
  acNumber: string;
  serialNumber: string;
  customerName: string;
  customerMobile: string;
  address: string;
  capacity: string;
  company: string;
  type: string;
  status: MeterStatus;
  isTemporary?: boolean;
  replacedByMeterId?: string;
  replacedByMeterAc?: string;
  replacingMeterId?: string;
  replacingMeterAc?: string;
  assignedTo?: string;
  assignedBy?: string;
  installationDate?: string;
  latitude?: number;
  longitude?: number;
  mapLink?: string;
  notes?: string;
  cancellationReason?: string;
  history: MeterHistoryEvent[];
};

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  role: string;
  mobile: string;
  email: string;
  assigned: number;
  color: 'navy' | 'amber' | 'mint' | 'plum';
  online?: boolean;
};

export const demoUser = {
  id: '',
  name: '',
  email: '',
  role: 'Field Specialist',
};

export const teamMembers: TeamMember[] = [];

export const initialMeters: Meter[] = [];

export const statusMeta: Record<MeterStatus, { label: string; short: string; tone: 'navy' | 'amber' | 'mint' | 'red' }> = {
  AVAILABLE: { label: 'Available', short: 'Available', tone: 'mint' },
  ASSIGNMENT_PENDING: { label: 'Assign requested', short: 'Accept ?', tone: 'amber' },
  ASSIGNED: { label: 'Assigned', short: 'Assigned', tone: 'navy' },
  INSTALLATION_PENDING: { label: 'Install pending', short: 'Pending', tone: 'amber' },
  INSTALLED: { label: 'Installed', short: 'Installed', tone: 'mint' },
  RETURN_PENDING: { label: 'Return requested', short: 'Return ?', tone: 'amber' },
  RETURNED: { label: 'Returned', short: 'Returned', tone: 'amber' },
  CANCELLED: { label: 'Cancelled', short: 'Cancelled', tone: 'red' },
  TEMPORARY: { label: 'Temporary Installed', short: 'Temporary', tone: 'amber' },
  REPLACED: { label: 'Replaced', short: 'Replaced', tone: 'navy' },
};