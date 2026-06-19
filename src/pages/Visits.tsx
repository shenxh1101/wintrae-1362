import { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, FileText, Pill, Stethoscope, ClipboardList, DollarSign,
  Upload, Trash2, Edit, Printer, Send, User, PawPrint, Calendar,
  CheckCircle, XCircle, AlertCircle, Paperclip, FileImage, FileSpreadsheet,
  Download, X, Save, RotateCcw, Syringe, Heart, Sparkles
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, statusColor, cn } from '@/utils/format';
import type { Visit, Prescription, VisitAttachment, CostBreakdown, FollowupType } from '@/types';
import { uid } from '@/data/mockData';
import { formatISO, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

type ViewMode = 'list' | 'form' | 'detail';
type PaymentStatus = 'pending' | 'paid' | 'refunded';
type FrequencyType = '每日1次' | '每日2次' | '每日3次' | '每8小时' | '每12小时' | '需要时';

const frequencyOptions: FrequencyType[] = ['每日1次', '每日2次', '每日3次', '每8小时', '每12小时', '需要时'];

interface PrescriptionFormItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: FrequencyType;
  durationDays: number;
  unitPrice: number;
  quantity: number;
}

interface AttachmentItem {
  id: string;
  fileName: string;
  fileType: 'image' | 'spreadsheet' | 'other';
}

const emptyPrescription = (): PrescriptionFormItem => ({
  id: uid(),
  medicineName: '',
  dosage: '',
  frequency: '每日1次',
  durationDays: 1,
  unitPrice: 0,
  quantity: 1,
});

const emptyCost: CostBreakdown = { examFee: 0, medicineFee: 0, treatmentFee: 0, otherFee: 0 };

