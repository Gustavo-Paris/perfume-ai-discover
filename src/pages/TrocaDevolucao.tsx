import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertTriangle, Package, Mail } from 'lucide-react';

const TrocaDevolucao = () => {
  useEffect(() => {
    document.title = 'Política de Trocas & Devoluções | Paris & Co Parfums';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Trocas & Devoluções
          </h1>
          <p className="text-muted-foreground text-lg">
            Entenda nossa política de trocas e devoluções para garantir sua satisfação.
          </p>
        </div>

        <div className="space-y-8">
          {/* Arrependimento */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <RefreshCw className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Arrependimento (até 7 dias)
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Envie um e-mail para{' '}
                <a href="mailto:suporte@pariscoparfums.com.br" className="text-primary hover:underline">
                  suporte@pariscoparfums.com.br
                </a>{' '}
                com número do pedido.
              </p>
              <p className="text-sm text-muted-foreground">
                O produto deve estar lacrado e com no mínimo 90% do volume original.
              </p>
            </div>
          </section>

          {/* Produto com defeito */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Produto com defeito
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Informe dentro de 30 dias e anexar fotos.
              </p>
              <p>
                Oferecemos substituição ou reembolso integral.
              </p>
            </div>
          </section>

          {/* Logística reversa */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Package className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Logística reversa
              </h2>
            </div>
            <div className="text-card-foreground ml-9">
              <p>
                Enviaremos uma etiqueta dos Correios sem custo adicional.
              </p>
            </div>
          </section>

          {/* Como solicitar */}
          <section className="bg-primary/5 rounded-lg p-6 border border-primary/20">
            <div className="flex items-start space-x-3 mb-4">
              <Mail className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-foreground">
                Como solicitar troca ou devolução
              </h2>
            </div>
            <div className="ml-9 space-y-3">
              <p className="text-foreground">
                Entre em contato conosco através do e-mail{' '}
                <a href="mailto:suporte@pariscoparfums.com.br" className="text-primary hover:underline font-medium">
                  suporte@pariscoparfums.com.br
                </a>
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Inclua as seguintes informações:</p>
                <ul className="space-y-1">
                  <li>• Número do pedido</li>
                  <li>• Motivo da troca/devolução</li>
                  <li>• Fotos do produto (se aplicável)</li>
                  <li>• Seu telefone para contato</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <div className="bg-muted rounded-lg p-6 border-l-4 border-primary">
            <p className="text-sm text-muted-foreground italic">
              <strong>Importante:</strong> Editar conforme suas regras finais.
              Esta política deve ser revista e aprovada pelo jurídico antes da publicação.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link 
              to="/privacidade" 
              className="text-primary hover:underline font-display"
            >
              ← Ver Política de Privacidade
            </Link>
            <Link 
              to="/" 
              className="text-primary hover:underline font-display"
            >
              Voltar ao início →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrocaDevolucao;