import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  X,
  Edit3,
  Check,
  XCircle,
  Clock,
  User,
  MapPin,
  Stethoscope,
  DollarSign,
  FileText,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  isSameDay,
  isSameWeek,
  isToday,
  getHours,
  format,
  setHours,
  setMinutes,
  parseISO,
  addHours,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatDate, formatTime, formatCurrency, statusText, statusColor } from '@/utils/format';
import { serviceTypeColors, timeSlots, weekDayNames } from '@/data/mockData';
import type { Appointment, ServiceType, AppointmentStatus } from '@/types';

interface NewAppointmentForm {
  petId: string;
  doctorId: string;
  roomId: string;
  serviceType: ServiceType;
  startTime: string;
  notes: string;
}

export default function CalendarPage() {
  const navigate = useNavigate();

  const {
    appointments,
    pets,
    doctors,
    rooms,
    visits,
    selectedDoctorId,
    selectedDate,
    filterType,
    setSelectedDoctorId,
    setSelectedDate,
    setFilterType,
    addAppointment,
    updateAppointment,
    cancelAppointment,
  } = useAppStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newForm, setNewForm] = useState<NewAppointmentForm>({
    petId: '',
    doctorId: '',
    roomId: '',
    serviceType: '常规检查',
    startTime: '',
    notes: '',
  });
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleHour, setRescheduleHour] = useState('9');

  const currentWeekStart = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset);
    return startOfWeek(base, { weekStartsOn: 1 });
  }, [weekOffset]);

  const currentWeekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const start = parseISO(apt.startTime);
      if (!isSameDay(start, currentWeekStart) && !isSameDay(start, currentWeekEnd) &&
          !(start > currentWeekStart && start < currentWeekEnd)) {
        if (!isSameWeek(start, currentWeekStart, { weekStartsOn: 1 })) return false;
      }
      if (selectedDoctorId && apt.doctorId !== selectedDoctorId) return false;
      if (selectedRoomId && apt.roomId !== selectedRoomId) return false;
      if (filterType && apt.serviceType !== filterType) return false;
      return true;
    });
  }, [appointments, currentWeekStart, currentWeekEnd, selectedDoctorId, selectedRoomId, filterType]);

  const waitlistAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === 'waitlist')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [appointments]);

  const serviceTypes: ServiceType[] = ['常规检查', '疫苗接种', '手术', '复诊', '急诊', '驱虫', '体检'];

  const getAppointmentsForCell = (day: Date, hour: number) => {
    return filteredAppointments.filter((apt) => {
      const start = parseISO(apt.startTime);
      return isSameDay(start, day) && getHours(start) === hour && apt.status !== 'waitlist';
    });
  };

  const handleGoToToday = () => {
    setWeekOffset(0);
    setSelectedDate(new Date());
  };

  const handleCellClick = (day: Date, hour: number) => {
    const startDt = setMinutes(setHours(day, hour), 0);
    setNewForm({
      petId: '',
      doctorId: selectedDoctorId || '',
      roomId: selectedRoomId || '',
      serviceType: (filterType as ServiceType) || '常规检查',
      startTime: format(startDt, "yyyy-MM-dd'T'HH:mm"),
      notes: '',
    });
    setShowNewModal(true);
  };

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowDetailModal(true);
  };

  const handleCreateAppointment = () => {
    if (!newForm.petId || !newForm.doctorId || !newForm.roomId || !newForm.startTime) return;
    const start = new Date(newForm.startTime);
    addAppointment({
      startTime: start.toISOString(),
      endTime: addHours(start, 1).toISOString(),
      doctorId: newForm.doctorId,
      roomId: newForm.roomId,
      petId: newForm.petId,
      serviceType: newForm.serviceType,
      status: 'scheduled',
      notes: newForm.notes,
    });
    setShowNewModal(false);
  };

  const handleConfirmAppointment = (id: string) => {
    updateAppointment(id, { status: 'confirmed' });
    setShowDetailModal(false);
  };

  const handleCancelAppointment = (id: string) => {
    cancelAppointment(id);
    setShowDetailModal(false);
  };

  const handleReschedule = () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleHour) return;
    const newStart = setMinutes(setHours(new Date(rescheduleDate), parseInt(rescheduleHour)), 0);
    const newEnd = addHours(newStart, 1);
    updateAppointment(selectedAppointment.id, {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
    });
    setShowReschedule(false);
    setShowDetailModal(false);
  };

  const handleConfirmWaitlist = (id: string) => {
    updateAppointment(id, { status: 'scheduled' });
  };

  const getPet = (id: string) => pets.find((p) => p.id === id);
  const getDoctor = (id: string) => doctors.find((d) => d.id === id);
  const getRoom = (id: string) => rooms.find((r) => r.id === id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-700"
              >
                本周
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-semibold text-brand-700">
                {format(currentWeekStart, 'yyyy年MM月dd日', { locale: zhCN })} -{' '}
                {format(currentWeekEnd, 'MM月dd日', { locale: zhCN })}
              </span>
            </div>

            <select
              value={selectedDoctorId || ''}
              onChange={(e) => setSelectedDoctorId(e.target.value || null)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">全部医生</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.avatarEmoji} {d.name} - {d.title}
                </option>
              ))}
            </select>

            <select
              value={selectedRoomId || ''}
              onChange={(e) => setSelectedRoomId(e.target.value || null)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">全部诊室</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {serviceTypes.map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterType(filterType === st ? null : st)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                    filterType === st
                      ? serviceTypeColors[st]
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setNewForm({
                  petId: '',
                  doctorId: selectedDoctorId || '',
                  roomId: selectedRoomId || '',
                  serviceType: (filterType as ServiceType) || '常规检查',
                  startTime: '',
                  notes: '',
                });
                setShowNewModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">新建预约</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="min-w-[900px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-gray-50 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200"></div>
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 text-center border-r border-gray-200 last:border-r-0',
                    isToday(day) && 'bg-brand-50/50'
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium mb-1',
                    isToday(day) ? 'text-brand-600' : 'text-gray-500'
                  )}>
                    {weekDayNames[idx]}
                  </div>
                  <div className={cn(
                    'text-lg font-bold',
                    isToday(day) ? 'text-brand-700' : 'text-gray-800'
                  )}>
                    {format(day, 'd', { locale: zhCN })}
                    {isToday(day) && (
                      <span className="ml-1 inline-block w-1.5 h-1.5 bg-brand-500 rounded-full align-middle"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-gray-100 last:border-b-0"
              >
                <div className="p-2 border-r border-gray-200 bg-gray-50/50 flex items-start justify-center pt-3">
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
                {weekDays.map((day, dayIdx) => {
                  const cellApts = getAppointmentsForCell(day, hour);
                  const isTodayCell = isToday(day);
                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleCellClick(day, hour)}
                      className={cn(
                        'relative p-1 border-r border-gray-100 last:border-r-0 min-h-[90px] cursor-pointer transition-colors',
                        isTodayCell ? 'bg-brand-50/30' : 'hover:bg-gray-50/80'
                      )}
                    >
                      {cellApts.map((apt) => {
                        const pet = getPet(apt.petId);
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppointmentClick(apt);
                            }}
                            className={cn(
                              'mb-1 p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
                              apt.status === 'completed'
                                ? 'bg-green-50 text-green-700 border-green-300'
                                : serviceTypeColors[apt.serviceType] || 'bg-gray-100 text-gray-700 border-gray-200'
                            )}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="text-base flex-shrink-0">{pet?.avatarEmoji || '🐾'}</span>
                                <div className="min-w-0">
                                  <div className="font-semibold truncate">{pet?.name || '-'}</div>
                                  <div className="opacity-80 truncate">{apt.serviceType}</div>
                                </div>
                              </div>
                              <span className={cn(
                                'flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                                statusColor(apt.status)
                              )}>
                                {statusText(apt.status)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist Panel */}
        <div className="xl:w-80 border-t xl:border-t-0 xl:border-l border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-600" />
              <h3 className="font-semibold text-gray-800">候补队列</h3>
              <span className="px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                {waitlistAppointments.length}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[500px] xl:max-h-[calc(100vh-220px)] overflow-y-auto">
            {waitlistAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无候补预约</p>
              </div>
            ) : (
              waitlistAppointments.map((apt, idx) => {
                const pet = getPet(apt.petId);
                const doctor = getDoctor(apt.doctorId);
                return (
                  <div
                    key={apt.id}
                    onClick={() => handleAppointmentClick(apt)}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-accent-300 hover:bg-accent-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{pet?.avatarEmoji || '🐾'}</span>
                          <span className="font-semibold text-gray-800">{pet?.name}</span>
                        </div>
                        <div className={cn(
                          'inline-block px-2 py-0.5 rounded-md text-[11px] font-medium mb-2',
                          serviceTypeColors[apt.serviceType] || 'bg-gray-100 text-gray-700'
                        )}>
                          {apt.serviceType}
                        </div>
                        <div className="space-y-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{formatDate(apt.startTime, 'MM月dd日')} {formatTime(apt.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{doctor?.avatarEmoji} {doctor?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmWaitlist(apt.id);
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Check className="w-3.5 h-3.5" />
                      确认预约
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">新建预约</h2>
                  <p className="text-sm text-gray-500">填写预约信息</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">宠物</label>
                <select
                  value={newForm.petId}
                  onChange={(e) => setNewForm({ ...newForm, petId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                >
                  <option value="">请选择宠物</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatarEmoji} {p.name}（{p.species} - {p.breed}）
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">医生</label>
                  <select
                    value={newForm.doctorId}
                    onChange={(e) => setNewForm({ ...newForm, doctorId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                  >
                    <option value="">请选择</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.avatarEmoji} {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">诊室</label>
                  <select
                    value={newForm.roomId}
                    onChange={(e) => setNewForm({ ...newForm, roomId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                  >
                    <option value="">请选择</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">服务项目</label>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewForm({ ...newForm, serviceType: st })}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                        newForm.serviceType === st
                          ? serviceTypeColors[st] + ' ring-2 ring-offset-1'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">时段</label>
                <input
                  type="datetime-local"
                  value={newForm.startTime}
                  onChange={(e) => setNewForm({ ...newForm, startTime: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
                <textarea
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  rows={3}
                  placeholder="请输入备注信息..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={!newForm.petId || !newForm.doctorId || !newForm.roomId || !newForm.startTime}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all"
              >
                创建预约
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {(() => {
              const pet = getPet(selectedAppointment.petId);
              const doctor = getDoctor(selectedAppointment.doctorId);
              const room = getRoom(selectedAppointment.roomId);
              const owner = selectedAppointment.petId
                ? useAppStore.getState().owners.find((o) => o.id === pet?.ownerId)
                : null;
              const relatedVisit = visits.find((v) => v.appointmentId === selectedAppointment.id);
              return (
                <>
                  <div className={cn(
                    'p-5 border-b border-gray-200',
                    selectedAppointment.status === 'cancelled' ? 'bg-gray-50' : ''
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                          {pet?.avatarEmoji || '🐾'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-800">{pet?.name}</h2>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              statusColor(selectedAppointment.status)
                            )}>
                              {statusText(selectedAppointment.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {pet?.species} · {pet?.breed} · {pet?.age}岁 · {pet?.gender}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowReschedule(false);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className={cn(
                      'p-3 rounded-xl border text-sm font-medium',
                      serviceTypeColors[selectedAppointment.serviceType] || 'bg-gray-100 text-gray-700 border-gray-200'
                    )}>
                      服务项目：{selectedAppointment.serviceType}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          日期
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                          {formatDate(selectedAppointment.startTime, 'yyyy年MM月dd日')}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          时段
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                          {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                        <User className="w-3.5 h-3.5" />
                        医生
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {doctor?.avatarEmoji} {doctor?.name}
                        <span className="ml-2 text-xs text-gray-500 font-normal">{doctor?.title}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        诊室
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {room?.name}
                        <span className="ml-2 text-xs text-gray-500 font-normal">({room?.type})</span>
                      </div>
                    </div>

                    {owner && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                          <User className="w-3.5 h-3.5" />
                          宠物主人
                        </div>
                        <div className="text-sm font-semibold text-gray-800">{owner.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{owner.phone}</div>
                      </div>
                    )}

                    {selectedAppointment.notes && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1.5">备注</div>
                        <div className="text-sm text-gray-700">{selectedAppointment.notes}</div>
                      </div>
                    )}

                    {relatedVisit && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-green-500 text-white flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-green-700">已接诊</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Stethoscope className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-green-600 text-xs font-medium">诊断</span>
                              <p className="text-gray-700 font-medium">{relatedVisit.diagnosis}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <span className="text-green-600 text-xs font-medium">费用</span>
                            <span className="text-gray-700 font-semibold">{formatCurrency(relatedVisit.totalCost)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {showReschedule && (
                      <div className="p-4 bg-brand-50 rounded-xl border border-brand-200 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                          <Edit3 className="w-4 h-4" />
                          改期设置
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">日期</label>
                            <input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">时段</label>
                            <select
                              value={rescheduleHour}
                              onChange={(e) => setRescheduleHour(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                            >
                              {timeSlots.map((h) => (
                                <option key={h} value={h}>
                                  {h.toString().padStart(2, '0')}:00
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-gray-200 flex gap-2 flex-wrap justify-end">
                    {relatedVisit && (
                      <button
                        onClick={() => {
                          navigate('/visits?visitId=' + relatedVisit.id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 border border-green-200 bg-green-50 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        查看接诊详情
                      </button>
                    )}
                    {selectedAppointment.status !== 'cancelled' &&
                      selectedAppointment.status !== 'completed' &&
                      !relatedVisit && (
                        <>
                          {selectedAppointment.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                navigate('/visits?appointmentId=' + selectedAppointment.id);
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                            >
                              <Stethoscope className="w-4 h-4" />
                              快速开单
                            </button>
                          )}
                          {!showReschedule ? (
                            <button
                              onClick={() => {
                                setShowReschedule(true);
                                setRescheduleDate(format(parseISO(selectedAppointment.startTime), 'yyyy-MM-dd'));
                                setRescheduleHour(getHours(parseISO(selectedAppointment.startTime)).toString());
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 border border-brand-200 bg-brand-50 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              改期
                            </button>
                          ) : (
                            <button
                              onClick={handleReschedule}
                              disabled={!rescheduleDate}
                              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                            >
                              <Check className="w-4 h-4" />
                              确认改期
                            </button>
                          )}
                          {selectedAppointment.status !== 'confirmed' && (
                            <button
                              onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                            >
                              <Check className="w-4 h-4" />
                              确认
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelAppointment(selectedAppointment.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            取消
                          </button>
                        </>
                      )}
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowReschedule(false);
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
    </div>
  );
}
