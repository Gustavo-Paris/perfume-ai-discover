import { SubscriptionPreferences } from '@/types/subscription';

interface Perfume {
  id: string;
  name: string;
  brand: string;
  family: string;
  gender: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  intensity?: string;
  total_stock_ml?: number;
}

interface SelectionResult {
  perfumes: Perfume[];
  reasoning: Record<string, string>;
}

/**
 * Shuffle array usando algoritmo Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Seleciona perfumes para assinatura baseado em preferências
 */
export async function selectPerfumesForSubscription(
  preferences: SubscriptionPreferences,
  availablePerfumes: Perfume[],
  previousShipmentIds: string[],
  quantity: number,
  sizeML: number
): Promise<SelectionResult> {
  
  console.log('🎯 Iniciando seleção de perfumes', {
    quantity,
    sizeML,
    availablePerfumes: availablePerfumes.length,
    previousShipments: previousShipmentIds.length
  });

  // 1. FILTRAR POR PREFERÊNCIAS
  let candidates = availablePerfumes.filter(p => {
    // Família compatível
    if (preferences.preferred_families.length > 0) {
      if (!preferences.preferred_families.includes(p.family)) {
        return false;
      }
    }
    
    // Gênero compatível
    if (preferences.preferred_gender.length > 0) {
      if (!preferences.preferred_gender.includes(p.gender)) {
        return false;
      }
    }
    
    // Sem notas excluídas
    if (preferences.excluded_notes.length > 0) {
      const allNotes = [
        ...(p.top_notes || []),
        ...(p.heart_notes || []),
        ...(p.base_notes || [])
      ];
      
      const hasExcludedNote = allNotes.some(note => 
        preferences.excluded_notes.some(excluded => 
          note.toLowerCase().includes(excluded.toLowerCase())
        )
      );
      
      if (hasExcludedNote) {
        return false;
      }
    }
    
    // Intensidade compatível (se especificada)
    if (preferences.intensity_preference !== 'any' && p.intensity) {
      if (p.intensity.toLowerCase() !== preferences.intensity_preference) {
        return false;
      }
    }
    
    return true;
  });

  console.log('✅ Após filtro de preferências:', candidates.length);

  // 2. REMOVER JÁ ENVIADOS (últimos 6 meses)
  candidates = candidates.filter(p => !previousShipmentIds.includes(p.id));
  console.log('✅ Após remover já enviados:', candidates.length);

  // 3. FILTRAR POR ESTOQUE SUFICIENTE
  const minStockNeeded = sizeML;
  candidates = candidates.filter(p => 
    (p.total_stock_ml || 0) >= minStockNeeded
  );
  console.log('✅ Após filtro de estoque:', candidates.length);

  // 4. SE NÃO HOUVER CANDIDATOS SUFICIENTES, EXPANDIR CRITÉRIOS
  if (candidates.length < quantity) {
    console.warn('⚠️ Poucos candidatos, expandindo critérios...');
    
    // Incluir perfumes já enviados há mais de 3 meses
    const threeMonthsAgo = previousShipmentIds.slice(0, Math.floor(previousShipmentIds.length / 2));
    candidates = availablePerfumes.filter(p => 
      !threeMonthsAgo.includes(p.id) &&
      (p.total_stock_ml || 0) >= minStockNeeded
    );
  }

  // 5. DIVERSIFICAR SELEÇÃO
  const selected: Perfume[] = [];
  const usedFamilies = new Set<string>();
  const usedBrands = new Set<string>();
  const reasoning: Record<string, string> = {};

  // Embaralhar para aleatoriedade
  const shuffled = shuffleArray(candidates);

  for (const perfume of shuffled) {
    if (selected.length >= quantity) break;

    // Se não é "surprise me", evitar repetir família E marca
    if (!preferences.surprise_me) {
      if (usedFamilies.has(perfume.family) && usedBrands.has(perfume.brand)) {
        continue;
      }
    }

    selected.push(perfume);
    usedFamilies.add(perfume.family);
    usedBrands.add(perfume.brand);

    // Criar reasoning
    const reasons: string[] = [];
    if (preferences.preferred_families.includes(perfume.family)) {
      reasons.push(`família ${perfume.family} preferida`);
    }
    if (preferences.preferred_gender.includes(perfume.gender)) {
      reasons.push(`gênero ${perfume.gender} preferido`);
    }
    if (perfume.intensity && preferences.intensity_preference === perfume.intensity.toLowerCase()) {
      reasons.push(`intensidade ${perfume.intensity} compatível`);
    }
    
    reasoning[perfume.id] = reasons.length > 0 
      ? `Selecionado por: ${reasons.join(', ')}`
      : 'Selecionado para diversificar sua experiência olfativa';
  }

  // 6. FALLBACK: Se ainda não temos suficientes, pegar os primeiros disponíveis
  if (selected.length < quantity) {
    console.warn('⚠️ Fallback: pegando qualquer perfume disponível');
    
    for (const perfume of shuffled) {
      if (selected.length >= quantity) break;
      if (!selected.find(p => p.id === perfume.id)) {
        selected.push(perfume);
        reasoning[perfume.id] = 'Selecionado para diversificar sua coleção';
      }
    }
  }

  console.log('🎉 Seleção final:', selected.length, 'perfumes');

  return {
    perfumes: selected,
    reasoning
  };
}

/**
 * Calcula score de diversidade de uma seleção
 */
export function calculateDiversityScore(perfumes: Perfume[]): number {
  if (perfumes.length === 0) return 0;

  const uniqueFamilies = new Set(perfumes.map(p => p.family)).size;
  const uniqueBrands = new Set(perfumes.map(p => p.brand)).size;
  const uniqueGenders = new Set(perfumes.map(p => p.gender)).size;

  const familyScore = (uniqueFamilies / perfumes.length) * 100;
  const brandScore = (uniqueBrands / perfumes.length) * 100;
  const genderScore = (uniqueGenders / perfumes.length) * 50;

  return Math.round((familyScore + brandScore + genderScore) / 2.5);
}
