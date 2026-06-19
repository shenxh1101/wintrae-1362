import { useState, useMemo } from 'react';
import {
  Search, Plus, Phone, Mail, MapPin, Syringe, AlertTriangle,
  X, Edit, Trash, User, PawPrint, CalendarDays, FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, formatCurrency, getAvatarEmoji, statusColor, cn } from '@/utils/format';
import type { Pet, VaccineRecord, Owner } from '@/types';
import { uid } from '@/data/mockData';

type SpeciesFilter = '全部' | '犬' | '猫' | '兔' | '鸟';
type FormMode = 'add' | 'edit';

interface PetFormData {
  name: string;
  species: Pet['species'];
  breed: string;
  age: number;
  gender: Pet['gender'];
  weight: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  ownerId: string;
  vaccines: VaccineRecord[];
  allergies: string[];
}

const emptyFormData: PetFormData = {
  name: '',
  species: '犬',
  breed: '',
  age: 0,
  gender: '公',
  weight: 0,
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  ownerAddress: '',
  ownerId: '',
  vaccines: [],
  allergies: [],
};

const speciesOptions: SpeciesFilter[] = ['全部', '犬', '猫', '兔', '鸟'];

export default function Pets() {
  const { pets, owners, visits, doctors, addPet, updatePet, deletePet } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('全部');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [formData, setFormData] = useState<PetFormData>(emptyFormData);
  const [newVaccine, setNewVaccine] = useState({ name: '', date: '', nextDue: '', status: 'completed' as VaccineRecord['status'] });
  const [newAllergy, setNewAllergy] = useState('');

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const owner = owners.find((o) => o.id === pet.ownerId);
      const matchesSpecies = speciesFilter === '全部' || pet.species === speciesFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        pet.name.toLowerCase().includes(term) ||
        pet.breed.toLowerCase().includes(term) ||
        (owner?.name.toLowerCase().includes(term)) ||
        (owner?.phone.includes(term));
      return matchesSpecies && matchesSearch;
    });
  }, [pets, owners, searchTerm, speciesFilter]);

  const getOwner = (pet: Pet) => owners.find((o) => o.id === pet.ownerId);

  const getVaccineProgress = (pet: Pet) => {
    if (pet.vaccines.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = pet.vaccines.filter((v) => v.status === 'completed').length;
    return {
      completed,
      total: pet.vaccines.length,
      percent: Math.round((completed / pet.vaccines.length) * 100),
    };
  };

  const getVaccineProgressColor = (pet: Pet) => {
    const hasOverdue = pet.vaccines.some((v) => v.status === 'overdue');
    if (hasOverdue) return 'bg-red-500';
    const hasUpcoming = pet.vaccines.some((v) => v.status === 'upcoming');
    if (hasUpcoming) return 'bg-accent-500';
    return 'bg-brand-500';
  };

  const openAddModal = () => {
    setFormMode('add');
    setFormData({ ...emptyFormData });
    setModalOpen(true);
  };

  const openEditModal = (pet: Pet) => {
    const owner = getOwner(pet);
    setFormMode('edit');
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender,
      weight: pet.weight,
      ownerName: owner?.name || '',
      ownerPhone: owner?.phone || '',
      ownerEmail: owner?.email || '',
      ownerAddress: owner?.address || '',
      ownerId: pet.ownerId,
      vaccines: [...pet.vaccines],
      allergies: [...pet.allergies],
    });
    setModalOpen(true);
  };

  const openDetailDrawer = (pet: Pet) => {
    setSelectedPet(pet);
    setDrawerOpen(true);
  };

  const closeModal = () => setModalOpen(false);
  const closeDrawer = () => setDrawerOpen(false);

  const handleSubmit = () => {
    if (!formData.name || !formData.ownerName || !formData.ownerPhone) return;

    let ownerId = formData.ownerId;
    if (!ownerId) {
      ownerId = uid();
    }

    const petPayload = {
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age: Number(formData.age),
      gender: formData.gender,
      weight: Number(formData.weight),
      avatar: '',
      ownerId,
      allergies: formData.allergies,
      vaccines: formData.vaccines,
      avatarEmoji: getAvatarEmoji(formData.species),
    };

    if (formMode === 'add') {
      addPet(petPayload);
    } else if (selectedPet || formData.ownerId) {
      updatePet(formMode === 'edit' && selectedPet ? selectedPet.id : formData.ownerId, petPayload);
    }

    closeModal();
  };

  const handleDelete = (pet: Pet) => {
    if (confirm(`确定要删除宠物「${pet.name}」吗？`)) {
      deletePet(pet.id);
      if (selectedPet?.id === pet.id) closeDrawer();
    }
  };

  const addVaccine = () => {
    if (!newVaccine.name || !newVaccine.date) return;
    setFormData((prev) => ({
      ...prev,
      vaccines: [
        ...prev.vaccines,
        {
          id: uid(),
          name: newVaccine.name,
          date: newVaccine.date,
          nextDue: newVaccine.nextDue,
          status: newVaccine.status,
        },
      ],
    }));
    setNewVaccine({ name: '', date: '', nextDue: '', status: 'completed' });
  };

  const removeVaccine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vaccines: prev.vaccines.filter((v) => v.id !== id),
    }));
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    if (!formData.allergies.includes(newAllergy.trim())) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      }));
    }
    setNewAllergy('');
  };

  const removeAllergy = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergy),
    }));
  };

  const getPetVisits = (petId: string) => visits.filter((v) => v.petId === petId);
  const getDoctor = (doctorId: string) => doctors.find((d) => d.id === doctorId);

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <PawPrint className="w-7 h-7 text-brand-500" />
              宠物档案
            </h1>
            <p className="text-sm text-gray-500 mt-1">共 {filteredPets.length} 只宠物</p>
          </div>
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            新增宠物
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索宠物名 / 主人名 / 品种 / 手机号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-11"
            />
          </div>
          <div className="flex gap-2">
            {speciesOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSpeciesFilter(s)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  speciesFilter === s
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                )}
              >
                {s === '全部' ? s : `${getAvatarEmoji(s)} ${s}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredPets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-brand-50 flex items-center justify-center">
              <PawPrint className="w-12 h-12 text-brand-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm || speciesFilter !== '全部' ? '没有找到匹配的宠物' : '暂无宠物档案'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm || speciesFilter !== '全部' ? '试试调整搜索条件或筛选标签' : '点击右上角「新增宠物」开始建立档案'}
            </p>
            {(!searchTerm && speciesFilter === '全部') && (
              <button onClick={openAddModal} className="btn-primary">
                <Plus className="w-4 h-4" />
                新增第一只宠物
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPets.map((pet) => {
            const owner = getOwner(pet);
            const progress = getVaccineProgress(pet);
            return (
              <div key={pet.id} className="card-hover p-5 flex flex-col gap-4 animate-slide-up">
                {/* Avatar & Basic Info */}
                <div className="flex gap-4">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-info-50 flex items-center justify-center text-4xl">
                    {pet.avatarEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800 truncate">{pet.name}</h3>
                      <span className={cn(
                        'text-sm',
                        pet.gender === '公' ? 'text-info-500' : 'text-pink-500'
                      )}>
                        {pet.gender === '公' ? '♂' : '♀'}
                      </span>
                      <span className="text-xs text-gray-500">{pet.age}岁</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1 truncate">{pet.breed}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{pet.weight}kg</div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{owner?.name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{owner?.phone || '-'}</span>
                  </div>
                </div>

                {/* Vaccine Progress */}
                {pet.vaccines.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Syringe className="w-3 h-3" />
                        疫苗接种
                      </span>
                      <span className="font-medium text-gray-700">
                        {progress.completed}/{progress.total} · {progress.percent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', getVaccineProgressColor(pet))}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Allergies */}
                {pet.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pet.allergies.map((a) => (
                      <span
                        key={a}
                        className="badge bg-red-50 text-red-600 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                  <button
                    onClick={() => openDetailDrawer(pet)}
                    className="flex-1 btn-sm btn-secondary"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    查看详情
                  </button>
                  <button
                    onClick={() => openEditModal(pet)}
                    className="btn-sm btn-secondary"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {drawerOpen && selectedPet && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
            onClick={closeDrawer}
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white z-50 shadow-2xl flex flex-col animate-slide-right">
            {/* Drawer Header */}
            <div className="relative h-48 bg-gradient-to-br from-brand-100 via-brand-50 to-info-50 flex items-center justify-center">
              <button
                onClick={closeDrawer}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-28 h-28 rounded-3xl bg-white shadow-lg flex items-center justify-center text-6xl">
                {selectedPet.avatarEmoji}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <section>
                <h2 className="section-title">
                  <PawPrint className="w-5 h-5 text-brand-500" />
                  基本信息
                </h2>
                <div className="card p-5 space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      {selectedPet.name}
                      <span className={cn(
                        'text-lg',
                        selectedPet.gender === '公' ? 'text-info-500' : 'text-pink-500'
                      )}>
                        {selectedPet.gender === '公' ? '♂' : '♀'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="chip bg-brand-50 text-brand-700">{selectedPet.species}</span>
                      <span className="chip">{selectedPet.breed}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">年龄</div>
                      <div className="font-medium text-gray-800">{selectedPet.age} 岁</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">体重</div>
                      <div className="font-medium text-gray-800">{selectedPet.weight} kg</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Owner Info */}
              <section>
                <h2 className="section-title">
                  <User className="w-5 h-5 text-info-500" />
                  主人信息
                </h2>
                <div className="card p-5 space-y-3">
                  {(() => {
                    const owner = getOwner(selectedPet);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-800">{owner?.name || '-'}</div>
                          <div className="flex gap-2">
                            {owner?.phone && (
                              <a href={`tel:${owner.phone}`} className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition-colors">
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                            {owner?.email && (
                              <a href={`mailto:${owner.email}`} className="w-8 h-8 rounded-full bg-info-50 text-info-600 flex items-center justify-center hover:bg-info-100 transition-colors">
                                <Mail className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {owner?.phone || '-'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {owner?.email || '-'}
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <span>{owner?.address || '-'}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </section>

              {/* Vaccine Timeline */}
              <section>
                <h2 className="section-title">
                  <Syringe className="w-5 h-5 text-accent-500" />
                  疫苗接种记录
                </h2>
                <div className="card p-5">
                  {selectedPet.vaccines.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">暂无疫苗记录</div>
                  ) : (
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />
                      <div className="space-y-5">
                        {selectedPet.vaccines.map((v) => (
                          <div key={v.id} className="relative">
                            <div className={cn(
                              'absolute -left-4 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm',
                              v.status === 'completed' && 'bg-brand-500',
                              v.status === 'upcoming' && 'bg-accent-500',
                              v.status === 'overdue' && 'bg-red-500'
                            )} />
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium text-gray-800">{v.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  接种: {formatDate(v.date)}
                                </div>
                                {v.nextDue && (
                                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    下次: {formatDate(v.nextDue)}
                                  </div>
                                )}
                              </div>
                              <span className={cn('badge shrink-0',
                                v.status === 'completed' && 'bg-brand-100 text-brand-700',
                                v.status === 'upcoming' && 'bg-accent-100 text-accent-700',
                                v.status === 'overdue' && 'bg-red-100 text-red-700'
                              )}>
                                {v.status === 'completed' ? '已接种' : v.status === 'upcoming' ? '待接种' : '已逾期'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Allergies */}
              {selectedPet.allergies.length > 0 && (
                <section>
                  <h2 className="section-title">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    过敏档案
                  </h2>
                  <div className="card p-5">
                    <div className="flex flex-wrap gap-2">
                      {selectedPet.allergies.map((a) => (
                        <span key={a} className="badge bg-red-50 text-red-600 border border-red-100 px-3 py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {a}过敏
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Visit History */}
              <section>
                <h2 className="section-title">
                  <FileText className="w-5 h-5 text-purple-500" />
                  历史就诊记录
                </h2>
                <div className="space-y-3">
                  {(() => {
                    const petVisits = getPetVisits(selectedPet.id);
                    if (petVisits.length === 0) {
                      return (
                        <div className="card p-5 text-center text-sm text-gray-400">暂无就诊记录</div>
                      );
                    }
                    return petVisits
                      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
                      .map((v) => {
                        const doctor = getDoctor(v.doctorId);
                        return (
                          <div key={v.id} className="card p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-gray-800">{v.diagnosis}</div>
                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                  <span>{formatDate(v.visitDate)}</span>
                                  {doctor && <span>· {doctor.name}</span>}
                                </div>
                              </div>
                              <span className={cn('badge shrink-0', statusColor(v.paymentStatus))}>
                                {formatCurrency(v.totalCost)}
                              </span>
                            </div>
                            {v.symptoms && (
                              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-400">主诉：</span>{v.symptoms}
                              </div>
                            )}
                            {v.treatmentPlan && (
                              <div className="text-xs text-gray-500 bg-brand-50 rounded-lg px-3 py-2">
                                <span className="text-brand-600">方案：</span>{v.treatmentPlan}
                              </div>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              </section>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-gray-100 p-4 flex gap-3">
              <button
                onClick={() => openEditModal(selectedPet)}
                className="flex-1 btn-primary"
              >
                <Edit className="w-4 h-4" />
                编辑资料
              </button>
              <button
                onClick={() => handleDelete(selectedPet)}
                className="btn-danger"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Form Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto animate-slide-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-50">
                <h2 className="text-lg font-bold text-gray-800">
                  {formMode === 'add' ? '新增宠物档案' : '编辑宠物档案'}
                </h2>
                <button onClick={closeModal} className="btn-ghost px-2 py-1.5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Pet Basic Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-brand-500" />
                    宠物基本信息
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">宠物名 *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        placeholder="请输入宠物名"
                      />
                    </div>
                    <div>
                      <label className="label">物种</label>
                      <select
                        value={formData.species}
                        onChange={(e) => setFormData({ ...formData, species: e.target.value as Pet['species'] })}
                        className="input"
                      >
                        <option value="犬">🐕 犬</option>
                        <option value="猫">🐱 猫</option>
                        <option value="兔">🐰 兔</option>
                        <option value="鸟">🐦 鸟</option>
                        <option value="其他">🐾 其他</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">品种</label>
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                        className="input"
                        placeholder="如：金毛、英短"
                      />
                    </div>
                    <div>
                      <label className="label">性别</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: '公' })}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all',
                            formData.gender === '公'
                              ? 'bg-info-50 border-info-200 text-info-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          ♂ 公
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: '母' })}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all',
                            formData.gender === '母'
                              ? 'bg-pink-50 border-pink-200 text-pink-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          ♀ 母
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label">年龄 (岁)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">体重 (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* Owner Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-info-500" />
                    主人联系方式
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">主人姓名 *</label>
                      <input
                        type="text"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="input"
                        placeholder="请输入主人姓名"
                      />
                    </div>
                    <div>
                      <label className="label">联系电话 *</label>
                      <input
                        type="tel"
                        value={formData.ownerPhone}
                        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                        className="input"
                        placeholder="请输入手机号"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">邮箱</label>
                      <input
                        type="email"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        className="input"
                        placeholder="请输入邮箱地址"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label">地址</label>
                      <input
                        type="text"
                        value={formData.ownerAddress}
                        onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
                        className="input"
                        placeholder="请输入详细地址"
                      />
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* Vaccines */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-accent-500" />
                    疫苗记录
                  </h3>
                  <div className="space-y-3">
                    {formData.vaccines.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="flex-1 grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <div className="text-gray-400 mb-0.5">疫苗</div>
                            <div className="font-medium text-gray-700 truncate">{v.name}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-0.5">接种</div>
                            <div className="font-medium text-gray-700">{formatDate(v.date)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-0.5">下次</div>
                            <div className="font-medium text-gray-700">{v.nextDue ? formatDate(v.nextDue) : '-'}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-0.5">状态</div>
                            <span className={cn('badge',
                              v.status === 'completed' && 'bg-brand-100 text-brand-700',
                              v.status === 'upcoming' && 'bg-accent-100 text-accent-700',
                              v.status === 'overdue' && 'bg-red-100 text-red-700'
                            )}>
                              {v.status === 'completed' ? '已接种' : v.status === 'upcoming' ? '待接种' : '已逾期'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeVaccine(v.id)}
                          className="w-8 h-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <label className="label">疫苗名称</label>
                        <input
                          type="text"
                          value={newVaccine.name}
                          onChange={(e) => setNewVaccine({ ...newVaccine, name: e.target.value })}
                          className="input input-sm"
                          placeholder="如：狂犬疫苗"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="label">接种日期</label>
                        <input
                          type="date"
                          value={newVaccine.date}
                          onChange={(e) => setNewVaccine({ ...newVaccine, date: e.target.value })}
                          className="input input-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="label">下次到期</label>
                        <input
                          type="date"
                          value={newVaccine.nextDue}
                          onChange={(e) => setNewVaccine({ ...newVaccine, nextDue: e.target.value })}
                          className="input input-sm"
                        />
                      </div>
                      <div className="col-span-2 flex gap-1">
                        <button onClick={addVaccine} className="btn-sm btn-primary flex-1">
                          <Plus className="w-3 h-3" />
                          添加
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* Allergies */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    过敏记录
                  </h3>
                  <div className="space-y-3">
                    {formData.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.allergies.map((a) => (
                          <span
                            key={a}
                            className="badge bg-red-50 text-red-600 px-3 py-1.5 border border-red-100"
                          >
                            {a}
                            <button
                              onClick={() => removeAllergy(a)}
                              className="ml-1 opacity-60 hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                        className="input"
                        placeholder="输入过敏原，如：青霉素、海鲜..."
                      />
                      <button onClick={addAllergy} className="btn-secondary px-5">
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-5 border-t border-gray-50">
                <button onClick={closeModal} className="btn-secondary flex-1">
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.ownerName || !formData.ownerPhone}
                  className="btn-primary flex-1"
                >
                  {formMode === 'add' ? '创建档案' : '保存修改'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
