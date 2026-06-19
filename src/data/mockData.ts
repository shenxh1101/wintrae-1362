import type {
  Owner, Pet, Doctor, Room, Appointment, Visit,
  Prescription, MedicationReminder, Followup
} from '@/types';
import { addDays, addHours, startOfWeek, format, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const uid = () => Math.random().toString(36).slice(2, 10);

const today = new Date();
const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });

export const mockOwners: Owner[] = [
  { id: 'o1', name: '张小明', phone: '13800138001', email: 'zhangxm@email.com', address: '朝阳区建国路88号' },
  { id: 'o2', name: '李娜', phone: '13900139002', email: 'lina@email.com', address: '海淀区中关村大街1号' },
  { id: 'o3', name: '王芳', phone: '13700137003', email: 'wangf@email.com', address: '西城区金融街15号' },
  { id: 'o4', name: '陈伟', phone: '13600136004', email: 'chenw@email.com', address: '东城区王府井大街20号' },
  { id: 'o5', name: '刘洋', phone: '13500135005', email: 'liuy@email.com', address: '丰台区南三环西路16号' },
  { id: 'o6', name: '赵磊', phone: '13400134006', email: 'zhaol@email.com', address: '通州区新华大街99号' },
];

export const mockDoctors: Doctor[] = [
  { id: 'd1', name: '林医生', title: '主任医师', avatar: '', avatarEmoji: '👨‍⚕️', specialties: ['外科', '骨科'] },
  { id: 'd2', name: '周医生', title: '主治医师', avatar: '', avatarEmoji: '👩‍⚕️', specialties: ['内科', '心脏科'] },
  { id: 'd3', name: '吴医生', title: '兽医博士', avatar: '', avatarEmoji: '🧑‍⚕️', specialties: ['皮肤科', '眼科'] },
  { id: 'd4', name: '郑医生', title: '主治医师', avatar: '', avatarEmoji: '👨‍⚕️', specialties: ['口腔科', '预防医学'] },
];

export const mockRooms: Room[] = [
  { id: 'r1', name: '1号诊室', type: '诊疗室' },
  { id: 'r2', name: '2号诊室', type: '诊疗室' },
  { id: 'r3', name: '手术室A', type: '手术室' },
  { id: 'r4', name: '影像检查室', type: '检查室' },
  { id: 'r5', name: '隔离观察室', type: '隔离室' },
];

