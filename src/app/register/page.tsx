import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Card } from '@/components/ui/primitives';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-brand-900">Crear cuenta en PymeLegal</h1>
        <p className="mb-6 text-sm text-gray-500">Podrá crear organizaciones y diagnósticos apenas ingrese.</p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tiene cuenta?{' '}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Inicie sesión
          </Link>
        </p>
      </Card>
    </main>
  );
}
