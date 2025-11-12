import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-3 bg-card/50 rounded-lg max-w-xs">
    <Bot className="w-4 h-4 text-primary" />
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
    <span className="text-sm text-muted-foreground">AI is typing...</span>
  </div>
);

const ChatMessage = ({ message }: { message: Message }) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
      message.role === 'user'
        ? 'bg-primary text-primary-foreground ml-8'
        : 'bg-card/50 text-foreground mr-8 border border-border/50'
    }`}>
      {message.role === 'assistant' && (
        <div className="flex items-center space-x-2 mb-1">
          <Bot className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-primary">AI Assistant</span>
        </div>
      )}
      <p className="text-sm leading-relaxed">{message.content}</p>
      <p className="text-xs opacity-70 mt-1">
        {new Date(message.created_at).toLocaleTimeString()}
      </p>
    </div>
  </div>
);

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        // Clear chat when user logs out
        setMessages([]);
        setConversationId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Load conversation history when opening chat
    if (isOpen && user && !conversationId) {
      loadRecentConversation();
    }
  }, [isOpen, user]);

  const loadRecentConversation = async () => {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (conversations && conversations.length > 0) {
        const recentConvId = conversations[0].id;
        setConversationId(recentConvId);
        loadMessages(recentConvId);
      }
    } catch (error) {
      console.error('Error loading recent conversation:', error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data: messageData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (messageData) {
        // Type cast the role field to ensure proper typing
        const typedMessages: Message[] = messageData.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          created_at: msg.created_at
        }));
        setMessages(typedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the chatbot",
        variant: "destructive",
      });
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          message: userMessage,
          conversationId: conversationId 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Set conversation ID if it's a new conversation
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      
      // Remove the temporary user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-20 left-4 w-80 h-96 z-50 shadow-2xl border border-primary/20 bg-card/95 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary/10">
            <CardTitle className="flex items-center space-x-2 text-sm font-semibold">
              <Bot className="w-5 h-5 text-primary" />
              <span>Chat with us 🤖</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="h-6 w-6 p-0 hover:bg-primary/10"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0 flex flex-col h-full">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 max-h-64">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-2">
                    <Bot className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Hi! I'm here to help with any questions about Donut Grocery.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && <TypingIndicator />}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={user ? "Type your message..." : "Sign in to chat"}
                  className="flex-1 text-sm"
                  disabled={!user || isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading || !user}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {!user && (
                <p className="text-xs text-muted-foreground mt-2">
                  Please sign in to start chatting
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Float Button */}
      <Button
        onClick={handleToggle}
        className={`fixed bottom-4 left-4 z-50 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 ${
          isOpen ? 'scale-90' : 'scale-100 hover:scale-105'
        }`}
        size="lg"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </Button>
    </>
  );
};