const followupTemplates: { type: FollowupType; label: string; icon: any; color: string; daysOffset: number; noteTemplate: string }[] = [
  { type: '术后', label: '术后复查', icon: RotateCcw, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', daysOffset: 3, noteTemplate: '术后伤口检查与拆线' },
  { type: '疫苗', label: '疫苗复种', icon: Syringe, color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100', daysOffset: 21, noteTemplate: '下一剂疫苗接种' },
  { type: '复诊', label: '慢病复查', icon: Heart, color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100', daysOffset: 30, noteTemplate: '慢性病定期复查' },
  { type: '满意度', label: '满意度回访', icon: Sparkles, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', daysOffset: 3, noteTemplate: '治疗满意度回访' },
];

export default function Visits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    visits, pets, doctors, owners, prescriptions, attachments, appointments, followups,
    createVisit, updateVisit, deletePrescriptionsByVisit,
    addPrescription, generateReminders, createFollowup, addAttachment,
    completeAppointment,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPetId, setFilterPetId] = useState<string>('');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');

  const [formPetId, setFormPetId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formAppointmentId, setFormAppointmentId] = useState('');
  const [formVisitDate, setFormVisitDate] = useState(formatISO(new Date(), { representation: 'date' }));
  const [formSymptoms, setFormSymptoms] = useState('');
  const [formExamination, setFormExamination] = useState('');
  const [formAuxiliaryExam, setFormAuxiliaryExam] = useState('');
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formTreatmentPlan, setFormTreatmentPlan] = useState('');
  const [formPrescriptions, setFormPrescriptions] = useState<PrescriptionFormItem[]>([emptyPrescription()]);
  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([]);
  const [formCost, setFormCost] = useState<CostBreakdown>({ ...emptyCost });
  const [formPaymentStatus, setFormPaymentStatus] = useState<PaymentStatus>('pending');

  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const visitId = searchParams.get('visitId');
    const appointmentId = searchParams.get('appointmentId');
    if (visitId) {
      const visit = visits.find((v) => v.id === visitId);
      if (visit) {
        setSelectedVisitId(visitId);
        setViewMode('detail');
      }
      setSearchParams({}, { replace: true });
    } else if (appointmentId) {
      const apt = appointments.find((a) => a.id === appointmentId);
      if (apt) {
        resetForm();
        setFormAppointmentId(appointmentId);
        setFormPetId(apt.petId);
        setFormDoctorId(apt.doctorId);
        setFormVisitDate(apt.startTime.slice(0, 10));
        if (apt.notes) setFormSymptoms(apt.notes);
        setViewMode('form');
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const getOwner = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    return pet ? owners.find((o) => o.id === pet.ownerId) : undefined;
  };

  const getPet = (petId: string) => pets.find((p) => p.id === petId);
  const getDoctor = (doctorId: string) => doctors.find((d) => d.id === doctorId);

  const getVisitPrescriptions = (visitId: string) =>
    prescriptions.filter((p) => p.visitId === visitId);

  const getVisitAttachments = (visitId: string) =>
    attachments.filter((a) => a.visitId === visitId);

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const pet = getPet(visit.petId);
      const doctor = getDoctor(visit.doctorId);
      const owner = getOwner(visit.petId);
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term ||
        pet?.name.toLowerCase().includes(term) ||
        owner?.name.toLowerCase().includes(term) ||
        visit.diagnosis.toLowerCase().includes(term) ||
        doctor?.name.includes(term);

      const matchesPet = !filterPetId || visit.petId === filterPetId;
      const matchesDoctor = !filterDoctorId || visit.doctorId === filterDoctorId;
      const matchesPayment = !filterPaymentStatus || visit.paymentStatus === filterPaymentStatus;
      const visitDate = parseISO(visit.visitDate);
      const matchesFrom = !filterDateFrom || visitDate >= parseISO(filterDateFrom);
      const matchesTo = !filterDateTo || visitDate <= parseISO(filterDateTo);

      return matchesSearch && matchesPet && matchesDoctor && matchesPayment && matchesFrom && matchesTo;
    }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }, [visits, pets, owners, doctors, searchTerm, filterPetId, filterDoctorId, filterPaymentStatus, filterDateFrom, filterDateTo]);

  const selectedVisit = selectedVisitId ? visits.find((v) => v.id === selectedVisitId) : null;

  const calcPrescriptionSubtotal = (item: PrescriptionFormItem) =>
    Number((item.unitPrice * item.quantity).toFixed(2));

  const calcTotalMedicine = () =>
    formPrescriptions.reduce((sum, p) => sum + calcPrescriptionSubtotal(p), 0);

  const calcTotalCost = () =>
    formCost.examFee + calcTotalMedicine() + formCost.treatmentFee + formCost.otherFee;

  const resetForm = () => {
    setFormPetId('');
    setFormDoctorId('');
    setFormAppointmentId('');
    setFormVisitDate(formatISO(new Date(), { representation: 'date' }));
    setFormSymptoms('');
    setFormExamination('');
    setFormAuxiliaryExam('');
    setFormDiagnosis('');
    setFormTreatmentPlan('');
    setFormPrescriptions([emptyPrescription()]);
    setFormAttachments([]);
    setFormCost({ ...emptyCost });
    setFormPaymentStatus('pending');
    setEditingVisitId(null);
  };

  const handleSelectAppointment = (appointmentId: string) => {
    setFormAppointmentId(appointmentId);
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      setFormPetId(apt.petId);
      setFormDoctorId(apt.doctorId);
      setFormVisitDate(apt.startTime.slice(0, 10));
      if (apt.notes && !formSymptoms) {
        setFormSymptoms(apt.notes);
      }
    }
  };

  const openNewForm = () => {
    resetForm();
    setSelectedVisitId(null);
    setEditingVisitId(null);
    setViewMode('form');
  };

  const openDetail = (visitId: string) => {
    setSelectedVisitId(visitId);
    setEditingVisitId(null);
    setViewMode('detail');
  };

  const editVisit = (visit: Visit) => {
    const presc = getVisitPrescriptions(visit.id);
    setEditingVisitId(visit.id);
    setFormPetId(visit.petId);
    setFormDoctorId(visit.doctorId);
    setFormAppointmentId(visit.appointmentId || '');
    setFormVisitDate(visit.visitDate);
    setFormSymptoms(visit.symptoms);
    setFormExamination(visit.examination);
    setFormAuxiliaryExam('');
    setFormDiagnosis(visit.diagnosis);
    setFormTreatmentPlan(visit.treatmentPlan);
    setFormPrescriptions(
      presc.length > 0
        ? presc.map((p) => ({
            id: p.id,
            medicineName: p.medicineName,
            dosage: p.dosage,
            frequency: p.frequency,
            durationDays: p.durationDays,
            unitPrice: p.unitPrice,
            quantity: p.quantity,
          }))
        : [emptyPrescription()]
    );
    setFormAttachments([]);
    setFormCost(visit.costBreakdown || { ...emptyCost, medicineFee: presc.reduce((s, p) => s + p.unitPrice * p.quantity, 0) });
    setFormPaymentStatus(visit.paymentStatus);
    setViewMode('form');
  };

  const addPrescriptionRow = () => {
    setFormPrescriptions((prev) => [...prev, emptyPrescription()]);
  };

  const removePrescriptionRow = (id: string) => {
    setFormPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePrescriptionRow = (id: string, field: keyof PrescriptionFormItem, value: any) => {
    setFormPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleFileUpload = () => {
    const mockFiles: AttachmentItem[] = [
      { id: uid(), fileName: '化验单_20260620.pdf', fileType: 'spreadsheet' },
      { id: uid(), fileName: 'X光影像.jpg', fileType: 'image' },
    ];
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setFormAttachments((prev) => [...prev, { ...randomFile, id: uid() }]);
  };

  const removeAttachment = (id: string) => {
    setFormAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const validateForm = () => {
    if (!formPetId) { showToast('error', '请选择宠物'); return false; }
    if (!formDoctorId) { showToast('error', '请选择医生'); return false; }
    if (!formDiagnosis.trim()) { showToast('error', '请填写诊断结果'); return false; }
    return true;
  };

  const saveVisit = (asDraft: boolean) => {
    if (!validateForm()) return;

    const totalCost = Number(calcTotalCost().toFixed(2));
    const medicineFee = Number(calcTotalMedicine().toFixed(2));
    const costBreakdown: CostBreakdown = {
      examFee: formCost.examFee,
      medicineFee,
      treatmentFee: formCost.treatmentFee,
      otherFee: formCost.otherFee,
    };

    let visitId: string;
    let isNew = false;

    if (editingVisitId) {
      updateVisit(editingVisitId, {
        petId: formPetId,
        doctorId: formDoctorId,
        appointmentId: formAppointmentId || undefined,
        visitDate: formVisitDate,
        symptoms: formSymptoms,
        examination: formExamination + (formAuxiliaryExam ? `\n【辅助检查】${formAuxiliaryExam}` : ''),
        diagnosis: formDiagnosis,
        treatmentPlan: formTreatmentPlan,
        totalCost,
        costBreakdown,
        paymentStatus: asDraft ? 'pending' : formPaymentStatus,
      });
      visitId = editingVisitId;
      deletePrescriptionsByVisit(visitId);
    } else {
      const newVisit = createVisit({
        petId: formPetId,
        doctorId: formDoctorId,
        appointmentId: formAppointmentId || undefined,
        visitDate: formVisitDate,
        symptoms: formSymptoms,
        examination: formExamination + (formAuxiliaryExam ? `\n【辅助检查】${formAuxiliaryExam}` : ''),
        diagnosis: formDiagnosis,
        treatmentPlan: formTreatmentPlan,
        totalCost,
        costBreakdown,
        paymentStatus: asDraft ? 'pending' : formPaymentStatus,
      });
      visitId = newVisit.id;
      isNew = true;
    }

    const validPrescriptions = formPrescriptions.filter((p) => p.medicineName.trim());
    validPrescriptions.forEach((p) => {
      const newPresc: Omit<Prescription, 'id'> = {
        visitId,
        medicineName: p.medicineName,
        dosage: p.dosage,
        frequency: p.frequency,
        durationDays: p.durationDays,
        instructions: '',
        unitPrice: p.unitPrice,
        quantity: p.quantity,
      };
      addPrescription(newPresc);
    });

    formAttachments.forEach((a) => {
      addAttachment({
        visitId,
        fileName: a.fileName,
        fileType: a.fileType === 'image' ? 'image/jpeg' : a.fileType === 'spreadsheet' ? 'application/pdf' : 'application/octet-stream',
        fileUrl: '',
        uploadedAt: formatISO(new Date()),
      });
    });

    if (!asDraft && validPrescriptions.length > 0 && isNew) {
      setTimeout(() => {
        const state = useAppStore.getState();
        const allPrescs = state.prescriptions.filter((p) => p.visitId === visitId);
        allPrescs.forEach((p) => generateReminders(p.id));
      }, 50);

      createFollowup({
        petId: formPetId,
        visitId,
        type: '复诊',
        scheduledDate: formatISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), { representation: 'date' }),
        doctorId: formDoctorId,
        status: 'pending',
        notes: `${formDiagnosis} 治疗后复诊`,
      });
    }

    if (!asDraft && formAppointmentId) {
      completeAppointment(formAppointmentId);
    }

    showToast('success', asDraft ? '草稿已保存' : (isNew ? '开单成功！已生成用药提醒和回访计划' : '接诊已更新'));
    setEditingVisitId(null);
    setSelectedVisitId(visitId);
    setViewMode('detail');
  };

  const paymentStatusConfig: Record<PaymentStatus, { label: string; icon: any; color: string }> = {
    pending: { label: '待支付', icon: AlertCircle, color: 'bg-accent-100 text-accent-700 border-accent-200' },
    paid: { label: '已支付', icon: CheckCircle, color: 'bg-brand-100 text-brand-700 border-brand-200' },
    refunded: { label: '已退款', icon: XCircle, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  };

  const getFileType = (fileType: string): 'image' | 'spreadsheet' | 'other' => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.includes('pdf') || fileType.includes('spreadsheet') || fileType.includes('excel')) return 'spreadsheet';
    return 'other';
  };

  const FileIcon = ({ type }: { type: 'image' | 'spreadsheet' | 'other' }) => {
    if (type === 'image') return <FileImage className="w-5 h-5 text-info-500" />;
    if (type === 'spreadsheet') return <FileSpreadsheet className="w-5 h-5 text-accent-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="h-full flex p-6 gap-6">
      {toast && (
        <div className={cn(
          'fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg animate-slide-up flex items-center gap-2 text-sm font-medium',
          toast.type === 'success' && 'bg-brand-500 text-white',
          toast.type === 'error' && 'bg-red-500 text-white',
          toast.type === 'info' && 'bg-info-500 text-white'
        )}>
          {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {toast.type === 'error' && <XCircle className="w-4 h-4" />}
          {toast.type === 'info' && <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Left Panel - List */}
      <div className="w-[35%] min-w-[360px] flex flex-col gap-4">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-brand-500" />
              接诊记录
            </h1>
            <button onClick={openNewForm} className="btn-primary">
              <Plus className="w-4 h-4" />
              新建接诊
            </button>
          </div>
          <p className="text-sm text-gray-500">共 {filteredVisits.length} 条记录</p>
        </div>

        {/* Search & Filters */}
        <div className="card p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索宠物名 / 主人 / 诊断 / 医生..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterPetId}
              onChange={(e) => setFilterPetId(e.target.value)}
              className="input input-sm"
            >
              <option value="">全部宠物</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>{p.avatarEmoji} {p.name}</option>
              ))}
            </select>
            <select
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value)}
              className="input input-sm"
            >
              <option value="">全部医生</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.avatarEmoji} {d.name}</option>
              ))}
            </select>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="input input-sm"
            >
              <option value="">全部支付状态</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="refunded">已退款</option>
            </select>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="input input-sm"
              placeholder="开始日期"
            />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="input input-sm"
              placeholder="结束日期"
            />
          </div>
        </div>

        {/* Visit List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredVisits.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">暂无匹配的接诊记录</p>
            </div>
          ) : (
            filteredVisits.map((visit) => {
              const pet = getPet(visit.petId);
              const owner = getOwner(visit.petId);
              const doctor = getDoctor(visit.doctorId);
              const ps = paymentStatusConfig[visit.paymentStatus];
              const isSelected = selectedVisitId === visit.id && viewMode === 'detail';

              return (
                <div
                  key={visit.id}
                  onClick={() => openDetail(visit.id)}
                  className={cn(
                    'card p-4 cursor-pointer transition-all duration-200',
                    isSelected
                      ? 'ring-2 ring-brand-400 bg-brand-50/50 shadow-hover -translate-y-0.5'
                      : 'hover:shadow-hover hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center text-2xl">
                      {pet?.avatarEmoji || '🐾'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-gray-800 flex items-center gap-1.5">
                            <span className="truncate">{pet?.name || '-'}</span>
                            <span className="text-xs text-gray-400 font-normal">· {owner?.name || '-'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(visit.visitDate)}
                            <span className="mx-1">·</span>
                            {doctor?.name || '-'}
                          </div>
                        </div>
                        <span className={cn('badge shrink-0 border', ps.color)}>
                          <ps.icon className="w-3 h-3" />
                          {ps.label}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                          {visit.diagnosis || '暂无诊断'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          {getVisitPrescriptions(visit.id).length > 0 && (
                            <span className="text-xs text-info-600 flex items-center gap-1">
                              <Pill className="w-3 h-3" />
                              {getVisitPrescriptions(visit.id).length}种药
                            </span>
                          )}
                          {getVisitAttachments(visit.id).length > 0 && (
                            <span className="text-xs text-accent-600 flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {getVisitAttachments(visit.id).length}个附件
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{formatCurrency(visit.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Detail / Form */}
      <div className="flex-1 min-w-0 flex flex-col">
        {viewMode === 'list' ? (
          <div className="card flex-1 flex items-center justify-center">
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center">
                <ClipboardList className="w-12 h-12 text-brand-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">选择接诊记录查看详情</h3>
              <p className="text-sm text-gray-500 mb-6">或点击「新建接诊」开始创建新的就诊记录</p>
              <button onClick={openNewForm} className="btn-primary">
                <Plus className="w-4 h-4" />
                新建接诊
              </button>
            </div>
          </div>
        ) : viewMode === 'form' ? (
          <div className="card flex-1 flex flex-col overflow-hidden">
            {/* Form Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-brand-500" />
                  接诊开单
                </h2>
                <button
                  onClick={() => { setViewMode('list'); resetForm(); }}
                  className="btn-ghost px-2 py-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="label">关联预约（可选，快速带入信息）</label>
                <select
                  value={formAppointmentId}
                  onChange={(e) => handleSelectAppointment(e.target.value)}
                  className="input"
                >
                  <option value="">不关联预约</option>
                  {appointments
                    .filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((apt) => {
                      const pet = getPet(apt.petId);
                      const doctor = getDoctor(apt.doctorId);
                      const timeStr = formatDate(apt.startTime) + ' ' + apt.startTime.slice(11, 16);
                      return (
                        <option key={apt.id} value={apt.id}>
                          {timeStr} · {pet?.name || '-'} · {doctor?.name || '-'} · {apt.serviceType}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">选择宠物 *</label>
                  <select
                    value={formPetId}
                    onChange={(e) => setFormPetId(e.target.value)}
                    className="input"
                  >
                    <option value="">请选择宠物</option>
                    {pets.map((p) => {
                      const o = getOwner(p.id);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.avatarEmoji} {p.name} ({o?.name || '-'})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="label">接诊医生 *</label>
                  <select
                    value={formDoctorId}
                    onChange={(e) => setFormDoctorId(e.target.value)}
                    className="input"
                  >
                    <option value="">请选择医生</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.avatarEmoji} {d.name} - {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">就诊日期</label>
                  <input
                    type="date"
                    value={formVisitDate}
                    onChange={(e) => setFormVisitDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Symptoms & Examination */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-info-500" />
                  症状检查
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">症状描述</label>
                    <textarea
                      value={formSymptoms}
                      onChange={(e) => setFormSymptoms(e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="请输入宠物的症状表现、持续时间等..."
                    />
                  </div>
                  <div>
                    <label className="label">体格检查</label>
                    <textarea
                      value={formExamination}
                      onChange={(e) => setFormExamination(e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="请输入体温、心率、触诊等体格检查结果..."
                    />
                  </div>
                  <div>
                    <label className="label">辅助检查</label>
                    <textarea
                      value={formAuxiliaryExam}
                      onChange={(e) => setFormAuxiliaryExam(e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="请输入血常规、生化、影像等辅助检查结果..."
                    />
                  </div>
                  <div>
                    <label className="label">诊断结果 *</label>
                    <textarea
                      value={formDiagnosis}
                      onChange={(e) => setFormDiagnosis(e.target.value)}
                      rows={3}
                      className="input resize-none border-brand-200 focus:border-brand-400"
                      placeholder="请输入最终诊断结果..."
                    />
                  </div>
                </div>
              </div>

              {/* Prescriptions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-brand-500" />
                    医嘱处方
                  </h3>
                  <button onClick={addPrescriptionRow} className="btn-sm btn-secondary">
                    <Plus className="w-3 h-3" />
                    添加药品
                  </button>
                </div>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="table-head">药品名称</th>
                          <th className="table-head w-28">剂量</th>
                          <th className="table-head w-32">频次</th>
                          <th className="table-head w-20">疗程(天)</th>
                          <th className="table-head w-24">单价</th>
                          <th className="table-head w-20">数量</th>
                          <th className="table-head w-24">小计</th>
                          <th className="table-head w-14"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formPrescriptions.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="table-cell">
                              <input
                                type="text"
                                value={p.medicineName}
                                onChange={(e) => updatePrescriptionRow(p.id, 'medicineName', e.target.value)}
                                className="input input-sm"
                                placeholder="药品名称"
                              />
                            </td>
                            <td className="table-cell">
                              <input
                                type="text"
                                value={p.dosage}
                                onChange={(e) => updatePrescriptionRow(p.id, 'dosage', e.target.value)}
                                className="input input-sm"
                                placeholder="如:1片/次"
                              />
                            </td>
                            <td className="table-cell">
                              <select
                                value={p.frequency}
                                onChange={(e) => updatePrescriptionRow(p.id, 'frequency', e.target.value)}
                                className="input input-sm"
                              >
                                {frequencyOptions.map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </td>
                            <td className="table-cell">
                              <input
                                type="number"
                                min="1"
                                value={p.durationDays}
                                onChange={(e) => updatePrescriptionRow(p.id, 'durationDays', Number(e.target.value))}
                                className="input input-sm"
                              />
                            </td>
                            <td className="table-cell">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={p.unitPrice}
                                onChange={(e) => updatePrescriptionRow(p.id, 'unitPrice', Number(e.target.value))}
                                className="input input-sm"
                              />
                            </td>
                            <td className="table-cell">
                              <input
                                type="number"
                                min="1"
                                value={p.quantity}
                                onChange={(e) => updatePrescriptionRow(p.id, 'quantity', Number(e.target.value))}
                                className="input input-sm"
                              />
                            </td>
                            <td className="table-cell font-semibold text-brand-600">
                              {formatCurrency(calcPrescriptionSubtotal(p))}
                            </td>
                            <td className="table-cell">
                              <button
                                onClick={() => removePrescriptionRow(p.id)}
                                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-brand-50/50">
                          <td colSpan={6} className="table-cell text-right font-semibold text-gray-700">
                            药品合计：
                          </td>
                          <td className="table-cell font-bold text-brand-600 text-lg">
                            {formatCurrency(calcTotalMedicine())}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Treatment Plan */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent-500" />
                  治疗方案
                </h3>
                <textarea
                  value={formTreatmentPlan}
                  onChange={(e) => setFormTreatmentPlan(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="请输入详细治疗方案、护理要求、注意事项等..."
                />
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-purple-500" />
                  附件上传
                </h3>
                <div className="card p-4">
                  {formAttachments.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {formAttachments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <FileIcon type={a.fileType} />
                          </div>
                          <span className="flex-1 text-sm text-gray-700">{a.fileName}</span>
                          <button className="btn-ghost px-2 py-1 text-xs text-gray-500">
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeAttachment(a.id)}
                            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleFileUpload}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-medium">上传化验单 / 影像资料</span>
                  </button>
                </div>
              </div>

              {/* Cost Settlement */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  费用结算
                </h3>
                <div className="card p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="label">检查费</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formCost.examFee}
                        onChange={(e) => setFormCost({ ...formCost, examFee: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">治疗费</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formCost.treatmentFee}
                        onChange={(e) => setFormCost({ ...formCost, treatmentFee: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">其他费用</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formCost.otherFee}
                        onChange={(e) => setFormCost({ ...formCost, otherFee: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">药品费（自动计算）</label>
                      <div className="input bg-gray-50 text-gray-600 flex items-center">
                        {formatCurrency(calcTotalMedicine())}
                      </div>
                    </div>
                  </div>
                  <div className="divider" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">合计金额：</span>
                      <span className="text-3xl font-bold text-brand-600 ml-2">
                        {formatCurrency(calcTotalCost())}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {(Object.keys(paymentStatusConfig) as PaymentStatus[]).map((status) => {
                        const cfg = paymentStatusConfig[status];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormPaymentStatus(status)}
                            className={cn(
                              'btn-sm flex items-center gap-1.5 border-2 transition-all',
                              formPaymentStatus === status
                                ? cfg.color + ' border-current shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="border-t border-gray-100 p-5 flex justify-end gap-3">
              <button
                onClick={() => { setViewMode('list'); resetForm(); }}
                className="btn-secondary px-6"
              >
                取消
              </button>
              <button
                onClick={() => saveVisit(true)}
                className="btn-secondary px-6 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存草稿
              </button>
              <button
                onClick={() => saveVisit(false)}
                disabled={!formPetId || !formDoctorId || !formDiagnosis.trim()}
                className="btn-primary px-8 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                确认开单
              </button>
            </div>
          </div>
        ) : (
          selectedVisit && (
            <div className="card flex-1 flex flex-col overflow-hidden">
              {/* Detail Header */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-brand-50/50 to-info-50/30">
                {(() => {
                  const pet = getPet(selectedVisit.petId);
                  const owner = getOwner(selectedVisit.petId);
                  const doctor = getDoctor(selectedVisit.doctorId);
                  const ps = paymentStatusConfig[selectedVisit.paymentStatus];
                  const visitPrescs = getVisitPrescriptions(selectedVisit.id);
                  const visitAtts = getVisitAttachments(selectedVisit.id);

                  return (
                    <>
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-brand-500" />
                          接诊详情
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => window.print()} className="btn-sm btn-secondary">
                            <Printer className="w-3.5 h-3.5" />
                            打印病历
                          </button>
                          <button onClick={() => editVisit(selectedVisit)} className="btn-sm btn-secondary">
                            <Edit className="w-3.5 h-3.5" />
                            编辑
                          </button>
                          <button
                            onClick={() => {
                              visitPrescs.forEach((p) => generateReminders(p.id));
                              showToast('success', `已为 ${visitPrescs.length} 种药品生成用药提醒`);
                            }}
                            className="btn-sm btn-secondary"
                          >
                            <Pill className="w-3.5 h-3.5" />
                            生成用药提醒
                          </button>
                          <div className="h-6 w-px bg-gray-200 mx-1" />
                          {followupTemplates.map((tpl) => {
                            const Icon = tpl.icon;
                            return (
                              <button
                                key={tpl.type}
                                onClick={() => {
                                  createFollowup({
                                    petId: selectedVisit.petId,
                                    visitId: selectedVisit.id,
                                    type: tpl.type,
                                    scheduledDate: formatISO(new Date(Date.now() + tpl.daysOffset * 24 * 60 * 60 * 1000), { representation: 'date' }),
                                    doctorId: selectedVisit.doctorId,
                                    status: 'pending',
                                    notes: `${selectedVisit.diagnosis} - ${tpl.noteTemplate}`,
                                  });
                                  showToast('success', `已生成${tpl.label}任务，可在回访看板查看`);
                                }}
                                className={cn('btn-sm border flex items-center gap-1.5 transition-colors', tpl.color)}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {tpl.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-start gap-6">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center text-5xl border-4 border-white">
                            {pet?.avatarEmoji || '🐾'}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-800">{pet?.name || '-'}</h3>
                              <span className="chip bg-brand-100 text-brand-700">
                                {pet?.species} · {pet?.breed}
                              </span>
                              <span className={cn('badge border', ps.color)}>
                                <ps.icon className="w-3 h-3" />
                                {ps.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-1.5">
                              <PawPrint className="w-3.5 h-3.5 text-gray-400" />
                              {pet?.age || '-'}岁 · {pet?.gender || '-'} · {pet?.weight || '-'}kg
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {formatDate(selectedVisit.visitDate)}
                              {selectedVisit.appointmentId && (() => {
                                const apt = appointments.find((a) => a.id === selectedVisit.appointmentId);
                                if (!apt) return null;
                                return (
                                  <span className="ml-2 chip bg-info-100 text-info-700 text-xs">
                                    关联预约 · {apt.serviceType}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Owner Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-4 min-w-[220px]">
                          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">主人信息</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-gray-400">姓名</span>
                              <span className="font-medium text-gray-800">{owner?.name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-gray-400">电话</span>
                              <span className="text-gray-700 font-mono">{owner?.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-gray-400">邮箱</span>
                              <span className="text-gray-700">{owner?.email || '-'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-12 text-gray-400 shrink-0">地址</span>
                              <span className="text-gray-700 line-clamp-2">{owner?.address || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-auto flex items-center gap-4">
                          <div className="text-center p-4 bg-white rounded-2xl shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-info-50 to-info-100 flex items-center justify-center text-2xl mx-auto mb-2">
                              {doctor?.avatarEmoji || '👨‍⚕️'}
                            </div>
                            <div className="font-semibold text-gray-800 text-sm">{doctor?.name}</div>
                            <div className="text-xs text-gray-400">{doctor?.title}</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-2xl shadow-sm">
                            <DollarSign className="w-6 h-6 text-brand-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-brand-600">{formatCurrency(selectedVisit.totalCost)}</div>
                            <div className="text-xs text-gray-400">总费用</div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Symptoms / Diagnosis Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-red-500" />
                      症状描述
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedVisit.symptoms || '暂无记录'}
                    </p>
                  </div>
                  <div className="card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-info-500" />
                      体格检查
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedVisit.examination || '暂无记录'}
                    </p>
                  </div>
                  <div className="card p-4 col-span-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-500" />
                      诊断结果
                    </h4>
                    <div className="bg-brand-50/60 rounded-xl p-4 border border-brand-100">
                      <p className="text-base font-medium text-gray-800 leading-relaxed">
                        {selectedVisit.diagnosis || '暂无诊断'}
                      </p>
                    </div>
                  </div>
                  {selectedVisit.treatmentPlan && (
                    <div className="card p-4 col-span-2">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent-500" />
                        治疗方案
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {selectedVisit.treatmentPlan}
                      </p>
                    </div>
                  )}
                </div>

                {/* Prescription Table */}
                {getVisitPrescriptions(selectedVisit.id).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-brand-500" />
                      处方药品
                      <span className="badge bg-brand-100 text-brand-700">
                        {getVisitPrescriptions(selectedVisit.id).length} 种
                      </span>
                    </h3>
                    <div className="card overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="table-head">药品名称</th>
                            <th className="table-head w-28">剂量</th>
                            <th className="table-head w-32">频次</th>
                            <th className="table-head w-20">疗程</th>
                            <th className="table-head w-24">单价</th>
                            <th className="table-head w-20">数量</th>
                            <th className="table-head w-24">小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getVisitPrescriptions(selectedVisit.id).map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                              <td className="table-cell">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                                    <Pill className="w-4 h-4 text-brand-500" />
                                  </span>
                                  <span className="font-medium text-gray-800">{p.medicineName}</span>
                                </div>
                              </td>
                              <td className="table-cell text-gray-600">{p.dosage}</td>
                              <td className="table-cell">
                                <span className="badge bg-info-100 text-info-700">{p.frequency}</span>
                              </td>
                              <td className="table-cell text-gray-600">{p.durationDays} 天</td>
                              <td className="table-cell text-gray-600">{formatCurrency(p.unitPrice)}</td>
                              <td className="table-cell text-gray-600">{p.quantity}</td>
                              <td className="table-cell font-semibold text-brand-600">
                                {formatCurrency(p.unitPrice * p.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-brand-50/50">
                            <td colSpan={6} className="table-cell text-right font-semibold text-gray-700">
                              药品合计：
                            </td>
                            <td className="table-cell font-bold text-brand-600 text-lg">
                              {formatCurrency(
                                getVisitPrescriptions(selectedVisit.id).reduce(
                                  (s, p) => s + p.unitPrice * p.quantity, 0
                                )
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {getVisitAttachments(selectedVisit.id).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-purple-500" />
                      附件资料
                      <span className="badge bg-purple-100 text-purple-700">
                        {getVisitAttachments(selectedVisit.id).length} 个
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getVisitAttachments(selectedVisit.id).map((a) => (
                        <div
                          key={a.id}
                          className="card p-4 flex items-center gap-3 hover:shadow-hover hover:-translate-y-0.5 transition-all cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-info-50 to-info-100 flex items-center justify-center shrink-0">
                            <FileIcon type={getFileType(a.fileType)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">{a.fileName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{formatDate(a.uploadedAt)}</div>
                          </div>
                          <button className="btn-ghost px-2 py-1">
                            <Download className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Followup Tasks */}
                {(() => {
                  const visitFollowups = followups.filter((f) => f.visitId === selectedVisit.id);
                  if (visitFollowups.length === 0) return null;

                  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
                    pending: { label: '待处理', icon: AlertCircle, color: 'bg-amber-100 text-amber-700 border-amber-200' },
                    in_progress: { label: '进行中', icon: Send, color: 'bg-info-100 text-info-700 border-info-200' },
                    completed: { label: '已完成', icon: CheckCircle, color: 'bg-brand-100 text-brand-700 border-brand-200' },
                    cancelled: { label: '已取消', icon: XCircle, color: 'bg-gray-100 text-gray-600 border-gray-200' },
                  };

                  return (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Send className="w-4 h-4 text-purple-500" />
                        回访任务
                        <span className="badge bg-purple-100 text-purple-700">
                          {visitFollowups.length} 条
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {visitFollowups.map((f) => {
                          const doctor = doctors.find((d) => d.id === f.doctorId);
                          const sc = statusConfig[f.status] || statusConfig.pending;
                          const ScIcon = sc.icon;

                          return (
                            <div key={f.id} className="card p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="chip bg-purple-100 text-purple-700 text-xs font-medium">
                                    {f.type}
                                  </span>
                                  <span className={cn('badge border flex items-center gap-1 text-xs', sc.color)}>
                                    <ScIcon className="w-3 h-3" />
                                    {sc.label}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-800">{formatDate(f.scheduledDate)}</div>
                                  {f.completedDate && (
                                    <div className="text-xs text-gray-400">完成于 {formatDate(f.completedDate)}</div>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="w-14 text-gray-400 shrink-0">医生</span>
                                  <span className="text-gray-700">{doctor?.avatarEmoji} {doctor?.name || '-'}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="w-14 text-gray-400 shrink-0">备注</span>
                                  <span className="text-gray-700">{f.notes || '-'}</span>
                                </div>
                                {f.feedback && (
                                  <div className="flex items-start gap-2">
                                    <span className="w-14 text-gray-400 shrink-0">回访反馈</span>
                                    <span className="text-gray-700">{f.feedback}</span>
                                  </div>
                                )}
                                {f.satisfactionScore && (
                                  <div className="flex items-center gap-2">
                                    <span className="w-14 text-gray-400 shrink-0">满意度</span>
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((i) => (
                                        <span key={i} className={cn(
                                          'text-lg',
                                          i <= f.satisfactionScore! ? 'text-amber-400' : 'text-gray-200'
                                        )}>★</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Cost Summary - Settlement Receipt */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    费用结算单
                  </h3>
                  <div className="card p-5 bg-gradient-to-br from-gray-50/50 to-brand-50/30">
                    {/* Receipt Header */}
                    <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-200">
                      <div className="text-lg font-bold text-gray-800">收费凭证</div>
                      <div className="text-xs text-gray-400 mt-1">
                        接诊单号：{selectedVisit.id.toUpperCase()} · {formatDate(selectedVisit.visitDate)}
                      </div>
                    </div>

                    {/* Cost Items */}
                    {(() => {
                      const cb = selectedVisit.costBreakdown || {
                        examFee: Math.max(0, selectedVisit.totalCost - getVisitPrescriptions(selectedVisit.id).reduce((s, p) => s + p.unitPrice * p.quantity, 0)),
                        medicineFee: getVisitPrescriptions(selectedVisit.id).reduce((s, p) => s + p.unitPrice * p.quantity, 0),
                        treatmentFee: 0,
                        otherFee: 0,
                      };
                      const items = [
                        { name: '检查费', value: cb.examFee, color: 'text-gray-700' },
                        { name: '治疗费', value: cb.treatmentFee, color: 'text-accent-600' },
                        { name: '药品费', value: cb.medicineFee, color: 'text-brand-600' },
                        { name: '其他费用', value: cb.otherFee, color: 'text-info-600' },
                      ].filter((i) => i.value > 0 || true);

                      return (
                        <div className="space-y-3 mb-4">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                                  {idx + 1}
                                </span>
                                <span className="text-gray-600">{item.name}</span>
                              </div>
                              <span className={cn('font-semibold', item.color)}>{formatCurrency(item.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Divider */}
                    <div className="border-b-2 border-dashed border-gray-200 mb-4" />

                    {/* Total */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">应付金额</span>
                      <span className="text-3xl font-bold text-brand-600">
                        {formatCurrency(selectedVisit.totalCost)}
                      </span>
                    </div>

                    {/* Payment Status & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      {(() => {
                        const ps = paymentStatusConfig[selectedVisit.paymentStatus];
                        const Icon = ps.icon;
                        return (
                          <span className={cn('px-4 py-2 rounded-xl border-2 flex items-center gap-2 text-sm font-semibold', ps.color)}>
                            <Icon className="w-5 h-5" />
                            {ps.label}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-2">
                        {selectedVisit.paymentStatus === 'pending' && (
                          <button
                            onClick={() => {
                              updateVisit(selectedVisit.id, { paymentStatus: 'paid' });
                              showToast('success', '已标记为已收款');
                            }}
                            className="btn-sm btn-primary"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            确认收款
                          </button>
                        )}
                        {selectedVisit.paymentStatus === 'paid' && (
                          <>
                            <button
                              onClick={() => {
                                updateVisit(selectedVisit.id, { paymentStatus: 'refunded' });
                                showToast('success', '已标记为已退款');
                              }}
                              className="btn-sm btn-secondary"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              办理退款
                            </button>
                            <button
                              onClick={() => {
                                updateVisit(selectedVisit.id, {
                                  totalCost: selectedVisit.totalCost + 50,
                                  costBreakdown: {
                                    ...selectedVisit.costBreakdown,
                                    otherFee: (selectedVisit.costBreakdown?.otherFee || 0) + 50,
                                  },
                                });
                                showToast('success', '已添加补缴费用');
                              }}
                              className="btn-sm btn-secondary"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              补缴费用
                            </button>
                          </>
                        )}
                        {selectedVisit.paymentStatus === 'refunded' && (
                          <button
                            onClick={() => {
                              updateVisit(selectedVisit.id, { paymentStatus: 'paid' });
                              showToast('success', '已撤销退款，恢复为已支付');
                            }}
                            className="btn-sm btn-secondary"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            撤销退款
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
