import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePrivacyConsent } from '@/hooks/usePrivacyConsent';
import PrivacyModal from './PrivacyModal';

interface ConsentBannerProps {
  onAccept?: () => void;
  onReject?: () => void;
}

export default function ConsentBanner({ onAccept, onReject }: ConsentBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { acceptConsent, rejectConsent, isRecording } = usePrivacyConsent('PRIVACY_CHAT');

  const handleAccept = async () => {
    try {
      await acceptConsent();
      setIsVisible(false);
      onAccept?.();
    } catch (error) {
      console.error('Error accepting consent:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectConsent();
      setIsVisible(false);
      onReject?.();
    } catch (error) {
      console.error('Error rejecting consent:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
        <Card className="mx-auto max-w-4xl bg-white/95 backdrop-blur-lg border border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Privacidade e Consentimento:</strong> Usamos suas respostas do chat apenas para fornecer recomendações personalizadas de perfumes. Seus dados são processados de forma segura e não são compartilhados com terceiros.
                </p>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={handleAccept}
                    disabled={isRecording}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    {isRecording ? 'Processando...' : 'Aceitar'}
                  </Button>
                  
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    Saiba Mais
                  </Button>
                  
                  <Button
                    onClick={handleReject}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Recusar
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PrivacyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccept={handleAccept}
        onReject={handleReject}
        isProcessing={isRecording}
      />
    </>
  );
}