import { supabase } from '@/integrations/supabase/client';

export interface ConnectionResult {
  success: boolean;
  connectionId?: string;
  error?: string;
  alreadyExists?: boolean;
  requiresNDA?: boolean;
}

/**
 * Creates a connection request from one profile to another.
 * The sender must sign the NDA separately after this call.
 * @param fromProfileId - The profile ID of the sender
 * @param toProfileId - The profile ID of the recipient
 */
export async function createConnectionRequest(
  fromProfileId: string,
  toProfileId: string
): Promise<ConnectionResult> {
  try {
    // 1. Check for existing connection (uses Profile IDs)
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

    // 2. Insert the new connection (uses Profile IDs)
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

    // 3. Fetch Profile Data for Notification
    const { data: fromProfile } = await supabase
      .from('profiles')
      .select('name, user_id')
      .eq('id', fromProfileId)
      .single();

    const { data: toProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', toProfileId)
      .single();

    // 4. Notification to recipient (uses auth user_id for notifications table)
    if (toProfile?.user_id) {
      await supabase.from('notifications').insert({
        user_id: toProfile.user_id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${fromProfile?.name || 'Someone'} wants to connect with you!`,
        related_user_id: fromProfile?.user_id || null,
        related_id: newConnection.id,
        is_read: false,
      });
    }

    // 5. Record the 'like' interaction (uses auth user IDs for RLS)
    try {
      if (fromProfile?.user_id && toProfile?.user_id) {
        await recordInteractionDirect(fromProfile.user_id, toProfile.user_id, 'like');
      }
    } catch (interactionError) {
      console.error('Error recording interaction:', interactionError);
    }

    return {
      success: true,
      connectionId: newConnection.id,
      requiresNDA: true, // Signal that sender needs to sign NDA
    };
  } catch (error) {
    console.error('Error creating connection:', error);

    const e = error as any;
    const messageParts = [
      typeof e?.message === 'string' ? e.message : null,
      typeof e?.details === 'string' ? e.details : null,
      typeof e?.hint === 'string' ? e.hint : null,
    ].filter(Boolean);

    return {
      success: false,
      error: messageParts.join(' — ') || (typeof e === 'string' ? e : 'Unknown error occurred'),
    };
  }
}

/**
 * Records an interaction using auth user IDs (required by RLS)
 */
async function recordInteractionDirect(fromAuthUserId: string, toAuthUserId: string, type: 'like' | 'pass') {
  const { error } = await supabase.from('user_interactions').insert({
    user_id: fromAuthUserId,
    target_user_id: toAuthUserId,
    interaction_type: type,
  });

  if (error) {
    console.error('Error recording interaction:', error.message);
    throw new Error(`Failed to record interaction: ${error.message}`);
  }
}

/**
 * Records a pass interaction
 * @param fromUserId - The AUTH user ID of the person passing
 * @param toProfileId - The PROFILE ID of the person being passed on
 */
export async function recordPass(fromUserId: string, toProfileId: string): Promise<void> {
  try {
    // Get the target profile's auth user_id
    const { data: toProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', toProfileId)
      .single();

    if (!toProfile?.user_id) {
      console.error('Cannot record pass: Target profile not found for profile ID.', toProfileId);
      return;
    }

    // Record the 'pass' interaction with auth user IDs
    await recordInteractionDirect(fromUserId, toProfile.user_id, 'pass');
  } catch (error) {
    console.error('Error recording pass:', error);
  }
}

/**
 * Sign NDA for a connection
 * @param connectionId - The connection ID
 * @param userId - The AUTH user ID signing
 */
export async function signNDAForConnection(
  connectionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Get user email
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email || '';

    // Insert NDA signature
    const { error: ndaError } = await supabase
      .from('nda_signatures')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        full_name: profile.name || 'Unknown',
        email,
        profile_id: profile.id,
      });

    if (ndaError && ndaError.code !== '23505') {
      throw ndaError;
    }

    // Get connection to determine which field to update
    const { data: connection } = await supabase
      .from('connections')
      .select('user1_id, user2_id')
      .eq('id', connectionId)
      .single();

    if (connection) {
      const isUser1 = connection.user1_id === profile.id;
      const updateField = isUser1 ? 'nda_signed_by_user1' : 'nda_signed_by_user2';
      const timestampField = isUser1 ? 'user1_accepted_at' : 'user2_accepted_at';

      await supabase
        .from('connections')
        .update({
          [updateField]: true,
          [timestampField]: new Date().toISOString(),
        })
        .eq('id', connectionId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error signing NDA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign NDA',
    };
  }
}
