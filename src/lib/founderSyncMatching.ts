// Founder Sync Dual-Model Matching Engine
// Implements two empirically validated startup success models:
// 1. Complementary Logic (Apple/Coinbase/Airbnb Model)
// 2. Overlapping Logic (Google/Stripe/Atlassian Model)

import { FounderSyncAnswers, ALL_QUESTIONS } from './founderSyncQuestions';

export interface MatchResult {
  compatibilityScore: number; // 0-100
  partnershipType: string; // "Visionary & Builder", "Technical Power Pair", etc.
  modelDominance: 'complementary' | 'overlapping' | 'balanced';
  categoryScores: {
    roleAlignment: number; // Category A score
    decisionCompatibility: number; // Category B score  
    valuesAlignment: number; // Category C score
  };
  symmetryAdjusted: boolean;
}

// Extract answer value (handles "Other: ..." format)
function getAnswerValue(answer: string): 'A' | 'B' | 'C' | 'D' {
  if (!answer) return 'D';
  if (answer.startsWith('Other:')) return 'D';
  return answer as 'A' | 'B' | 'C' | 'D';
}

// MODEL 1: Complementary Logic (Category A weighted HIGH)
// Inverse answers increase compatibility
function calculateComplementaryScore(
  viewerAnswers: FounderSyncAnswers,
  candidateAnswers: FounderSyncAnswers
): number {
  let score = 0;
  let maxScore = 0;
  
  // Category A questions (1-10) - Core Role & Skill DNA
  for (let q = 1; q <= 10; q++) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    
    if (viewerAns === 'D' || candidateAns === 'D') {
      // Skip "Other" answers for scoring
      continue;
    }
    
    maxScore += 10;
    
    // Complementary pairs (different answers) score higher
    if (viewerAns !== candidateAns) {
      // Specific complementary pairs get bonus points
      // A (Builder) + B (Vision) or A (Builder) + C (Operator) = best
      if ((viewerAns === 'A' && candidateAns === 'B') || (viewerAns === 'B' && candidateAns === 'A')) {
        score += 10; // Classic Visionary & Builder combo
      } else if ((viewerAns === 'A' && candidateAns === 'C') || (viewerAns === 'C' && candidateAns === 'A')) {
        score += 9; // Builder & Operator combo
      } else if ((viewerAns === 'B' && candidateAns === 'C') || (viewerAns === 'C' && candidateAns === 'B')) {
        score += 8; // Visionary & Operator combo
      } else {
        score += 7; // Any different pair
      }
    } else {
      // Same answers - lower score in complementary model
      score += 4;
    }
  }
  
  // Also consider some Category B questions for complementary logic
  const decisionQuestions = [11, 13, 15]; // Conflict resolution, control, crisis
  for (const q of decisionQuestions) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    
    maxScore += 5;
    
    // For decision-making, one decisive + one collaborative is ideal
    if (viewerAns !== candidateAns) {
      score += 5;
    } else {
      score += 3;
    }
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

// MODEL 2: Overlapping Logic (Category C weighted HIGH)
// Identical or near-identical answers increase compatibility
function calculateOverlappingScore(
  viewerAnswers: FounderSyncAnswers,
  candidateAnswers: FounderSyncAnswers
): number {
  let score = 0;
  let maxScore = 0;
  
  // Category C questions (21-30) - Values & Personality
  for (let q = 21; q <= 30; q++) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    
    maxScore += 10;
    
    // Same answers score highest in overlapping model
    if (viewerAns === candidateAns) {
      score += 10; // Perfect alignment
    } else {
      // Check for adjacent values (A-B, B-C)
      const isAdjacent = 
        (viewerAns === 'A' && candidateAns === 'B') ||
        (viewerAns === 'B' && candidateAns === 'A') ||
        (viewerAns === 'B' && candidateAns === 'C') ||
        (viewerAns === 'C' && candidateAns === 'B');
      
      if (isAdjacent) {
        score += 6; // Close alignment
      } else {
        score += 3; // Opposite values
      }
    }
  }
  
  // Also consider shared decision philosophy from Category B
  const sharedPhilosophyQuestions = [18, 19, 20]; // Trust, goals, communication
  for (const q of sharedPhilosophyQuestions) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    
    maxScore += 5;
    
    if (viewerAns === candidateAns) {
      score += 5;
    } else {
      score += 2;
    }
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

