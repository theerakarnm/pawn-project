import { getSettings, getStaff } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Store, Building2, Users, MessageSquare } from 'lucide-react';

export default async function SettingsPage() {
  const settings = await getSettings();
  const staff = await getStaff();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="size-5" />
        <h1 className="text-lg font-semibold">Settings</h1>
        <span className="text-xs text-muted-foreground">(Demo — read only)</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Store className="size-4" />
              Shop Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shop Name</span>
              <span className="font-medium">{settings.shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LINE OA</span>
              <span className="font-medium">{settings.lineOfficialAccount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="size-4" />
              Bank Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{settings.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account No.</span>
              <span className="font-medium">{settings.bankAccount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="size-4" />
              Staff Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{s.role}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="size-4" />
              LINE Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-700">Connected (Mock)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LIFF ID</span>
              <span className="font-medium">demo-liff-id-xxxx</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Webhook URL</span>
              <span className="font-medium">/api/webhook (mock)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded border bg-amber-50 p-4 text-xs text-amber-800">
        This is a <strong>demo mode</strong> with mock data. All settings are read-only.
        To configure real settings, connect to the PAWN API backend.
      </div>
    </div>
  );
}
