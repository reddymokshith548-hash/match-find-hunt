import { supabase } from '@/integrations/supabase/client';

export interface ConnectionResult {
  success: boolean;
  connectionId?: string;
  error?: string;
  alreadyExists?: boolean;
}

async function recordInteractionRpc(fromProfileId: string, toProfileId: string, type: 'like' | 'pass') {
  const { error } = await supabase.rpc('record_interaction', {
    p_from_profile_id: fromProfileId,
    p_to_profile_id: toProfileId,
    p_interaction_type: type,
  });

  if (error) {
    console.error('RPC Error recording interaction:', error.message);
    throw new Error(`Failed to record interaction: ${error.message}`);
  }
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

    // 4. Notification Logic
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

    // 5. Use RPC to record the 'like' interaction
    try {
      await recordInteractionRpc(fromProfileId, toProfileId, 'like');
    } catch (interactionError) {
      console.error('Error recording interaction:', interactionError);
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

export async function recordPass(fromUserId: string, toProfileId: string): Promise<void> {
  try {
    // 1. Fetch the Profile ID of the initiating user from their AUTH User ID
    const { data: fromProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', fromUserId)
      .single();

    if (!fromProfile?.id) {
      console.error('Cannot record pass: Initiating profile not found for user ID.', fromUserId);
      return;
    }

    // 2. Use RPC to record the 'pass' interaction
    await recordInteractionRpc(fromProfile.id, toProfileId, 'pass');
  } catch (error) {
    console.error('Error recording pass:', error);
  }
}
