
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Send, RotateCcw, Brain, Zap } from 'lucide-react';
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="ai-glow w-16 h-16 rounded-full bg-gradient-to-r from-tech-500 to-gold-500 flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h3 className="font-playfair text-2xl font-semibold mb-4 text-white">
              Inicializar Sistema Neural
            </h3>
            <p className="text-tech-300 text-lg mb-6 max-w-md mx-auto">
              Digite "Olá" para começar a análise comportamental de fragrâncias
            </p>
            <div className="bg-tech-900/30 backdrop-blur-sm rounded-lg p-4 border border-tech-800/50 max-w-sm mx-auto">
              <div className="flex items-center justify-center space-x-2 text-tech-400">
                <Zap className="h-4 w-4" />
                <span className="text-sm">IA pronta para interação</span>
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
            <Card className={`max-w-[85%] transition-all duration-300 hover:scale-[1.02] ${
              message.role === 'user' 
                ? 'bg-gradient-to-br from-gold-900/80 to-gold-800/60 border-gold-600/50 backdrop-blur-sm' 
                : 'tech-card border-tech-700/50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {message.role === 'assistant' ? (
                    <div className="ai-glow w-8 h-8 rounded-full bg-gradient-to-r from-tech-500 to-gold-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">U</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`leading-relaxed whitespace-pre-wrap ${
                      message.role === 'user' ? 'text-gold-100' : 'text-white'
                    }`}>
                      {message.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`text-xs ${
                        message.role === 'user' ? 'text-gold-300' : 'text-tech-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Neural</span>
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
            <Card className="tech-card border-tech-600/50 bg-tech-900/60">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="ai-glow w-8 h-8 rounded-full bg-gradient-to-r from-tech-500 to-gold-500 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-tech-300 text-sm">Processando</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-tech-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-tech-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-tech-800/50 bg-gradient-to-r from-tech-950/90 to-tech-900/90 backdrop-blur-sm p-6 space-y-4">
        {!isComplete && (
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem para a IA..."
                disabled={loading}
                className="bg-tech-900/50 border-tech-700/50 text-white placeholder-tech-400 focus:border-gold-500/50 focus:ring-gold-500/20 pr-12"
              />
              {inputMessage && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputMessage.trim() || loading}
              className="bg-gradient-to-r from-tech-600 to-gold-600 hover:from-tech-500 hover:to-gold-500 text-white border-0 transition-all duration-300 hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full glass-dark text-white border-tech-700/50 hover:border-red-500/50 hover:bg-red-950/20 transition-all duration-300"
          disabled={loading}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reinicializar Sistema Neural
        </Button>
      </div>
    </div>
  );
};

export default ConversationChat;
