import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, getAvailability, setAvailability, deleteAvailability } from '../../api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

interface Employee { id: string; name: string; color: string; }
interface Availability { id: string; employeeId: string; date: string; startTime: string; endTime: string; employee: Employee; }
interface SlotModalState { open: boolean; date: string; existingByEmployee: Record<string, Availability>; }

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function AvailabilityPage() {
  const qc = useQueryClient();
  const [current, setCurrent] = useState(new Date());
  const [modal, setModal] = useState<SlotModalState>({ open: false, date: '', existingByEmployee: {} });
  const [slotForms, setSlotForms] = useState<Record<string, { start: string; end: string }>>({});

  const year = current.getFullYear();
  const month = current.getMonth() + 1;

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ['employees'], queryFn: () => getEmployees().then(r => r.data) });
  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ['availability', year, month],
    queryFn: () => getAvailability(year, month).then(r => r.data),
  });

  const upsert = useMutation({
    mutationFn: (data: any) => setAvailability(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['availability'] }); toast.success('Disponibilidad guardada'); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAvailability(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['availability'] }); toast.success('Disponibilidad eliminada'); },
  });

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const firstDow = (getDay(days[0]) + 6) % 7; // Monday-based

  const availByDate = availability.reduce((acc, a) => {
    const key = a.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, Availability[]>);

  const openModal = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const existing = (availByDate[key] ?? []).reduce((acc, a) => ({ ...acc, [a.employeeId]: a }), {} as Record<string, Availability>);
    const forms = employees.reduce((acc, e) => ({
      ...acc,
      [e.id]: { start: existing[e.id]?.startTime ?? '09:00', end: existing[e.id]?.endTime ?? '18:00' },
    }), {} as Record<string, { start: string; end: string }>);
    setSlotForms(forms);
    setModal({ open: true, date: key, existingByEmployee: existing });
  };

  const saveEmployee = (employeeId: string) => {
    const f = slotForms[employeeId];
    if (f.start >= f.end) { toast.error('La hora de inicio debe ser antes del cierre'); return; }
    upsert.mutate({ employeeId, date: modal.date, startTime: f.start, endTime: f.end });
  };

  const removeEmployee = (employeeId: string) => {
    const existing = modal.existingByEmployee[employeeId];
    if (existing) remove.mutate(existing.id);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Disponibilidad</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-700 w-36 text-center capitalize">{format(current, 'MMMM yyyy', { locale: es })}</span>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-3">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} className="border-b border-r border-gray-100 min-h-24 p-2 bg-gray-50/50" />)}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayAvail = availByDate[key] ?? [];
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return (
              <div
                key={key}
                onClick={() => openModal(day)}
                className="border-b border-r border-gray-100 min-h-24 p-2 cursor-pointer hover:bg-pink-50/30 transition"
              >
                <span className={`text-sm font-medium inline-flex w-7 h-7 items-center justify-center rounded-full ${isToday ? 'bg-pink-500 text-white' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayAvail.map(a => (
                    <div key={a.id} className="text-xs rounded px-1.5 py-0.5 text-white truncate" style={{ backgroundColor: a.employee.color }}>
                      {a.employee.name.split(' ')[0]} {a.startTime}–{a.endTime}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Disponibilidad</h2>
                <p className="text-sm text-gray-500 capitalize">{format(new Date(modal.date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}</p>
              </div>
              <button onClick={() => setModal(m => ({ ...m, open: false }))} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {employees.map((emp) => {
                const hasExisting = !!modal.existingByEmployee[emp.id];
                const f = slotForms[emp.id] ?? { start: '09:00', end: '18:00' };
                return (
                  <div key={emp.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: emp.color }}>{emp.name[0]}</div>
                      <p className="font-medium text-gray-800">{emp.name}</p>
                      {hasExisting && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Configurado</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      <select value={f.start} onChange={e => setSlotForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], start: e.target.value } }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-gray-400 text-sm">a</span>
                      <select value={f.end} onChange={e => setSlotForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], end: e.target.value } }))}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <button onClick={() => saveEmployee(emp.id)} className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
                        Guardar
                      </button>
                      {hasExisting && (
                        <button onClick={() => removeEmployee(emp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><X size={15} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
