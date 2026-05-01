import type { ActivityItem } from '@/types/api';
import { CheckCircle2, XCircle, Upload, UserPlus } from 'lucide-react';

const iconMap = {
  payment_confirmed: <CheckCircle2 className="size-4 text-green-600" />,
  payment_rejected: <XCircle className="size-4 text-red-600" />,
  payment_submitted: <Upload className="size-4 text-blue-600" />,
  customer_created: <UserPlus className="size-4 text-purple-600" />,
};

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium">Recent Activity</h2>
      <div className="space-y-2">
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded border p-3">
            <div className="mt-0.5">{iconMap[a.type]}</div>
            <div className="flex-1">
              <div className="text-sm">{a.description}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{a.customerName}</span>
                {a.staffName && (
                  <>
                    <span>·</span>
                    <span>{a.staffName}</span>
                  </>
                )}
                <span>·</span>
                <span>{new Date(a.timestamp).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
