import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FounderSyncAnswers {
  [key: string]: string;
}

interface TraitData {
  founder_archetype: string;
  decision_style: string;
  values_profile: string;
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
  partnership_type: string | null;
  model_dominance: string | null;
}

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

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

function roleComplementarity(role1: string | null, role2: string | null): number {
  if (!role1 || !role2) return 50;
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
  if ((isTech1 && isBiz2) || (isBiz1 && isTech2)) return 90;
  if ((isTech1 && isProd2) || (isProd1 && isTech2)) return 85;
  if ((isBiz1 && isProd2) || (isProd1 && isBiz2)) return 80;
  if ((isTech1 && isTech2) || (isBiz1 && isBiz2) || (isProd1 && isProd2)) return 60;
  return 65;
}

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

function getAnswerValue(answer: string): 'A' | 'B' | 'C' | 'D' {
  if (!answer) return 'D';
  if (answer.startsWith('Other:')) return 'D';
  const letter = answer.charAt(0).toUpperCase();
  if (letter === 'A' || letter === 'B' || letter === 'C') return letter;
  return 'D';
}

// Derive traits from 30-question format
function deriveTraitsFrom30Q(answers: FounderSyncAnswers): TraitData {
  // Founder archetype from Q1-10
  const archCounts = { A: 0, B: 0, C: 0 };
  for (let q = 1; q <= 10; q++) {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') archCounts[ans]++;
  }
  let founder_archetype = 'Operator';
  if (archCounts.A >= archCounts.B && archCounts.A >= archCounts.C) founder_archetype = 'Builder';
  else if (archCounts.B >= archCounts.C) founder_archetype = 'Visionary';

  // Decision style from Q11-20
  const decCounts = { A: 0, B: 0, C: 0 };
  for (let q = 11; q <= 20; q++) {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') decCounts[ans]++;
  }
  let decision_style = 'Analytical';
  if (decCounts.A >= decCounts.B && decCounts.A >= decCounts.C) decision_style = 'Decisive';
  else if (decCounts.B >= decCounts.C) decision_style = 'Collaborative';

  // Values from Q21-30
  const valCounts = { A: 0, B: 0, C: 0 };
  for (let q = 21; q <= 30; q++) {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') valCounts[ans]++;
  }
  let values_profile = 'Pragmatic';
  if (valCounts.A >= valCounts.B && valCounts.A >= valCounts.C) values_profile = 'Integrity-Focused';
  else if (valCounts.B >= valCounts.C) values_profile = 'Mission-Driven';

  // Leadership from Q11, 13, 15, 19
  const leadCounts = { A: 0, B: 0, C: 0 };
  [11, 13, 15, 19].forEach(q => {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') leadCounts[ans]++;
  });
  let leadership_style = 'Delegative';
  if (leadCounts.A >= leadCounts.B && leadCounts.A >= leadCounts.C) leadership_style = 'Directive';
  else if (leadCounts.B >= leadCounts.C) leadership_style = 'Collaborative';

  // Risk from Q14, 17, 25
  const riskCounts = { A: 0, B: 0, C: 0 };
  [14, 17, 25].forEach(q => {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') riskCounts[ans]++;
  });
  let risk_tolerance = 'Calculated';
  if (riskCounts.C >= riskCounts.A && riskCounts.C >= riskCounts.B) risk_tolerance = 'Conservative';
  else if (riskCounts.B >= riskCounts.A) risk_tolerance = 'Adaptive';

  return { founder_archetype, decision_style, values_profile, leadership_style, risk_tolerance };
}

