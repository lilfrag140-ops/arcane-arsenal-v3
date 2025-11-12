import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    console.log("Discord Webhook URL configured:", discordWebhookUrl ? "YES" : "NO");
    
    if (!discordWebhookUrl) {
      return new Response(JSON.stringify({ 
        error: "DISCORD_WEBHOOK_URL not configured",
        success: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Test Discord webhook
    const testEmbed = {
      title: "🧪 Test Discord Notification",
      color: 0x0099ff,
      fields: [
        {
          name: "Status",
          value: "Discord webhook is working!",
          inline: false
        },
        {
          name: "Test Time",
          value: new Date().toISOString(),
          inline: false
        }
      ],
      footer: {
        text: "DonutGroceries Test"
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [testEmbed],
        content: "🧪 **Discord Webhook Test**"
      }),
    });

    console.log("Discord response status:", response.status);
    const responseText = await response.text();
    console.log("Discord response:", responseText);

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} - ${responseText}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Discord webhook test successful!",
      discordStatus: response.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Test Discord webhook error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});