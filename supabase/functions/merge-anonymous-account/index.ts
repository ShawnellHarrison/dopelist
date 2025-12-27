import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { anonymousUserId, authenticatedUserId } = await req.json();

    if (!anonymousUserId || !authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (user.id !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('posts').update({ user_id: authenticatedUserId }).eq('user_id', anonymousUserId);

    await supabase.from('comments').update({ user_id: authenticatedUserId }).eq('user_id', anonymousUserId);

    await supabase.from('post_votes').update({ user_id: authenticatedUserId }).eq('user_id', anonymousUserId);

    await supabase.from('post_reactions').update({ user_id: authenticatedUserId }).eq('user_id', anonymousUserId);

    const { data: stripeCustomer } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', anonymousUserId)
      .maybeSingle();

    if (stripeCustomer) {
      const { data: existingCustomer } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', authenticatedUserId)
        .maybeSingle();

      if (!existingCustomer) {
        await supabase
          .from('stripe_customers')
          .update({ user_id: authenticatedUserId })
          .eq('user_id', anonymousUserId);
      } else {
        await supabase
          .from('stripe_customers')
          .delete()
          .eq('user_id', anonymousUserId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account merged successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error merging accounts:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to merge accounts', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
