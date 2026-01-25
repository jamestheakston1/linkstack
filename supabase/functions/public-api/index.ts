import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()
  const handle = url.searchParams.get('handle')?.toLowerCase()

  if (!handle) {
    return new Response(JSON.stringify({ error: 'Handle required' }), { status: 400, headers: corsHeaders })
  }

  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('handle', handle).single()
    if (!profile) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders })

    let resultData;

    switch (path) {
      case 'verified':
        resultData = { is_verified: profile.is_verified };
        break;
      case 'theme':
        resultData = { theme_id: profile.theme_id };
        break;
      case 'profilepicture':
        resultData = { avatar_url: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.handle}` };
        break;
      default:
        resultData = profile;
    }

    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: corsHeaders })
  }
})
