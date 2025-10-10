import { DashboardSelector, DashboardType } from './DashboardSelector';
import { DateRangeFilter, DateRange } from './DateRangeFilter';
import { ExportButton } from './ExportButton';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  title: string;
  description: string;
  currentDashboard: DashboardType;
  setCurrentDashboard: (dashboard: DashboardType) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  exportData?: any[];
  exportFilename?: string;
  exportTitle?: string;
  exportColumns?: Array<{ header: string; key: string; }>;
  onRefresh?: () => void;
  showDateFilter?: boolean;
  showExport?: boolean;
}

export function DashboardHeader({
  title,
  description,
  currentDashboard,
  setCurrentDashboard,
  dateRange,
  onDateRangeChange,
  exportData,
  exportFilename,
  exportTitle,
  exportColumns,
  onRefresh,
  showDateFilter = true,
  showExport = true,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <DashboardSelector value={currentDashboard} onChange={setCurrentDashboard} />
      </div>
      
      {(showDateFilter || showExport || onRefresh) && (
        <div className="flex items-center justify-between gap-4">
          {showDateFilter && dateRange && onDateRangeChange && (
            <DateRangeFilter 
              value={dateRange} 
              onChange={onDateRangeChange}
            />
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            )}
            
            {showExport && exportData && exportFilename && exportTitle && (
              <ExportButton
                data={exportData}
                filename={exportFilename}
                title={exportTitle}
                columns={exportColumns}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
