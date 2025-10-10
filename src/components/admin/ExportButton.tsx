import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: any[];
  filename: string;
  title: string;
  columns?: Array<{ header: string; key: string; }>;
  className?: string;
}

export function ExportButton({ 
  data, 
  filename, 
  title, 
  columns,
  className 
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
      
      // Prepare table data
      const tableColumns = columns || Object.keys(data[0] || {}).map(key => ({
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key: key
      }));
      
      const tableData = data.map(row => 
        tableColumns.map(col => {
          const value = row[col.key];
          if (typeof value === 'number' && value > 1000) {
            return value.toLocaleString('pt-BR');
          }
          return value?.toString() || '-';
        })
      );
      
      autoTable(doc, {
        head: [tableColumns.map(col => col.header)],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] },
      });
      
      doc.save(`${filename}.pdf`);
      
      toast({
        title: 'Exportado com sucesso',
        description: 'O arquivo PDF foi baixado.',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o arquivo PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      
      // Prepare data with formatted columns
      const formattedData = data.map(row => {
        const formattedRow: any = {};
        
        if (columns) {
          columns.forEach(col => {
            formattedRow[col.header] = row[col.key];
          });
        } else {
          Object.keys(row).forEach(key => {
            const header = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            formattedRow[header] = row[key];
          });
        }
        
        return formattedRow;
      });
      
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
      
      // Add metadata
      worksheet['!cols'] = Object.keys(formattedData[0] || {}).map(() => ({ wch: 15 }));
      
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      toast({
        title: 'Exportado com sucesso',
        description: 'O arquivo Excel foi baixado.',
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o arquivo Excel.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      
      const tableColumns = columns || Object.keys(data[0] || {}).map(key => ({
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key: key
      }));
      
      // Create CSV content
      const headers = tableColumns.map(col => col.header).join(',');
      const rows = data.map(row =>
        tableColumns.map(col => {
          const value = row[col.key];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = value?.toString() || '';
          return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        }).join(',')
      );
      
      const csv = [headers, ...rows].join('\n');
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      
      toast({
        title: 'Exportado com sucesso',
        description: 'O arquivo CSV foi baixado.',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o arquivo CSV.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar como Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar como CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
