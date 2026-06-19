import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Owner, Pet, Doctor, Room, Appointment, Visit,
  Prescription, MedicationReminder, Followup, VisitAttachment,
  ServiceType, AppointmentStatus, FollowupType, FollowupStatus,
} from '@/types';
import {
  mockOwners, mockPets, mockDoctors, mockRooms,
  mockAppointments, mockVisits, mockPrescriptions,
  mockMedicationReminders, mockFollowups,
} from '@/data/mockData';
import { uid } from '@/data/mockData';
import { formatISO } from 'date-fns';

interface AppState {
  owners: Owner[];
  pets: Pet[];
  doctors: Doctor[];
  rooms: Room[];
  appointments: Appointment[];
  visits: Visit[];
  prescriptions: Prescription[];
  medicationReminders: MedicationReminder[];
  followups: Followup[];
  attachments: VisitAttachment[];

  selectedDate: Date;
  selectedDoctorId: string | null;
  selectedPetId: string | null;
  filterType: string | null;

  setSelectedDate: (d: Date) => void;
  setSelectedDoctorId: (id: string | null) => void;
  setSelectedPetId: (id: string | null) => void;
  setFilterType: (t: string | null) => void;

  addPet: (pet: Omit<Pet, 'id' | 'createdAt'>, owner: Omit<Owner, 'id'>) => void;
  updatePet: (id: string, data: Partial<Pet>, owner: Partial<Owner>) => void;
  deletePet: (id: string) => void;
  addOwner: (owner: Omit<Owner, 'id'>) => string;
  updateOwner: (id: string, data: Partial<Owner>) => void;
  addAttachment: (data: Omit<VisitAttachment, 'id'>) => void;

  addAppointment: (data: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, newStart: string, newEnd: string) => void;
  completeAppointment: (id: string) => void;

  createVisit: (data: Omit<Visit, 'id'>) => Visit;
  addPrescription: (data: Omit<Prescription, 'id'>) => void;
  getVisitByAppointment: (appointmentId: string) => Visit | undefined;

  generateReminders: (prescriptionId: string) => void;
  sendReminder: (id: string, channel: 'sms' | 'wechat') => void;
  confirmReminder: (id: string) => void;

  createFollowup: (data: Omit<Followup, 'id'>) => void;
  completeFollowup: (id: string, data: Partial<Followup>) => void;
  updateFollowupStatus: (id: string, status: FollowupStatus) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      owners: mockOwners,
      pets: mockPets,
      doctors: mockDoctors,
      rooms: mockRooms,
      appointments: mockAppointments,
      visits: mockVisits,
      prescriptions: mockPrescriptions,
      medicationReminders: mockMedicationReminders,
      followups: mockFollowups,
      attachments: [],

      selectedDate: new Date(),
      selectedDoctorId: null,
      selectedPetId: null,
      filterType: null,

      setSelectedDate: (d) => set({ selectedDate: d }),
      setSelectedDoctorId: (id) => set({ selectedDoctorId: id }),
      setSelectedPetId: (id) => set({ selectedPetId: id }),
      setFilterType: (t) => set({ filterType: t }),

      addOwner: (owner) => {
        const newOwner: Owner = { ...owner, id: uid() };
        set((s) => ({ owners: [...s.owners, newOwner] }));
        return newOwner.id;
      },

      updateOwner: (id, data) => set((s) => ({
        owners: s.owners.map((o) => (o.id === id ? { ...o, ...data } : o)),
      })),

      addPet: (pet, owner) => {
        let ownerId = pet.ownerId;
        if (!ownerId) {
          ownerId = uid();
          set((s) => ({
            owners: [...s.owners, { ...owner, id: ownerId }],
            pets: [...s.pets, { ...pet, id: uid(), ownerId, createdAt: formatISO(new Date()) }],
          }));
        } else {
          set((s) => ({
            owners: s.owners.map((o) => (o.id === ownerId ? { ...o, ...owner } : o)),
            pets: [...s.pets, { ...pet, id: uid(), ownerId, createdAt: formatISO(new Date()) }],
          }));
        }
      },

      updatePet: (id, data, owner) => {
        set((s) => {
          const pet = s.pets.find((p) => p.id === id);
          const ownerId = pet?.ownerId || data.ownerId;
          return {
            owners: ownerId ? s.owners.map((o) => (o.id === ownerId ? { ...o, ...owner } : o)) : s.owners,
            pets: s.pets.map((p) => (p.id === id ? { ...p, ...data } : p)),
          };
        });
      },

