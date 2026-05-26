import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getServices, getAvailability, getSlots, createPaymentPreference } from '../api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, Clock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Service { id: string; name: string; durationMinutes: number; price: number; depositAmount: number; description?: string; }
interface Employee { id: string; name: string; color: string; phone?: string; }
interface Availability { employeeId: string; date: string; employee: Employee; }

type Step = 'service' | 'employee-date' | 'slot' | 'form';

const formatDuration = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}` : `${min}min`;

export default function BookingPage() {
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth() + 1;

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => getServices().then(r => r.data),
  });

  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ['availability', year, month],
    queryFn: () => getAvailability(year, month).then(r => r.data),
    enabled: step === 'employee-date',
  });

  const { data: slots = [], isFetching: loadingSlots } = useQuery<string[]>({
    queryKey: ['slots', selectedDate, selectedEmployee?.id, selectedService?.durationMinutes],
    queryFn: () => getSlots(selectedDate!, selectedEmployee!.id, selectedService!.durationMinutes).then(r => r.data),
    enabled: !!(selectedDate && selectedEmployee && selectedService && step === 'slot'),
  });

  const preferenceMutation = useMutation({
    mutationFn: (data: any) => createPaymentPreference(data),
    onSuccess: (res) => {
      const { init_point, appointmentId, depositAmount } = res.data;
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        appointmentId,
        serviceName: selectedService?.name,
        servicePrice: selectedService?.price,
        depositAmount,
        remainingAmount: (selectedService?.price ?? 0) - depositAmount,
        employeeName: selectedEmployee?.name,
        date: selectedDate,
        slot: selectedSlot,
        clientName: form.name,
        clientEmail: form.email,
      }));
      window.location.href = init_point;
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Error al iniciar el pago'),
  });

  const availDays = new Set(availability.map(a => a.date.slice(0, 10)));
  const employeesOnDate = selectedDate
    ? availability.filter(a => a.date.slice(0, 10) === selectedDate).map(a => a.employee)
    : [];

  const days = eachDayOfInterval({ start: startOfMonth(calendarDate), end: endOfMonth(calendarDate) });
  const firstDow = (getDay(days[0]) + 6) % 7;

  const handleDateClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    if (!availDays.has(key) || isBefore(day, startOfDay(new Date()))) return;
    setSelectedDate(key);
    setSelectedEmployee(null);
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    preferenceMutation.mutate({
      employeeId: selectedEmployee!.id,
      serviceId: selectedService!.id,
      date: selectedDate,
      startTime: selectedSlot,
      clientName: form.name,
      clientEmail: form.email,
      clientPhone: form.phone,
      notes: form.notes,
    });
  };

  const visibleSteps = ['service', 'employee-date', 'slot', 'form'];
  const stepLabels = ['Servicio', 'Fecha', 'Horario', 'Datos'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💅</span>
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-none">Nails Studio</h1>
              <p className="text-xs text-gray-500">Reservá tu turno online</p>
            </div>
          </div>
          <a href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600 transition">Admin</a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
            {visibleSteps.map((s, i) => {
              const idx = visibleSteps.indexOf(step);
              const isActive = s === step;
              const isDone = i < idx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 text-sm ${isActive ? 'text-pink-600 font-semibold' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-pink-500 text-white' : isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {isDone ? <Check size={12} /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{stepLabels[i]}</span>
                  </div>
                  {i < 3 && <div className="w-8 h-px bg-gray-200" />}
                </div>
              );
            })}
          </div>

        {/* STEP 1: Select service */}
        {step === 'service' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">¿Qué servicio querés?</h2>
            <p className="text-gray-500 mb-6 text-sm">Elegí el servicio para continuar con la reserva</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map(svc => (
                <button key={svc.id} onClick={() => { setSelectedService(svc); setStep('employee-date'); }}
                  className="bg-white border-2 border-gray-200 hover:border-pink-400 rounded-xl p-5 text-left transition group">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-800 group-hover:text-pink-600 transition">{svc.name}</p>
                    <div className="text-right">
                      <p className="text-pink-600 font-bold text-sm">${svc.price.toLocaleString('es-AR')}</p>
                      {svc.depositAmount > 0 && (
                        <p className="text-purple-500 text-xs font-medium">Seña: ${svc.depositAmount.toLocaleString('es-AR')}</p>
                      )}
                    </div>
                  </div>
                  {svc.description && <p className="text-sm text-gray-500 mb-2">{svc.description}</p>}
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{formatDuration(svc.durationMinutes)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select date + employee */}
        {step === 'employee-date' && (
          <div>
            <button onClick={() => setStep('service')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
              <ArrowLeft size={15} /> Volver
            </button>
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-3">
              <span className="text-pink-600 font-semibold">{selectedService?.name}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600 text-sm flex items-center gap-1"><Clock size={13} />{formatDuration(selectedService?.durationMinutes ?? 0)}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-700 text-sm">Total: <strong>${selectedService?.price.toLocaleString('es-AR')}</strong></span>
              {(selectedService?.depositAmount ?? 0) > 0 && (
                <><span className="text-gray-400">·</span>
                <span className="text-purple-600 text-sm">Seña: <strong>${selectedService?.depositAmount.toLocaleString('es-AR')}</strong></span></>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Elegí un día</h2>
            <p className="text-gray-500 text-sm mb-4">Los días resaltados tienen disponibilidad</p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><ChevronLeft size={18} /></button>
                <span className="font-semibold text-gray-700 capitalize">{format(calendarDate, 'MMMM yyyy', { locale: es })}</span>
                <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition"><ChevronRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 border-b border-gray-100">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} className="h-12" />)}
                {days.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  const hasAvail = availDays.has(key);
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const isSelected = selectedDate === key;
                  return (
                    <div key={key} onClick={() => !isPast && hasAvail && handleDateClick(day)}
                      className={`h-12 flex items-center justify-center text-sm relative transition
                        ${isPast ? 'text-gray-300 cursor-not-allowed' : hasAvail ? 'cursor-pointer' : 'text-gray-400 cursor-not-allowed'}
                        ${isSelected ? '' : hasAvail && !isPast ? 'hover:bg-pink-50' : ''}`}>
                      <span className={`w-9 h-9 flex items-center justify-center rounded-full font-medium
                        ${isSelected ? 'bg-pink-500 text-white' : hasAvail && !isPast ? 'text-pink-600' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {hasAvail && !isPast && !isSelected && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
            {selectedDate && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Elegí con quién querés atenderte</h3>
                {employeesOnDate.length === 0
                  ? <p className="text-gray-400 text-sm">No hay empleadas disponibles ese día</p>
                  : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {employeesOnDate.map(emp => (
                        <button key={emp.id} onClick={() => { setSelectedEmployee(emp); setSelectedSlot(null); setStep('slot'); }}
                          className="bg-white border-2 border-gray-200 hover:border-pink-400 rounded-xl p-4 flex items-center gap-3 transition group">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0" style={{ backgroundColor: emp.color }}>{emp.name[0]}</div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-800 group-hover:text-pink-600 transition">{emp.name}</p>
                            {emp.phone && <p className="text-sm text-gray-500">{emp.phone}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Select slot */}
        {step === 'slot' && (
          <div>
            <button onClick={() => { setStep('employee-date'); setSelectedEmployee(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
              <ArrowLeft size={15} /> Volver
            </button>
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 mb-6">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="font-semibold text-pink-600">{selectedService?.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600 capitalize">{selectedDate && format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{selectedEmployee?.name}</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Elegí el horario</h2>
            <p className="text-gray-500 text-sm mb-5">Horarios disponibles para {formatDuration(selectedService?.durationMinutes ?? 0)}</p>
            {loadingSlots && <p className="text-gray-400 text-center py-8">Cargando horarios...</p>}
            {!loadingSlots && slots.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">😔</p>
                <p>No hay horarios disponibles para este día</p>
                <button onClick={() => { setStep('employee-date'); setSelectedEmployee(null); }} className="mt-4 text-pink-500 hover:text-pink-600 text-sm underline">Elegir otro día</button>
              </div>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {slots.map(slot => (
                <button key={slot} onClick={() => { setSelectedSlot(slot); setStep('form'); }}
                  className="bg-white border-2 border-gray-200 hover:border-pink-400 hover:bg-pink-50 text-gray-700 font-medium py-3 rounded-xl transition text-sm">
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Booking form */}
        {step === 'form' && (
          <div>
            <button onClick={() => { setStep('slot'); setSelectedSlot(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
              <ArrowLeft size={15} /> Volver
            </button>
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 mb-6">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="font-semibold text-pink-600">{selectedService?.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600 capitalize">{selectedDate && format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: es })}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{selectedEmployee?.name}</span>
                <span className="text-gray-400">·</span>
                <span className="font-semibold text-gray-700">{selectedSlot} hs</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-3 divide-x divide-gray-100 text-center">
              <div className="px-3">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Precio total</p>
                <p className="text-lg font-bold text-gray-800">${selectedService?.price.toLocaleString('es-AR')}</p>
              </div>
              <div className="px-3">
                <p className="text-xs text-purple-500 uppercase font-semibold tracking-wide mb-1">Seña hoy</p>
                <p className="text-lg font-bold text-purple-600">${selectedService?.depositAmount.toLocaleString('es-AR')}</p>
              </div>
              <div className="px-3">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Resta el día</p>
                <p className="text-lg font-bold text-pink-600">
                  ${((selectedService?.price ?? 0) - (selectedService?.depositAmount ?? 0)).toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">Tus datos</h2>
            <p className="text-gray-500 text-sm mb-6">Completá tus datos para ir al pago de la seña</p>

            <form onSubmit={handleBook} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                    placeholder="María García" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                    placeholder="11 2345 6789" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
                  placeholder="maria@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm resize-none"
                  placeholder="Alguna aclaración o diseño que quieras..." />
              </div>
              <button type="submit" disabled={preferenceMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm">
                {preferenceMutation.isPending ? 'Preparando pago...' : `Continuar al pago — $${selectedService?.depositAmount.toLocaleString('es-AR')}`}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Footer redes sociales */}
      <footer className="mt-auto py-6 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-3">
          <p className="text-xs text-gray-400">Seguinos en redes</p>
          <div className="flex items-center gap-5">
            {/* Facebook */}
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition"
              style={{background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)'}}>
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/542213642194" target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
