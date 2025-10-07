import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { SubscriptionPreferences, IntensityPreference } from '@/types/subscription';
import { useSubscriptionPreferences } from '@/hooks/useSubscriptionPreferences';

interface PreferencesFormProps {
  subscriptionId: string;
  preferences?: SubscriptionPreferences;
}

const FAMILIES = [
  'Floral',
  'Amadeirado',
  'Oriental',
  'Cítrico',
  'Aromático',
  'Chipre',
  'Fougère'
];

const GENDERS = [
  'Masculino',
  'Feminino',
  'Unissex'
];

export function PreferencesForm({ subscriptionId, preferences }: PreferencesFormProps) {
  const { updatePreferences, loading } = useSubscriptionPreferences();
  
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(
    preferences?.preferred_families || []
  );
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    preferences?.preferred_gender || []
  );
  const [excludedNotes, setExcludedNotes] = useState(
    preferences?.excluded_notes?.join(', ') || ''
  );
  const [intensity, setIntensity] = useState<IntensityPreference>(
    preferences?.intensity_preference || 'any'
  );
  const [surpriseMe, setSurpriseMe] = useState(
    preferences?.surprise_me ?? true
  );
  const [notes, setNotes] = useState(preferences?.notes || '');

  const handleToggleFamily = (family: string) => {
    setSelectedFamilies(prev =>
      prev.includes(family)
        ? prev.filter(f => f !== family)
        : [...prev, family]
    );
  };

  const handleToggleGender = (gender: string) => {
    setSelectedGenders(prev =>
      prev.includes(gender)
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const excludedNotesArray = excludedNotes
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    await updatePreferences(subscriptionId, {
      preferred_families: selectedFamilies,
      preferred_gender: selectedGenders,
      excluded_notes: excludedNotesArray,
      intensity_preference: intensity,
      surprise_me: surpriseMe,
      notes
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências de Curadoria</CardTitle>
        <CardDescription>
          Configure suas preferências para recebermos perfumes mais alinhados ao seu gosto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Famílias Olfativas */}
          <div className="space-y-3">
            <Label className="text-base">Famílias Olfativas Preferidas</Label>
            <p className="text-sm text-muted-foreground">
              Selecione as famílias que você mais gosta
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FAMILIES.map((family) => (
                <div key={family} className="flex items-center space-x-2">
                  <Checkbox
                    id={`family-${family}`}
                    checked={selectedFamilies.includes(family)}
                    onCheckedChange={() => handleToggleFamily(family)}
                  />
                  <Label
                    htmlFor={`family-${family}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {family}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Gênero */}
          <div className="space-y-3">
            <Label className="text-base">Gênero Preferido</Label>
            <div className="grid grid-cols-3 gap-3">
              {GENDERS.map((gender) => (
                <div key={gender} className="flex items-center space-x-2">
                  <Checkbox
                    id={`gender-${gender}`}
                    checked={selectedGenders.includes(gender)}
                    onCheckedChange={() => handleToggleGender(gender)}
                  />
                  <Label
                    htmlFor={`gender-${gender}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {gender}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Intensidade */}
          <div className="space-y-3">
            <Label className="text-base">Intensidade Preferida</Label>
            <RadioGroup value={intensity} onValueChange={(v) => setIntensity(v as IntensityPreference)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="font-normal cursor-pointer">Leve (Suave, Discreto)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">Médio (Equilibrado)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="strong" id="strong" />
                <Label htmlFor="strong" className="font-normal cursor-pointer">Intenso (Marcante)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="any" />
                <Label htmlFor="any" className="font-normal cursor-pointer">Qualquer (Variar)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notas Excluídas */}
          <div className="space-y-3">
            <Label htmlFor="excluded-notes" className="text-base">
              Notas que NÃO gosta
            </Label>
            <p className="text-sm text-muted-foreground">
              Separe por vírgula. Ex: baunilha, patchouli, almíscar
            </p>
            <Textarea
              id="excluded-notes"
              value={excludedNotes}
              onChange={(e) => setExcludedNotes(e.target.value)}
              placeholder="Digite as notas que deseja evitar..."
              rows={3}
            />
          </div>

          {/* Surpresa */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="surprise-me" className="text-base">
                Me surpreenda!
              </Label>
              <p className="text-sm text-muted-foreground">
                Receber perfumes fora das minhas preferências para descobrir novos estilos
              </p>
            </div>
            <Switch
              id="surprise-me"
              checked={surpriseMe}
              onCheckedChange={setSurpriseMe}
            />
          </div>

          {/* Observações */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base">
              Observações Adicionais
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conte mais sobre suas preferências..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
