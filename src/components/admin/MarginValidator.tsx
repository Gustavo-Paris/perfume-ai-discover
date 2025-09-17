import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  percentageToDecimal, 
  decimalToPercentage, 
  formatMarginDisplay, 
  isValidMargin 
} from '@/utils/marginHelpers';

/**
 * Componente de validação e teste do sistema de margem
 * Para garantir que conversões estão funcionando corretamente
 */
export const MarginValidator = () => {
  const [testPercentage, setTestPercentage] = useState(200);
  const [validationResults, setValidationResults] = useState<any[]>([]);

  const runValidation = async () => {
    const results = [];
    
    // Teste 1: Conversão percentual para decimal
    const decimal = percentageToDecimal(testPercentage);
    results.push({
      test: 'Conversão % → decimal',
      input: `${testPercentage}%`,
      output: decimal,
      expected: testPercentage / 100,
      passed: decimal === testPercentage / 100
    });

    // Teste 2: Conversão decimal para percentual
    const backToPercentage = decimalToPercentage(decimal);
    results.push({
      test: 'Conversão decimal → %',
      input: decimal,
      output: backToPercentage,
      expected: testPercentage,
      passed: backToPercentage === testPercentage
    });

    // Teste 3: Formatação para display
    const formatted = formatMarginDisplay(decimal);
    results.push({
      test: 'Formatação display',
      input: decimal,
      output: formatted,
      expected: `${testPercentage}%`,
      passed: formatted === `${testPercentage}%`
    });

    // Teste 4: Validação de range
    const isValid = isValidMargin(testPercentage);
    results.push({
      test: 'Validação de range',
      input: testPercentage,
      output: isValid,
      expected: testPercentage >= 50 && testPercentage <= 500,
      passed: isValid === (testPercentage >= 50 && testPercentage <= 500)
    });

    // Teste 5: Buscar perfume real do banco
    try {
      const { data: perfumes } = await supabase
        .from('perfumes')
        .select('id, name, target_margin_percentage')
        .limit(1);
      
      if (perfumes && perfumes[0]) {
        const perfume = perfumes[0];
        const dbMargin = perfume.target_margin_percentage;
        const displayMargin = decimalToPercentage(dbMargin);
        
        results.push({
          test: `Banco → Interface (${perfume.name})`,
          input: `DB: ${dbMargin}`,
          output: `${displayMargin}%`,
          expected: 'Valor razoável (50%-500%)',
          passed: displayMargin >= 50 && displayMargin <= 500
        });
      }
    } catch (error) {
      results.push({
        test: 'Teste banco de dados',
        input: 'Query perfumes',
        output: `Erro: ${error}`,
        expected: 'Sucesso',
        passed: false
      });
    }

    setValidationResults(results);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔍 Validador do Sistema de Margem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <Input
            type="number"
            value={testPercentage}
            onChange={(e) => setTestPercentage(Number(e.target.value))}
            className="w-32"
            placeholder="200"
          />
          <span>%</span>
          <Button onClick={runValidation}>
            Executar Validação
          </Button>
        </div>

        {validationResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Resultados dos Testes:</h3>
            {validationResults.map((result, index) => (
              <div key={index} className="flex items-center gap-4 p-2 border rounded">
                <Badge variant={result.passed ? 'default' : 'destructive'}>
                  {result.passed ? '✅' : '❌'}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium">{result.test}</p>
                  <p className="text-sm text-muted-foreground">
                    Input: {result.input} → Output: {result.output}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Esperado: {result.expected}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900">Padrão do Sistema:</h4>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• <strong>Interface:</strong> Usuário vê/digita em % (200%, 150%)</li>
            <li>• <strong>Banco:</strong> Armazena como decimal (2.0, 1.5)</li>
            <li>• <strong>Conversão:</strong> % ÷ 100 = decimal | decimal × 100 = %</li>
            <li>• <strong>Range válido:</strong> 50% a 500% (0.5 a 5.0)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};