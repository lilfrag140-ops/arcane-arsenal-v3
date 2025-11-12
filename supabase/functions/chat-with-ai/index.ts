import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from request headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Processing chat request for user:', user.id);

    let currentConversationId = conversationId;

    // Create new conversation if none provided
    if (!currentConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Failed to create conversation');
      }

      currentConversationId = newConv.id;
      console.log('Created new conversation:', currentConversationId);
    }

    // Save user message to database
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      throw new Error('Failed to save user message');
    }

    // Get conversation history for context
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching message history:', historyError);
      throw new Error('Failed to fetch conversation history');
    }

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for Donut Groceries, a premium Minecraft marketplace on DonutSMP. Keep responses short (1-2 sentences max).

PRODUCTS WE SELL:
- In-game money/currency for DonutSMP
- Skeleton spawners and other mob spawners
- Diamond and Netherite armor sets
- Elytra wings
- Other rare Minecraft items and blocks

PAYMENT METHODS:
- PayPal Friends & Family ONLY (no goods & services payments accepted)
- Cryptocurrency (Bitcoin, Ethereum, etc.)
- We DO NOT accept: Venmo, CashApp, regular PayPal payments

IMPORTANT POLICIES:
- NO REFUNDS - All sales are final once payment is received
- PayPal payments MUST be sent as Friends & Family, not goods & services
- Non-F&F PayPal payments will be refunded minus fees
- Items delivered instantly to your Minecraft username on DonutSMP after payment confirmation
- Join discord.gg/donutgroceries for support and updates

Be helpful with product questions, order status, and payment instructions while keeping responses brief and friendly.`
      },
      ...messageHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: messages,
        max_completion_tokens: 150, // Limit response length
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Received AI response:', aiResponse);

    // Save AI response to database
    const { error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse
      });

    if (aiMsgError) {
      console.error('Error saving AI message:', aiMsgError);
      throw new Error('Failed to save AI response');
    }

    return new Response(JSON.stringify({ 
      message: aiResponse,
      conversationId: currentConversationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});