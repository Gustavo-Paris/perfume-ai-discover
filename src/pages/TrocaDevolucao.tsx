import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertTriangle, Package, Mail, Clock, Shield } from 'lucide-react';
import SEO from '@/components/SEO';

const TrocaDevolucao = () => {
  useEffect(() => {
    document.title = 'Política de Trocas & Devoluções | Paris & Co Parfums';
  }, []);

  return (
    <>
      <SEO 
        title="Política de Trocas & Devoluções"
        description="Saiba como trocar ou devolver produtos conforme o Código de Defesa do Consumidor"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Trocas & Devoluções
            </h1>
            <p className="text-muted-foreground text-lg mb-4">
              Entenda nossa política de trocas e devoluções para garantir sua satisfação, 
              de acordo com o Código de Defesa do Consumidor (Lei 8.078/90).
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Última atualização:</strong> 10 de outubro de 2025
              </p>
            </div>
          </div>

        <div className="space-y-8">
          {/* Arrependimento */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <RefreshCw className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                1. Arrependimento (Art. 49 CDC)
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                <strong>Prazo:</strong> Até 7 dias corridos após o recebimento do produto
              </p>
              <p>
                <strong>Condições:</strong> O produto deve estar:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Lacrado ou com no mínimo 90% do conteúdo original</li>
                <li>Na embalagem original, sem danos</li>
                <li>Com nota fiscal e todos os acessórios</li>
              </ul>
              <p>
                <strong>Reembolso:</strong> 100% do valor pago, incluindo frete de ida (mas você paga o frete de devolução)
              </p>
              <p>
                <strong>Como solicitar:</strong> Envie e-mail para{' '}
                <a href="mailto:suporte@pariscoparfums.com.br" className="text-primary hover:underline">
                  suporte@pariscoparfums.com.br
                </a>{' '}
                com número do pedido e motivo.
              </p>
              <p className="text-sm text-muted-foreground">
                Você tem direito ao arrependimento sem precisar justificar. É um direito legal para compras online.
              </p>
            </div>
          </section>

          {/* Produto com defeito */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                2. Produto com Defeito/Vício (Art. 18 CDC)
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                <strong>Garantia Legal:</strong> 30 dias para produtos não-duráveis, 90 dias para duráveis
              </p>
              <p>
                <strong>O que caracteriza defeito:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Produto vazando, com cheiro alterado ou oxidado</li>
                <li>Frasco quebrado ou danificado no transporte</li>
                <li>Conteúdo diferente do anunciado</li>
                <li>Qualquer imperfeição que impeça o uso normal</li>
              </ul>
              <p>
                <strong>Suas opções (você escolhe):</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Substituição do produto por outro igual</li>
                <li>Reembolso integral (valor + frete de ida e volta)</li>
                <li>Abatimento proporcional no preço</li>
              </ul>
              <p>
                <strong>Como solicitar:</strong> Entre em contato em até 30 dias após recebimento, 
                anexando fotos claras do defeito. Enviaremos etiqueta de devolução pré-paga.
              </p>
            </div>
          </section>

          {/* Vício Oculto */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Clock className="h-6 w-6 text-purple-500 mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                3. Vício Oculto (Art. 26 CDC)
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                <strong>O que é:</strong> Defeito que não era perceptível no momento da compra
              </p>
              <p>
                <strong>Prazo:</strong> Até 90 dias após descobrir o defeito (não da compra)
              </p>
              <p>
                <strong>Exemplos:</strong> Perfume que oxida muito rápido, frasco que vaza depois de 1 mês, 
                cheiro que muda completamente após algumas semanas
              </p>
              <p>
                <strong>Procedimento:</strong> Mesmo processo de produto com defeito. Entre em contato 
                imediatamente ao descobrir o problema, com fotos e descrição detalhada.
              </p>
            </div>
          </section>

          {/* Logística reversa */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Package className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                4. Logística Reversa e Frete
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                <strong>Quando NÓS pagamos o frete de devolução:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Produto com defeito ou vício</li>
                <li>Erro nosso no pedido (produto errado, quantidade errada)</li>
                <li>Produto danificado no transporte</li>
              </ul>
              <p>
                <strong>Quando VOCÊ paga o frete de devolução:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Arrependimento (direito de desistência nos 7 dias)</li>
                <li>Mudou de ideia após testar (desde que tenha 90% do conteúdo)</li>
              </ul>
              <p>
                <strong>Como funciona:</strong> Se o frete é por nossa conta, enviamos etiqueta de 
                devolução pré-paga por e-mail. Você cola na embalagem e leva até os Correios. 
                Se o frete é por sua conta, orientamos você a enviar com código de rastreamento.
              </p>
            </div>
          </section>

          {/* Prazos de Reembolso */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Shield className="h-6 w-6 text-green-500 mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                5. Prazos de Reembolso
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Após recebermos o produto devolvido e aprovarmos (prazo: até 3 dias úteis):
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>PIX:</strong> Reembolso em até 2 dias úteis (mais rápido)
                </li>
                <li>
                  <strong>Cartão de Crédito:</strong> Estorno aparece na fatura em até 2 ciclos (30-60 dias)
                </li>
                <li>
                  <strong>Vale-compras:</strong> Crédito imediato na sua conta (válido por 1 ano)
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Você escolhe a forma de reembolso ao solicitar a devolução. Vale-compras tem bônus de +10% 
                (ex: devolução de R$ 100 vira vale de R$ 110).
              </p>
            </div>
          </section>

          {/* Como solicitar */}
          <section className="bg-primary/5 rounded-lg p-6 border border-primary/20">
            <div className="flex items-start space-x-3 mb-4">
              <Mail className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-foreground">
                6. Como Solicitar Troca ou Devolução (Passo a Passo)
              </h2>
            </div>
            <div className="ml-9 space-y-4">
              <div>
                <p className="font-medium mb-2">📧 PASSO 1: Entre em contato</p>
                <p className="text-muted-foreground">
                  Envie e-mail para{' '}
                  <a href="mailto:suporte@pariscoparfums.com.br" className="text-primary hover:underline font-medium">
                    suporte@pariscoparfums.com.br
                  </a>{' '}
                  ou use o <Link to="/sac" className="text-primary hover:underline">SAC online</Link>
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">📝 PASSO 2: Forneça as informações</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Número do pedido (ex: #12345)</li>
                  <li>• Motivo da devolução (arrependimento, defeito, etc.)</li>
                  <li>• Fotos do produto (obrigatório se houver defeito)</li>
                  <li>• Forma de reembolso preferida (PIX, cartão ou vale-compras)</li>
                  <li>• Telefone para contato</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-2">⏱️ PASSO 3: Aguarde análise</p>
                <p className="text-muted-foreground">
                  Analisamos em até 24 horas úteis. Você receberá e-mail com aprovação e instruções de envio.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">📦 PASSO 4: Embale e envie</p>
                <p className="text-muted-foreground">
                  Embale bem o produto (use a embalagem original se possível). Se fornecermos etiqueta, 
                  cole no pacote e leve até os Correios. Se você for pagar, envie com código de rastreamento 
                  e nos informe.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">✅ PASSO 5: Receba o reembolso</p>
                <p className="text-muted-foreground">
                  Após recebermos e aprovarmos o produto (3 dias úteis), processamos o reembolso conforme 
                  a forma escolhida.
                </p>
              </div>
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
                  Política de Privacidade
                </Link>
                <Link 
                  to="/termos-uso" 
                  className="text-primary hover:underline font-display"
                >
                  Termos de Uso →
                </Link>
              </div>
            </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default TrocaDevolucao;