export interface Owner {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface VaccineRecord {
  id: string;
  name: string;
  date: string;
  nextDue: string;
  status: 'completed' | 'upcoming' | 'overdue';
}

export interface Pet {
  id: string;
  name: string;
  species: '犬' | '猫' | '兔' | '鸟' | '其他';
  breed: string;
  age: number;
  gender: '公' | '母';
  weight: number;
  avatar: string;
  ownerId: string;
  allergies: string[];
  vaccines: VaccineRecord[];
  createdAt: string;
  avatarEmoji: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  avatarEmoji: string;
  specialties: string[];
}

export interface Room {
  id: string;
  name: string;
  type: '诊疗室' | '手术室' | '检查室' | '隔离室';
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'waitlist';
export type ServiceType = '常规检查' | '疫苗接种' | '手术' | '复诊' | '急诊' | '驱虫' | '体检';

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  doctorId: string;
  roomId: string;
  petId: string;
  serviceType: ServiceType;
  status: AppointmentStatus;
  notes: string;
  waitlistNumber?: number;
}

export interface CostBreakdown {
  examFee: number;
  medicineFee: number;
  treatmentFee: number;
  otherFee: number;
}

export interface Visit {
  id: string;
  appointmentId?: string;
  petId: string;
  doctorId: string;
  visitDate: string;
  symptoms: string;
  examination: string;
  diagnosis: string;
  treatmentPlan: string;
  totalCost: number;
  costBreakdown: CostBreakdown;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

export interface Prescription {
  id: string;
  visitId: string;
  medicineName: string;
  dosage: string;
  frequency: '每日1次' | '每日2次' | '每日3次' | '每8小时' | '每12小时' | '需要时';
  durationDays: number;
  instructions: string;
  unitPrice: number;
  quantity: number;
}

export type ReminderStatus = 'pending' | 'sent' | 'confirmed' | 'overdue';
export type SendChannel = 'sms' | 'wechat' | 'none';

export interface MedicationReminder {
  id: string;
  prescriptionId: string;
  petId: string;
  remindTime: string;
  medicineName: string;
  dosage: string;
  status: ReminderStatus;
  sendChannel: SendChannel;
  confirmedByOwner: boolean;
}

export type FollowupType = '术后' | '疫苗' | '复诊' | '满意度';
export type FollowupStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Followup {
  id: string;
  petId: string;
  visitId?: string;
  type: FollowupType;
  scheduledDate: string;
  doctorId: string;
  status: FollowupStatus;
  notes: string;
  satisfactionScore?: number;
  feedback?: string;
  completedDate?: string;
}

export interface VisitAttachment {
  id: string;
  visitId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}