export const mockPets: Pet[] = [
  {
    id: 'p1', name: '旺财', species: '犬', breed: '金毛寻回犬', age: 3, gender: '公', weight: 28.5,
    avatar: '', ownerId: 'o1', avatarEmoji: '🐕',
    allergies: ['青霉素'],
    vaccines: [
      { id: 'v1', name: '狂犬疫苗', date: format(addDays(today, -200), 'yyyy-MM-dd'), nextDue: format(addDays(today, 165), 'yyyy-MM-dd'), status: 'completed' },
      { id: 'v2', name: '六联疫苗', date: format(addDays(today, -180), 'yyyy-MM-dd'), nextDue: format(addDays(today, 185), 'yyyy-MM-dd'), status: 'completed' },
    ],
    createdAt: format(addDays(today, -500), 'yyyy-MM-dd'),
  },
  {
    id: 'p2', name: '咪咪', species: '猫', breed: '英短蓝白', age: 2, gender: '母', weight: 4.2,
    avatar: '', ownerId: 'o2', avatarEmoji: '🐱',
    allergies: [],
    vaccines: [
      { id: 'v3', name: '狂犬疫苗', date: format(addDays(today, -300), 'yyyy-MM-dd'), nextDue: format(addDays(today, 65), 'yyyy-MM-dd'), status: 'upcoming' },
      { id: 'v4', name: '猫三联', date: format(addDays(today, -280), 'yyyy-MM-dd'), nextDue: format(addDays(today, 85), 'yyyy-MM-dd'), status: 'upcoming' },
    ],
    createdAt: format(addDays(today, -400), 'yyyy-MM-dd'),
  },
  {
    id: 'p3', name: '豆豆', species: '犬', breed: '泰迪', age: 5, gender: '母', weight: 5.1,
    avatar: '', ownerId: 'o3', avatarEmoji: '🐩',
    allergies: ['海鲜'],
    vaccines: [
      { id: 'v5', name: '狂犬疫苗', date: format(addDays(today, -420), 'yyyy-MM-dd'), nextDue: format(addDays(today, -55), 'yyyy-MM-dd'), status: 'overdue' },
    ],
    createdAt: format(addDays(today, -800), 'yyyy-MM-dd'),
  },
  {
    id: 'p4', name: '雪球', species: '兔', breed: '荷兰垂耳兔', age: 1, gender: '公', weight: 2.3,
    avatar: '', ownerId: 'o4', avatarEmoji: '🐰',
    allergies: [],
    vaccines: [],
    createdAt: format(addDays(today, -200), 'yyyy-MM-dd'),
  },
  {
    id: 'p5', name: '小黑', species: '猫', breed: '中华田园猫', age: 4, gender: '公', weight: 5.5,
    avatar: '', ownerId: 'o5', avatarEmoji: '🐈‍⬛',
    allergies: ['鸡肝'],
    vaccines: [
      { id: 'v6', name: '狂犬疫苗', date: format(addDays(today, -100), 'yyyy-MM-dd'), nextDue: format(addDays(today, 265), 'yyyy-MM-dd'), status: 'completed' },
    ],
    createdAt: format(addDays(today, -700), 'yyyy-MM-dd'),
  },
  {
    id: 'p6', name: '皮皮', species: '犬', breed: '哈士奇', age: 2, gender: '公', weight: 22.8,
    avatar: '', ownerId: 'o6', avatarEmoji: '🐺',
    allergies: [],
    vaccines: [
      { id: 'v7', name: '狂犬疫苗', date: format(addDays(today, -150), 'yyyy-MM-dd'), nextDue: format(addDays(today, 215), 'yyyy-MM-dd'), status: 'completed' },
      { id: 'v8', name: '六联疫苗', date: format(addDays(today, -130), 'yyyy-MM-dd'), nextDue: format(addDays(today, 235), 'yyyy-MM-dd'), status: 'completed' },
    ],
    createdAt: format(addDays(today, -450), 'yyyy-MM-dd'),
  },
  {
    id: 'p7', name: '花花', species: '猫', breed: '布偶猫', age: 1, gender: '母', weight: 3.5,
    avatar: '', ownerId: 'o1', avatarEmoji: '😺',
    allergies: [],
    vaccines: [
      { id: 'v9', name: '猫三联', date: format(addDays(today, -60), 'yyyy-MM-dd'), nextDue: format(addDays(today, 305), 'yyyy-MM-dd'), status: 'completed' },
    ],
    createdAt: format(addDays(today, -250), 'yyyy-MM-dd'),
  },
  {
    id: 'p8', name: '大黄', species: '犬', breed: '拉布拉多', age: 6, gender: '公', weight: 31.2,
    avatar: '', ownerId: 'o2', avatarEmoji: '🦮',
    allergies: [],
    vaccines: [
      { id: 'v10', name: '狂犬疫苗', date: format(addDays(today, -30), 'yyyy-MM-dd'), nextDue: format(addDays(today, 335), 'yyyy-MM-dd'), status: 'completed' },
    ],
    createdAt: format(addDays(today, -1000), 'yyyy-MM-dd'),
  },
];

const makeAppt = (dayOffset: number, hour: number, doctorId: string, roomId: string, petId: string, serviceType: any, status: any = 'scheduled', notes = ''): Appointment => {
  const start = setMinutes(setHours(addDays(thisWeekStart, dayOffset), hour), 0);
  return {
    id: uid(),
    startTime: start.toISOString(),
    endTime: addHours(start, 1).toISOString(),
    doctorId, roomId, petId, serviceType, status, notes,
  };
};

