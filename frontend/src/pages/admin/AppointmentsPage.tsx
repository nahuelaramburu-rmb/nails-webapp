import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppointments, cancelAppointment } from '../../api';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Phone, Mail, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  id: string; clientName: string; clientEmail: string; clientPhone: string;
  date: string; startTime: string; endTime: string; notes?: string; status: string;
  depositAmount: number; mercadoPagoPaymentId?: string;
  employee: { name: string; color: string; };
  service: { name: string; price: number; };
}

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [current, setCurrent] = useState(new Date());
  const year = current.getFullYear();
  const month = current.getMonth() + 1;

  const { data = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', year, month],
    queryFn: () => getAppointments({ year, month }).then(r => r.data),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Turno cancelado'); },
  });

  const grouped = data.reduce((acc, appt) => {
    const key = appt.date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(appt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Turnos</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-700 w-36 text-center capitalize">{format(current, 'MMMM yyyy', { locale: es })}</span>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"><ChevronRight size={18} /></button>
        </div>
      </div>

      {isLoading && <p className="text-gray-400 text-center py-12">Cargando...</p>}

      {!isLoading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p>No hay turnos en este mes</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, appts]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 capitalize">
              {format(new Date(date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            <div className="space-y-3">
              {appts.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(appt => (
                <div key={appt.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-start">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: appt.employee.color }} />
                  <div className="flex-1 grid sm:grid-cols-3 gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{appt.clientName}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={12} />{appt.clientEmail}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} />{appt.clientPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{appt.service.name}</p>
                      <p className="text-sm text-gray-500">${appt.service.price.toLocaleString('es-AR')}</p>
                      <p className="text-sm text-gray-500">{appt.employee.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="bg-pink-100 text-pink-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {appt.startTime} – {appt.endTime}
                      </span>
                      {appt.status === 'pending' ? (
                        <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">Pago pendiente</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Seña: ${(appt.depositAmount ?? 0).toLocaleString('es-AR')}
                        </span>
                      )}
                      {appt.notes && <p className="text-xs text-gray-400 text-right">{appt.notes}</p>}
                      <button
                        onClick={() => { if (confirm('¿Cancelar este turno?')) cancel.mutate(appt.id); }}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition"
                      >
                        <Ban size={12} /> Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
