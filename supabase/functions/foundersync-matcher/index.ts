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
  thinking_style: 'analytical' | 'visionary' | 'executional';
  leadership_style: 'strategist' | 'operator' | 'collaborator';
  risk_tolerance: 'low' | 'medium' | 'high';
}

interface MatchCandidate {
  id: string;
  user1_id: string;
  user2_id: string;
}

// Map FounderSync answers to psychological traits
function mapAnswersToTraits(answers: FounderSyncAnswers): TraitProfile {
  const answerValues = Object.values(answers);
  
  // Count answer types (A, B, C)
  const counts = { A: 0, B: 0, C: 0 };
  answerValues.forEach(answer => {
    const letter = answer.charAt(0).toUpperCase();
    if (letter === 'A' || letter === 'B' || letter === 'C') {
      counts[letter]++;
    }
  });
  
  // Thinking Style: A = analytical, B = visionary, C = executional
  let thinking_style: TraitProfile['thinking_style'];
  if (counts.A >= counts.B && counts.A >= counts.C) {
    thinking_style = 'analytical';
  } else if (counts.B >= counts.A && counts.B >= counts.C) {
    thinking_style = 'visionary';
  } else {
    thinking_style = 'executional';
  }
  
  // Leadership Style based on specific questions (2, 4, 9, 10)
  const leadershipQuestions = ['q2', 'q4', 'q9', 'q10'];
  const leadershipCounts = { A: 0, B: 0, C: 0 };
  leadershipQuestions.forEach(q => {
    const answer = answers[q];
    if (answer) {
      const letter = answer.charAt(0).toUpperCase();
      if (letter === 'A' || letter === 'B' || letter === 'C') {
        leadershipCounts[letter]++;
      }
    }
  });
  
  let leadership_style: TraitProfile['leadership_style'];
  if (leadershipCounts.A >= leadershipCounts.B && leadershipCounts.A >= leadershipCounts.C) {
    leadership_style = 'strategist'; // Data/logic focused
  } else if (leadershipCounts.B >= leadershipCounts.A && leadershipCounts.B >= leadershipCounts.C) {
    leadership_style = 'collaborator'; // Vision/alignment focused
  } else {
    leadership_style = 'operator'; // Action/momentum focused
  }
  
  // Risk Tolerance based on questions 1, 6, 7
  const riskQuestions = ['q1', 'q6', 'q7'];
  const riskCounts = { A: 0, B: 0, C: 0 };
  riskQuestions.forEach(q => {
    const answer = answers[q];
    if (answer) {
      const letter = answer.charAt(0).toUpperCase();
      if (letter === 'A' || letter === 'B' || letter === 'C') {
        riskCounts[letter]++;
      }
    }
  });
  
  let risk_tolerance: TraitProfile['risk_tolerance'];
  // A = careful/analytical approach = low risk
  // B = vision-aligned = medium risk
  // C = action/testing = high risk
  if (riskCounts.C >= riskCounts.A && riskCounts.C >= riskCounts.B) {
    risk_tolerance = 'high';
  } else if (riskCounts.A >= riskCounts.B && riskCounts.A >= riskCounts.C) {
    risk_tolerance = 'low';
  } else {
    risk_tolerance = 'medium';
  }
  
  return { thinking_style, leadership_style, risk_tolerance };
}

// Check if two profiles should be hidden from each other
function shouldHideMatch(viewer: TraitProfile, candidate: TraitProfile): { hide: boolean; reason: string } {
  // Rule 1: Both same dominant leadership style (operator + operator is problematic)
  if (viewer.leadership_style === candidate.leadership_style && 
      viewer.leadership_style === 'operator') {
    return { hide: true, reason: 'competing_operators' };
  }
  
  // Rule 2: Both have low risk tolerance - too cautious together
  if (viewer.risk_tolerance === 'low' && candidate.risk_tolerance === 'low') {
    return { hide: true, reason: 'risk_averse_pair' };
  }
  
  // Rule 3: No complementary thinking styles (same thinking, no balance)
  if (viewer.thinking_style === candidate.thinking_style && 
      viewer.leadership_style === candidate.leadership_style) {
    return { hide: true, reason: 'no_complementarity' };
  }
  
  return { hide: false, reason: '' };
}

