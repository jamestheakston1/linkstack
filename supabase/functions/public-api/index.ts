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
  const handle = url.searchParams.get('handle')?.toLowerCase()

  if (!handle) {
    return new Response(JSON.stringify({ error: 'Handle required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*, links(*)')
    .eq('handle', handle)
    .single()

  return new Response(JSON.stringify(data || { error: 'Not found' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: data ? 200 : 404
  })
})
