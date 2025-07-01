
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, RotateCcw } from 'lucide-react';
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
      <div className="flex items-center space-x-3 p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-400/10 via-purple-500/10 to-pink-500/10">
        <Sparkles className="h-5 w-5 text-brand-gradient" />
        <h3 className="font-display text-lg font-semibold text-brand-gradient">Curadoria IA</h3>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-6 py-6">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-brand-gradient" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-4 text-brand-gradient">
                Bem-vindo à Curadoria Inteligente
              </h3>
              <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
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
                    <span className="text-xs text-brand-gradient">IA</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="chat-ai">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Processando</span>
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

      <div className="border-t border-gray-200/50 bg-gradient-to-r from-blue-400/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm p-6 space-y-4">
        {!isComplete && (
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 rounded-xl"
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
