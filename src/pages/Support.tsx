import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ExternalLink, HeadphonesIcon, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

interface UserProfile {
  discord_username: string;
  discord_avatar_url: string;
}

const Support = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      } else {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate('/auth');
        } else if (session) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('discord_username, discord_avatar_url')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleCreateTicket = () => {
    // Replace with your actual Discord ticket creation channel URL
    window.open('https://discord.com/channels/1401042603708780664/1401175161151033474', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-md mx-auto">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="gradient-text">Support Center</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Please sign in with Discord to access our support system.
                </p>
                <Button className="btn-primary w-full" onClick={() => navigate('/auth')}>
                  Sign In with Discord
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-primary/10 border border-primary/20 rounded-full px-6 py-3 mb-6">
            <HeadphonesIcon className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">24/7 Support Available</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            <span className="gradient-text">Welcome, {userProfile.discord_username}!</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Need help with your order or have questions? Our Discord community and support team are here to assist you.
          </p>
        </div>

        {/* Support Options */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Primary Support Card */}
          <Card className="card-modern border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-2xl mb-2">Create a Support Ticket</CardTitle>
              <p className="text-muted-foreground">
                Get direct help from our support team in Discord
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={handleCreateTicket}
                className="btn-primary w-full text-lg py-6 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                size="lg"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Create a Ticket in Discord
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Community Support Card */}
          <Card className="card-modern hover:bg-muted/5 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.3)]">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-2xl mb-2">Community Support</CardTitle>
              <p className="text-muted-foreground">
                Join our Discord community for general help and discussions
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                variant="outline"
                onClick={() => window.open('https://discord.com/invite/donutgroceries', '_blank')}
                className="w-full text-lg py-6 font-semibold neon-border hover:bg-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                size="lg"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
                Join Discord Community
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Info */}
        <div className="max-w-3xl mx-auto">
          <Card className="card-modern bg-muted/20">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <Clock className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-semibold">Response Time</h3>
                  <p className="text-sm text-muted-foreground">Usually within 1-2 hours</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <HeadphonesIcon className="w-8 h-8 text-secondary mb-2" />
                  <h3 className="font-semibold">Available 24/7</h3>
                  <p className="text-sm text-muted-foreground">Round-the-clock support</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-accent mb-2" />
                  <h3 className="font-semibold">Expert Help</h3>
                  <p className="text-sm text-muted-foreground">Knowledgeable support team</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Need immediate assistance? Join our Discord server and create a ticket for the fastest support experience.
          </p>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default Support;
