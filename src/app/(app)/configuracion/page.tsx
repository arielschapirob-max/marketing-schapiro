import { Card, Alert } from '@/components/ui/primitives';
import { getEnv, isMockAI, isMockOCR, isMockStorage, isMockAntivirus } from '@/lib/env';

export default function SettingsPage() {
  const env = getEnv();

  const rows = [
    { label: 'Proveedor de IA', value: isMockAI() ? 'MODO MOCK (heurística léxica local)' : env.AI_PROVIDER, mock: isMockAI() },
    { label: 'OCR', value: isMockOCR() ? 'MODO MOCK' : env.OCR_PROVIDER, mock: isMockOCR() },
    { label: 'Almacenamiento', value: isMockStorage() ? 'Local (storage/uploads)' : 'S3', mock: isMockStorage() },
    { label: 'Antivirus', value: isMockAntivirus() ? 'MODO MOCK (firma EICAR + validación de tipo)' : 'Externo', mock: isMockAntivirus() },
    { label: 'Correo saliente', value: env.EMAIL_PROVIDER, mock: env.EMAIL_PROVIDER === 'mock' },
    { label: 'Colas / Redis', value: env.REDIS_URL ? 'configurado' : 'MODO SÍNCRONO (sin cola)', mock: !env.REDIS_URL },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Configuración del sistema</h1>
      <Alert variant="info">
        Estas integraciones se controlan mediante variables de entorno (ver .env.example). En modo mock, el sistema funciona
        completamente para fines de desarrollo y demostración, pero no reemplaza un proveedor real en producción.
      </Alert>
      <Card>
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-gray-100 last:border-0">
                <td className="py-2 font-medium text-gray-700">{r.label}</td>
                <td className="py-2 text-gray-600">{r.value}</td>
                <td className="py-2 text-right">
                  {r.mock && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-600">MODO MOCK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
