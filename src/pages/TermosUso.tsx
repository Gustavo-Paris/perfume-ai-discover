import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, AlertTriangle, UserCheck, XCircle } from 'lucide-react';
import SEO from '@/components/SEO';

const TermosUso = () => {
  useEffect(() => {
    document.title = 'Termos de Uso | Paris & Co Parfums';
  }, []);

  return (
    <>
      <SEO 
        title="Termos de Uso"
        description="Conheça os termos e condições de uso da plataforma Paris & Co Parfums"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground text-lg mb-4">
              Estes termos regem o uso da plataforma Paris & Co Parfums. Ao usar nossos serviços, 
              você concorda com estes termos.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Última atualização:</strong> 10 de outubro de 2025
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
                Todo o conteúdo do site Paris & Co Parfums, incluindo mas não limitado a:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Textos, artigos e descrições de produtos</li>
                <li>Imagens, fotografias e ilustrações</li>
                <li>Logotipos, marcas e identidade visual</li>
                <li>Layout, design e elementos gráficos</li>
                <li>Código-fonte e estrutura do site</li>
                <li>Algoritmos de recomendação (IA)</li>
              </ul>
              <p>
                Todos estes elementos são protegidos por direitos autorais (Lei 9.610/98) e outras 
                leis de propriedade intelectual brasileiras e internacionais.
              </p>
              <p>
                É expressamente <strong>proibido</strong> sem autorização por escrito:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Reproduzir, copiar ou distribuir qualquer conteúdo</li>
                <li>Usar para fins comerciais ou lucrativos</li>
                <li>Modificar, adaptar ou criar obras derivadas</li>
                <li>Fazer engenharia reversa do código ou algoritmos</li>
              </ul>
            </div>
          </section>

          {/* Cancelamento de Conta */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <XCircle className="h-6 w-6 text-orange-500 mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                6. Cancelamento e Suspensão de Conta
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                <strong>Cancelamento pelo usuário:</strong> Você pode cancelar sua conta a qualquer momento 
                em "Configurações → Privacidade → Excluir Conta". Esta ação é irreversível.
              </p>
              <p>
                <strong>Suspensão pela Paris & Co:</strong> Podemos suspender ou encerrar sua conta se:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Violação destes Termos de Uso</li>
                <li>Atividade fraudulenta ou suspeita</li>
                <li>Uso de múltiplas contas para burlar regras</li>
                <li>Abuso de cupons ou programa de fidelidade</li>
                <li>Comportamento ofensivo com equipe de suporte</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Em caso de suspensão, você será notificado por e-mail com o motivo e prazo de recurso (15 dias).
              </p>
            </div>
          </section>

          {/* Limitação de Responsabilidade */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                7. Limitação de Responsabilidade
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
                8. Modificações dos Termos
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
                9. Lei Aplicável e Foro
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil, 
                especialmente:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Código de Defesa do Consumidor (Lei 8.078/90)</li>
                <li>Marco Civil da Internet (Lei 12.965/14)</li>
                <li>Lei Geral de Proteção de Dados - LGPD (Lei 13.709/18)</li>
                <li>Código Civil Brasileiro (Lei 10.406/02)</li>
              </ul>
              <p>
                Qualquer disputa ou controvérsia oriunda destes termos será resolvida no foro 
                da comarca de <strong>São Paulo/SP</strong>, com exclusão de qualquer outro, por mais 
                privilegiado que seja, exceto quando a lei exigir foro específico (ex: domicílio do consumidor).
              </p>
            </div>
          </section>

          {/* Contato */}
          <section className="bg-primary/5 rounded-lg p-6 border border-primary/20">
            <div className="flex items-start space-x-3 mb-4">
              <FileText className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-foreground">
                10. Contato
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Para dúvidas sobre estes termos ou questões jurídicas, entre em contato:
              </p>
              <ul className="space-y-2">
                <li>📧 Jurídico: <a href="mailto:juridico@pariscoparfums.com.br" className="text-primary hover:underline">juridico@pariscoparfums.com.br</a></li>
                <li>📧 SAC: <a href="mailto:sac@pariscoparfums.com.br" className="text-primary hover:underline">sac@pariscoparfums.com.br</a></li>
                <li>📱 Telefone: (49) 99972-3818</li>
                <li>📍 Endereço: Rua Augusta, 123 - São Paulo/SP, 01234-567</li>
              </ul>
            </div>
          </section>
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
    </>
  );
};

export default TermosUso;