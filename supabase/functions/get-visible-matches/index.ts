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

interface ProfileRow {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  stage: string | null;
  looking_for: string[] | null;
  profile_pic_url: string | null;
  test_completed: boolean;
}

interface FounderSyncRow {
  user_id: string;
  personality_type: string | null;
  leadership_style: string | null;
  risk_tolerance: string | null;
}

interface VisibleMatch {
  id: string;
  user_id: string;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  interests: string[];
  stage: string;
  looking_for: string[];
  profile_pic_url: string | null;
  final_score: number;
  ai_summary: string | null;
  phase: string;
  viewer_traits: TraitData | null;
  candidate_traits: TraitData | null;
}

// Normalize strings for comparison
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

// Calculate array overlap score (0-100)
function overlapScore(arr1: string[], arr2: string[]): number {
  if (!arr1.length || !arr2.length) return 0;
  const set1 = new Set(arr1.map(normalize));
  const set2 = new Set(arr2.map(normalize));
  let matches = 0;
  for (const item of set1) {
    if (set2.has(item)) matches++;
  }
  const maxPossible = Math.min(set1.size, set2.size);
  return maxPossible > 0 ? (matches / maxPossible) * 100 : 0;
}

// Check role complementarity
function roleComplementarity(role1: string | null, role2: string | null): number {
  if (!role1 || !role2) return 50; // Neutral
  
  const r1 = normalize(role1);
  const r2 = normalize(role2);
  
  const technical = ['developer', 'engineer', 'technical', 'cto', 'programmer', 'software'];
  const business = ['business', 'marketing', 'sales', 'ceo', 'growth', 'operations', 'strategy'];
  const product = ['product', 'design', 'ux', 'ui'];
  
  const isTech1 = technical.some(t => r1.includes(t));
  const isTech2 = technical.some(t => r2.includes(t));
  const isBiz1 = business.some(t => r1.includes(t));
  const isBiz2 = business.some(t => r2.includes(t));
  const isProd1 = product.some(t => r1.includes(t));
  const isProd2 = product.some(t => r2.includes(t));
  
  // Complementary pairs score high
  if ((isTech1 && isBiz2) || (isBiz1 && isTech2)) return 90;
  if ((isTech1 && isProd2) || (isProd1 && isTech2)) return 85;
  if ((isBiz1 && isProd2) || (isProd1 && isBiz2)) return 80;
  
  // Same category is less ideal but not bad
  if ((isTech1 && isTech2) || (isBiz1 && isBiz2) || (isProd1 && isProd2)) return 60;
  
  return 65; // Default moderate score
}

// Stage alignment scoring
function stageAlignment(stage1: string | null, stage2: string | null): number {
  if (!stage1 || !stage2) return 60;
  
  const s1 = normalize(stage1);
  const s2 = normalize(stage2);
  
  if (s1 === s2) return 90;
  
  const stages = ['idea', 'mvp', 'earlystage', 'growth', 'scaling'];
  const idx1 = stages.findIndex(s => s1.includes(s));
  const idx2 = stages.findIndex(s => s2.includes(s));
  
  if (idx1 === -1 || idx2 === -1) return 60;
  
  const diff = Math.abs(idx1 - idx2);
  return Math.max(50, 90 - diff * 15);
}

// FounderSync trait compatibility (complementarity > sameness for risk)
function traitCompatibility(viewer: TraitData | null, candidate: TraitData | null): number {
  if (!viewer || !candidate) return 0;
  
  let score = 0;
  
  // Thinking style - similar is good
  if (viewer.thinking_style && candidate.thinking_style) {
    const v = normalize(viewer.thinking_style);
    const c = normalize(candidate.thinking_style);
    if (v === c) score += 30;
    else if (v.includes(c) || c.includes(v)) score += 20;
    else score += 10; // Different can still work
  }
  
  // Leadership style - complementary is better
  if (viewer.leadership_style && candidate.leadership_style) {
    const v = normalize(viewer.leadership_style);
    const c = normalize(candidate.leadership_style);
    if (v === c) score += 20; // Same leadership can cause conflict
    else score += 35; // Different leadership styles complement each other
  }
  
  // Risk tolerance - balanced is best
  if (viewer.risk_tolerance && candidate.risk_tolerance) {
    const v = normalize(viewer.risk_tolerance);
    const c = normalize(candidate.risk_tolerance);
    
    const riskLevels: Record<string, number> = {
      'low': 1, 'conservative': 1,
      'medium': 2, 'moderate': 2, 'balanced': 2,
      'high': 3, 'aggressive': 3
    };
    
    const vLevel = riskLevels[v] || 2;
    const cLevel = riskLevels[c] || 2;
    const diff = Math.abs(vLevel - cLevel);
    
    if (diff === 0) score += 25; // Same risk tolerance
    else if (diff === 1) score += 35; // Balanced - one conservative, one moderate
    else score += 20; // Opposite extremes - can work but challenging
  }
  
  return score; // Max 100
}

