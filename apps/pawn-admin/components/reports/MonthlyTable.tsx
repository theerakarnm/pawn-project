import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MonthlyTableProps {
  data: Array<{
    date: string;
    paymentCount: number;
    totalAmount: string;
    customerCount: number;
  }>;
}

export function MonthlyTable({ data }: MonthlyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Payments</TableHead>
          <TableHead>Total (฿)</TableHead>
          <TableHead>Customers</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.date}>
            <TableCell>{row.date}</TableCell>
            <TableCell>{row.paymentCount}</TableCell>
            <TableCell>฿{row.totalAmount}</TableCell>
            <TableCell>{row.customerCount}</TableCell>
          </TableRow>
        ))}
        {data.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
              No data
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
