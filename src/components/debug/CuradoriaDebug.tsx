import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const CuradoriaDebug = () => {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const runDebug = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-conversational');
      
      if (error) {
        setDebugResult({ error: error.message });
      } else {
        setDebugResult(data);
      }
    } catch (err) {
      setDebugResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testConversationalRecommend = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('conversational-recommend', {
        body: {
          message: 'Olá, estou procurando um perfume masculino para o dia a dia',
          conversationHistory: []
        }
      });
      
      if (error) {
        setTestResult({ error: error.message });
      } else {
        setTestResult(data);
      }
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug Curadoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? 'Testando...' : 'Testar API Debug'}
          </Button>
          
          <Button onClick={testConversationalRecommend} disabled={loading}>
            {loading ? 'Testando...' : 'Testar Conversational Recommend'}
          </Button>

          {debugResult && (
            <div>
              <h3 className="font-semibold mb-2">Resultado Debug API:</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </div>
          )}

          {testResult && (
            <div>
              <h3 className="font-semibold mb-2">Resultado Conversational:</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CuradoriaDebug;