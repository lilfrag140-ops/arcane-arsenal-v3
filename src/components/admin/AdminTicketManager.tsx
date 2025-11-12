import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { MessageCircle, Send, Clock, CheckCircle, XCircle } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  user_id: string;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  user_id?: string;
}

export const AdminTicketManager = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logTicketManagement } = useAdminAudit();

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      // Log admin viewing ticket
      logTicketManagement('view', selectedTicket.id, {
        title: selectedTicket.title,
        status: selectedTicket.status,
        priority: selectedTicket.priority
      });
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch tickets",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          message: newReply,
          is_admin_reply: true,
          admin_user_id: session.user.id,
        });

      if (error) throw error;

      // Log admin reply
      await logTicketManagement('reply', selectedTicket.id, {
        message_length: newReply.length,
        ticket_title: selectedTicket.title
      });

      setNewReply("");
      fetchMessages(selectedTicket.id);
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the user",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reply",
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const oldStatus = selectedTicket?.status || 'unknown';
      
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      // Log admin status update
      await logTicketManagement('status_update', ticketId, {
        old_status: oldStatus,
        new_status: status,
        ticket_title: selectedTicket?.title
      });

      setTickets(tickets => 
        tickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status } : ticket
        )
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }

      toast({
        title: "Status updated",
        description: `Ticket status changed to ${status}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket status",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800"><Clock className="w-3 h-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><MessageCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  if (loading) {
    return <div className="p-6">Loading tickets...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Support Ticket Management</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                All Tickets ({tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 p-4">
                  {tickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className={`cursor-pointer transition-colors border-l-4 ${getPriorityColor(ticket.priority)} ${
                        selectedTicket?.id === ticket.id ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          {getStatusBadge(ticket.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium text-sm mb-1 line-clamp-1">{ticket.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            By: User {ticket.user_id.slice(0, 8)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {ticket.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details & Messages */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedTicket.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ticket #{selectedTicket.id.slice(0, 8)} • Category: {selectedTicket.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-[400px]">
                {/* Messages */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {/* Original ticket */}
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          User {selectedTicket.user_id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedTicket.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{selectedTicket.description}</p>
                    </div>

                    {/* Message thread */}
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.is_admin_reply
                            ? 'bg-primary/10 ml-6'
                            : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">
                            {message.is_admin_reply 
                              ? 'Admin' 
                              : `User ${message.user_id?.slice(0, 8) || 'Unknown'}`
                            }
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                          {message.is_admin_reply && (
                            <Badge variant="outline" className="text-xs">Admin Reply</Badge>
                          )}
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="mb-4" />

                {/* Reply form */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your reply..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={sendReply}
                      disabled={!newReply.trim()}
                      className="btn-primary"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a ticket</h3>
                  <p className="text-muted-foreground">
                    Choose a ticket from the list to view details and respond
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};