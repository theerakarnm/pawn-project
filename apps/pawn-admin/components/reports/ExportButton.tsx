import { Button } from '@/components/ui/button';
import { getExportUrl } from '@/lib/api';

interface ExportButtonProps {
  year: number;
  month: number;
}

export function ExportButton({ year, month }: ExportButtonProps) {
  return (
    <Button asChild size="sm" variant="outline">
      <a href={getExportUrl(year, month)} download>
        Export Excel
      </a>
    </Button>
  );
}
