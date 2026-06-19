import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill, Clock, CheckCircle2, AlertTriangle, Send, MessageCircle,
  Smartphone, Calendar, Filter, Plus, Eye, X, Bell,
  Check, Sparkles, ListChecks, CalendarDays, User, PawPrint,
  Stethoscope, FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  formatTime, formatDate, formatRelativeDate, statusColor, statusText, cn,
} from '@/utils/format';
import type { MedicationReminder, Prescription, ReminderStatus } from '@/types';
import { uid } from '@/data/mockData';
import {
  isToday, isTomorrow, differenceInDays, startOfDay, addDays, parseISO,
  isSameDay, isWithinInterval,
} from 'date-fns';

type StatusFilter = 'all' | ReminderStatus;

interface SendPanelData {
  reminder: MedicationReminder;
  channel: 'sms' | 'wechat';
}

interface ManualFormData {
  petId: string;
  medicineName: string;
  dosage: string;
  frequency: Prescription['frequency'];
  durationDays: number;
  instructions: string;
}

const freqOptions: Prescription['frequency'][] = [
  '每日1次', '每日2次', '每日3次', '每8小时', '每12小时', '需要时',
];

const freqMap: Record<string, { hours: number; times: [number, number][] }> = {
  '每日1次': { hours: 24, times: [[8, 0]] },
  '每日2次': { hours: 12, times: [[8, 0], [20, 0]] },
  '每日3次': { hours: 8, times: [[8, 0], [16, 0], [22, 0]] },
  '每8小时': { hours: 8, times: [[8, 0], [16, 0], [0, 0]] },
  '每12小时': { hours: 12, times: [[8, 0], [20, 0]] },
  '需要时': { hours: 0, times: [[9, 0]] },
};

const emptyManualForm: ManualFormData = {
  petId: '',
  medicineName: '',
  dosage: '',
  frequency: '每日2次',
  durationDays: 7,
  instructions: '',
};

function confirmedStatusColor(status: string) {
  if (status === 'confirmed') return 'bg-brand-100 text-brand-700';
  return statusColor(status);
}

function confirmedStatusText(status: string) {
  if (status === 'confirmed') return '已确认';
  return statusText(status);
}

const nodeColorMap: Record<ReminderStatus, string> = {
  pending: 'bg-gray-400',
  sent: 'bg-info-500',
  confirmed: 'bg-brand-500',
  overdue: 'bg-red-500',
};

