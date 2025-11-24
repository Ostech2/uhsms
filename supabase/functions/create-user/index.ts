import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the JWT from authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create client with anon key to verify caller
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify caller is authenticated and is admin
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if user is admin using RLS-protected query
    const { data: roles, error: roleError } = await supabaseAnon
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roles) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Now create service role client for user creation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, full_name, role, assigned_hostel } = await req.json()

    // Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) throw authError

    // Update user_profile with the auth user id
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .update({ id: authData.user.id })
      .eq('email', email)

    if (profileError) throw profileError

    // Convert role format for database enum (hyphens to underscores)
    const roleForEnum = role.replace('-', '_')

    // Insert role into user_roles table
    const { error: roleInsertError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: roleForEnum
      })

    if (roleInsertError) throw roleInsertError

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})