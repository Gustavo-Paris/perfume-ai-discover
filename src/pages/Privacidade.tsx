import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield, Eye, UserCheck, Users, Lock } from 'lucide-react';
import SEO from '@/components/SEO';

const Privacidade = () => {
  useEffect(() => {
    document.title = 'Política de Privacidade | Paris & Co Parfums';
  }, []);

  return (
    <>
      <SEO 
        title="Política de Privacidade"
        description="Saiba como coletamos, usamos e protegemos seus dados pessoais de acordo com a LGPD"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground text-lg mb-4">
              Esta página explica <strong>quais dados coletamos</strong>, <strong>por que coletamos</strong> e{' '}
              <strong>quais são seus direitos</strong> conforme a LGPD (Lei 13.709/2018).
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Última atualização:</strong> 10 de outubro de 2025
              </p>
            </div>
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
              <li>• <strong>Dados cadastrais:</strong> Nome, CPF/CNPJ, data de nascimento, gênero</li>
              <li>• <strong>Dados de contato:</strong> E-mail, telefone, endereço completo</li>
              <li>• <strong>Dados de preferências:</strong> Questionário de fragrâncias, notas favoritas, ocasiões de uso</li>
              <li>• <strong>Dados transacionais:</strong> Histórico de compras, forma de pagamento (últimos 4 dígitos)</li>
              <li>• <strong>Dados de navegação:</strong> Endereço IP, cookies, páginas visitadas, tempo de navegação</li>
              <li>• <strong>Dados de segurança:</strong> Logs de acesso, autenticação em 2 fatores (se ativado)</li>
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
              <li>• <strong>Processar pedidos:</strong> Confirmação de pagamento, emissão de nota fiscal, envio de produtos</li>
              <li>• <strong>Personalizar experiência:</strong> Recomendações de perfumes baseadas em IA, ofertas relevantes</li>
              <li>• <strong>Comunicação:</strong> E-mails transacionais (pedido, entrega), marketing (com seu consentimento)</li>
              <li>• <strong>Segurança:</strong> Prevenir fraudes, proteger sua conta, cumprir obrigações legais</li>
              <li>• <strong>Melhorias:</strong> Análise de métricas para aprimorar nossos serviços (dados anonimizados)</li>
            </ul>
          </section>

          {/* Compartilhamento de Dados */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Users className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Compartilhamento de Dados
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>Compartilhamos seus dados apenas quando estritamente necessário:</p>
              <ul className="space-y-2">
                <li>• <strong>Stripe:</strong> Processamento seguro de pagamentos (PCI-DSS certificado)</li>
                <li>• <strong>Melhor Envio:</strong> Cálculo de frete e rastreamento de entregas</li>
                <li>• <strong>Focus NFe:</strong> Emissão de notas fiscais eletrônicas (obrigação legal)</li>
                <li>• <strong>Google Analytics:</strong> Métricas de uso (dados anonimizados)</li>
                <li>• <strong>Sentry:</strong> Monitoramento de erros técnicos (sem dados sensíveis)</li>
              </ul>
              <p className="text-sm text-muted-foreground italic">
                Nunca vendemos seus dados para terceiros. Todos os parceiros assinam contrato de confidencialidade.
              </p>
            </div>
          </section>

          {/* Direitos do titular */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <UserCheck className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Seus Direitos (LGPD)
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>Você tem direito a:</p>
              <ul className="space-y-2">
                <li>• <strong>Acesso:</strong> Obter cópia de todos os seus dados que temos</li>
                <li>• <strong>Retificação:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>• <strong>Exclusão:</strong> Solicitar a remoção permanente dos seus dados</li>
                <li>• <strong>Portabilidade:</strong> Receber seus dados em formato estruturado (CSV/JSON)</li>
                <li>• <strong>Revogação:</strong> Retirar consentimento para uso de dados (impacta serviços)</li>
                <li>• <strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
              </ul>
              <p className="mt-4">
                <strong>Como exercer:</strong> Acesse{' '}
                <Link to="/configuracoes" className="text-primary hover:underline">
                  Configurações → Privacidade e Dados
                </Link>{' '}
                ou envie e-mail para{' '}
                <a href="mailto:privacidade@pariscoparfums.com.br" className="text-primary hover:underline">
                  privacidade@pariscoparfums.com.br
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Prazo de resposta: até 15 dias úteis. Solicitações gratuitas (exceto portabilidade recorrente).
              </p>
            </div>
          </section>

          {/* Segurança */}
          <section className="bg-card rounded-lg p-6 border">
            <div className="flex items-start space-x-3 mb-4">
              <Lock className="h-6 w-6 text-primary mt-1" />
              <h2 className="text-2xl font-display font-semibold text-card-foreground">
                Segurança dos Dados
              </h2>
            </div>
            <div className="text-card-foreground ml-9 space-y-3">
              <p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <ul className="space-y-2">
                <li>• <strong>Criptografia:</strong> SSL/TLS em todas as páginas (HTTPS obrigatório)</li>
                <li>• <strong>Senhas:</strong> Hash bcrypt + verificação de vazamento (haveibeenpwned)</li>
                <li>• <strong>Autenticação:</strong> 2FA opcional para reforçar segurança da conta</li>
                <li>• <strong>Acesso restrito:</strong> Apenas colaboradores autorizados acessam dados sensíveis</li>
                <li>• <strong>Auditoria:</strong> Logs de acesso registrados e monitorados 24/7</li>
                <li>• <strong>Backup:</strong> Cópias diárias criptografadas com retenção de 30 dias</li>
              </ul>
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
            <div className="text-card-foreground ml-9 space-y-3">
              <p>
                Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nosso uso de cookies.
              </p>
              <p><strong>Tipos de cookies:</strong></p>
              <ul className="space-y-2">
                <li>• <strong>Essenciais:</strong> Necessários para funcionamento do site (login, carrinho)</li>
                <li>• <strong>Analíticos:</strong> Google Analytics para entender uso do site (anonimizado)</li>
                <li>• <strong>Marketing:</strong> Remarketing e personalização (requer consentimento)</li>
              </ul>
              <p>
                Você pode desativar cookies nas configurações do navegador, mas isso pode impactar funcionalidades.
              </p>
            </div>
          </section>

          {/* DPO Contact */}
          <section className="bg-primary/5 rounded-lg p-6 border border-primary/20">
            <h3 className="text-lg font-display font-semibold text-foreground mb-3">
              Encarregado de Proteção de Dados (DPO)
            </h3>
            <p className="text-card-foreground mb-4">
              Para exercer seus direitos ou tirar dúvidas sobre tratamento de dados pessoais:
            </p>
            <div className="space-y-2 text-card-foreground">
              <p>📧 E-mail: <a href="mailto:privacidade@pariscoparfums.com.br" className="text-primary hover:underline">privacidade@pariscoparfums.com.br</a></p>
              <p>📱 Telefone: (49) 99972-3818</p>
              <p>📍 Endereço: Rua Augusta, 123 - São Paulo/SP, 01234-567</p>
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
                to="/termos-uso" 
                className="text-primary hover:underline font-display"
              >
                Ver Termos de Uso
              </Link>
              <Link 
                to="/troca-devolucao" 
                className="text-primary hover:underline font-display"
              >
                Ver Trocas & Devoluções →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Privacidade;