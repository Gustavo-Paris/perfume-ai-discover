import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const SitemapGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSitemap = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap');

      if (error) throw error;

      // A função retorna o XML diretamente
      if (data) {
        // Criar blob do XML
        const blob = new Blob([data], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        setSitemapUrl(url);

        toast({
          title: "✅ Sitemap Gerado",
          description: "O sitemap foi gerado com sucesso. Você pode baixá-lo agora.",
        });
      }
    } catch (error: any) {
      console.error('Error generating sitemap:', error);
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao gerar sitemap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadSitemap = () => {
    if (!sitemapUrl) return;

    const link = document.createElement('a');
    link.href = sitemapUrl;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewSitemap = () => {
    window.open('https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/generate-sitemap', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Gerador de Sitemap
        </CardTitle>
        <CardDescription>
          Gere um sitemap.xml atualizado com todas as páginas e perfumes do site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium">URL Pública do Sitemap:</p>
              <code className="block mt-1 text-xs break-all">
                https://vjlfwmwhvxlicykqetnk.supabase.co/functions/v1/generate-sitemap
              </code>
              <p className="mt-2 text-muted-foreground">
                Este link pode ser usado no Google Search Console e robots.txt
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900">
              <p className="font-medium">Atualização Automática</p>
              <p className="mt-1">
                O sitemap é gerado dinamicamente sempre que alguém acessa a URL acima.
                Não é necessário regenerar manualmente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={generateSitemap}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Gerando...' : 'Gerar Sitemap'}
            </Button>

            {sitemapUrl && (
              <Button
                onClick={downloadSitemap}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar XML
              </Button>
            )}

            <Button
              onClick={viewSitemap}
              variant="outline"
              className="flex-1"
            >
              Ver Online
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">Como usar:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Adicione a URL do sitemap ao seu robots.txt</li>
            <li>Envie a URL para o Google Search Console</li>
            <li>O sitemap será atualizado automaticamente quando houver novos perfumes</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
