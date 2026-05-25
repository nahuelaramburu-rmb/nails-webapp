import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, createService, updateService, deleteService } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Clock } from 'lucide-react';

interface Service { id: string; name: string; durationMinutes: number; price: number; depositAmount: number; description?: string; }
interface FormState { name: string; durationMinutes: string; price: string; depositAmount: string; description: string; }

const defaultForm: FormState = { name: '', durationMinutes: '60', price: '', depositAmount: '', description: '' };

export default function ServicesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['services'], queryFn: () => getServices().then(r => r.data) });
  const [modal, setModal] = useState<{ open: boolean; editing?: Service }>({ open: false });
  const [form, setForm] = useState<FormState>(defaultForm);

  const create = useMutation({
    mutationFn: (d: any) => createService(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast.success('Servicio creado'); closeModal(); },
  });
  const update = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => updateService(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast.success('Servicio actualizado'); closeModal(); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast.success('Servicio eliminado'); },
    onError: () => toast.error('No se puede eliminar — tiene turnos asociados'),
  });

  const openCreate = () => { setForm(defaultForm); setModal({ open: true }); };
  const openEdit = (s: Service) => {
    setForm({ name: s.name, durationMinutes: String(s.durationMinutes), price: String(s.price), depositAmount: String(s.depositAmount ?? 0), description: s.description ?? '' });
    setModal({ open: true, editing: s });
  };
  const closeModal = () => setModal({ open: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, durationMinutes: Number(form.durationMinutes), price: Number(form.price), depositAmount: Number(form.depositAmount), description: form.description };
    if (modal.editing) update.mutate({ id: modal.editing.id, d: payload });
    else create.mutate(payload);
  };

  const formatDuration = (min: number) => min >= 60 ? `${Math.floor(min/60)}h${min%60 ? ` ${min%60}min` : ''}` : `${min}min`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Servicios</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3">Servicio</th>
              <th className="text-left px-6 py-3">Duración</th>
              <th className="text-left px-6 py-3">Precio total</th>
              <th className="text-left px-6 py-3">Seña</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map((svc: Service) => (
              <tr key={svc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{svc.name}</p>
                  {svc.description && <p className="text-sm text-gray-500">{svc.description}</p>}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-sm text-gray-600"><Clock size={14} />{formatDuration(svc.durationMinutes)}</span>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-700">${svc.price.toLocaleString('es-AR')}</td>
                <td className="px-6 py-4">
                  <span className="bg-purple-100 text-purple-700 text-sm font-semibold px-2 py-0.5 rounded-full">
                    ${(svc.depositAmount ?? 0).toLocaleString('es-AR')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(svc)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"><Pencil size={15} /></button>
                    <button onClick={() => remove.mutate(svc.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data || data.length === 0) && <p className="text-center text-gray-400 py-12">No hay servicios cargados</p>}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">{modal.editing ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min) *</label>
                <input type="number" min="15" step="15" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio total ($) *</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seña ($) *</label>
                  <input type="number" min="0" value={form.depositAmount} onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg text-sm font-medium transition">
                  {modal.editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
