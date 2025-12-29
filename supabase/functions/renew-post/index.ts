import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { postId, sessionId } = await req.json();

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post not found or unauthorized' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: existingRenewal } = await supabase
      .from('posts')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .neq('id', postId)
      .maybeSingle();

    if (existingRenewal) {
      return new Response(
        JSON.stringify({ error: 'Payment session already used' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let paymentIntentId = sessionId;

    if (stripeSecretKey && !sessionId.startsWith('demo_')) {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return new Response(
          JSON.stringify({ error: 'Payment not completed' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      paymentIntentId = session.payment_intent as string;
    }

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        expires_at: newExpiresAt.toISOString(),
        is_active: true,
        stripe_session_id: sessionId,
        stripe_payment_id: paymentIntentId,
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      const errorMessage = updateError.code === '23505'
        ? 'Payment session already used'
        : updateError.message;

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: updateError.code === '23505' ? 400 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ post: updatedPost }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});