export const mockAppointments: Appointment[] = [
  makeAppt(0, 9, 'd1', 'r1', 'p1', '常规检查', 'confirmed'),
  makeAppt(0, 10, 'd2', 'r2', 'p2', '疫苗接种', 'scheduled'),
  makeAppt(0, 11, 'd1', 'r3', 'p6', '手术', 'confirmed', '绝育手术，术前检查已完成'),
  makeAppt(0, 14, 'd3', 'r1', 'p5', '皮肤科检查', 'scheduled'),
  makeAppt(0, 15, 'd4', 'r2', 'p7', '常规检查', 'waitlist'),

  makeAppt(1, 9, 'd1', 'r1', 'p3', '复诊', 'scheduled', '皮肤问题复诊'),
  makeAppt(1, 10, 'd2', 'r4', 'p8', '体检', 'confirmed'),
  makeAppt(1, 11, 'd3', 'r2', 'p4', '常规检查', 'scheduled'),
  makeAppt(1, 14, 'd4', 'r1', 'p2', '口腔科检查', 'scheduled'),
  makeAppt(1, 16, 'd1', 'r3', 'p1', '手术', 'scheduled', '肿瘤切除'),

  makeAppt(2, 9, 'd2', 'r1', 'p5', '复诊', 'scheduled'),
  makeAppt(2, 10, 'd1', 'r2', 'p6', '复诊', 'confirmed', '术后拆线'),
  makeAppt(2, 14, 'd3', 'r4', 'p3', '体检', 'scheduled'),
  makeAppt(2, 15, 'd4', 'r1', 'p7', '疫苗接种', 'scheduled'),

  makeAppt(3, 9, 'd1', 'r1', 'p8', '常规检查', 'scheduled'),
  makeAppt(3, 11, 'd2', 'r2', 'p1', '心脏检查', 'scheduled'),
  makeAppt(3, 14, 'd3', 'r1', 'p2', '皮肤科复诊', 'waitlist'),
  makeAppt(3, 16, 'd4', 'r2', 'p4', '驱虫', 'scheduled'),

  makeAppt(4, 10, 'd1', 'r3', 'p5', '手术', 'scheduled'),
  makeAppt(4, 14, 'd2', 'r1', 'p6', '常规检查', 'scheduled'),
  makeAppt(4, 15, 'd4', 'r2', 'p3', '疫苗接种', 'scheduled'),

  makeAppt(5, 9, 'd3', 'r1', 'p7', '眼科检查', 'scheduled'),
  makeAppt(5, 11, 'd2', 'r4', 'p8', '体检', 'confirmed'),
];

export const mockVisits: Visit[] = [
  {
    id: 'vi1', petId: 'p1', doctorId: 'd1', visitDate: format(addDays(today, -30), 'yyyy-MM-dd'),
    symptoms: '食欲不振，精神萎靡，持续呕吐2天',
    examination: '体温39.2℃，腹部触诊敏感，心率偏快',
    diagnosis: '急性肠胃炎',
    treatmentPlan: '输液治疗3天，配合止吐药和益生菌调理',
    totalCost: 1280, costBreakdown: { examFee: 200, medicineFee: 480, treatmentFee: 500, otherFee: 100 }, paymentStatus: 'paid',
  },
  {
    id: 'vi2', petId: 'p2', doctorId: 'd3', visitDate: format(addDays(today, -20), 'yyyy-MM-dd'),
    symptoms: '频繁抓挠耳朵，有褐色分泌物',
    examination: '耳道分泌物检查发现耳螨',
    diagnosis: '耳螨感染',
    treatmentPlan: '耳道清洗+外用驱虫药，每周复查',
    totalCost: 560, costBreakdown: { examFee: 120, medicineFee: 240, treatmentFee: 150, otherFee: 50 }, paymentStatus: 'paid',
  },
  {
    id: 'vi3', petId: 'p6', doctorId: 'd1', visitDate: format(addDays(today, -7), 'yyyy-MM-dd'),
    symptoms: '术前常规检查，准备绝育',
    examination: '血常规、生化指标正常，心肺功能良好',
    diagnosis: '健康，可进行手术',
    treatmentPlan: '次日进行绝育手术，术前禁食8小时',
    totalCost: 1850, costBreakdown: { examFee: 300, medicineFee: 350, treatmentFee: 1100, otherFee: 100 }, paymentStatus: 'paid',
  },
  {
    id: 'vi4', petId: 'p3', doctorId: 'd3', visitDate: format(addDays(today, -45), 'yyyy-MM-dd'),
    symptoms: '皮肤红疹、脱毛、瘙痒严重',
    examination: '皮肤刮片检查发现真菌感染',
    diagnosis: '皮肤真菌病',
    treatmentPlan: '药浴+口服抗真菌药，4周疗程',
    totalCost: 920, costBreakdown: { examFee: 150, medicineFee: 570, treatmentFee: 150, otherFee: 50 }, paymentStatus: 'paid',
  },
  {
    id: 'vi5', petId: 'p8', doctorId: 'd2', visitDate: format(addDays(today, -10), 'yyyy-MM-dd'),
    symptoms: '运动后咳嗽，耐力下降',
    examination: '心音听诊有杂音，X光心脏轮廓增大',
    diagnosis: '早期心脏瓣膜病',
    treatmentPlan: '保守治疗，服用心脏营养药物，避免剧烈运动，3个月复查',
    totalCost: 1560, costBreakdown: { examFee: 280, medicineFee: 960, treatmentFee: 200, otherFee: 120 }, paymentStatus: 'paid',
  },
];

