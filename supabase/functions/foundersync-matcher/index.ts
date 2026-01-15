import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FounderSyncAnswers {
  [key: string]: string;
}

interface TraitProfile {
  founder_archetype: 'Builder' | 'Visionary' | 'Operator';
  decision_style: 'Decisive' | 'Collaborative' | 'Analytical';
  values_profile: 'Integrity-Focused' | 'Mission-Driven' | 'Pragmatic';
  leadership_style: 'Directive' | 'Collaborative' | 'Delegative';
  risk_tolerance: 'Conservative' | 'Calculated' | 'Adaptive';
}

interface MatchResult {
  compatibilityScore: number;
  partnershipType: string;
  modelDominance: 'complementary' | 'overlapping' | 'balanced';
  categoryScores: {
    roleAlignment: number;
    decisionCompatibility: number;
    valuesAlignment: number;
  };
}

// Extract answer value (handles "Other: ..." format)
function getAnswerValue(answer: string): 'A' | 'B' | 'C' | 'D' {
  if (!answer) return 'D';
  if (answer.startsWith('Other:')) return 'D';
  const letter = answer.charAt(0).toUpperCase();
  if (letter === 'A' || letter === 'B' || letter === 'C') return letter;
  return 'D';
}

// Derive founder archetype from Category A answers (Q1-10)
function deriveFounderArchetype(answers: FounderSyncAnswers): TraitProfile['founder_archetype'] {
  const counts = { A: 0, B: 0, C: 0 };
  for (let q = 1; q <= 10; q++) {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') counts[ans]++;
  }
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Builder';
  if (counts.B === max) return 'Visionary';
  return 'Operator';
}

// Derive decision style from Category B answers (Q11-20)
function deriveDecisionStyle(answers: FounderSyncAnswers): TraitProfile['decision_style'] {
  const counts = { A: 0, B: 0, C: 0 };
  for (let q = 11; q <= 20; q++) {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') counts[ans]++;
  }
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Decisive';
  if (counts.B === max) return 'Collaborative';
  return 'Analytical';
}

// Derive values profile from Category C answers (Q21-30)
function deriveValuesProfile(answers: FounderSyncAnswers): TraitProfile['values_profile'] {
  const counts = { A: 0, B: 0, C: 0 };
  for (let q = 21; q <= 30; q++) {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') counts[ans]++;
  }
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Integrity-Focused';
  if (counts.B === max) return 'Mission-Driven';
  return 'Pragmatic';
}

// Derive leadership style
function deriveLeadershipStyle(answers: FounderSyncAnswers): TraitProfile['leadership_style'] {
  const leadershipQuestions = [11, 13, 15, 19];
  const counts = { A: 0, B: 0, C: 0 };
  leadershipQuestions.forEach(q => {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') counts[ans]++;
  });
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Directive';
  if (counts.B === max) return 'Collaborative';
  return 'Delegative';
}

// Derive risk tolerance
function deriveRiskTolerance(answers: FounderSyncAnswers): TraitProfile['risk_tolerance'] {
  const riskQuestions = [14, 17, 25];
  const counts = { A: 0, B: 0, C: 0 };
  riskQuestions.forEach(q => {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans !== 'D') counts[ans]++;
  });
  if (counts.C >= counts.A && counts.C >= counts.B) return 'Conservative';
  if (counts.B >= counts.A) return 'Adaptive';
  return 'Calculated';
}

// Map all answers to complete trait profile
function mapAnswersToTraits(answers: FounderSyncAnswers): TraitProfile {
  return {
    founder_archetype: deriveFounderArchetype(answers),
    decision_style: deriveDecisionStyle(answers),
    values_profile: deriveValuesProfile(answers),
    leadership_style: deriveLeadershipStyle(answers),
    risk_tolerance: deriveRiskTolerance(answers),
  };
}

// MODEL 1: Complementary Logic (Category A weighted HIGH)
function calculateComplementaryScore(viewerAnswers: FounderSyncAnswers, candidateAnswers: FounderSyncAnswers): number {
  let score = 0;
  let maxScore = 0;
  
  // Category A questions (1-10) - Core Role & Skill DNA
  for (let q = 1; q <= 10; q++) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    
    maxScore += 10;
    if (viewerAns !== candidateAns) {
      // Complementary pairs score higher
      if ((viewerAns === 'A' && candidateAns === 'B') || (viewerAns === 'B' && candidateAns === 'A')) {
        score += 10; // Classic Visionary & Builder
      } else if ((viewerAns === 'A' && candidateAns === 'C') || (viewerAns === 'C' && candidateAns === 'A')) {
        score += 9; // Builder & Operator
      } else {
        score += 7;
      }
    } else {
      score += 4; // Same answers - lower in complementary model
    }
  }
  
  // Some Category B questions for complementary logic
  const decisionQuestions = [11, 13, 15];
  for (const q of decisionQuestions) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    maxScore += 5;
    score += viewerAns !== candidateAns ? 5 : 3;
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

// MODEL 2: Overlapping Logic (Category C weighted HIGH)
function calculateOverlappingScore(viewerAnswers: FounderSyncAnswers, candidateAnswers: FounderSyncAnswers): number {
  let score = 0;
  let maxScore = 0;
  
  // Category C questions (21-30) - Values & Personality
  for (let q = 21; q <= 30; q++) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    
    maxScore += 10;
    if (viewerAns === candidateAns) {
      score += 10; // Perfect alignment
    } else {
      const isAdjacent = 
        (viewerAns === 'A' && candidateAns === 'B') || (viewerAns === 'B' && candidateAns === 'A') ||
        (viewerAns === 'B' && candidateAns === 'C') || (viewerAns === 'C' && candidateAns === 'B');
      score += isAdjacent ? 6 : 3;
    }
  }
  
  // Shared decision philosophy from Category B
  const sharedPhilosophyQuestions = [18, 19, 20];
  for (const q of sharedPhilosophyQuestions) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    maxScore += 5;
    score += viewerAns === candidateAns ? 5 : 2;
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

// Calculate Category B compatibility
function calculateDecisionCompatibility(viewerAnswers: FounderSyncAnswers, candidateAnswers: FounderSyncAnswers): number {
  let score = 0;
  let maxScore = 0;
  
  for (let q = 11; q <= 20; q++) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    
    maxScore += 10;
    score += viewerAns === candidateAns ? 7 : 6;
    
    // Bonus for specific compatible pairs
    if (q === 14 && viewerAns !== candidateAns) score += 2; // Different risk tolerances balance
    if (q === 15 && (viewerAns === 'A' || candidateAns === 'A')) score += 2; // At least one decisive leader
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

// SYMMETRY RULE: Calculate mutual compatibility
function calculateSymmetricScore(viewerAnswers: FounderSyncAnswers, candidateAnswers: FounderSyncAnswers): MatchResult {
  // Calculate scores in both directions and average (symmetry rule)
  const complementaryAtoB = calculateComplementaryScore(viewerAnswers, candidateAnswers);
  const complementaryBtoA = calculateComplementaryScore(candidateAnswers, viewerAnswers);
  const overlappingAtoB = calculateOverlappingScore(viewerAnswers, candidateAnswers);
  const overlappingBtoA = calculateOverlappingScore(candidateAnswers, viewerAnswers);
  const decisionAtoB = calculateDecisionCompatibility(viewerAnswers, candidateAnswers);
  const decisionBtoA = calculateDecisionCompatibility(candidateAnswers, viewerAnswers);
  
  const complementaryScore = (complementaryAtoB + complementaryBtoA) / 2;
  const overlappingScore = (overlappingAtoB + overlappingBtoA) / 2;
  const decisionScore = (decisionAtoB + decisionBtoA) / 2;
  
  // Determine which model dominates
  let modelDominance: 'complementary' | 'overlapping' | 'balanced';
  if (complementaryScore > overlappingScore + 10) {
    modelDominance = 'complementary';
  } else if (overlappingScore > complementaryScore + 10) {
    modelDominance = 'overlapping';
  } else {
    modelDominance = 'balanced';
  }
  
  // Calculate final weighted score
  let finalScore: number;
  if (modelDominance === 'complementary') {
    finalScore = complementaryScore * 0.5 + overlappingScore * 0.25 + decisionScore * 0.25;
  } else if (modelDominance === 'overlapping') {
    finalScore = overlappingScore * 0.5 + complementaryScore * 0.25 + decisionScore * 0.25;
  } else {
    finalScore = complementaryScore * 0.35 + overlappingScore * 0.35 + decisionScore * 0.30;
  }
  
  // Apply baseline (no matches below 35%)
  const baseline = 35;
  const scaledScore = baseline + ((finalScore / 100) * (100 - baseline));
  
  // Determine partnership type
  const viewerRole = deriveFounderArchetype(viewerAnswers);
  const candidateRole = deriveFounderArchetype(candidateAnswers);
  const partnershipType = determinePartnershipType(viewerRole, candidateRole, modelDominance);
  
  return {
    compatibilityScore: Math.min(100, Math.round(scaledScore)),
    partnershipType,
    modelDominance,
    categoryScores: {
      roleAlignment: Math.round(complementaryScore),
      decisionCompatibility: Math.round(decisionScore),
      valuesAlignment: Math.round(overlappingScore),
    },
  };
}

// Determine partnership type label
function determinePartnershipType(
  viewerRole: string, 
  candidateRole: string, 
  modelDominance: 'complementary' | 'overlapping' | 'balanced'
): string {
  if (modelDominance === 'complementary') {
    if ((viewerRole === 'Builder' && candidateRole === 'Visionary') ||
        (viewerRole === 'Visionary' && candidateRole === 'Builder')) {
      return 'Visionary & Builder';
    }
    if ((viewerRole === 'Builder' && candidateRole === 'Operator') ||
        (viewerRole === 'Operator' && candidateRole === 'Builder')) {
      return 'Builder & Operator';
    }
    if ((viewerRole === 'Visionary' && candidateRole === 'Operator') ||
        (viewerRole === 'Operator' && candidateRole === 'Visionary')) {
      return 'Visionary & Operator';
    }
    return 'Complementary Partners';
  }
  
  if (modelDominance === 'overlapping') {
    if (viewerRole === 'Builder' && candidateRole === 'Builder') return 'Technical Power Pair';
    if (viewerRole === 'Visionary' && candidateRole === 'Visionary') return 'Vision Alignment Duo';
    if (viewerRole === 'Operator' && candidateRole === 'Operator') return 'Operations Power Pair';
    return 'Peer Founders';
  }
  
  return 'Balanced Partnership';
}

// Generate AI summary using Lovable AI Gateway
async function generateAISummary(
  viewerTraits: TraitProfile,
  candidateTraits: TraitProfile,
  matchResult: MatchResult,
  sharedSkills: string[],
  stage: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return generateFallbackSummary(matchResult);
  }

  const systemPrompt = `You are generating a 2-3 sentence explanation of why two startup founders match well together.
Be specific about their complementary or overlapping traits.
Reference proven startup founder patterns when relevant.
Avoid hype or generic wording.
Keep it professional and grounded.`;

  const userPrompt = `Partnership Type: ${matchResult.partnershipType}
Matching Model: ${matchResult.modelDominance} (${matchResult.modelDominance === 'complementary' ? 'like Jobs/Wozniak, Chesky/Blecharczyk' : matchResult.modelDominance === 'overlapping' ? 'like Page/Brin, Collison Brothers' : 'balanced approach'})

Viewer traits:
- Founder Type: ${viewerTraits.founder_archetype}
- Decision Style: ${viewerTraits.decision_style}
- Values: ${viewerTraits.values_profile}
- Leadership: ${viewerTraits.leadership_style}
- Risk Tolerance: ${viewerTraits.risk_tolerance}

Candidate traits:
- Founder Type: ${candidateTraits.founder_archetype}
- Decision Style: ${candidateTraits.decision_style}
- Values: ${candidateTraits.values_profile}
- Leadership: ${candidateTraits.leadership_style}
- Risk Tolerance: ${candidateTraits.risk_tolerance}

Category Scores:
- Role Alignment: ${matchResult.categoryScores.roleAlignment}%
- Decision Compatibility: ${matchResult.categoryScores.decisionCompatibility}%
- Values Alignment: ${matchResult.categoryScores.valuesAlignment}%

Context:
- Shared skills: ${sharedSkills.length > 0 ? sharedSkills.join(', ') : 'None specified'}
- Startup stage: ${stage || 'Not specified'}

Write 2-3 sentences explaining why this match works. Reference the matching model and proven startup patterns.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status, await response.text());
      return generateFallbackSummary(matchResult);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || generateFallbackSummary(matchResult);
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return generateFallbackSummary(matchResult);
  }
}

function generateFallbackSummary(matchResult: MatchResult): string {
  if (matchResult.modelDominance === 'complementary') {
    return `This ${matchResult.partnershipType} pairing reflects a classic complementary founder model. One founder focuses on product vision while the other drives execution, mirroring patterns seen in successful billion-dollar startups.`;
  } else if (matchResult.modelDominance === 'overlapping') {
    return `This ${matchResult.partnershipType} pairing reflects a peer founder model with shared values and working styles. Both founders can deeply collaborate on shared work, similar to successful pairs like Page & Brin.`;
  }
  return `This ${matchResult.partnershipType} blends complementary skills with shared values, creating a balanced partnership for long-term growth.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing FounderSync for user: ${user_id}`);

    // 1. Get user's FounderSync results
    const { data: founderSyncData, error: fsError } = await supabase
      .from('foundersync_results')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (fsError || !founderSyncData) {
      console.error('FounderSync results not found:', fsError);
      return new Response(JSON.stringify({ error: 'FounderSync results not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Map answers to traits
    const userAnswers = founderSyncData.answers as FounderSyncAnswers;
    const userTraits = mapAnswersToTraits(userAnswers);
    console.log(`User traits:`, userTraits);

    // 3. Update user's foundersync_results with derived traits
    await supabase
      .from('foundersync_results')
      .update({
        personality_type: `${userTraits.founder_archetype} - ${userTraits.values_profile}`,
        leadership_style: userTraits.leadership_style,
        risk_tolerance: userTraits.risk_tolerance,
      })
      .eq('user_id', user_id);

    // 4. Get user's profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('skills, stage')
      .eq('user_id', user_id)
      .maybeSingle();

    // 5. Get all matches involving this user
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`);

    if (matchError) {
      console.error('Error fetching matches:', matchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch matches' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${matches?.length || 0} matches to process`);

    // 6. Process each match
    for (const match of matches || []) {
      const otherUserId = match.user1_id === user_id ? match.user2_id : match.user1_id;
      const isUser1 = match.user1_id === user_id;

      const { data: otherFSData } = await supabase
        .from('foundersync_results')
        .select('*')
        .eq('user_id', otherUserId)
        .maybeSingle();

      if (!otherFSData) continue; // Other user hasn't completed test

      const otherAnswers = otherFSData.answers as FounderSyncAnswers;
      const otherTraits = mapAnswersToTraits(otherAnswers);

      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('skills, stage, name')
        .eq('user_id', otherUserId)
        .maybeSingle();

      // Calculate symmetric match result
      const matchResult = calculateSymmetricScore(userAnswers, otherAnswers);
      
      // Find shared skills
      const userSkills = userProfile?.skills || [];
      const otherSkills = otherProfile?.skills || [];
      const sharedSkills = userSkills.filter((s: string) => otherSkills.includes(s));

      // Generate AI summaries
      const aiSummaryUser1 = await generateAISummary(
        isUser1 ? userTraits : otherTraits,
        isUser1 ? otherTraits : userTraits,
        matchResult,
        sharedSkills,
        userProfile?.stage || otherProfile?.stage || ''
      );

      const aiSummaryUser2 = await generateAISummary(
        isUser1 ? otherTraits : userTraits,
        isUser1 ? userTraits : otherTraits,
        matchResult,
        sharedSkills,
        otherProfile?.stage || userProfile?.stage || ''
      );

      // Update match
      await supabase
        .from('matches')
        .update({
          is_visible: true,
          hidden_reason: null,
          final_score: matchResult.compatibilityScore,
          match_score: matchResult.compatibilityScore,
          phase: 'phase2',
          ai_summary_user1: aiSummaryUser1,
          ai_summary_user2: aiSummaryUser2,
        })
        .eq('id', match.id);

      console.log(`Updated match ${match.id}: ${matchResult.compatibilityScore}% (${matchResult.partnershipType})`);

      // Notify for high-compatibility matches
      if (matchResult.compatibilityScore >= 75) {
        await supabase.from('notifications').insert([
          {
            user_id: user_id,
            type: 'high_compatibility_match',
            title: `${matchResult.partnershipType} Match!`,
            message: `${matchResult.compatibilityScore}% compatibility with ${otherProfile?.name || 'a founder'}`,
            related_user_id: otherUserId,
            related_id: match.id,
          },
          {
            user_id: otherUserId,
            type: 'high_compatibility_match',
            title: `${matchResult.partnershipType} Match!`,
            message: `Someone matched with you at ${matchResult.compatibilityScore}% compatibility!`,
            related_user_id: user_id,
            related_id: match.id,
          }
        ]);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      traits: userTraits,
      matches_processed: matches?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in foundersync-matcher:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