// Calculate compatibility score (0-100)
function calculateCompatibilityScore(viewer: TraitProfile, candidate: TraitProfile): number {
  let score = 50; // Base score
  
  // Thinking style complementarity (max +20)
  if (viewer.thinking_style !== candidate.thinking_style) {
    score += 15; // Different styles complement
    // Best pairing: analytical + executional or visionary + executional
    if ((viewer.thinking_style === 'analytical' && candidate.thinking_style === 'executional') ||
        (viewer.thinking_style === 'executional' && candidate.thinking_style === 'analytical') ||
        (viewer.thinking_style === 'visionary' && candidate.thinking_style === 'executional') ||
        (viewer.thinking_style === 'executional' && candidate.thinking_style === 'visionary')) {
      score += 5;
    }
  }
  
  // Leadership complementarity (max +20)
  if (viewer.leadership_style !== candidate.leadership_style) {
    score += 15;
    // Best pairing: strategist + operator
    if ((viewer.leadership_style === 'strategist' && candidate.leadership_style === 'operator') ||
        (viewer.leadership_style === 'operator' && candidate.leadership_style === 'strategist')) {
      score += 5;
    }
  } else if (viewer.leadership_style === 'collaborator') {
    // Two collaborators can work together
    score += 10;
  }
  
  // Risk tolerance balance (max +15)
  const riskMap = { low: 0, medium: 1, high: 2 };
  const riskDiff = Math.abs(riskMap[viewer.risk_tolerance] - riskMap[candidate.risk_tolerance]);
  if (riskDiff === 1) {
    score += 15; // One step apart is ideal - balances each other
  } else if (riskDiff === 0 && viewer.risk_tolerance === 'medium') {
    score += 10; // Both medium is okay
  } else if (riskDiff === 2) {
    score += 5; // Extreme difference can create tension but also balance
  }
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

// Generate AI summary using Lovable AI Gateway
async function generateAISummary(
  viewerTraits: TraitProfile,
  candidateTraits: TraitProfile,
  sharedSkills: string[],
  stage: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return "A potential co-founder match based on complementary working styles.";
  }

  const systemPrompt = `You are generating a short, calm, and insightful explanation of why two startup founders might work well together.
Do not use buzzwords.
Do not exaggerate.
Speak in a grounded, professional tone.
Keep it to 1-2 sentences maximum.`;

  const userPrompt = `Viewer traits:
- Thinking style: ${viewerTraits.thinking_style}
- Leadership style: ${viewerTraits.leadership_style}
- Risk tolerance: ${viewerTraits.risk_tolerance}

Candidate traits:
- Thinking style: ${candidateTraits.thinking_style}
- Leadership style: ${candidateTraits.leadership_style}
- Risk tolerance: ${candidateTraits.risk_tolerance}

Shared context:
- Overlapping skills: ${sharedSkills.length > 0 ? sharedSkills.join(', ') : 'None specified'}
- Startup stage: ${stage || 'Not specified'}

Write 1-2 sentences explaining why this candidate complements the viewer.
Focus on how they would work together.`;

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
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status, await response.text());
      return "A complementary match based on your working styles.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "A complementary match based on your working styles.";
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return "A complementary match based on your working styles.";
  }
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

    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing FounderSync for user: ${user_id}`);

    // 1. Get the user's FounderSync results
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
    const userTraits = mapAnswersToTraits(founderSyncData.answers as FounderSyncAnswers);
    console.log(`User traits:`, userTraits);

    // 3. Update the user's foundersync_results with derived traits
    await supabase
      .from('foundersync_results')
      .update({
        personality_type: userTraits.thinking_style,
        leadership_style: userTraits.leadership_style,
        risk_tolerance: userTraits.risk_tolerance,
      })
      .eq('user_id', user_id);

    // 4. Get user's profile for skills/stage info
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

      // Get other user's FounderSync results
      const { data: otherFSData } = await supabase
        .from('foundersync_results')
        .select('*')
        .eq('user_id', otherUserId)
        .maybeSingle();

      if (!otherFSData) {
        // Other user hasn't completed FounderSync, keep visible but no score
        continue;
      }

      // Get other user's traits
      const otherTraits = mapAnswersToTraits(otherFSData.answers as FounderSyncAnswers);

      // Get other user's profile
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('skills, stage')
        .eq('user_id', otherUserId)
        .maybeSingle();

      // Check if match should be hidden
      const hideResult = shouldHideMatch(userTraits, otherTraits);
      
      if (hideResult.hide) {
        // Hide the match
        await supabase
          .from('matches')
          .update({
            is_visible: false,
            hidden_reason: hideResult.reason,
            phase: 'phase2',
          })
          .eq('id', match.id);
        console.log(`Hidden match ${match.id}: ${hideResult.reason}`);
        continue;
      }

      // Calculate compatibility score
      const compatibilityScore = calculateCompatibilityScore(userTraits, otherTraits);

      // Find shared skills
      const userSkills = userProfile?.skills || [];
      const otherSkills = otherProfile?.skills || [];
      const sharedSkills = userSkills.filter((s: string) => otherSkills.includes(s));

      // Generate AI summaries (viewer-relative)
      let aiSummaryUser1 = match.ai_summary_user1;
      let aiSummaryUser2 = match.ai_summary_user2;

      // Generate summary for user1's perspective if needed
      if (!aiSummaryUser1 || isUser1) {
        const user1Traits = isUser1 ? userTraits : otherTraits;
        const user2Traits = isUser1 ? otherTraits : userTraits;
        aiSummaryUser1 = await generateAISummary(
          user1Traits,
          user2Traits,
          sharedSkills,
          userProfile?.stage || otherProfile?.stage || ''
        );
      }

      // Generate summary for user2's perspective if needed
      if (!aiSummaryUser2 || !isUser1) {
        const user1Traits = isUser1 ? userTraits : otherTraits;
        const user2Traits = isUser1 ? otherTraits : userTraits;
        aiSummaryUser2 = await generateAISummary(
          user2Traits,
          user1Traits,
          sharedSkills,
          otherProfile?.stage || userProfile?.stage || ''
        );
      }

      // Update match with score and summaries
      await supabase
        .from('matches')
        .update({
          is_visible: true,
          hidden_reason: null,
          final_score: compatibilityScore,
          phase: 'phase2',
          ai_summary_user1: aiSummaryUser1,
          ai_summary_user2: aiSummaryUser2,
        })
        .eq('id', match.id);

      console.log(`Updated match ${match.id} with score ${compatibilityScore}`);

      // Create notification for high-compatibility matches (score >= 75)
      if (compatibilityScore >= 75) {
        // Get other user's profile for the notification
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', otherUserId)
          .maybeSingle();

        // Create notification for the current user
        await supabase
          .from('notifications')
          .insert({
            user_id: user_id,
            type: 'high_compatibility_match',
            title: '🎯 High Compatibility Match!',
            message: `You have ${compatibilityScore}% compatibility with ${otherProfile?.name || 'a founder'}. Check out your match!`,
            related_user_id: otherUserId,
            related_id: match.id,
          });

        console.log(`Created high-compatibility notification for user ${user_id}`);

        // Also notify the other user if they completed FounderSync
        await supabase
          .from('notifications')
          .insert({
            user_id: otherUserId,
            type: 'high_compatibility_match',
            title: '🎯 High Compatibility Match!',
            message: `Someone just matched with you at ${compatibilityScore}% compatibility!`,
            related_user_id: user_id,
            related_id: match.id,
          });
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
