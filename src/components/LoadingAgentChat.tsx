import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface LoadingAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockAgentResponses = [
  "Olá! Sou o agente especializado em carregamento. Como posso ajudar você hoje?",
  "Analisando os dados do último carregamento... Detectei um desvio de 2.3kg no Vagão 1. Quer que eu investigue?",
  "O consumo de milho está 5% acima do previsto hoje. Isso pode estar relacionado à umidade do ingrediente.",
  "Recomendo verificar a calibração da balança do Vagão 2. Há inconsistências nos últimos 3 carregamentos.",
  "A eficiência média do turno da manhã foi de 94.2%. Dentro dos parâmetros aceitáveis.",
  "Identifiquei que o ingrediente 'Farelo de Trigo' teve variação maior que o esperado. Precisa de ajuste na formulação?",
  "Os dados mostram que o Vagão 3 tem performance 8% melhor que os demais. Quer saber os detalhes?",
  "Baseado no histórico, sugiro aumentar o tempo de mistura em 30 segundos para melhorar a homogeneidade."
];

export function LoadingAgentChat({ isOpen, onClose }: LoadingAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Mensagem inicial do agente
      setTimeout(() => {
        addAgentMessage(mockAgentResponses[0]);
      }, 500);
    }
  }, [isOpen]);

  const addAgentMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'agent',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateAgentResponse = () => {
    setIsTyping(true);
    const responseDelay = Math.random() * 2000 + 1000; // 1-3 segundos
    
    setTimeout(() => {
      const randomResponse = mockAgentResponses[Math.floor(Math.random() * mockAgentResponses.length)];
      addAgentMessage(randomResponse);
    }, responseDelay);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addUserMessage(inputValue);
    setInputValue('');
    simulateAgentResponse();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col bg-card border-border">
        <CardHeader className="flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Agente de Carregamento</CardTitle>
                <p className="text-sm text-muted-foreground">Online • Especialista em Desvios</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className="flex items-start space-x-2 max-w-[80%]">
                    {message.sender === 'agent' && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        message.sender === 'user'
                          ? "bg-primary text-white"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {message.text}
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-3 w-3 text-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}