// Legacy trait derivation for 10-question format
function deriveTraitsFromLegacy(answers: FounderSyncAnswers): TraitData {
  const counts = { A: 0, B: 0, C: 0 };
  Object.values(answers).forEach(answer => {
    const letter = getAnswerValue(answer);
    if (letter !== 'D') counts[letter]++;
  });
  
  let founder_archetype = 'Operator';
  if (counts.A >= counts.B && counts.A >= counts.C) founder_archetype = 'Builder';
  else if (counts.B >= counts.C) founder_archetype = 'Visionary';

  return {
    founder_archetype,
    decision_style: counts.A >= counts.B ? 'Decisive' : 'Collaborative',
    values_profile: counts.B >= counts.C ? 'Mission-Driven' : 'Pragmatic',
    leadership_style: counts.A >= counts.C ? 'Directive' : 'Delegative',
    risk_tolerance: counts.C >= counts.A ? 'Adaptive' : 'Calculated',
  };
}

function mapAnswersToTraits(answers: FounderSyncAnswers): TraitData {
  // Check if it's 30-question format (has q21+)
  const has30Questions = Object.keys(answers).some(k => {
    const num = parseInt(k.replace('q', ''));
    return num >= 21;
  });
  return has30Questions ? deriveTraitsFrom30Q(answers) : deriveTraitsFromLegacy(answers);
}

