import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useScheduleCollection } from '@/hooks/useScheduleCollection';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CollectionSchedulerProps {
  selectedShipments: string[];
  onScheduled?: () => void;
}

export function CollectionScheduler({ selectedShipments, onScheduled }: CollectionSchedulerProps) {
  const [collectionDate, setCollectionDate] = useState<Date>();
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const { scheduleCollection, loading } = useScheduleCollection();

  const handleSchedule = async () => {
    if (!collectionDate || selectedShipments.length === 0) {
      return;
    }

    try {
      await scheduleCollection({
        shipment_ids: selectedShipments,
        collection_date: format(collectionDate, 'yyyy-MM-dd'),
        collection_time_start: timeStart || undefined,
        collection_time_end: timeEnd || undefined,
      });

      onScheduled?.();
    } catch (error) {
      console.error('Error scheduling collection:', error);
    }
  };

  if (selectedShipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Coleta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Selecione os embarques para agendar a coleta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendar Coleta ({selectedShipments.length} embarques)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Data da Coleta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {collectionDate ? (
                    format(collectionDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={collectionDate}
                  onSelect={setCollectionDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="timeStart">Horário Início (Opcional)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="timeStart"
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="timeEnd">Horário Fim (Opcional)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="timeEnd"
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSchedule} 
          disabled={!collectionDate || loading}
          className="w-full"
        >
          {loading ? 'Agendando...' : 'Agendar Coleta'}
        </Button>
      </CardContent>
    </Card>
  );
}