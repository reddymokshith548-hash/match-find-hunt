import { supabase } from '@/integrations/supabase/client';

export interface ConnectionResult {
  success: boolean;
  connectionId?: string;
  error?: string;
  alreadyExists?: boolean;
}

export async function createConnectionRequest(
  fromProfileId: string,
  toProfileId: string
): Promise<ConnectionResult> {
  try {
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

    const { data: fromProfile } = await supabase
      .from('profiles')
      .select('name, user_id')
      .eq('id', fromProfileId)
      .single();

    const { data: toProfile } = await supabase
      .from('profiles')
      .select('name, user_id')
      .eq('id', toProfileId)
      .single();

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

    const { error: interactionError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: fromProfile?.user_id || null,
        target_user_id: toProfile?.user_id || null,
        interaction_type: 'like',
      });

    if (interactionError) {
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

export async function recordPass(fromUserId: string, toUserId: string): Promise<void> {
  try {
    await supabase.from('user_interactions').insert({
      user_id: fromUserId,
      target_user_id: toUserId,
      interaction_type: 'pass',
    });
  } catch (error) {
    console.error('Error recording pass:', error);
  }
}
