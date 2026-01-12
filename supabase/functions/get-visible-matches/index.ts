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

interface VisibleMatch {
  /** Profile ID (public.profiles.id) */
  id: string;
  /** Match record ID (public.matches.id) */
  match_id: string;
  /** Auth user ID (public.profiles.user_id) of the *other* user */
  user_id: string;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  interests: string[];
  stage: string;
  looking_for: string[];
  profile_pic_url: string | null;
  final_score: number | null;
  ai_summary: string | null;
  phase: string;
  viewer_traits: TraitData | null;
  candidate_traits: TraitData | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, limit = 20 } = await req.json();
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching visible matches for user: ${user_id}`);

    // Get viewer's FounderSync traits
    const { data: viewerFS } = await supabase
      .from('foundersync_results')
      .select('personality_type, leadership_style, risk_tolerance')
      .eq('user_id', user_id)
      .maybeSingle();

    const viewerTraits: TraitData | null = viewerFS ? {
      thinking_style: viewerFS.personality_type || '',
      leadership_style: viewerFS.leadership_style || '',
      risk_tolerance: viewerFS.risk_tolerance || '',
    } : null;

    // Get all visible matches for this user
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
      .eq('is_visible', true)
      .eq('is_active', true)
      .order('final_score', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (matchError) {
      console.error('Error fetching matches:', matchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch matches' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${matches?.length || 0} visible matches`);

    // Get profiles for all matched users
    const visibleMatches: VisibleMatch[] = [];

    for (const match of matches || []) {
      const otherUserId = match.user1_id === user_id ? match.user2_id : match.user1_id;
      const isUser1 = match.user1_id === user_id;

      // Get the other user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', otherUserId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error(`Profile not found for user ${otherUserId}`);
        continue;
      }

      // Get candidate's FounderSync traits
      const { data: candidateFS } = await supabase
        .from('foundersync_results')
        .select('personality_type, leadership_style, risk_tolerance')
        .eq('user_id', otherUserId)
        .maybeSingle();

      const candidateTraits: TraitData | null = candidateFS ? {
        thinking_style: candidateFS.personality_type || '',
        leadership_style: candidateFS.leadership_style || '',
        risk_tolerance: candidateFS.risk_tolerance || '',
      } : null;

      // Get the viewer-relative AI summary
      const aiSummary = isUser1 ? match.ai_summary_user1 : match.ai_summary_user2;

      visibleMatches.push({
        // IMPORTANT: Frontend expects this to be the profile ID (used for /profile/:id and connections.user2_id FK)
        id: profile.id,
        match_id: match.id,
        user_id: otherUserId,
        name: profile.name,
        role: profile.role,
        bio: profile.bio,
        skills: profile.skills || [],
        interests: profile.interests || [],
        stage: profile.stage,
        looking_for: profile.looking_for || [],
        profile_pic_url: profile.profile_pic_url,
        final_score: match.final_score,
        ai_summary: aiSummary,
        phase: match.phase || 'phase1',
        viewer_traits: viewerTraits,
        candidate_traits: candidateTraits,
      });
    }

    // Sort by final_score (Phase 2 matches first, then Phase 1)
    visibleMatches.sort((a, b) => {
      // Phase 2 matches with scores come first
      if (a.phase === 'phase2' && b.phase !== 'phase2') return -1;
      if (b.phase === 'phase2' && a.phase !== 'phase2') return 1;
      
      // Within same phase, sort by score
      const scoreA = a.final_score || 0;
      const scoreB = b.final_score || 0;
      return scoreB - scoreA;
    });

    console.log(`Returning ${visibleMatches.length} visible matches`);

    return new Response(JSON.stringify({ 
      success: true, 
      matches: visibleMatches,
      total: visibleMatches.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-visible-matches:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
