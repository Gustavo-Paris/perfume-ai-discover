import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Star, ThumbsUp, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupportChat } from '@/hooks/useSupportChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { sanitizeInput } from '@/utils/securityEnhancements';

export function SupportChat() {
  const { user } = useAuth();
  const {
    isOpen,
    setIsOpen,
    conversation,
    messages,
    isLoading,
    startConversation,
    sendMessage,
    closeConversation
  } = useSupportChat();

  const [newMessage, setNewMessage] = useState('');
  const [showStartForm, setShowStartForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Sanitizar mensagem antes de enviar
    const sanitizedMessage = sanitizeInput(newMessage.trim());
    await sendMessage(sanitizedMessage);
    setNewMessage('');
  };

  const handleStartChat = async () => {
    // Sanitizar subject antes de iniciar conversa
    const sanitizedSubject = subject ? sanitizeInput(subject) : undefined;
    await startConversation(sanitizedSubject, category || undefined);
    setShowStartForm(false);
    setSubject('');
    setCategory('');
  };

  const handleCloseChat = () => {
    if (conversation) {
      setShowRating(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSubmitRating = async () => {
    // Sanitizar feedback antes de enviar
    const sanitizedFeedback = feedback ? sanitizeInput(feedback) : '';
    await closeConversation(rating, sanitizedFeedback);
    setShowRating(false);
    setRating(5);
    setFeedback('');
  };

  const openChat = () => {
    if (conversation) {
      setIsOpen(true);
    } else {
      setShowStartForm(true);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={openChat}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Start Chat Dialog */}
      <Dialog open={showStartForm} onOpenChange={setShowStartForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Chat de Suporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assunto (opcional)</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Descreva brevemente sua dúvida"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pedidos">Pedidos</SelectItem>
                  <SelectItem value="produtos">Produtos</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                  <SelectItem value="devolucao">Troca/Devolução</SelectItem>
                  <SelectItem value="tecnico">Suporte Técnico</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStartChat} disabled={isLoading} className="flex-1">
                Iniciar Chat
              </Button>
              <Button variant="outline" onClick={() => setShowStartForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-96 shadow-xl z-40 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Suporte</CardTitle>
              <div className="flex items-center gap-2">
                {conversation && (
                  <Badge variant="secondary" className="text-xs">
                    {conversation.status === 'open' ? 'Aguardando' :
                     conversation.status === 'in_progress' ? 'Em andamento' :
                     'Finalizado'}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" onClick={handleCloseChat} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground">
                Faça login para um atendimento mais personalizado
              </p>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-2 rounded-lg text-sm",
                      message.sender_type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.sender_type === 'system'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.message}
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {conversation && conversation.status !== 'closed' && (
              <form onSubmit={handleSendMessage} className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avalie nosso atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Como foi nosso atendimento?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="icon"
                    onClick={() => setRating(star)}
                    className={cn(
                      "h-8 w-8",
                      star <= rating ? "text-yellow-500" : "text-muted-foreground"
                    )}
                  >
                    <Star className="h-4 w-4" fill={star <= rating ? "currentColor" : "none"} />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Comentários (opcional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Deixe seu comentário sobre o atendimento"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitRating} className="flex-1">
                Enviar Avaliação
              </Button>
              <Button variant="outline" onClick={() => setShowRating(false)}>
                Pular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}