export const mockPrescriptions: Prescription[] = [
  { id: 'pr1', visitId: 'vi1', medicineName: '止吐灵注射液', dosage: '2ml/次', frequency: '每日2次', durationDays: 3, instructions: '皮下注射，饭后30分钟', unitPrice: 45, quantity: 6 },
  { id: 'pr2', visitId: 'vi1', medicineName: '益生菌粉', dosage: '1袋/次', frequency: '每日2次', durationDays: 7, instructions: '温水冲服，与饭同服', unitPrice: 12, quantity: 14 },
  { id: 'pr3', visitId: 'vi2', medicineName: '耳螨净滴剂', dosage: '3滴/耳', frequency: '每日2次', durationDays: 14, instructions: '滴入耳道后按摩耳根', unitPrice: 68, quantity: 1 },
  { id: 'pr4', visitId: 'vi4', medicineName: '抗真菌片', dosage: '1片/次', frequency: '每日1次', durationDays: 28, instructions: '饭后服用，配合护肝药', unitPrice: 18, quantity: 28 },
  { id: 'pr5', visitId: 'vi4', medicineName: '药浴洗剂', dosage: '50ml/次', frequency: '每日1次', durationDays: 28, instructions: '稀释后浸泡全身15分钟', unitPrice: 120, quantity: 2 },
  { id: 'pr6', visitId: 'vi5', medicineName: '心脏营养剂', dosage: '1粒/次', frequency: '每日2次', durationDays: 90, instructions: '长期服用，定期复查肝功', unitPrice: 25, quantity: 180 },
];

export const mockMedicationReminders: MedicationReminder[] = [
  {
    id: 'm1', prescriptionId: 'pr6', petId: 'p8', medicineName: '心脏营养剂', dosage: '1粒/次',
    remindTime: setHours(setMinutes(new Date(), 0), 8).toISOString(),
    status: 'confirmed', sendChannel: 'wechat', confirmedByOwner: true,
  },
  {
    id: 'm2', prescriptionId: 'pr6', petId: 'p8', medicineName: '心脏营养剂', dosage: '1粒/次',
    remindTime: setHours(setMinutes(new Date(), 0), 20).toISOString(),
    status: 'sent', sendChannel: 'wechat', confirmedByOwner: false,
  },
  {
    id: 'm3', prescriptionId: 'pr4', petId: 'p3', medicineName: '抗真菌片', dosage: '1片/次',
    remindTime: setHours(setMinutes(addDays(today, 1), 0), 9).toISOString(),
    status: 'pending', sendChannel: 'none', confirmedByOwner: false,
  },
  {
    id: 'm4', prescriptionId: 'pr4', petId: 'p3', medicineName: '抗真菌片', dosage: '1片/次',
    remindTime: setHours(setMinutes(addDays(today, 2), 0), 9).toISOString(),
    status: 'pending', sendChannel: 'none', confirmedByOwner: false,
  },
  {
    id: 'm5', prescriptionId: 'pr5', petId: 'p3', medicineName: '药浴洗剂', dosage: '50ml/次',
    remindTime: setHours(setMinutes(addDays(today, 3), 0), 14).toISOString(),
    status: 'pending', sendChannel: 'none', confirmedByOwner: false,
  },
  {
    id: 'm6', prescriptionId: 'pr6', petId: 'p8', medicineName: '心脏营养剂', dosage: '1粒/次',
    remindTime: setHours(setMinutes(addDays(today, 1), 0), 8).toISOString(),
    status: 'pending', sendChannel: 'none', confirmedByOwner: false,
  },
  {
    id: 'm7', prescriptionId: 'pr6', petId: 'p8', medicineName: '心脏营养剂', dosage: '1粒/次',
    remindTime: setHours(setMinutes(addDays(today, 1), 0), 20).toISOString(),
    status: 'pending', sendChannel: 'none', confirmedByOwner: false,
  },
];