// Dual-model scoring
function calculateComplementaryScore(viewerAnswers: FounderSyncAnswers, candidateAnswers: FounderSyncAnswers): number {
  let score = 0, maxScore = 0;
  for (let q = 1; q <= 10; q++) {
    const v = getAnswerValue(viewerAnswers[`q${q}`]);
    const c = getAnswerValue(candidateAnswers[`q${q}`]);
    if (v === 'D' || c === 'D') continue;
    maxScore += 10;
    score += v !== c ? 8 : 4;
  }
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

function calculateOverlappingScore(viewerAnswers: FounderSyncAnswers, candidateAnswers: FounderSyncAnswers): number {
  let score = 0, maxScore = 0;
  for (let q = 21; q <= 30; q++) {
    const v = getAnswerValue(viewerAnswers[`q${q}`]);
    const c = getAnswerValue(candidateAnswers[`q${q}`]);
    if (v === 'D' || c === 'D') continue;
    maxScore += 10;
    score += v === c ? 10 : 4;
  }
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

function calculatePhase1Score(viewer: ProfileRow, candidate: ProfileRow): number {
  const skillScore = overlapScore(viewer.skills || [], candidate.skills || []);
  const interestScore = overlapScore(viewer.interests || [], candidate.interests || []);
  const roleScore = roleComplementarity(viewer.role, candidate.role);
  const stageScore = stageAlignment(viewer.stage, candidate.stage);
  const rawScore = skillScore * 0.25 + interestScore * 0.20 + roleScore * 0.35 + stageScore * 0.20;
  const baseline = 38;
  return Math.min(100, Math.round(baseline + (rawScore * 0.62)));
}

function calculatePhase2Score(
  viewer: ProfileRow,
  candidate: ProfileRow,
  viewerAnswers: FounderSyncAnswers,
  candidateAnswers: FounderSyncAnswers
): { score: number; partnershipType: string; modelDominance: string } {
  const profileScore = calculatePhase1Score(viewer, candidate);
  const complementaryScore = calculateComplementaryScore(viewerAnswers, candidateAnswers);
  const overlappingScore = calculateOverlappingScore(viewerAnswers, candidateAnswers);
  
  let modelDominance = 'balanced';
  if (complementaryScore > overlappingScore + 10) modelDominance = 'complementary';
  else if (overlappingScore > complementaryScore + 10) modelDominance = 'overlapping';
  
  const viewerTraits = mapAnswersToTraits(viewerAnswers);
  const candidateTraits = mapAnswersToTraits(candidateAnswers);
  
  let partnershipType = 'Balanced Partnership';
  if (modelDominance === 'complementary') {
    if ((viewerTraits.founder_archetype === 'Builder' && candidateTraits.founder_archetype === 'Visionary') ||
        (viewerTraits.founder_archetype === 'Visionary' && candidateTraits.founder_archetype === 'Builder')) {
      partnershipType = 'Visionary & Builder';
    } else if ((viewerTraits.founder_archetype === 'Builder' && candidateTraits.founder_archetype === 'Operator') ||
               (viewerTraits.founder_archetype === 'Operator' && candidateTraits.founder_archetype === 'Builder')) {
      partnershipType = 'Builder & Operator';
    } else {
      partnershipType = 'Complementary Partners';
    }
  } else if (modelDominance === 'overlapping') {
    if (viewerTraits.founder_archetype === candidateTraits.founder_archetype) {
      if (viewerTraits.founder_archetype === 'Builder') partnershipType = 'Technical Power Pair';
      else if (viewerTraits.founder_archetype === 'Visionary') partnershipType = 'Vision Alignment Duo';
      else partnershipType = 'Operations Power Pair';
    } else {
      partnershipType = 'Peer Founders';
    }
  }
  
  let traitScore: number;
  if (modelDominance === 'complementary') {
    traitScore = complementaryScore * 0.7 + overlappingScore * 0.3;
  } else if (modelDominance === 'overlapping') {
    traitScore = overlappingScore * 0.7 + complementaryScore * 0.3;
  } else {
    traitScore = (complementaryScore + overlappingScore) / 2;
  }
  
  const combined = (profileScore * 0.4) + (traitScore * 0.6);
  return { 
    score: Math.min(100, Math.max(40, Math.round(combined))),
    partnershipType,
    modelDominance
  };
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

    const { data: viewerFS } = await supabase
      .from('foundersync_results')
      .select('answers')
      .eq('user_id', user_id)
      .maybeSingle();

    const viewerAnswers = viewerFS?.answers as FounderSyncAnswers | null;
    const viewerTraits = viewerAnswers ? mapAnswersToTraits(viewerAnswers) : null;
    const viewerCompletedTest = !!viewerFS;

    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('target_user_id')
      .eq('user_id', user_id);

    const excludedUserIds = new Set(
      (interactions || []).map(i => i.target_user_id).filter(Boolean)
    );
    excludedUserIds.add(user_id);

    const { data: candidates, error: candidatesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user_id)
      .eq('is_active', true)
      .limit(200);

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch candidates' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const filteredCandidates = (candidates || []).filter(c => !excludedUserIds.has(c.user_id));
    const candidateUserIds = filteredCandidates.map(c => c.user_id).filter(Boolean);
    
    const { data: allFS } = await supabase
      .from('foundersync_results')
      .select('user_id, answers')
      .in('user_id', candidateUserIds);

    const fsMap = new Map<string, FounderSyncAnswers>();
    for (const fs of allFS || []) {
      fsMap.set(fs.user_id, fs.answers as FounderSyncAnswers);
    }

    const scoredMatches: VisibleMatch[] = [];

    for (const candidate of filteredCandidates) {
      const candidateAnswers = fsMap.get(candidate.user_id);
      const candidateTraits = candidateAnswers ? mapAnswersToTraits(candidateAnswers) : null;

      let phase: string;
      let score: number;
      let partnershipType: string | null = null;
      let modelDominance: string | null = null;

      if (viewerCompletedTest && viewerAnswers && candidateAnswers) {
        phase = 'phase2';
        const result = calculatePhase2Score(
          viewerProfile as ProfileRow,
          candidate as ProfileRow,
          viewerAnswers,
          candidateAnswers
        );
        score = result.score;
        partnershipType = result.partnershipType;
        modelDominance = result.modelDominance;
      } else {
        phase = 'phase1';
        score = calculatePhase1Score(viewerProfile as ProfileRow, candidate as ProfileRow);
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
        ai_summary: null,
        phase,
        viewer_traits: viewerTraits,
        candidate_traits: candidateTraits,
        partnership_type: partnershipType,
        model_dominance: modelDominance,
      });
    }

    scoredMatches.sort((a, b) => {
      if (a.phase === 'phase2' && b.phase !== 'phase2') return -1;
      if (b.phase === 'phase2' && a.phase !== 'phase2') return 1;
      return b.final_score - a.final_score;
    });

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
