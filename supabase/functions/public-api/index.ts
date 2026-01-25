import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()
  let handle = url.searchParams.get('handle')?.toLowerCase()

  if (handle && handle.startsWith('@')) {
    handle = handle.substring(1);
  }

  if (!handle) {
    return new Response(JSON.stringify({ error: 'Handle required' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    let result;

    switch (path) {
      case 'verified':
        result = { is_verified: profile.is_verified };
        break;
      case 'theme':
        result = { theme_id: profile.theme_id || 'default' };
        break;
      case 'profilepicture':
        result = { avatar_url: profile.avatar_url };
        break;
      case 'socials':
        result = profile.socials || {};
        break;
      case 'links':
        const { data: links } = await supabase
          .from('links')
          .select('*')
          .eq('profile_id', profile.id);
        result = links || [];
        break;
      default:
        const { data: fullLinks } = await supabase
          .from('links')
          .select('*')
          .eq('profile_id', profile.id);
        result = { ...profile, links: fullLinks || [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
