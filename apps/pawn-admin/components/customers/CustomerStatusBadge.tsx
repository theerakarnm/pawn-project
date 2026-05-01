interface CustomerStatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: 'text-green-700 bg-green-50 border-green-200',
  paid: 'text-blue-700 bg-blue-50 border-blue-200',
  overdue: 'text-red-700 bg-red-50 border-red-200',
  due_soon: 'text-amber-700 bg-amber-50 border-amber-200',
  pending_verification: 'text-amber-700 bg-amber-50 border-amber-200',
  confirmed: 'text-green-700 bg-green-50 border-green-200',
  rejected: 'text-red-700 bg-red-50 border-red-200',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  paid: 'Paid',
  overdue: 'Overdue',
  due_soon: 'Due Soon',
  pending_verification: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
};

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const style = statusStyles[status] ?? 'text-gray-700 bg-gray-50 border-gray-200';
  const label = statusLabels[status] ?? status;
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
