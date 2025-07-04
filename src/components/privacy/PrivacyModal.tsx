import { Shield, Eye, Trash2, Clock, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

export default function PrivacyModal({
  isOpen,
  onClose,
  onAccept,
  onReject,
  isProcessing
}: PrivacyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-blue-600" />
            Política de Privacidade - Chat de Curadoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Resumo Executivo
            </h3>
            <p className="text-blue-800 text-sm">
              Coletamos apenas as informações necessárias para personalizar suas recomendações de perfumes. 
              Seus dados são protegidos e você mantém controle total sobre eles.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Dados Coletados</h4>
                <p className="text-sm text-gray-600">
                  • Suas respostas sobre preferências olfativas<br/>
                  • Perfumes que você curtiu ou não curtiu<br/>
                  • Ocasiões de uso mencionadas<br/>
                  • Histórico de interações no chat
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Como Usamos</h4>
                <p className="text-sm text-gray-600">
                  • Gerar recomendações personalizadas de perfumes<br/>
                  • Melhorar nosso algoritmo de curadoria<br/>
                  • Entender suas preferências ao longo do tempo<br/>
                  • Sugerir fragrâncias compatíveis com seu perfil
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Proteção dos Dados</h4>
                <p className="text-sm text-gray-600">
                  • Dados criptografados em trânsito e em repouso<br/>
                  • Acesso restrito apenas a sistemas de IA<br/>
                  • Não compartilhamos com terceiros<br/>
                  • Conformidade com LGPD/GDPR
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Retenção e Controle</h4>
                <p className="text-sm text-gray-600">
                  • Dados mantidos por até 2 anos para melhorar recomendações<br/>
                  • Você pode solicitar exclusão a qualquer momento<br/>
                  • Logs de acesso mantidos por 90 dias<br/>
                  • Consentimento pode ser revogado quando desejar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Seus Direitos (LGPD)</h4>
                <p className="text-sm text-gray-600">
                  • Acessar seus dados pessoais<br/>
                  • Corrigir informações incorretas<br/>
                  • Solicitar exclusão completa<br/>
                  • Portabilidade dos dados<br/>
                  • Revogar consentimento
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Importante</h4>
            <p className="text-sm text-gray-600">
              Se você não aceitar, ainda poderá usar nosso catálogo, mas as recomendações serão genéricas. 
              Você pode alterar sua decisão nas configurações da sua conta a qualquer momento.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            onClick={onReject}
            variant="outline"
            disabled={isProcessing}
          >
            Recusar
          </Button>
          <Button
            onClick={onAccept}
            disabled={isProcessing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isProcessing ? 'Processando...' : 'Aceitar e Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}