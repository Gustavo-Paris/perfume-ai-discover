import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Package, 
  CreditCard, 
  RefreshCw, 
  User, 
  Sparkles, 
  Shield,
  ChevronDown
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import SEO from '@/components/SEO';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'Perguntas Frequentes (FAQ) | Paris & Co Parfums';
  }, []);

  const categories = [
    {
      id: 'assinaturas',
      title: 'Assinaturas e Curadoria',
      icon: Sparkles,
      questions: [
        {
          q: 'Como funciona a curadoria personalizada?',
          a: 'Nossa curadoria usa inteligência artificial para entender suas preferências através de um questionário detalhado. Analisamos suas notas favoritas, ocasiões de uso, e até mesmo perfumes que você já gosta. Com base nisso, recomendamos fragrâncias que têm alta probabilidade de agradar você.'
        },
        {
          q: 'Posso pausar ou cancelar minha assinatura a qualquer momento?',
          a: 'Sim! Você tem total flexibilidade. Acesse "Minha Assinatura" no seu perfil e escolha pausar por 1-3 meses ou cancelar definitivamente. Não há multas ou taxas de cancelamento.'
        },
        {
          q: 'Quando recebo meu primeiro kit de assinatura?',
          a: 'Seu primeiro kit é enviado em até 3 dias úteis após a confirmação do pagamento. Você receberá um e-mail com o código de rastreamento assim que for despachado.'
        },
        {
          q: 'Posso escolher os perfumes da minha assinatura?',
          a: 'A assinatura é baseada em nossa curadoria, mas você pode adicionar notas e preferências que serão priorizadas. Também oferecemos a opção de trocar 1 perfume por mês caso não tenha gostado.'
        },
        {
          q: 'Qual a diferença entre os planos de assinatura?',
          a: 'Temos 3 planos: Essencial (2 perfumes de 5ml), Premium (3 perfumes de 10ml) e Luxury (5 perfumes de 10ml + 1 full size). Quanto maior o plano, maior o desconto por ml e mais exclusivas as fragrâncias.'
        }
      ]
    },
    {
      id: 'pedidos',
      title: 'Pedidos e Entregas',
      icon: Package,
      questions: [
        {
          q: 'Quanto tempo demora a entrega?',
          a: 'Para capitais: 3-7 dias úteis. Interior: 7-15 dias úteis. Regiões remotas podem levar até 20 dias úteis. Você pode acompanhar seu pedido em tempo real pela área "Meus Pedidos".'
        },
        {
          q: 'Como rastrear meu pedido?',
          a: 'Acesse "Meus Pedidos" no menu do seu perfil. Você verá o status atualizado e poderá clicar no código de rastreamento para acompanhar pelos Correios ou transportadora.'
        },
        {
          q: 'Não recebi meu pedido no prazo, o que fazer?',
          a: 'Entre em contato com nosso SAC imediatamente através do e-mail suporte@pariscoparfums.com.br ou pelo chat no site. Verificaremos a situação e tomaremos as medidas necessárias (reenvio ou reembolso).'
        },
        {
          q: 'Posso alterar o endereço de entrega após fazer o pedido?',
          a: 'Se o pedido ainda não foi despachado (status "Preparando"), sim! Entre em contato urgentemente pelo SAC. Após o despacho, não é mais possível alterar.'
        },
        {
          q: 'Vocês entregam em todo o Brasil?',
          a: 'Sim! Atendemos todo o território nacional através dos Correios e transportadoras parceiras. Algumas regiões remotas podem ter prazo estendido.'
        },
        {
          q: 'Qual o valor do frete?',
          a: 'O frete é calculado automaticamente no checkout baseado no seu CEP e peso do pedido. Oferecemos frete grátis para pedidos acima de R$ 250,00 em capitais.'
        }
      ]
    },
    {
      id: 'pagamentos',
      title: 'Pagamentos e Nota Fiscal',
      icon: CreditCard,
      questions: [
        {
          q: 'Quais formas de pagamento vocês aceitam?',
          a: 'Aceitamos Cartão de Crédito (todas as bandeiras), Cartão de Débito e PIX. Para assinaturas, apenas cartão de crédito (cobrança recorrente automática).'
        },
        {
          q: 'Meu pagamento foi recusado, o que fazer?',
          a: 'Verifique: 1) Limite disponível no cartão, 2) Dados digitados corretamente, 3) Cartão não vencido. Se persistir, tente outro cartão ou use PIX como alternativa.'
        },
        {
          q: 'Quanto tempo leva para processar pagamento via PIX?',
          a: 'O PIX é instantâneo! Seu pedido é confirmado em até 5 minutos após o pagamento. Você receberá um e-mail de confirmação automaticamente.'
        },
        {
          q: 'Vocês emitem nota fiscal?',
          a: 'Sim! Todas as compras têm nota fiscal eletrônica (NF-e) emitida automaticamente. Você recebe por e-mail em até 48h após a confirmação do pagamento.'
        },
        {
          q: 'Posso parcelar minha compra?',
          a: 'Sim! Aceitamos parcelamento em até 6x sem juros no cartão de crédito para compras acima de R$ 150,00. Abaixo disso, até 3x sem juros.'
        },
        {
          q: 'Como funciona o programa de pontos?',
          a: 'A cada R$ 1,00 em compras você ganha 1 ponto. Cada 100 pontos = R$ 10,00 de desconto. Você pode resgatar a partir de 50 pontos (R$ 5,00).'
        }
      ]
    },
    {
      id: 'trocas',
      title: 'Trocas e Devoluções',
      icon: RefreshCw,
      questions: [
        {
          q: 'Qual o prazo para trocar ou devolver?',
          a: 'Arrependimento: 7 dias corridos (CDC). Produto com defeito: 30 dias (garantia legal). Vício oculto: até 90 dias. O produto deve estar lacrado com no mínimo 90% do conteúdo.'
        },
        {
          q: 'Como solicitar uma troca ou devolução?',
          a: 'Envie e-mail para suporte@pariscoparfums.com.br com: número do pedido, motivo, fotos (se defeito) e telefone. Analisamos em até 24h e enviamos instruções de devolução.'
        },
        {
          q: 'Quem paga o frete da devolução?',
          a: 'Defeito/erro nosso: nós pagamos (enviamos etiqueta pré-paga). Arrependimento: cliente paga (você envia por conta). Orientamos a usar Correios com código de rastreamento.'
        },
        {
          q: 'Quando recebo o reembolso?',
          a: 'Após recebermos e aprovarmos a devolução: PIX (2 dias úteis), Cartão de crédito (até 2 faturas), Vale-compras (imediato). Você escolhe a forma de reembolso.'
        },
        {
          q: 'Posso trocar um perfume por outro modelo?',
          a: 'Sim, mas apenas em caso de arrependimento (7 dias). Enviamos o novo produto após recebermos o item devolvido. Diferenças de preço são cobradas/reembolsadas.'
        }
      ]
    },
    {
      id: 'conta',
      title: 'Conta e Cadastro',
      icon: User,
      questions: [
        {
          q: 'Como criar uma conta?',
          a: 'Clique em "Entrar" no menu superior, depois em "Criar conta". Preencha nome, e-mail e crie uma senha forte. Você receberá um e-mail de confirmação para ativar sua conta.'
        },
        {
          q: 'Esqueci minha senha, como recuperar?',
          a: 'Na tela de login, clique em "Esqueci minha senha". Digite seu e-mail cadastrado e enviaremos um link para criar nova senha. O link é válido por 1 hora.'
        },
        {
          q: 'Como ativar a autenticação de dois fatores (2FA)?',
          a: 'Acesse "Configurações" no seu perfil, clique em "Segurança" e ative "Autenticação em 2 Fatores". Você precisará de um app autenticador (Google Authenticator, Authy, etc.).'
        },
        {
          q: 'Como atualizar meus dados cadastrais?',
          a: 'Vá em "Configurações" no menu do seu perfil. Você pode alterar nome, telefone, endereços e preferências de comunicação a qualquer momento.'
        },
        {
          q: 'Como excluir minha conta permanentemente?',
          a: 'Acesse "Configurações" → "Privacidade e Dados" → "Excluir Conta". Atenção: esta ação é irreversível e você perderá seu histórico, pontos e assinaturas ativas.'
        },
        {
          q: 'Posso ter mais de uma conta?',
          a: 'Cada CPF/CNPJ pode ter apenas uma conta ativa. Isso evita fraudes e garante a integridade do programa de fidelidade.'
        }
      ]
    },
    {
      id: 'produtos',
      title: 'Produtos e Estoque',
      icon: HelpCircle,
      questions: [
        {
          q: 'Como sei se um perfume vai me agradar antes de comprar?',
          a: 'Use nossa ferramenta de Curadoria AI que analisa suas preferências. Também temos descrições detalhadas com notas olfativas, ocasiões de uso e comparações. E você pode começar com tamanhos menores (5ml ou 10ml).'
        },
        {
          q: 'O que são decants?',
          a: 'Decants são perfumes originais fracionados em frascos menores (5ml, 10ml). Você experimenta fragrâncias premium sem gastar com full size. Todos são originais, nunca réplicas.'
        },
        {
          q: 'Vocês vendem amostras gratuitas?',
          a: 'Não oferecemos amostras gratuitas, mas nossos decants de 5ml (cerca de 50 aplicações) são a melhor forma de experimentar. Assinantes ganham 1 amostra surpresa por mês.'
        },
        {
          q: 'Como saber se um produto está em estoque?',
          a: 'Todos os produtos exibidos no site estão disponíveis. Se estiver esgotado, aparecerá como "Indisponível" e você pode ativar notificação de reposição.'
        },
        {
          q: 'Os perfumes são originais?',
          a: 'Sim, 100% originais! Trabalhamos apenas com distribuidores oficiais e importadores autorizados. Emitimos nota fiscal em todas as vendas.'
        },
        {
          q: 'Como armazenar perfumes corretamente?',
          a: 'Mantenha em local fresco, escuro e seco. Evite banheiro (umidade) e exposição direta ao sol. Bem armazenados, decants duram 1-2 anos mantendo qualidade.'
        }
      ]
    },
    {
      id: 'seguranca',
      title: 'Segurança e Privacidade',
      icon: Shield,
      questions: [
        {
          q: 'Meus dados estão seguros?',
          a: 'Sim! Usamos criptografia SSL/TLS em todas as páginas, seguimos a LGPD rigorosamente e nunca compartilhamos seus dados com terceiros sem autorização. Somos auditados regularmente.'
        },
        {
          q: 'Como vocês protegem meu cartão de crédito?',
          a: 'Não armazenamos dados do seu cartão. Todo pagamento é processado diretamente pelo Stripe (certificado PCI-DSS nível 1), líder mundial em segurança de pagamentos.'
        },
        {
          q: 'O que é a LGPD e como vocês se adequam?',
          a: 'A LGPD (Lei Geral de Proteção de Dados) regula uso de dados pessoais no Brasil. Coletamos apenas dados necessários, você pode solicitar acesso/exclusão a qualquer momento, e temos um DPO (Data Protection Officer) responsável.'
        },
        {
          q: 'Vocês compartilham meus dados com terceiros?',
          a: 'Apenas com parceiros essenciais: Stripe (pagamento), Melhor Envio (logística), Focus NFe (nota fiscal) e Google Analytics (métricas anônimas). Nunca vendemos dados.'
        },
        {
          q: 'Como exercer meus direitos LGPD?',
          a: 'Acesse "Configurações" → "Privacidade" ou envie e-mail para privacidade@pariscoparfums.com.br. Respondemos em até 15 dias. Você pode: acessar, corrigir, excluir ou portar seus dados.'
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      searchTerm === '' || 
      q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <>
      <SEO 
        title="Perguntas Frequentes (FAQ)"
        description="Tire suas dúvidas sobre assinaturas, entregas, pagamentos, trocas e muito mais. Central de ajuda Paris & Co Parfums."
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Encontre respostas rápidas para as dúvidas mais comuns sobre nossos produtos e serviços.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <Input
                type="text"
                placeholder="Buscar pergunta... (ex: 'prazo de entrega', 'cancelar assinatura')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-base"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-8">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <section key={category.id} className="bg-card rounded-lg border p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Icon className="h-7 w-7 text-primary" />
                    <h2 className="text-2xl font-display font-semibold text-card-foreground">
                      {category.title}
                    </h2>
                  </div>

                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((item, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category.id}-${index}`}
                        className="border rounded-lg px-4 bg-background/50"
                      >
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="font-display font-medium text-foreground pr-4">
                            {item.q}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4 pt-2">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>

          {/* No Results */}
          {searchTerm && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                Nenhuma pergunta encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                Tente buscar com outras palavras-chave
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-primary hover:underline font-display"
              >
                Limpar busca
              </button>
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-12 bg-primary/5 rounded-lg p-8 border border-primary/20 text-center">
            <h3 className="text-2xl font-display font-semibold text-foreground mb-3">
              Não encontrou sua resposta?
            </h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar! Entre em contato através dos canais abaixo:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sac"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-display font-medium"
              >
                Falar com o SAC
              </Link>
              <a
                href="mailto:suporte@pariscoparfums.com.br"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-display font-medium"
              >
                Enviar E-mail
              </a>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-col sm:flex-row gap-4 justify-between text-center sm:text-left">
              <Link 
                to="/" 
                className="text-primary hover:underline font-display"
              >
                ← Voltar ao início
              </Link>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                  Termos de Uso
                </Link>
                <Link 
                  to="/troca-devolucao" 
                  className="text-primary hover:underline font-display"
                >
                  Trocas & Devoluções
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
