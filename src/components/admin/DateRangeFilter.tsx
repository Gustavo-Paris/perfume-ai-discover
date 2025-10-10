import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presetRanges = [
  {
    label: 'Últimos 7 dias',
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date()
    })
  },
  {
    label: 'Últimos 15 dias',
    getValue: () => ({
      from: subDays(new Date(), 14),
      to: new Date()
    })
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date()
    })
  },
  {
    label: 'Últimos 60 dias',
    getValue: () => ({
      from: subDays(new Date(), 59),
      to: new Date()
    })
  },
  {
    label: 'Últimos 90 dias',
    getValue: () => ({
      from: subDays(new Date(), 89),
      to: new Date()
    })
  },
  {
    label: 'Este mês',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date()
    })
  },
  {
    label: 'Mês anterior',
    getValue: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    }
  },
  {
    label: 'Este ano',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: new Date()
    })
  },
  {
    label: 'Personalizado',
    getValue: null
  }
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState('Últimos 30 dias');
  const [showCalendar, setShowCalendar] = useState(false);

  const handlePresetChange = (presetLabel: string) => {
    setSelectedPreset(presetLabel);
    const preset = presetRanges.find(p => p.label === presetLabel);
    
    if (preset?.getValue) {
      onChange(preset.getValue());
      setShowCalendar(false);
    } else {
      setShowCalendar(true);
    }
  };

  const formatDateRange = () => {
    if (!value.from || !value.to) return 'Selecione o período';
    
    const fromStr = format(value.from, 'dd/MM/yyyy', { locale: ptBR });
    const toStr = format(value.to, 'dd/MM/yyyy', { locale: ptBR });
    
    return `${fromStr} - ${toStr}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((preset) => (
            <SelectItem key={preset.label} value={preset.label}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(showCalendar || selectedPreset === 'Personalizado') && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={value.from}
              selected={{ from: value.from, to: value.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onChange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