      deletePet: (id) => set((s) => ({
        pets: s.pets.filter((p) => p.id !== id),
      })),

      addAttachment: (data) => set((s) => ({
        attachments: [...s.attachments, { ...data, id: uid() }],
      })),

      addAppointment: (data) => set((s) => ({
        appointments: [...s.appointments, { ...data, id: uid() }],
      })),

      updateAppointment: (id, data) => set((s) => ({
        appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)),
      })),

      cancelAppointment: (id) => set((s) => ({
        appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)),
      })),

      rescheduleAppointment: (id, newStart, newEnd) => set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === id ? { ...a, startTime: newStart, endTime: newEnd } : a
        ),
      })),

      completeAppointment: (id) => set((s) => ({
        appointments: s.appointments.map((a) =>
          a.id === id ? { ...a, status: 'completed' } : a
        ),
      })),

      createVisit: (data) => {
        const visit: Visit = { ...data, id: uid() };
        set((s) => ({ visits: [...s.visits, visit] }));
        return visit;
      },

      addPrescription: (data) => set((s) => ({
        prescriptions: [...s.prescriptions, { ...data, id: uid() }],
      })),

      getVisitByAppointment: (appointmentId) => {
        return get().visits.find((v) => v.appointmentId === appointmentId);
      },

      generateReminders: (prescriptionId) => {
        const state = get();
        const presc = state.prescriptions.find((p) => p.id === prescriptionId);
        if (!presc) return;

        const freqMap: Record<string, { hours: number; times: [number, number][] }> = {
          '每日1次': { hours: 24, times: [[8, 0]] },
          '每日2次': { hours: 12, times: [[8, 0], [20, 0]] },
          '每日3次': { hours: 8, times: [[8, 0], [16, 0], [22, 0]] },
          '每8小时': { hours: 8, times: [[8, 0], [16, 0], [0, 0]] },
          '每12小时': { hours: 12, times: [[8, 0], [20, 0]] },
          '需要时': { hours: 0, times: [[9, 0]] },
        };

        const config = freqMap[presc.frequency] || freqMap['每日1次'];
        const reminders: MedicationReminder[] = [];
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        for (let day = 0; day < presc.durationDays; day++) {
          for (const [h, m] of config.times) {
            const time = new Date(startOfToday);
            time.setDate(time.getDate() + day);
            time.setHours(h, m, 0, 0);
            if (time >= new Date()) {
              reminders.push({
                id: uid(),
                prescriptionId: presc.id,
                petId: state.visits.find((v) => v.id === presc.visitId)?.petId || '',
                remindTime: time.toISOString(),
                medicineName: presc.medicineName,
                dosage: presc.dosage,
                status: 'pending',
                sendChannel: 'none',
                confirmedByOwner: false,
              });
            }
          }
        }

        set((s) => ({
          medicationReminders: [...s.medicationReminders, ...reminders],
        }));
      },

      sendReminder: (id, channel) => set((s) => ({
        medicationReminders: s.medicationReminders.map((r) =>
          r.id === id ? { ...r, status: 'sent', sendChannel: channel } : r
        ),
      })),

      confirmReminder: (id) => set((s) => ({
        medicationReminders: s.medicationReminders.map((r) =>
          r.id === id ? { ...r, status: 'confirmed', confirmedByOwner: true } : r
        ),
      })),

      createFollowup: (data) => set((s) => ({
        followups: [...s.followups, { ...data, id: uid() }],
      })),

      completeFollowup: (id, data) => set((s) => ({
        followups: s.followups.map((f) =>
          f.id === id ? { ...f, ...data, status: 'completed', completedDate: formatISO(new Date()) } : f
        ),
      })),

      updateFollowupStatus: (id, status) => set((s) => ({
        followups: s.followups.map((f) => (f.id === id ? { ...f, status } : f)),
      })),
    }),
    {
      name: 'pet-clinic-store',
      partialize: (state) => ({
        owners: state.owners,
        pets: state.pets,
        appointments: state.appointments,
        visits: state.visits,
        prescriptions: state.prescriptions,
        medicationReminders: state.medicationReminders,
        followups: state.followups,
        attachments: state.attachments,
      }),
      onRehydrateStorage: () => {
        console.log('zustand persistence loaded');
      },
    }
  )
);
