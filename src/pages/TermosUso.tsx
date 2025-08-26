import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, AlertTriangle, UserCheck } from 'lucide-react';

const TermosUso = () => {
  useEffect(() => {
    document.title = 'Termos de Uso | Paris & Co Parfums';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Termos de Uso
          </h1>
          <p className="text-muted-foreground text-lg">
            Estes termos regem o uso da plataforma Paris & Co Parfums. Ao usar nossos serviços, 
            você concorda com estes termos.
          </p>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Aceitação dos Termos */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <UserCheck className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                1. Aceitação dos Termos
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Ao acessar e usar o site da Paris & Co Parfums, você aceita e concorda 
                em cumprir estes termos e condições de uso.
              </p>
              <p>
                Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
              </p>
            </div>
          </section>

          {/* Descrição dos Serviços */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <FileText className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                2. Descrição dos Serviços
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                A Paris & Co Parfums é uma plataforma de e-commerce especializada na venda de perfumes 
                e produtos de beleza.
              </p>
              <p>Nossos serviços incluem:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Venda de perfumes em diferentes tamanhos (5ml, 10ml, tamanho completo)</li>
                <li>Sistema de curadoria personalizada de fragrâncias</li>
                <li>Programa de fidelidade e pontos</li>
                <li>Sistema de avaliações e recomendações</li>
                <li>Entrega em todo o território nacional</li>
              </ul>
            </div>
          </section>

          {/* Responsabilidades do Usuário */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                3. Responsabilidades do Usuário
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>Ao usar nossos serviços, você se compromete a:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a segurança de sua conta e senha</li>
                <li>Não usar o site para atividades ilegais ou não autorizadas</li>
                <li>Respeitar os direitos de propriedade intelectual</li>
                <li>Não tentar burlar sistemas de segurança</li>
                <li>Ser responsável por todos os pedidos feitos em sua conta</li>
              </ul>
            </div>
          </section>

          {/* Política de Compras */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <FileText className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                4. Política de Compras e Pagamentos
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Todos os preços estão em reais (R$) e incluem impostos aplicáveis.
              </p>
              <p>
                Aceitamos cartões de crédito, débito e PIX. O pagamento deve ser aprovado 
                antes do processamento do pedido.
              </p>
              <p>
                Nos reservamos o direito de cancelar pedidos em caso de:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Problemas com o pagamento</li>
                <li>Indisponibilidade do produto</li>
                <li>Suspeita de fraude</li>
                <li>Dados incorretos ou incompletos</li>
              </ul>
            </div>
          </section>

          {/* Propriedade Intelectual */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                5. Propriedade Intelectual
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Todo o conteúdo do site, incluindo textos, imagens, logos, designs e código, 
                é protegido por direitos autorais e outras leis de propriedade intelectual.
              </p>
              <p>
                É proibida a reprodução, distribuição ou uso comercial sem autorização expressa.
              </p>
            </div>
          </section>

          {/* Limitação de Responsabilidade */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                6. Limitação de Responsabilidade
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                A Paris & Co Parfums não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Danos indiretos ou consequenciais</li>
                <li>Problemas técnicos temporários no site</li>
                <li>Atrasos de entrega por motivos de força maior</li>
                <li>Reações alérgicas a produtos (consulte sempre a composição)</li>
                <li>Uso inadequado dos produtos</li>
              </ul>
            </div>
          </section>

          {/* Modificações */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <FileText className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                7. Modificações dos Termos
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento.
              </p>
              <p>
                As alterações entrarão em vigor imediatamente após a publicação no site.
                É sua responsabilidade revisar periodicamente os termos atualizados.
              </p>
            </div>
          </section>

          {/* Lei Aplicável */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Shield className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                8. Lei Aplicável e Foro
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Estes termos são regidos pelas leis brasileiras.
              </p>
              <p>
                Qualquer disputa será resolvida no foro da comarca de São Paulo/SP, 
                salvo quando a lei exigir foro específico.
              </p>
            </div>
          </section>

          {/* Contato */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <FileText className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                9. Contato
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Para dúvidas sobre estes termos, entre em contato:
              </p>
              <ul className="space-y-1">
                <li>E-mail: <a href="mailto:juridico@pariscoparfums.com.br" className="text-primary hover:underline">juridico@pariscoparfums.com.br</a></li>
                <li>SAC: <a href="mailto:sac@pariscoparfums.com.br" className="text-primary hover:underline">sac@pariscoparfums.com.br</a></li>
                <li>Telefone: (11) 0000-0000</li>
              </ul>
            </div>
          </section>

          {/* Disclaimer */}
          <div className="bg-muted rounded-lg p-6 border-l-4 border-amber-500">
            <p className="text-sm text-muted-foreground italic">
              <strong>Importante:</strong> Este documento deve ser revisado por advogado especialista 
              antes do uso em produção. Adapte às necessidades específicas do seu negócio e 
              às leis aplicáveis.
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
            <div className="flex gap-4">
              <Link 
                to="/privacidade" 
                className="text-primary hover:underline font-display"
              >
                Ver Política de Privacidade
              </Link>
              <Link 
                to="/troca-devolucao" 
                className="text-primary hover:underline font-display"
              >
                Ver Política de Trocas →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosUso;