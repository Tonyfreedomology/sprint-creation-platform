import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrollUserRequest {
  sprintId: string;
  userToken?: string; // Optional - if provided, we'll look up existing enrollment
}

interface EnrollUserResponse {
  userToken: string;
  startedAt: string;
  currentDay: number;
  maxUnlockedDay: number;
  portalUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sprintId, userToken }: EnrollUserRequest = await req.json();

    let userProgress;

    if (userToken) {
      // Look up existing enrollment
      const { data: existingProgress, error: fetchError } = await supabase
        .from('sprint_user_progress')
        .select('*')
        .eq('sprint_id', sprintId)
        .eq('user_token', userToken)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to fetch user progress: ${fetchError.message}`);
      }

      userProgress = existingProgress;
    }

    if (!userProgress) {
      // Create new enrollment
      const newToken = crypto.randomUUID();
      
      const { data: newProgress, error: insertError } = await supabase
        .from('sprint_user_progress')
        .insert({
          sprint_id: sprintId,
          user_token: newToken,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create user progress: ${insertError.message}`);
      }

      userProgress = newProgress;
    }

    // Calculate current progress
    const startedAt = new Date(userProgress.started_at);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = daysSinceStart + 1;

    // Get sprint info to determine max days
    const { data: sprint, error: sprintError } = await supabase
      .from('sprints')
      .select('duration, portal_url')
      .eq('sprint_id', sprintId)
      .single();

    if (sprintError) {
      throw new Error(`Failed to fetch sprint: ${sprintError.message}`);
    }

    const maxUnlockedDay = Math.min(currentDay, sprint.duration);
    const portalUrl = `${sprint.portal_url}?user=${userProgress.user_token}`;

    const response: EnrollUserResponse = {
      userToken: userProgress.user_token,
      startedAt: userProgress.started_at,
      currentDay,
      maxUnlockedDay,
      portalUrl
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in enroll-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);