export default function Medications() {
  const {
    medicationReminders, prescriptions, pets, owners, visits, doctors,
    generateReminders, sendReminder, confirmReminder, addPrescription,
  } = useAppStore();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(formatDate(new Date(), 'yyyy-MM-dd'));
  const [petFilter, setPetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sendPanel, setSendPanel] = useState<SendPanelData | null>(null);
  const [mode, setMode] = useState<'prescription' | 'manual'>('prescription');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>('');
  const [manualForm, setManualForm] = useState<ManualFormData>(emptyManualForm);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const getPet = (petId: string) => pets.find((p) => p.id === petId);
  const getOwner = (petId: string) => {
    const pet = getPet(petId);
    return owners.find((o) => o.id === pet?.ownerId);
  };
  const getPrescription = (id: string) => prescriptions.find((p) => p.id === id);

  const today = startOfDay(new Date());
  const todayCount = useMemo(() =>
    medicationReminders.filter((r) =>
      isSameDay(parseISO(r.remindTime), today) && r.status === 'pending'
    ).length
  , [medicationReminders, today]);
  const sentCount = medicationReminders.filter((r) => r.status === 'sent').length;
  const confirmedCount = medicationReminders.filter((r) => r.status === 'confirmed').length;
  const overdueCount = medicationReminders.filter((r) => r.status === 'overdue').length;

  const filteredReminders = useMemo(() => {
    const targetDate = parseISO(dateFilter);
    const endOfWeek = addDays(today, 7);
    return medicationReminders
      .filter((r) => {
        const d = parseISO(r.remindTime);
        const matchDate = isWithinInterval(d, { start: targetDate, end: endOfWeek });
        const matchPet = petFilter === 'all' || r.petId === petFilter;
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchDate && matchPet && matchStatus;
      })
      .sort((a, b) =>
        new Date(a.remindTime).getTime() - new Date(b.remindTime).getTime()
      );
  }, [medicationReminders, dateFilter, petFilter, statusFilter, today]);

  const groupedReminders = useMemo(() => {
    const groups: Record<string, MedicationReminder[]> = {
      今天: [],
      明天: [],
      后天: [],
      本周内: [],
    };
    filteredReminders.forEach((r) => {
      const d = parseISO(r.remindTime);
      let key = '本周内';
      if (isToday(d)) key = '今天';
      else if (isTomorrow(d)) key = '明天';
      else if (differenceInDays(d, today) === 2) key = '后天';
      else if (differenceInDays(d, today) < 7) key = '本周内';
      if (groups[key]) groups[key].push(r);
    });
    return groups;
  }, [filteredReminders, today]);

  const previewTimes = useMemo(() => {
    let config = freqMap['每日2次'];
    let duration = 7;
    if (mode === 'prescription') {
      const p = prescriptions.find((x) => x.id === selectedPrescriptionId);
      if (p) {
        config = freqMap[p.frequency] || freqMap['每日1次'];
        duration = p.durationDays;
      } else {
        return [];
      }
    } else {
      config = freqMap[manualForm.frequency] || freqMap['每日1次'];
      duration = manualForm.durationDays;
    }
    const times: Date[] = [];
    for (let day = 0; day < duration; day++) {
      for (const [h, m] of config.times) {
        const t = new Date(today);
        t.setDate(t.getDate() + day);
        t.setHours(h, m, 0, 0);
        if (t.getTime() >= new Date().getTime()) {
          times.push(t);
        }
      }
    }
    return times.slice(0, 12);
  }, [mode, selectedPrescriptionId, manualForm, today, prescriptions]);

  const totalPreviewCount = useMemo(() => {
    if (mode === 'prescription') {
      const p = prescriptions.find((x) => x.id === selectedPrescriptionId);
      if (!p) return 0;
      const config = freqMap[p.frequency] || freqMap['每日1次'];
      return config.times.length * p.durationDays;
    }
    const config = freqMap[manualForm.frequency] || freqMap['每日1次'];
    return config.times.length * manualForm.durationDays;
  }, [mode, selectedPrescriptionId, manualForm, prescriptions]);

  const canGenerate = useMemo(() => {
    if (mode === 'prescription') {
      return !!selectedPrescriptionId;
    }
    return (
      !!manualForm.petId &&
      !!manualForm.medicineName.trim() &&
      !!manualForm.dosage.trim() &&
      manualForm.durationDays > 0
    );
  }, [mode, selectedPrescriptionId, manualForm]);

  const handleGenerate = () => {
    if (!canGenerate) return;
    if (mode === 'prescription') {
      generateReminders(selectedPrescriptionId);
      return;
    }
    const visit = visits[0];
    const presc: Omit<Prescription, 'id'> = {
      visitId: visit?.id || 'manual',
      medicineName: manualForm.medicineName.trim(),
      dosage: manualForm.dosage.trim(),
      frequency: manualForm.frequency,
      durationDays: Number(manualForm.durationDays),
      instructions: manualForm.instructions.trim(),
      unitPrice: 0,
      quantity: 0,
    };
    const tempId = uid();
    addPrescription({ ...presc });
    setTimeout(() => {
      const store = useAppStore.getState();
      const newPresc = store.prescriptions.find(
        (p) => p.medicineName === presc.medicineName && p.dosage === presc.dosage
      );
      if (newPresc) {
        store.generateReminders(newPresc.id);
        setManualForm({ ...emptyManualForm });
      }
    }, 0);
    void tempId;
  };

  const openSendPanel = (reminder: MedicationReminder, channel: 'sms' | 'wechat') => {
    setSendPanel({ reminder, channel });
  };

  const confirmSend = () => {
    if (!sendPanel) return;
    sendReminder(sendPanel.reminder.id, sendPanel.channel);
    setSendPanel(null);
  };

  const handleConfirm = (id: string) => {
    confirmReminder(id);
  };

  const statCards = [
    { label: '今日待发送', value: todayCount, icon: Clock, color: 'gray', bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-100' },
    { label: '已发送', value: sentCount, icon: Send, color: 'info', bg: 'bg-info-50', text: 'text-info-600', ring: 'ring-info-100' },
    { label: '已确认', value: confirmedCount, icon: CheckCircle2, color: 'brand', bg: 'bg-brand-50', text: 'text-brand-600', ring: 'ring-brand-100' },
    { label: '已逾期', value: overdueCount, icon: AlertTriangle, color: 'red', bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
  ] as const;

  const statusTabs: { key: StatusFilter; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: '全部', icon: ListChecks },
    { key: 'pending', label: '待发送', icon: Clock },
    { key: 'sent', label: '已发送', icon: Send },
    { key: 'confirmed', label: '已确认', icon: CheckCircle2 },
    { key: 'overdue', label: '已逾期', icon: AlertTriangle },
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col p-6 gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 min-h-0">
          <div className="xl:col-span-3 card p-5 animate-pulse min-h-[500px]" />
          <div className="xl:col-span-2 card p-5 animate-pulse min-h-[500px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Pill className="w-7 h-7 text-brand-500" />
            用药提醒
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            自动管理处方用药提醒，推送主人按时服药通知
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {statCards.map(({ label, value, icon: Icon, bg, text, ring }) => (
          <div key={label} className="card p-5 card-hover">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-gray-500 truncate">{label}</div>
                <div className="text-3xl font-bold text-gray-800 mt-2">{value}</div>
              </div>
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center ring-4 shrink-0', bg, ring)}>
                <Icon className={cn('w-5 h-5', text)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: 60% / 40% */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 min-h-0">
        {/* Left: Timeline (~60%) */}
        <div className="xl:col-span-3 flex flex-col card overflow-hidden">
          {/* Filters */}
          <div className="p-5 border-b border-gray-50 space-y-4 shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative sm:w-44">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="relative flex-1">
                <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={petFilter}
                  onChange={(e) => setPetFilter(e.target.value)}
                  className="input pl-10 appearance-none pr-10"
                >
                  <option value="all">全部宠物</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.avatarEmoji} {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative sm:w-auto">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="input pl-10 appearance-none pr-10"
                >
                  {statusTabs.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {statusTabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                    statusFilter === key
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {filteredReminders.length === 0 ? (
              <div className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center py-16 animate-fade-in">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center">
                    <Pill className="w-12 h-12 text-brand-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无用药提醒</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                    选择已有处方或手动创建，生成自动提醒计划
                  </p>
                  <button
                    onClick={() => setMode('manual')}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    创建提醒计划
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {(['今天', '明天', '后天', '本周内'] as const).map((groupKey) => {
                  const items = groupedReminders[groupKey];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={groupKey}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-500" />
                          <h3 className="text-sm font-bold text-gray-700">{groupKey}</h3>
                        </div>
                        <span className="badge bg-gray-50 text-gray-500">{items.length}条</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                      <div className="relative pl-8">
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 rounded-full" />

                        <div className="space-y-4">
                          {items.map((r) => {
                            const pet = getPet(r.petId);
                            const owner = getOwner(r.petId);
                            const prescription = getPrescription(r.prescriptionId);
                            const relatedVisit = prescription ? visits.find((v) => v.id === prescription.visitId) : undefined;
                            return (
                              <div key={r.id} className="relative animate-fade-in">
                                <div className={cn(
                                  'absolute -left-[21px] top-5 w-6 h-6 rounded-full border-[3px] border-white shadow-sm z-10 flex items-center justify-center',
                                  nodeColorMap[r.status],
                                  (r.status === 'pending' || r.status === 'overdue') && 'animate-pulse-soft'
                                )}>
                                  {r.status === 'confirmed' && (
                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                  )}
                                </div>

                                <div className="card card-hover p-4">
                                  <div className="flex gap-4">
                                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center text-3xl">
                                      {pet?.avatarEmoji || '🐾'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-800">
                                              {pet?.name || '未知宠物'}
                                            </span>
                                            <span className="text-xs text-gray-400">·</span>
                                            <span className="font-bold text-gray-900">
                                              {r.medicineName}
                                            </span>
                                          </div>
                                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                              <Pill className="w-3 h-3 text-brand-500" />
                                              {r.dosage}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-info-500" />
                                              {formatTime(r.remindTime)}
                                            </span>
                                            {owner?.name && (
                                              <span className="flex items-center gap-1">
                                                <User className="w-3 h-3 text-gray-400" />
                                                {owner.name}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <span className={cn('badge shrink-0', confirmedStatusColor(r.status))}>
                                          {confirmedStatusText(r.status)}
                                        </span>
                                      </div>

                                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
                                        {relatedVisit && (
                                          <>
                                            <button
                                              onClick={() => navigate('/visits?visitId=' + relatedVisit.id)}
                                              className="btn-sm btn-primary flex items-center gap-1.5"
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                              查看接诊
                                            </button>
                                            <button
                                              onClick={() => {
                                                setSelectedVisitId(relatedVisit.id);
                                                setShowVisitModal(true);
                                              }}
                                              className="btn-sm btn-secondary flex items-center gap-1.5"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                              快速预览
                                            </button>
                                          </>
                                        )}
                                        {r.status === 'pending' && (
                                          <>
                                            <button
                                              onClick={() => openSendPanel(r, 'sms')}
                                              className="btn-sm btn-secondary flex items-center gap-1.5"
                                            >
                                              <Smartphone className="w-3.5 h-3.5 text-info-500" />
                                              发送短信
                                            </button>
                                            <button
                                              onClick={() => openSendPanel(r, 'wechat')}
                                              className="btn-sm btn-secondary flex items-center gap-1.5"
                                            >
                                              <MessageCircle className="w-3.5 h-3.5 text-brand-500" />
                                              发送微信
                                            </button>
                                          </>
                                        )}
                                        {r.status === 'sent' && (
                                          <button
                                            onClick={() => handleConfirm(r.id)}
                                            className="btn-sm btn-primary flex items-center gap-1.5"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            标记确认
                                          </button>
                                        )}
                                        {r.status === 'overdue' && (
                                          <>
                                            <button
                                              onClick={() => openSendPanel(r, 'sms')}
                                              className="btn-sm btn-danger flex items-center gap-1.5"
                                            >
                                              <Smartphone className="w-3.5 h-3.5" />
                                              重发短信
                                            </button>
                                            <button
                                              onClick={() => openSendPanel(r, 'wechat')}
                                              className="btn-sm btn-danger flex items-center gap-1.5"
                                            >
                                              <MessageCircle className="w-3.5 h-3.5" />
                                              重发微信
                                            </button>
                                          </>
                                        )}
                                        {r.status === 'confirmed' && (
                                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                                            主人已确认服药
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Generator (~40%) */}
        <div className="xl:col-span-2 flex flex-col card overflow-hidden">
          <div className="p-5 border-b border-gray-50 shrink-0">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-500" />
              计划生成器
            </h2>
            <p className="text-xs text-gray-500 mt-1">选择处方或手动创建用药计划</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl">
              <button
                onClick={() => setMode('prescription')}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5',
                  mode === 'prescription'
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <ListChecks className="w-3.5 h-3.5" />
                已有处方
              </button>
              <button
                onClick={() => setMode('manual')}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5',
                  mode === 'manual'
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                手动创建
              </button>
            </div>

            {/* Prescription Mode */}
            {mode === 'prescription' && (
              <div>
                <label className="label">选择处方</label>
                <select
                  value={selectedPrescriptionId}
                  onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                  className="input appearance-none pr-10"
                >
                  <option value="">请选择处方...</option>
                  {prescriptions.map((p) => {
                    const visit = visits.find((v) => v.id === p.visitId);
                    const pet = getPet(visit?.petId || '');
                    return (
                      <option key={p.id} value={p.id}>
                        {pet?.avatarEmoji || '🐾'} {pet?.name || '未知'} - {p.medicineName} ({p.durationDays}天)
                      </option>
                    );
                  })}
                </select>
                {selectedPrescriptionId && (() => {
                  const p = getPrescription(selectedPrescriptionId);
                  const visit = visits.find((v) => v.id === p?.visitId);
                  const pet = getPet(visit?.petId || '');
                  if (!p) return null;
                  return (
                    <div className="mt-3 card p-4 space-y-2 bg-gradient-to-br from-brand-50/50 to-info-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{pet?.avatarEmoji || '🐾'}</span>
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{pet?.name}</div>
                          <div className="text-xs text-gray-500">{p.medicineName}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-white/60">
                        <div>
                          <div className="text-gray-400">剂量</div>
                          <div className="font-medium text-gray-700">{p.dosage}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">频次</div>
                          <div className="font-medium text-gray-700">{p.frequency}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">疗程</div>
                          <div className="font-medium text-gray-700">{p.durationDays}天</div>
                        </div>
                      </div>
                      {p.instructions && (
                        <div className="text-xs text-gray-500 pt-2 border-t border-white/60">
                          💡 {p.instructions}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Manual Mode */}
            {mode === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="label">宠物 *</label>
                  <select
                    value={manualForm.petId}
                    onChange={(e) => setManualForm({ ...manualForm, petId: e.target.value })}
                    className="input appearance-none pr-10"
                  >
                    <option value="">请选择宠物...</option>
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.avatarEmoji} {p.name} ({p.breed})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">药品名称 *</label>
                  <input
                    type="text"
                    value={manualForm.medicineName}
                    onChange={(e) => setManualForm({ ...manualForm, medicineName: e.target.value })}
                    className="input"
                    placeholder="如：阿莫西林胶囊"
                  />
                </div>
                <div>
                  <label className="label">剂量 *</label>
                  <input
                    type="text"
                    value={manualForm.dosage}
                    onChange={(e) => setManualForm({ ...manualForm, dosage: e.target.value })}
                    className="input"
                    placeholder="如：1粒/次"
                  />
                </div>
                <div>
                  <label className="label">服用频次</label>
                  <select
                    value={manualForm.frequency}
                    onChange={(e) => setManualForm({ ...manualForm, frequency: e.target.value as Prescription['frequency'] })}
                    className="input appearance-none pr-10"
                  >
                    {freqOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">疗程天数</label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.durationDays}
                    onChange={(e) => setManualForm({ ...manualForm, durationDays: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">服用说明</label>
                  <textarea
                    rows={2}
                    value={manualForm.instructions}
                    onChange={(e) => setManualForm({ ...manualForm, instructions: e.target.value })}
                    className="input resize-none"
                    placeholder="如：饭后服用，多喝水..."
                  />
                </div>
              </div>
            )}

            <div className="divider my-0" />

            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-info-500" />
                  提醒预览
                </h3>
                {totalPreviewCount > 0 && (
                  <span className="badge bg-info-50 text-info-600">
                    共 {totalPreviewCount} 条提醒
                  </span>
                )}
              </div>

              {previewTimes.length === 0 ? (
                <div className="card p-6 text-center">
                  <div className="text-xs text-gray-400">
                    {mode === 'prescription' ? '请先选择处方' : '填写信息后可查看提醒时间预览'}
                  </div>
                </div>
              ) : (
                <div className="card p-4 space-y-2">
                  {previewTimes.map((t, i) => {
                    const rel = formatRelativeDate(t);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                          <span className="text-xs text-gray-500">{rel}</span>
                          <span className="text-xs font-medium text-gray-700">{formatTime(t)}</span>
                        </div>
                        <Bell className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    );
                  })}
                  {totalPreviewCount > previewTimes.length && (
                    <div className="text-center pt-2 border-t border-gray-50 text-xs text-gray-400">
                      还有 {totalPreviewCount - previewTimes.length} 条提醒未显示...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="p-5 border-t border-gray-50 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full btn-accent py-3"
            >
              <Sparkles className="w-4 h-4" />
              生成提醒计划
            </button>
          </div>
        </div>
      </div>

      {/* Send Panel Modal */}
      {sendPanel && (() => {
        const { reminder, channel } = sendPanel;
        const pet = getPet(reminder.petId);
        const owner = getOwner(reminder.petId);
        const smsMessage = `【宠物用药提醒】尊敬的${owner?.name || '主人'}您好，提醒您为「${pet?.name || '宠物'}」服用「${reminder.medicineName}」${reminder.dosage}。请按时给药，如有疑问请联系医院。`;
        const wechatMessage = `🐾 用药时间到啦！\n\n宠物：${pet?.avatarEmoji} ${pet?.name}\n药品：${reminder.medicineName}\n剂量：${reminder.dosage}\n时间：${formatTime(reminder.remindTime)}\n\n请按时给毛孩子吃药哦～`;
        return (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
              onClick={() => setSendPanel(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="card w-full max-w-md pointer-events-auto animate-slide-up overflow-hidden">
                <div className={cn(
                  'px-5 py-4 flex items-center justify-between',
                  channel === 'sms' ? 'bg-info-50' : 'bg-brand-50'
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      channel === 'sms' ? 'bg-info-500 text-white' : 'bg-brand-500 text-white'
                    )}>
                      {channel === 'sms' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <MessageCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        发送{channel === 'sms' ? '短信' : '微信'}提醒
                      </h3>
                      <p className="text-xs text-gray-500">
                        {channel === 'sms' ? '通过运营商短信发送' : '通过微信服务号推送'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSendPanel(null)}
                    className="btn-ghost px-2 py-1.5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Recipient */}
                  <div className="card p-4 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-info-100 flex items-center justify-center text-2xl">
                        {pet?.avatarEmoji || '🐾'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800">{pet?.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {owner?.name || '未知主人'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/60 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">手机：</span>
                        <span className="font-medium text-gray-700">{owner?.phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      消息预览
                    </div>
                    <div className={cn(
                      'rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed',
                      channel === 'sms'
                        ? 'bg-gradient-to-br from-info-50 to-white border border-info-100 text-gray-700'
                        : 'bg-gradient-to-br from-brand-50 to-white border border-brand-100 text-gray-700'
                    )}>
                      {channel === 'sms' ? smsMessage : wechatMessage}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-gray-50 flex gap-3">
                  <button
                    onClick={() => setSendPanel(null)}
                    className="btn-secondary flex-1"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmSend}
                    className={cn('flex-1', channel === 'sms' ? 'btn-primary' : 'btn-accent')}
                  >
                    <Send className="w-4 h-4" />
                    确认发送
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Visit Detail Modal */}
      {showVisitModal && selectedVisitId && (() => {
        const visit = visits.find((v) => v.id === selectedVisitId);
        const pet = visit ? getPet(visit.petId) : undefined;
        const doctor = visit ? doctors.find((d) => d.id === visit.doctorId) : undefined;
        if (!visit) return null;
        return (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
              onClick={() => { setShowVisitModal(false); setSelectedVisitId(null); }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="card w-full max-w-md pointer-events-auto animate-slide-up overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between bg-brand-50 border-b border-brand-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">原接诊记录</h3>
                      <p className="text-xs text-gray-500">该提醒来源于接诊处方</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowVisitModal(false); setSelectedVisitId(null); }}
                    className="btn-ghost px-2 py-1.5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center text-2xl">
                      {pet?.avatarEmoji || '🐾'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{pet?.name || '未知宠物'}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(visit.visitDate)} · {doctor?.name || '未知医生'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">诊断</div>
                      <div className="text-sm font-semibold text-gray-800">{visit.diagnosis}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">症状</div>
                      <div className="text-sm text-gray-700">{visit.symptoms}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">治疗方案</div>
                      <div className="text-sm text-gray-700">{visit.treatmentPlan}</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-50 space-y-3">
                  <button
                    onClick={() => {
                      setShowVisitModal(false);
                      setSelectedVisitId(null);
                      navigate('/visits?visitId=' + visit.id);
                    }}
                    className="btn-primary w-full"
                  >
                    <FileText className="w-4 h-4" />
                    前往接诊详情
                  </button>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setShowVisitModal(false); setSelectedVisitId(null); }}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      ← 返回用药提醒
                    </button>
                    <button
                      onClick={() => { setShowVisitModal(false); setSelectedVisitId(null); }}
                      className="btn-secondary"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
