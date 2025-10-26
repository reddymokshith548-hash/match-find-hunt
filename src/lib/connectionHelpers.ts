import { supabase } from '@/integrations/supabase/client';

export interface ConnectionResult {
  success: boolean;
  connectionId?: string;
  error?: string;
  alreadyExists?: boolean;
}

// 🎯 NEW HELPER: Safely get user_id (auth.users.id) from a profile_id (public.profiles.id)
async function getUserIdFromProfileId(profileId: string): Promise<string | null> {
    // Note: The input parameters for recordPass in LiveMatchmaking.tsx need to be checked.
    // Assuming LiveMatchmaking calls recordPass(user.id, targetProfileId) where user.id is the User ID
    // and targetProfileId is the Profile ID.

    // If the input is already a User ID, this function will try to look it up in profiles, which is incorrect.
    // For safety and correctness, we rely on the logic below where all necessary profile data is fetched.
    
    // For createConnectionRequest, both are Profile IDs, so the existing fetch logic is integrated directly.
    return null; // This helper is no longer needed as the full profile fetch is integrated below.
}

export async function createConnectionRequest(
  fromProfileId: string,
  toProfileId: string
): Promise<ConnectionResult> {
  try {
    // 1. Check for existing connection (Correctly uses Profile IDs)
    const { data: existingConnection, error: checkError } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(user1_id.eq.${fromProfileId},user2_id.eq.${toProfileId}),and(user1_id.eq.${toProfileId},user2_id.eq.${fromProfileId})`)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingConnection) {
      return {
        success: false,
        alreadyExists: true,
        error: 'Connection already exists',
      };
    }

    // 2. Insert the new connection (Correctly uses Profile IDs)
    const { data: newConnection, error: createError } = await supabase
      .from('connections')
      .insert({
        user1_id: fromProfileId,
        user2_id: toProfileId,
        status: 'pending',
        nda_signed_by_user1: false,
        nda_signed_by_user2: false,
      })
      .select('id')
      .single();

    if (createError) throw createError;

    // 3. 🎯 CRITICAL FIX: Fetch BOTH User ID and Profile Name for notifications/interactions
    const { data: fromProfile, error: fromProfileError } = await supabase
      .from('profiles')
      .select('name, user_id')
      .eq('id', fromProfileId)
      .single();
      
    const { data: toProfile, error: toProfileError } = await supabase
      .from('profiles')
      .select('name, user_id')
      .eq('id', toProfileId)
      .single();

    if (fromProfileError || toProfileError) {
        // Log the error but proceed with interaction record if profiles exist
        console.error('Error fetching profile data for notification/interaction:', fromProfileError || toProfileError);
    }

    // 4. Notification Logic (Uses toProfile?.user_id)
    if (toProfile?.user_id) {
      await supabase.from('notifications').insert({
        user_id: toProfile.user_id, // Correct: Auth User ID
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${fromProfile?.name || 'Someone'} wants to connect with you!`,
        related_user_id: fromProfile?.user_id || null, // Correct: Auth User ID
        related_id: newConnection.id,
        is_read: false,
      });
    }

    // 5. 🎯 CRITICAL FIX: Record Interaction using the fetched AUTH User IDs
    // This was the source of the "Unknown error" (likely a foreign key violation)
    const { error: interactionError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: fromProfile?.user_id || null,      // Corrected to use AUTH User ID
        target_user_id: toProfile?.user_id || null, // Corrected to use AUTH User ID
        interaction_type: 'like',
      });

    if (interactionError) {
      console.error('Error recording interaction:', interactionError);
      // We don't throw, as the connection request itself was successful
    }

    return {
      success: true,
      connectionId: newConnection.id,
    };
  } catch (error) {
    console.error('Error creating connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// NOTE: We assume LiveMatchmaking.tsx calls this as recordPass(user.id, targetProfileId)
// where user.id is the AUTH User ID and targetProfileId is the Profile ID.
export async function recordPass(fromUserId: string, toProfileId: string): Promise<void> {
  try {
    // The 'from' ID (fromUserId) is assumed to be the AUTH User ID (from user.id).
    // The 'to' ID (toProfileId) is the Profile ID, so we must fetch the corresponding AUTH User ID.
    
    // 🎯 CRITICAL FIX: Fetch the target AUTH User ID
    const { data: toProfile, error: toProfileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', toProfileId)
      .maybeSingle();

    if (toProfileError || !toProfile?.user_id) {
        console.error('Cannot record pass: Target profile user ID not found or error occurred.', toProfileError);
        return;
    }

    // Insert using the correct AUTH User IDs
    await supabase.from('user_interactions').insert({
      user_id: fromUserId,             // This is the correct AUTH User ID
      target_user_id: toProfile.user_id, // Corrected to use the fetched AUTH User ID
      interaction_type: 'pass',
    });
  } catch (error) {
    console.error('Error recording pass:', error);
  }
}
