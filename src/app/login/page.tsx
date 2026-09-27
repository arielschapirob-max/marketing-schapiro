import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Card } from '@/components/ui/primitives';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-brand-900">PymeLegal</h1>
        <p className="mb-6 text-sm text-gray-500">Ingrese a su cuenta para continuar.</p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No tiene cuenta?{' '}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Cree una aquí
          </Link>
        </p>
      </Card>
    </main>
  );
}
