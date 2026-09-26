import { Card } from '@/components/ui/primitives';
import { OrganizationForm } from '@/components/organizations/organization-form';

export default function NewOrganizationPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-brand-900">Nueva organización</h1>
      <Card>
        <OrganizationForm />
      </Card>
    </div>
  );
}