// Calculate Phase 1 score (profile-only matching)
function calculatePhase1Score(viewer: ProfileRow, candidate: ProfileRow): number {
  const skillScore = overlapScore(viewer.skills || [], candidate.skills || []);
  const interestScore = overlapScore(viewer.interests || [], candidate.interests || []);
  const roleScore = roleComplementarity(viewer.role, candidate.role);
  const stageScore = stageAlignment(viewer.stage, candidate.stage);
  
  // Weighted average with baseline
  const rawScore = (
    skillScore * 0.25 +
    interestScore * 0.20 +
    roleScore * 0.35 +
    stageScore * 0.20
  );
  
  // Apply baseline (35-40%) so matches never show 0%
  const baseline = 38;
  const scaled = baseline + (rawScore * 0.62); // Scale to 38-100
  
  return Math.min(100, Math.round(scaled));
}

// Calculate Phase 2 score (FounderSync + profile matching)
function calculatePhase2Score(
  viewer: ProfileRow,
  candidate: ProfileRow,
  viewerTraits: TraitData,
  candidateTraits: TraitData
): number {
  // Profile compatibility (40% weight)
  const profileScore = calculatePhase1Score(viewer, candidate);
  
  // Trait compatibility (60% weight)
  const traitScore = traitCompatibility(viewerTraits, candidateTraits);
  
  // Combined score
  const combined = (profileScore * 0.4) + (traitScore * 0.6);
  
  // Ensure minimum score and cap at 100
  return Math.min(100, Math.max(40, Math.round(combined)));
}

serve(async (req) => {
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

    console.log(`Fetching intelligent matches for user: ${user_id}`);

    // Get viewer's profile
    const { data: viewerProfile, error: viewerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (viewerError || !viewerProfile) {
      console.error('Viewer profile not found:', viewerError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get viewer's FounderSync traits (if completed)
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

    const viewerCompletedTest = !!viewerFS;

    // Get users that have been interacted with (to exclude)
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('target_user_id')
      .eq('user_id', user_id);

    const excludedUserIds = new Set(
      (interactions || []).map(i => i.target_user_id).filter(Boolean)
    );
    excludedUserIds.add(user_id); // Exclude self

    // Fetch ALL other profiles (bypass RLS with service role)
    const { data: candidates, error: candidatesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user_id)
      .eq('is_active', true)
      .limit(200); // Get more to filter

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch candidates' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${candidates?.length || 0} potential candidates`);

    // Filter out interacted users
    const filteredCandidates = (candidates || []).filter(
      c => !excludedUserIds.has(c.user_id)
    );

    console.log(`After filtering interactions: ${filteredCandidates.length} candidates`);

    // Get FounderSync results for all candidates (batch query)
    const candidateUserIds = filteredCandidates.map(c => c.user_id).filter(Boolean);
    
    const { data: allFS } = await supabase
      .from('foundersync_results')
      .select('user_id, personality_type, leadership_style, risk_tolerance')
      .in('user_id', candidateUserIds);

    const fsMap = new Map<string, FounderSyncRow>();
    for (const fs of allFS || []) {
      fsMap.set(fs.user_id, fs);
    }

    // Score and rank all candidates
    const scoredMatches: VisibleMatch[] = [];

    for (const candidate of filteredCandidates) {
      const candidateFS = fsMap.get(candidate.user_id);
      const candidateTraits: TraitData | null = candidateFS ? {
        thinking_style: candidateFS.personality_type || '',
        leadership_style: candidateFS.leadership_style || '',
        risk_tolerance: candidateFS.risk_tolerance || '',
      } : null;

      // Determine phase and calculate score
      let phase: string;
      let score: number;

      if (viewerCompletedTest && candidateTraits) {
        // Phase 2: Both have completed FounderSync
        phase = 'phase2';
        score = calculatePhase2Score(
          viewerProfile as ProfileRow,
          candidate as ProfileRow,
          viewerTraits!,
          candidateTraits
        );
      } else {
        // Phase 1: Profile-only matching
        phase = 'phase1';
        score = calculatePhase1Score(
          viewerProfile as ProfileRow,
          candidate as ProfileRow
        );
      }

      scoredMatches.push({
        id: candidate.id,
        user_id: candidate.user_id,
        name: candidate.name || 'Unknown',
        role: candidate.role || 'Entrepreneur',
        bio: candidate.bio || '',
        skills: candidate.skills || [],
        interests: candidate.interests || [],
        stage: candidate.stage || '',
        looking_for: candidate.looking_for || [],
        profile_pic_url: candidate.profile_pic_url,
        final_score: score,
        ai_summary: null, // Will be generated on-demand via separate endpoint
        phase,
        viewer_traits: viewerTraits,
        candidate_traits: candidateTraits,
      });
    }

    // Sort by phase (phase2 first) then by score (descending)
    scoredMatches.sort((a, b) => {
      if (a.phase === 'phase2' && b.phase !== 'phase2') return -1;
      if (b.phase === 'phase2' && a.phase !== 'phase2') return 1;
      return b.final_score - a.final_score;
    });

    // Limit results
    const limitedMatches = scoredMatches.slice(0, limit);

    console.log(`Returning ${limitedMatches.length} scored matches`);

    return new Response(JSON.stringify({ 
      success: true, 
      matches: limitedMatches,
      total: limitedMatches.length,
      viewer_completed_test: viewerCompletedTest
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-visible-matches:', error);
    // Always return a valid response shape even on error
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      matches: [],
      total: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
