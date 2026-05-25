import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingData {
  appointmentId: string;
  serviceName: string;
  servicePrice: number;
  depositAmount: number;
  remainingAmount: number;
  employeeName: string;
  date: string;
  slot: string;
  clientName: string;
  clientEmail: string;
}

export default function BookingSuccessPage() {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get('collection_id') || params.get('payment_id') || '—';

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingBooking');
    if (raw) {
      setBooking(JSON.parse(raw));
      sessionStorage.removeItem('pendingBooking');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <span className="text-2xl">💅</span>
          <h1 className="font-bold text-gray-800 text-lg">Nails Studio</h1>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">¡Turno confirmado!</h2>
            <p className="text-gray-500 text-sm">Tu seña fue recibida. Te enviamos un email con todos los detalles.</p>
          </div>

          {booking && (
            <>
              {/* Turno */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Detalle del turno</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Servicio</span><span className="font-semibold text-gray-800">{booking.serviceName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Profesional</span><span className="font-semibold text-gray-800">{booking.employeeName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Fecha</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {format(new Date(booking.date + 'T12:00:00Z'), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Horario</span><span className="font-semibold text-gray-800">{booking.slot} hs</span></div>
                </div>
              </div>

              {/* Pago */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 space-y-3">
                <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">Comprobante de pago</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">N° transacción</span><span className="font-mono text-gray-700 text-xs">{paymentId}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Seña abonada</span><span className="font-bold text-green-600">${Number(booking.depositAmount).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Precio total</span><span className="font-semibold text-gray-700">${Number(booking.servicePrice).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between border-t border-green-200 pt-2 mt-2"><span className="text-gray-600 font-medium">Saldo a abonar el día del turno</span><span className="font-bold text-pink-600 text-base">${Number(booking.remainingAmount).toLocaleString('es-AR')}</span></div>
                </div>
              </div>
            </>
          )}

          <a href="/" className="block w-full text-center bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition text-sm">
            Reservar otro turno
          </a>
        </div>
      </div>
    </div>
  );
}
