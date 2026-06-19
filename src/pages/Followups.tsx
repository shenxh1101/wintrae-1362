import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw, Syringe, Heart, Star, Calendar, User, Search, Filter, Plus,
  CheckCircle, Clock, AlertTriangle, X, Phone, MessageSquare, Stethoscope,
  FileText, ChevronRight, MoreHorizontal, Trash2, Sparkles, Activity,
  Target, Award,
} from 'lucide-react';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval,
  parseISO, differenceInDays, format,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatRelativeDate, formatDate, statusColor, statusText } from '@/utils/format';
import type { Followup, FollowupType, FollowupStatus, Pet, Doctor, Owner, Visit } from '@/types';

const typeConfig: Record<FollowupType, { icon: any; emoji: string; color: string; bg: string; border: string; text: string }> = {
  '术后': { icon: RotateCcw, emoji: '🩹', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  '疫苗': { icon: Syringe, emoji: '💉', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  '复诊': { icon: Heart, emoji: '🔄', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  '满意度': { icon: Star, emoji: '⭐', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
};

const followupTypes: FollowupType[] = ['术后', '疫苗', '复诊', '满意度'];
const statusFilters: FollowupStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
const dateRanges = ['本周', '本月', '自定义'] as const;
type DateRange = typeof dateRanges[number];

interface NewFollowupForm {
  petId: string;
  type: FollowupType;
  scheduledDate: string;
  doctorId: string;
  notes: string;
}

const emptyNewForm: NewFollowupForm = {
  petId: '',
  type: '术后',
  scheduledDate: format(new Date(), 'yyyy-MM-dd'),
  doctorId: '',
  notes: '',
};

export default function Followups() {
  const {
    followups, pets, owners, doctors, visits,
    createFollowup, completeFollowup, updateFollowupStatus,
  } = useAppStore();

  const navigate = useNavigate();

  const [selectedTypes, setSelectedTypes] = useState<FollowupType[]>([...followupTypes]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [filterVisitId, setFilterVisitId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>('本月');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<FollowupStatus[]>(['pending', 'in_progress']);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<Followup | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<NewFollowupForm>(emptyNewForm);
  const [detailRating, setDetailRating] = useState(0);
  const [detailFeedback, setDetailFeedback] = useState('');
  const [detailContent, setDetailContent] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getPet = (id: string): Pet | undefined => pets.find((p) => p.id === id);
  const getDoctor = (id: string): Doctor | undefined => doctors.find((d) => d.id === id);
  const getOwner = (petId: string): Owner | undefined => {
    const pet = getPet(petId);
    return pet ? owners.find((o) => o.id === pet.ownerId) : undefined;
  };
  const getVisit = (id?: string): Visit | undefined => id ? visits.find((v) => v.id === id) : undefined;

  const filteredFollowups = useMemo(() => {
    const now = new Date();
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

    if (dateRange === '本周') {
      rangeStart = startOfWeek(now, { weekStartsOn: 1 });
      rangeEnd = endOfWeek(now, { weekStartsOn: 1 });
    } else if (dateRange === '本月') {
      rangeStart = startOfMonth(now);
      rangeEnd = endOfMonth(now);
    } else if (dateRange === '自定义' && customDateStart && customDateEnd) {
      rangeStart = parseISO(customDateStart);
      rangeEnd = parseISO(customDateEnd + 'T23:59:59');
    }

    return followups.filter((f) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(f.type)) return false;
      if (selectedDoctorId && f.doctorId !== selectedDoctorId) return false;
      if (filterVisitId && f.visitId !== filterVisitId) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(f.status)) return false;

      if (rangeStart && rangeEnd) {
        const scheduled = parseISO(f.scheduledDate);
        if (!isWithinInterval(scheduled, { start: rangeStart, end: rangeEnd })) return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const pet = getPet(f.petId);
        const doctor = getDoctor(f.doctorId);
        const owner = getOwner(f.petId);
        return (
          pet?.name.toLowerCase().includes(term) ||
          doctor?.name.toLowerCase().includes(term) ||
          owner?.name.toLowerCase().includes(term) ||
          owner?.phone.includes(term) ||
          f.notes.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [followups, selectedTypes, selectedDoctorId, filterVisitId, dateRange, customDateStart, customDateEnd, selectedStatuses, searchTerm]);

  const stats = useMemo(() => {
    const pending = filteredFollowups.filter((f) => f.status === 'pending').length;
    const inProgress = filteredFollowups.filter((f) => f.status === 'in_progress').length;
    const completed = filteredFollowups.filter((f) => f.status === 'completed').length;

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const monthCompleted = followups.filter((f) => {
      if (f.status !== 'completed' || !f.completedDate) return false;
      const d = parseISO(f.completedDate);
      return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    });
    const avgScore = monthCompleted.length > 0
      ? monthCompleted.reduce((s, f) => s + (f.satisfactionScore || 0), 0) / monthCompleted.length
      : 0;

    const totalPending = followups.filter((f) => f.status === 'pending' || f.status === 'in_progress').length;

    return { pending, inProgress, completed, avgScore, totalPending };
  }, [filteredFollowups, followups]);

  const kanbanColumns = useMemo(() => {
    const columns: Record<FollowupType, Followup[]> = {
      '术后': [],
      '疫苗': [],
      '复诊': [],
      '满意度': [],
    };
    filteredFollowups.forEach((f) => {
      if (selectedTypes.includes(f.type)) {
        columns[f.type].push(f);
      }
    });
    Object.keys(columns).forEach((k) => {
      columns[k as FollowupType].sort((a, b) => {
        const aPending = a.status === 'pending' ? 0 : 1;
        const bPending = b.status === 'pending' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
    });
    return columns;
  }, [filteredFollowups, selectedTypes]);

  const getCountdown = (scheduledDate: string): { text: string; isOverdue: boolean; isUrgent: boolean } => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const scheduled = parseISO(scheduledDate);
    const diff = differenceInDays(scheduled, now);

    if (diff < 0) {
      return { text: `已逾期${Math.abs(diff)}天`, isOverdue: true, isUrgent: true };
    }
    if (diff === 0) {
      return { text: '今天', isOverdue: false, isUrgent: true };
    }
    if (diff <= 3) {
      return { text: `${diff}天内`, isOverdue: false, isUrgent: true };
    }
    if (diff <= 7) {
      return { text: `${diff}天内`, isOverdue: false, isUrgent: false };
    }
    return { text: `${diff}天后`, isOverdue: false, isUrgent: false };
  };

  const toggleType = (type: FollowupType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleStatus = (status: FollowupStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const openDetailModal = (f: Followup) => {
    setSelectedFollowup(f);
    setDetailRating(f.satisfactionScore || 0);
    setDetailFeedback(f.feedback || '');
    setDetailContent('');
    setShowDetailModal(true);
  };

  const handleStartFollowup = (f: Followup) => {
    updateFollowupStatus(f.id, 'in_progress');
    openDetailModal(f);
  };

  const handleCompleteFollowup = () => {
    if (!selectedFollowup) return;
    completeFollowup(selectedFollowup.id, {
      satisfactionScore: detailRating,
      feedback: detailFeedback,
    });
    setShowDetailModal(false);
    setSelectedFollowup(null);
  };

  const handleCancelFollowup = (id: string) => {
    if (confirm('确定要取消这次回访吗？')) {
      updateFollowupStatus(id, 'cancelled');
    }
  };

  const handleCreateFollowup = () => {
    if (!newForm.petId || !newForm.doctorId || !newForm.scheduledDate) return;
    createFollowup({
      petId: newForm.petId,
      type: newForm.type,
      scheduledDate: newForm.scheduledDate,
      doctorId: newForm.doctorId,
      status: 'pending',
      notes: newForm.notes,
    });
    setShowNewModal(false);
    setNewForm(emptyNewForm);
  };

  const renderStars = (score: number, interactive: boolean = false, onSelect?: (n: number) => void, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onSelect && onSelect(n)}
            className={cn(interactive && 'cursor-pointer transition-transform hover:scale-110', 'focus:outline-none')}
          >
            <Star
              className={cn(
                sizeMap[size],
                n <= score
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 gap-6 overflow-hidden">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-7 h-7 text-brand-500" />
              回访看板
            </h1>
            <p className="text-sm text-gray-500 mt-1">共 {filteredFollowups.length} 条回访记录</p>
          </div>
          <button
            onClick={() => {
              setNewForm(emptyNewForm);
              setShowNewModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            新增回访
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-accent-100 flex items-center justify-center">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-accent-600" />
              </div>
              <span className="badge bg-accent-50 text-accent-600">+{stats.pending}</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-800">{stats.pending}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">待回访</div>
          </div>

          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-info-100 flex items-center justify-center">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-info-600" />
              </div>
              <span className="badge bg-info-50 text-info-600">进行中</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-800">{stats.inProgress}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">进行中</div>
          </div>

          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-brand-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-brand-600" />
              </div>
              <span className="badge bg-brand-50 text-brand-600">已完成</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-800">{stats.completed}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">已完成</div>
          </div>

          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
              </div>
              <span className="badge bg-amber-50 text-amber-600">本月</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl md:text-3xl font-bold text-gray-800">
                {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {renderStars(Math.round(stats.avgScore), false, undefined, 'sm')}
              <span className="text-xs md:text-sm text-gray-500 ml-1">满意度</span>
            </div>
          </div>

          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-rose-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
              </div>
              <span className="badge bg-rose-50 text-rose-600">总计</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalPending}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">待回访总数</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 shrink-0 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative lg:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索宠物/医生/主人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Type Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {followupTypes.map((t) => {
              const cfg = typeConfig[t];
              const active = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    active
                      ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  <span>{cfg.emoji}</span>
                  {t}
                </button>
              );
            })}
          </div>

          {/* Doctor Filter */}
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="input lg:w-44 shrink-0"
          >
            <option value="">全部医生</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.avatarEmoji} {d.name}
              </option>
            ))}
          </select>

          {/* Source Visit Filter */}
          <select
            value={filterVisitId}
            onChange={(e) => setFilterVisitId(e.target.value)}
            className="input lg:w-52 shrink-0"
          >
            <option value="">全部来源</option>
            {visits.map((v) => {
              const pet = getPet(v.petId);
              return (
                <option key={v.id} value={v.id}>
                  {pet?.name || '-'} · {v.diagnosis.slice(0, 10)} · {v.visitDate}
                </option>
              );
            })}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2 shrink-0">
            {dateRanges.map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  dateRange === r
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date & Status Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 pt-3 border-t border-gray-50">
          {dateRange === '自定义' && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="input input-sm w-36"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="input input-sm w-36"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <span className="text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
              <User className="w-3.5 h-3.5" />
              状态筛选:
            </span>
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-all border',
                  selectedStatuses.includes(s)
                    ? statusColor(s) + ' border-transparent'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                )}
              >
                {statusText(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
        <div className={cn(
          'grid gap-4 h-full',
          selectedTypes.length === 1 ? 'grid-cols-1' :
          selectedTypes.length === 2 ? 'grid-cols-2' :
          selectedTypes.length === 3 ? 'grid-cols-3' :
          'grid-cols-4'
        )} style={{ minWidth: selectedTypes.length * 280 }}>
          {followupTypes.filter((t) => selectedTypes.includes(t)).map((type) => {
            const cfg = typeConfig[type];
            const Icon = cfg.icon;
            const items = kanbanColumns[type];
            const pendingCount = items.filter((f) => f.status === 'pending').length;

            return (
              <div
                key={type}
                className="flex flex-col bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden h-full min-h-0"
              >
                <div className={cn('px-4 py-3 border-b flex items-center justify-between shrink-0', cfg.bg, cfg.border)}>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cfg.bg, cfg.border, 'border')}>
                      <Icon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div>
                      <h3 className={cn('font-semibold text-sm', cfg.text)}>{cfg.emoji} {type}</h3>
                      <p className="text-xs text-gray-500">共 {items.length} 条</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    pendingCount > 0
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  )}>
                    {pendingCount}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mb-3', cfg.bg)}>
                        <Icon className={cn('w-6 h-6', cfg.color, 'opacity-40')} />
                      </div>
                      <p className="text-sm text-gray-400">暂无{type}回访</p>
                    </div>
                  ) : (
                    items.map((f) => {
                      const pet = getPet(f.petId);
                      const doctor = getDoctor(f.doctorId);
                      const countdown = getCountdown(f.scheduledDate);
                      const isHovered = hoveredCard === f.id;

                      return (
                        <div
                          key={f.id}
                          className="card-hover p-4 cursor-pointer group relative"
                          onClick={() => openDetailModal(f)}
                          onMouseEnter={() => setHoveredCard(f.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          {isHovered && f.status !== 'completed' && f.status !== 'cancelled' && (
                            <div className="absolute top-3 right-3 flex gap-1 z-10 animate-fade-in">
                              {f.status === 'pending' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStartFollowup(f); }}
                                  className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm"
                                  title="开始回访"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); openDetailModal(f); }}
                                className="w-7 h-7 rounded-lg bg-info-500 text-white flex items-center justify-center hover:bg-info-600 transition-colors shadow-sm"
                                title="完成回访"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancelFollowup(f.id); }}
                                className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                                title="取消"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-start gap-3 mb-3">
                            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center text-2xl">
                              {pet?.avatarEmoji || '🐾'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-800 text-base truncate pr-16">
                                    {pet?.name || '-'}
                                  </h4>
                                </div>
                              </div>
                              <div className="mt-1">
                                <span className={cn('badge', cfg.bg, cfg.text)}>
                                  {cfg.emoji} {f.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={cn(
                            'flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                            countdown.isOverdue
                              ? 'bg-red-50 text-red-600'
                              : countdown.isUrgent
                                ? 'bg-accent-50 text-accent-600'
                                : 'bg-gray-50 text-gray-500'
                          )}>
                            {countdown.isOverdue ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : countdown.isUrgent ? (
                              <Clock className="w-3.5 h-3.5" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5" />
                            )}
                            <span>{countdown.text}</span>
                          </div>

                          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                            <span className="text-base">{doctor?.avatarEmoji || '👤'}</span>
                            <span className="font-medium">{doctor?.name || '-'}</span>
                            <span className="text-xs text-gray-400">· {doctor?.title || ''}</span>
                          </div>

                          {f.notes && (
                            <div className="mb-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 line-clamp-2 leading-relaxed">
                              <MessageSquare className="w-3 h-3 inline mr-1 -mt-0.5 text-gray-400" />
                              {f.notes}
                            </div>
                          )}

                          {f.visitId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/visits?visitId=' + f.visitId);
                              }}
                              className="mb-3 w-full text-left text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 rounded-lg p-2 transition-colors"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>查看原接诊记录</span>
                              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                            </button>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(f.scheduledDate, 'MM-dd')}</span>
                            </div>
                            <span className={cn('badge', statusColor(f.status))}>
                              {statusText(f.status)}
                            </span>
                          </div>

                          {f.satisfactionScore && f.status === 'completed' && (
                            <div className="mt-2 flex items-center gap-1.5">
                              {renderStars(f.satisfactionScore, false, undefined, 'sm')}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setNewForm(emptyNewForm);
          setShowNewModal(true);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-brand-500 text-white shadow-2xl hover:bg-brand-600 hover:shadow-brand-500/30 transition-all hover:scale-110 flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Detail Modal */}
      {showDetailModal && selectedFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            {(() => {
              const pet = getPet(selectedFollowup.petId);
              const doctor = getDoctor(selectedFollowup.doctorId);
              const owner = getOwner(selectedFollowup.petId);
              const visit = getVisit(selectedFollowup.visitId);
              const cfg = typeConfig[selectedFollowup.type];
              const countdown = getCountdown(selectedFollowup.scheduledDate);

              return (
                <>
                  <div className={cn('p-5 border-b border-gray-200', cfg.bg)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-4xl">
                          {pet?.avatarEmoji || '🐾'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2 className="text-xl font-bold text-gray-800">{pet?.name || '-'}</h2>
                            <span className={cn('badge', cfg.bg, cfg.text, cfg.border, 'border')}>
                              {cfg.emoji} {selectedFollowup.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              建议日期：{formatDate(selectedFollowup.scheduledDate)}
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              countdown.isOverdue ? 'bg-red-100 text-red-600' :
                              countdown.isUrgent ? 'bg-accent-100 text-accent-600' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              {countdown.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowDetailModal(false); setSelectedFollowup(null); }}
                        className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 transition-colors shadow-sm"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {owner && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <User className="w-3.5 h-3.5" />
                            主人姓名
                          </div>
                          <div className="text-sm font-semibold text-gray-800">{owner.name}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Phone className="w-3.5 h-3.5" />
                            联系电话
                          </div>
                          <a
                            href={`tel:${owner.phone}`}
                            className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                          >
                            {owner.phone}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {doctor && (
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl">
                          {doctor.avatarEmoji}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{doctor.name}</div>
                          <div className="text-xs text-gray-500">{doctor.title}</div>
                        </div>
                      </div>
                    )}

                    {visit && (
                      <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-brand-600" />
                            <span className="text-sm font-semibold text-brand-700">关联就诊摘要</span>
                          </div>
                          <button
                            onClick={() => {
                              navigate('/visits?visitId=' + selectedFollowup.visitId);
                            }}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                          >
                            查看详情
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0 w-14">日期：</span>
                            <span className="text-gray-700">{formatDate(visit.visitDate)}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0 w-14">诊断：</span>
                            <span className="text-gray-700 font-medium">{visit.diagnosis}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0 w-14">方案：</span>
                            <span className="text-gray-700">{visit.treatmentPlan}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedFollowup.notes && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700">回访备注</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{selectedFollowup.notes}</p>
                      </div>
                    )}

                    {selectedFollowup.status !== 'completed' && selectedFollowup.status !== 'cancelled' && (
                      <>
                        <div>
                          <label className="label flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            回访内容
                          </label>
                          <textarea
                            value={detailContent}
                            onChange={(e) => setDetailContent(e.target.value)}
                            rows={3}
                            placeholder="请记录本次回访的内容..."
                            className="input resize-none"
                          />
                        </div>

                        <div>
                          <label className="label flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            主人反馈
                          </label>
                          <textarea
                            value={detailFeedback}
                            onChange={(e) => setDetailFeedback(e.target.value)}
                            rows={3}
                            placeholder="请记录主人的反馈意见..."
                            className="input resize-none"
                          />
                        </div>

                        <div>
                          <label className="label flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-gray-400" />
                            满意度评分
                          </label>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              {renderStars(detailRating, true, (n) => setDetailRating(n), 'lg')}
                              {detailRating > 0 && (
                                <span className="text-sm text-gray-600 font-medium">
                                  {detailRating === 1 && '非常不满意'}
                                  {detailRating === 2 && '不满意'}
                                  {detailRating === 3 && '一般'}
                                  {detailRating === 4 && '满意'}
                                  {detailRating === 5 && '非常满意'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedFollowup.status === 'completed' && (
                      <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 space-y-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-brand-600" />
                          <span className="text-sm font-semibold text-brand-700">回访已完成</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {selectedFollowup.completedDate ? formatDate(selectedFollowup.completedDate) : ''}
                          </span>
                        </div>
                        {selectedFollowup.satisfactionScore ? (
                          <div>
                            <div className="text-xs text-gray-500 mb-2">满意度评分</div>
                            {renderStars(selectedFollowup.satisfactionScore, false, undefined, 'md')}
                          </div>
                        ) : null}
                        {selectedFollowup.feedback && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">主人反馈</div>
                            <p className="text-sm text-gray-700 leading-relaxed">{selectedFollowup.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-gray-200 flex gap-2 justify-end flex-wrap bg-gray-50/50">
                    {selectedFollowup.status !== 'completed' && selectedFollowup.status !== 'cancelled' && (
                      <>
                        {selectedFollowup.status === 'pending' && (
                          <button
                            onClick={() => handleStartFollowup(selectedFollowup)}
                            className="btn btn-accent"
                          >
                            <Phone className="w-4 h-4" />
                            开始回访
                          </button>
                        )}
                        <button
                          onClick={handleCompleteFollowup}
                          disabled={detailRating === 0}
                          className="btn-primary"
                        >
                          <CheckCircle className="w-4 h-4" />
                          完成回访
                        </button>
                        <button
                          onClick={() => handleCancelFollowup(selectedFollowup.id)}
                          className="btn btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          取消
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => { setShowDetailModal(false); setSelectedFollowup(null); }}
                      className="btn btn-secondary"
                    >
                      关闭
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* New Followup Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">新增回访</h2>
                  <p className="text-sm text-gray-500">快速创建回访任务</p>
                </div>
              </div>
              <button
                onClick={() => { setShowNewModal(false); setNewForm(emptyNewForm); }}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="label">选择宠物 *</label>
                <select
                  value={newForm.petId}
                  onChange={(e) => setNewForm({ ...newForm, petId: e.target.value })}
                  className="input"
                >
                  <option value="">请选择宠物</option>
                  {pets.map((p) => {
                    const owner = getOwner(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.avatarEmoji} {p.name}（{p.species} - {owner?.name || '未知主人'}）
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="label">回访类型 *</label>
                <div className="grid grid-cols-4 gap-2">
                  {followupTypes.map((t) => {
                    const cfg = typeConfig[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewForm({ ...newForm, type: t })}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all',
                          newForm.type === t
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-offset-1 ring-brand-300/50`
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <span className="text-xl">{cfg.emoji}</span>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">回访日期 *</label>
                  <input
                    type="date"
                    value={newForm.scheduledDate}
                    onChange={(e) => setNewForm({ ...newForm, scheduledDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">负责医生 *</label>
                  <select
                    value={newForm.doctorId}
                    onChange={(e) => setNewForm({ ...newForm, doctorId: e.target.value })}
                    className="input"
                  >
                    <option value="">请选择</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.avatarEmoji} {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">回访备注</label>
                <textarea
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  rows={3}
                  placeholder="请输入回访备注信息..."
                  className="input resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => { setShowNewModal(false); setNewForm(emptyNewForm); }}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreateFollowup}
                disabled={!newForm.petId || !newForm.scheduledDate || !newForm.doctorId}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                创建回访
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
