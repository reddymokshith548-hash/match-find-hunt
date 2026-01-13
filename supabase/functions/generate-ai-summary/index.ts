import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TraitData {
  thinking_style: string;
  leadership_style: string;
  risk_tolerance: string;
}

interface GenerateSummaryRequest {
  viewer_user_id: string;
  candidate_profile_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { viewer_user_id, candidate_profile_id }: GenerateSummaryRequest = await req.json();
    
    if (!viewer_user_id || !candidate_profile_id) {
      return new Response(JSON.stringify({ error: 'viewer_user_id and candidate_profile_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a cache key for this pair
    const cacheKey = `ai_summary_${viewer_user_id}_${candidate_profile_id}`;
    
    // Check for cached summary in matches table
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('ai_summary_user1, ai_summary_user2, user1_id, user2_id')
      .or(`and(user1_id.eq.${viewer_user_id},user2_id.eq.${candidate_profile_id}),and(user1_id.eq.${candidate_profile_id},user2_id.eq.${viewer_user_id})`)
      .maybeSingle();

    // Return cached summary if exists
    if (existingMatch) {
      const isUser1 = existingMatch.user1_id === viewer_user_id;
      const cachedSummary = isUser1 ? existingMatch.ai_summary_user1 : existingMatch.ai_summary_user2;
      if (cachedSummary) {
        console.log('Returning cached AI summary');
        return new Response(JSON.stringify({ 
          success: true, 
          ai_summary: cachedSummary,
          cached: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Generating new AI summary for viewer ${viewer_user_id} and candidate ${candidate_profile_id}`);

    // Fetch viewer profile
    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', viewer_user_id)
      .single();

    // Fetch candidate profile
    const { data: candidateProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', candidate_profile_id)
      .single();

    if (!viewerProfile || !candidateProfile) {
      return new Response(JSON.stringify({ error: 'Profiles not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch FounderSync traits for both
    const { data: viewerFS } = await supabase
      .from('foundersync_results')
      .select('personality_type, leadership_style, risk_tolerance')
      .eq('user_id', viewer_user_id)
      .maybeSingle();

    const { data: candidateFS } = await supabase
      .from('foundersync_results')
      .select('personality_type, leadership_style, risk_tolerance')
      .eq('user_id', candidateProfile.user_id)
      .maybeSingle();

    // Build the prompt
    const prompt = buildPrompt(viewerProfile, candidateProfile, viewerFS, candidateFS);

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert startup advisor analyzing co-founder compatibility. 
Provide a concise, analytical explanation of why two founders might work well together.
Focus on complementary skills, aligned values, and proven startup team patterns.
Be factual, not promotional. Use 2-3 sentences max.
Never use buzzwords or hype. Sound like an experienced investor or advisor.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiSummary = aiData.choices?.[0]?.message?.content?.trim() || 
      'Strong potential for collaboration based on complementary skill sets.';

    console.log('Generated AI summary:', aiSummary);

    // Cache the summary in matches table (upsert)
    if (existingMatch) {
      const isUser1 = existingMatch.user1_id === viewer_user_id;
      const updateField = isUser1 ? 'ai_summary_user1' : 'ai_summary_user2';
      
      await supabase
        .from('matches')
        .update({ [updateField]: aiSummary })
        .eq('id', existingMatch.user1_id === viewer_user_id ? existingMatch.user1_id : existingMatch.user2_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ai_summary: aiSummary,
      cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating AI summary:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate AI summary',
      ai_summary: 'Both founders show complementary backgrounds that could support effective collaboration.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPrompt(
  viewer: any,
  candidate: any,
  viewerFS: any | null,
  candidateFS: any | null
): string {
  let prompt = `Analyze the compatibility of these two potential co-founders:

**Founder A (You):**
- Role: ${viewer.role || 'Not specified'}
- Skills: ${(viewer.skills || []).join(', ') || 'Not specified'}
- Interests: ${(viewer.interests || []).join(', ') || 'Not specified'}
- Stage: ${viewer.stage || 'Not specified'}
- Looking for: ${(viewer.looking_for || []).join(', ') || 'Not specified'}`;

  if (viewerFS) {
    prompt += `
- Thinking Style: ${viewerFS.personality_type || 'Unknown'}
- Leadership: ${viewerFS.leadership_style || 'Unknown'}
- Risk Tolerance: ${viewerFS.risk_tolerance || 'Unknown'}`;
  }

  prompt += `

**Founder B (Match):**
- Name: ${candidate.name}
- Role: ${candidate.role || 'Not specified'}
- Skills: ${(candidate.skills || []).join(', ') || 'Not specified'}
- Interests: ${(candidate.interests || []).join(', ') || 'Not specified'}
- Stage: ${candidate.stage || 'Not specified'}
- Looking for: ${(candidate.looking_for || []).join(', ') || 'Not specified'}`;

  if (candidateFS) {
    prompt += `
- Thinking Style: ${candidateFS.personality_type || 'Unknown'}
- Leadership: ${candidateFS.leadership_style || 'Unknown'}
- Risk Tolerance: ${candidateFS.risk_tolerance || 'Unknown'}`;
  }

  prompt += `

Write a 2-3 sentence analytical summary of why these founders might work well together. 
Reference their complementary skills, aligned values, and any patterns that mirror successful startup teams.
Be specific but concise. Do not use buzzwords or marketing language.`;

  return prompt;
}
