import Link from 'next/link';
import type { DeviceListItem } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';

interface DeviceTableProps {
  devices: DeviceListItem[];
  onDelete: (id: string) => void;
}

export function DeviceTable({ devices, onDelete }: DeviceTableProps) {
  return (
    <div className="rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.brand}</TableCell>
              <TableCell>{d.model}</TableCell>
              <TableCell>{d.storage}</TableCell>
              <TableCell>
                {d.price ? `฿${d.price}` : '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={d.status === 'active' ? 'default' : 'secondary'}
                  className={
                    d.status === 'active'
                      ? 'text-green-700 bg-green-50'
                      : 'text-gray-500 bg-gray-100'
                  }
                >
                  {d.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(d.createdAt).toLocaleDateString('th-TH')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/devices/${d.id}/edit`}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(d.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {devices.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                No devices found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
