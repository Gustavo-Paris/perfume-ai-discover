import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, Eye, UserCheck } from 'lucide-react';

const Privacidade = () => {
  useEffect(() => {
    document.title = 'Política de Privacidade | Paris & Co Parfums';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground text-lg">
            Esta página explica <strong>quais dados coletamos</strong>, <strong>por que coletamos</strong> e{' '}
            <strong>quais são seus direitos</strong> conforme a LGPD (Lei 13.709/2018).
          </p>
        </div>

        <div className="space-y-8">
          {/* Dados que coletamos */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Eye className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Dados que coletamos
              </h2>
            </div>
            <ul className="space-y-2 text-card-foreground ml-9">
              <li>• Nome, CPF/CNPJ, endereço</li>
              <li>• E-mail, telefone</li>
              <li>• Preferências de fragrância (questionário)</li>
              <li>• Histórico de compras</li>
            </ul>
          </section>

          {/* Finalidade */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Finalidade
              </h2>
            </div>
            <ul className="space-y-2 text-card-foreground ml-9">
              <li>• Processar seu pedido e pagamento</li>
              <li>• Personalizar recomendações de perfume</li>
              <li>• Cumprir obrigações fiscais e de logística</li>
            </ul>
          </section>

          {/* Direitos do titular */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <UserCheck className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Direitos do titular
              </h2>
            </div>
            <div className="text-card-foreground ml-9">
              <p className="mb-3">
                Você pode solicitar <strong>acesso, correção ou exclusão</strong> dos seus dados em{' '}
                <Link to="/auth" className="text-primary hover:underline">
                  Minha Conta ▸ Privacidade
                </Link>{' '}
                ou pelo e-mail{' '}
                <a href="mailto:privacidade@pariscoparfums.com.br" className="text-primary hover:underline">
                  privacidade@pariscoparfums.com.br
                </a>
                .
              </p>
            </div>
          </section>

          {/* Cookies & Analytics */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Mail className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Cookies & Analytics
              </h2>
            </div>
            <div className="text-card-foreground ml-9">
              <p className="mb-3">
                Usamos Google Analytics para métricas de navegação.
              </p>
              <p>
                Você pode desativar cookies no seu navegador.
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <div className="bg-muted rounded-lg p-6 border-l-4 border-primary">
            <p className="text-sm text-muted-foreground italic">
              <strong>Importante:</strong> Substitua este texto por versão revisada pelo seu jurídico.
              Este é um modelo básico que deve ser adaptado às suas necessidades específicas.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link 
              to="/" 
              className="text-primary hover:underline font-display"
            >
              ← Voltar ao início
            </Link>
            <Link 
              to="/troca-devolucao" 
              className="text-primary hover:underline font-display"
            >
              Ver Política de Trocas & Devoluções →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacidade;