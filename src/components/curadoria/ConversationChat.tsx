
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, RotateCcw, Star, Zap } from 'lucide-react';
import { ConversationMessage } from '@/types/conversation';

interface ConversationChatProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  onReset: () => void;
  loading: boolean;
  isComplete: boolean;
}

const ConversationChat = ({ 
  messages, 
  onSendMessage, 
  onReset, 
  loading, 
  isComplete 
}: ConversationChatProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll suave apenas quando há nova mensagem, não no carregamento inicial
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (inputMessage.trim() && !loading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[650px]">
      <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
        <div className="space-y-6 py-6">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="ai-glow w-16 h-16 rounded-full bg-gradient-gold-elegant flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h3 className="font-cormorant text-3xl font-semibold mb-4 text-luxury-800">
                Bem-vindo à Curadoria Inteligente
              </h3>
              <p className="text-luxury-600 text-lg mb-6 max-w-md mx-auto font-montserrat">
                Digite "Olá" para começar sua jornada personalizada de descoberta de fragrâncias
              </p>
              <div className="glass-luxury rounded-2xl p-4 border border-luxury-300/40 max-w-sm mx-auto">
                <div className="tech-status justify-center text-luxury-600 font-montserrat">
                  <span className="text-sm">Sistema pronto para interação</span>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className={`max-w-[85%] chat-hover-smooth ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-gold-100/95 to-gold-50/80 border-gold-300/40 backdrop-blur-sm' 
                  : 'luxury-card border-luxury-300/40 bg-white/98'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' ? (
                      <div className="ai-glow w-8 h-8 rounded-full bg-gradient-gold-elegant flex items-center justify-center flex-shrink-0 mt-1">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-luxury-600 to-luxury-700 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm font-bold font-montserrat">U</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`leading-relaxed whitespace-pre-wrap font-montserrat ${
                        message.role === 'user' ? 'text-luxury-800' : 'text-luxury-700'
                      }`}>
                        {message.content}
                      </p>
                      <div className="flex items-center space-x-2 mt-3">
                        <span className={`text-xs font-montserrat ${
                          message.role === 'user' ? 'text-gold-600' : 'text-luxury-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {message.role === 'assistant' && (
                          <div className="tech-status">
                            <span className="text-xs text-tech-green font-montserrat">IA</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <Card className="luxury-card border-luxury-300/40 bg-luxury-50/90">
                <CardContent className="p-5">
                  <div className="flex items-center space-x-3">
                    <div className="ai-glow w-8 h-8 rounded-full bg-gradient-gold-elegant flex items-center justify-center">
                      <Star className="h-4 w-4 text-white animate-pulse" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-luxury-600 text-sm font-montserrat">Processando</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-tech-blue rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-tech-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-tech-pink rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-luxury-200/40 bg-gradient-to-r from-white/98 to-luxury-50/98 backdrop-blur-sm p-6 space-y-4">
        {!isComplete && (
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={loading}
                className="bg-white/90 border-luxury-300/40 text-luxury-700 placeholder-luxury-400 focus:border-gold-400/50 focus:ring-gold-400/20 pr-12 font-montserrat"
              />
              {inputMessage && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-tech-green rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading}
              className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white border-0 transition-all duration-300 hover:scale-105 font-montserrat"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full glass-luxury text-luxury-600 border-luxury-300/40 hover:border-red-400/50 hover:bg-red-50/20 transition-all duration-300 font-montserrat"
          disabled={loading}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar Curadoria
        </Button>
      </div>
    </div>
  );
};

export default ConversationChat;
