import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

interface Employee { id: string; name: string; phone?: string; color: string; }
interface FormState { name: string; phone: string; color: string; }

const defaultForm: FormState = { name: '', phone: '', color: '#ec4899' };

export default function EmployeesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['employees'], queryFn: () => getEmployees().then(r => r.data) });
  const [modal, setModal] = useState<{ open: boolean; editing?: Employee }>({ open: false });
  const [form, setForm] = useState<FormState>(defaultForm);

  const create = useMutation({
    mutationFn: (d: FormState) => createEmployee(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Empleada creada'); closeModal(); },
    onError: () => toast.error('Error al crear'),
  });
  const update = useMutation({
    mutationFn: ({ id, d }: { id: string; d: FormState }) => updateEmployee(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Empleada actualizada'); closeModal(); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Empleada eliminada'); },
    onError: () => toast.error('No se puede eliminar — tiene turnos asociados'),
  });

  const openCreate = () => { setForm(defaultForm); setModal({ open: true }); };
  const openEdit = (e: Employee) => { setForm({ name: e.name, phone: e.phone ?? '', color: e.color }); setModal({ open: true, editing: e }); };
  const closeModal = () => setModal({ open: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal.editing) update.mutate({ id: modal.editing.id, d: form });
    else create.mutate(form);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Empleadas</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Nueva empleada
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((emp: Employee) => (
          <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0" style={{ backgroundColor: emp.color }}>
              {emp.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{emp.name}</p>
              {emp.phone && <p className="text-sm text-gray-500">{emp.phone}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(emp)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"><Pencil size={15} /></button>
              <button onClick={() => remove.mutate(emp.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">{modal.editing ? 'Editar empleada' : 'Nueva empleada'}</h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
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
