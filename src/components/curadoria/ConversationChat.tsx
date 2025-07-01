
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cpu, Send, RotateCcw } from 'lucide-react';
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 p-6 border-b border-gold/10 bg-navy/70">
        <Cpu className="h-5 w-5 text-gold/80" />
        <h3 className="font-display text-lg font-semibold text-gold">Curadoria IA</h3>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-6 py-6">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
                <Cpu className="h-8 w-8 text-gold/80" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-4 text-gold">
                Bem-vindo à Curadoria Inteligente
              </h3>
              <p className="text-white/80 text-lg mb-6 max-w-md mx-auto">
                Digite "Olá" para começar sua jornada personalizada de descoberta de fragrâncias
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`max-w-[85%] ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-2xl px-4 py-3' 
                  : 'chat-ai'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {message.role === 'assistant' && (
                    <span className="text-xs text-gold/70">IA</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="chat-ai">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-white/70">Processando</span>
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-gold/10 bg-navy/50 backdrop-blur-sm p-6 space-y-4">
        {!isComplete && (
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="bg-navy/50 border-gold/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-gold/30 focus:border-gold/40 focus:placeholder:text-white/40 rounded-xl"
            />
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading}
              className="btn-primary hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full btn-secondary"
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
