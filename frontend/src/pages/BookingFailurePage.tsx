import { XCircle } from 'lucide-react';

export default function BookingFailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <span className="text-2xl">💅</span>
          <h1 className="font-bold text-gray-800 text-lg">Nails Studio</h1>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pago no procesado</h2>
          <p className="text-gray-500 mb-2">No pudimos procesar tu pago.</p>
          <p className="text-gray-400 text-sm mb-8">Podés intentarlo de nuevo. El turno no fue reservado.</p>
          <a href="/" className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-xl transition text-sm">
            Intentar de nuevo
          </a>
        </div>
      </div>
    </div>
  );
}