// Calculate Category B (Decision-Making) compatibility
// Affects both models - focuses on survivability
function calculateDecisionCompatibility(
  viewerAnswers: FounderSyncAnswers,
  candidateAnswers: FounderSyncAnswers
): number {
  let score = 0;
  let maxScore = 0;
  
  for (let q = 11; q <= 20; q++) {
    const viewerAns = getAnswerValue(viewerAnswers[`q${q}`]);
    const candidateAns = getAnswerValue(candidateAnswers[`q${q}`]);
    
    if (viewerAns === 'D' || candidateAns === 'D') continue;
    
    maxScore += 10;
    
    // Balanced approach - some alignment, some complementarity
    if (viewerAns === candidateAns) {
      score += 7; // Same decision style = some synergy
    } else {
      score += 6; // Different can work too
    }
    
    // Bonus for specific compatible pairs
    // Q14 (risk): Different risk tolerances balance each other
    if (q === 14 && viewerAns !== candidateAns) {
      score += 2;
    }
    // Q15 (crisis): Need at least one decisive leader
    if (q === 15 && (viewerAns === 'A' || candidateAns === 'A')) {
      score += 2;
    }
    // Q16 (stress communication): Complementary styles help
    if (q === 16 && viewerAns !== candidateAns) {
      score += 1;
    }
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 50;
}

// SYMMETRY RULE: Calculate mutual compatibility
// Final score = Average of (how B fits A) + (how A fits B)
export function calculateSymmetricScore(
  viewerAnswers: FounderSyncAnswers,
  candidateAnswers: FounderSyncAnswers
): MatchResult {
  // Calculate scores in both directions
  const complementaryAtoB = calculateComplementaryScore(viewerAnswers, candidateAnswers);
  const complementaryBtoA = calculateComplementaryScore(candidateAnswers, viewerAnswers);
  const overlappingAtoB = calculateOverlappingScore(viewerAnswers, candidateAnswers);
  const overlappingBtoA = calculateOverlappingScore(candidateAnswers, viewerAnswers);
  const decisionAtoB = calculateDecisionCompatibility(viewerAnswers, candidateAnswers);
  const decisionBtoA = calculateDecisionCompatibility(candidateAnswers, viewerAnswers);
  
  // Average the scores (symmetry rule)
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
  // Weight based on dominant model
  let finalScore: number;
  if (modelDominance === 'complementary') {
    finalScore = complementaryScore * 0.5 + overlappingScore * 0.25 + decisionScore * 0.25;
  } else if (modelDominance === 'overlapping') {
    finalScore = overlappingScore * 0.5 + complementaryScore * 0.25 + decisionScore * 0.25;
  } else {
    finalScore = complementaryScore * 0.35 + overlappingScore * 0.35 + decisionScore * 0.30;
  }
  
  // Apply baseline (no matches should be below 35%)
  const baseline = 35;
  const scaledScore = baseline + ((finalScore / 100) * (100 - baseline));
  
  // Determine partnership type
  const partnershipType = determinePartnershipType(
    viewerAnswers, 
    candidateAnswers, 
    modelDominance
  );
  
  return {
    compatibilityScore: Math.min(100, Math.round(scaledScore)),
    partnershipType,
    modelDominance,
    categoryScores: {
      roleAlignment: Math.round(complementaryScore),
      decisionCompatibility: Math.round(decisionScore),
      valuesAlignment: Math.round(overlappingScore),
    },
    symmetryAdjusted: true,
  };
}

// Determine partnership type label based on answers
function determinePartnershipType(
  viewerAnswers: FounderSyncAnswers,
  candidateAnswers: FounderSyncAnswers,
  modelDominance: 'complementary' | 'overlapping' | 'balanced'
): string {
  // Get dominant archetypes from Category A
  const viewerRole = getDominantRole(viewerAnswers);
  const candidateRole = getDominantRole(candidateAnswers);
  
  if (modelDominance === 'complementary') {
    // Complementary type labels
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
    // Overlapping/Peer type labels
    if (viewerRole === 'Builder' && candidateRole === 'Builder') {
      return 'Technical Power Pair';
    }
    if (viewerRole === 'Visionary' && candidateRole === 'Visionary') {
      return 'Vision Alignment Duo';
    }
    if (viewerRole === 'Operator' && candidateRole === 'Operator') {
      return 'Operations Power Pair';
    }
    return 'Peer Founders';
  }
  
  // Balanced
  return 'Balanced Partnership';
}

// Get dominant role from Category A answers
function getDominantRole(answers: FounderSyncAnswers): 'Builder' | 'Visionary' | 'Operator' {
  const counts = { A: 0, B: 0, C: 0 };
  
  for (let q = 1; q <= 10; q++) {
    const ans = getAnswerValue(answers[`q${q}`]);
    if (ans === 'A' || ans === 'B' || ans === 'C') {
      counts[ans]++;
    }
  }
  
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Builder';
  if (counts.B === max) return 'Visionary';
  return 'Operator';
}

// Generate AI summary prompt context
export function generateAISummaryContext(
  matchResult: MatchResult,
  viewerArchetype: string,
  candidateArchetype: string
): string {
  const { modelDominance, partnershipType, categoryScores } = matchResult;
  
  let context = `This is a ${partnershipType} pairing. `;
  
  if (modelDominance === 'complementary') {
    context += `This reflects a classic complementary founder model, similar to successful pairs like Steve Jobs & Steve Wozniak or Brian Chesky & Nathan Blecharczyk. `;
    context += `The ${viewerArchetype} brings different skills that complement the ${candidateArchetype}'s strengths. `;
  } else if (modelDominance === 'overlapping') {
    context += `This reflects a peer founder model, similar to successful pairs like Larry Page & Sergey Brin or the Collison Brothers. `;
    context += `Both founders share similar ${candidateArchetype} orientation, enabling deep collaboration on shared work. `;
  } else {
    context += `This pairing blends complementary skills with shared values, creating a balanced partnership. `;
  }
  
  context += `Role alignment: ${categoryScores.roleAlignment}%. `;
  context += `Decision compatibility: ${categoryScores.decisionCompatibility}%. `;
  context += `Values alignment: ${categoryScores.valuesAlignment}%.`;
  
  return context;
}