export const mockFollowups: Followup[] = [
  {
    id: 'f1', petId: 'p6', visitId: 'vi3', type: '术后',
    scheduledDate: format(addDays(today, 0), 'yyyy-MM-dd'),
    doctorId: 'd1', status: 'pending',
    notes: '绝育手术后7天复查，查看伤口愈合情况，安排拆线',
  },
  {
    id: 'f2', petId: 'p2', visitId: 'vi2', type: '复诊',
    scheduledDate: format(addDays(today, -1), 'yyyy-MM-dd'),
    doctorId: 'd3', status: 'completed',
    notes: '耳螨治疗后复查，确认治疗效果',
    satisfactionScore: 5,
    feedback: '治疗效果很好，猫咪已经不抓耳朵了，非常感谢周医生的耐心指导！',
    completedDate: format(addDays(today, -1), 'yyyy-MM-dd'),
  },
  {
    id: 'f3', petId: 'p3', visitId: 'vi4', type: '复诊',
    scheduledDate: format(addDays(today, 2), 'yyyy-MM-dd'),
    doctorId: 'd3', status: 'pending',
    notes: '真菌治疗2周后复查皮肤刮片，评估治疗效果',
  },
  {
    id: 'f4', petId: 'p1', visitId: 'vi1', type: '满意度',
    scheduledDate: format(addDays(today, -20), 'yyyy-MM-dd'),
    doctorId: 'd1', status: 'completed',
    notes: '肠胃炎治疗后满意度随访',
    satisfactionScore: 4,
    feedback: '整体服务很好，就是等待时间稍长。旺财恢复得很好，谢谢林医生！',
    completedDate: format(addDays(today, -18), 'yyyy-MM-dd'),
  },
  {
    id: 'f5', petId: 'p8', visitId: 'vi5', type: '复诊',
    scheduledDate: format(addDays(today, 80), 'yyyy-MM-dd'),
    doctorId: 'd2', status: 'pending',
    notes: '3个月后复查心脏彩超，评估药物治疗效果',
  },
  {
    id: 'f6', petId: 'p5', type: '疫苗',
    scheduledDate: format(addDays(today, 7), 'yyyy-MM-dd'),
    doctorId: 'd4', status: 'in_progress',
    notes: '年度狂犬疫苗接种提醒',
  },
  {
    id: 'f7', petId: 'p3', type: '疫苗',
    scheduledDate: format(addDays(today, 55), 'yyyy-MM-dd'),
    doctorId: 'd4', status: 'pending',
    notes: '狂犬疫苗已逾期，请尽快预约补种',
  },
  {
    id: 'f8', petId: 'p2', type: '疫苗',
    scheduledDate: format(addDays(today, 65), 'yyyy-MM-dd'),
    doctorId: 'd4', status: 'pending',
    notes: '年度狂犬疫苗接种提醒',
  },
  {
    id: 'f9', petId: 'p2', visitId: 'vi2', type: '满意度',
    scheduledDate: format(addDays(today, -15), 'yyyy-MM-dd'),
    doctorId: 'd3', status: 'completed',
    notes: '耳螨治疗后满意度调查',
    satisfactionScore: 5,
    feedback: '非常专业，解释得很清楚，价格也合理，强烈推荐！',
    completedDate: format(addDays(today, -14), 'yyyy-MM-dd'),
  },
  {
    id: 'f10', petId: 'p6', visitId: 'vi3', type: '满意度',
    scheduledDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    doctorId: 'd1', status: 'pending',
    notes: '术后满意度调查',
  },
];

export { uid, thisWeekStart };
export const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const timeSlots = [9, 10, 11, 14, 15, 16, 17, 18];
export const serviceTypeColors: Record<string, string> = {
  '常规检查': 'bg-info-100 text-info-700 border-info-200',
  '疫苗接种': 'bg-brand-100 text-brand-700 border-brand-200',
  '手术': 'bg-red-100 text-red-700 border-red-200',
  '复诊': 'bg-accent-100 text-accent-700 border-accent-200',
  '急诊': 'bg-red-200 text-red-800 border-red-300',
  '驱虫': 'bg-purple-100 text-purple-700 border-purple-200',
  '体检': 'bg-cyan-100 text-cyan-700 border-cyan-200',
};
