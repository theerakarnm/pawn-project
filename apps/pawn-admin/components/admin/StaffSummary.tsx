import type { StaffMember } from '@/types/api';

interface StaffSummaryProps {
  staff: StaffMember[];
}

export function StaffSummary({ staff }: StaffSummaryProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">Staff Today</h3>
      <div className="space-y-1.5">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
            <div>
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{s.role}</span>
            </div>
            <span className="text-xs text-muted-foreground">{s.confirmedToday} confirmed</span>
          </div>
        ))}
      </div>
    </div>
  );
}
