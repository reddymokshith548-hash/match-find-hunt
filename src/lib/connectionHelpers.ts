import { supabase } from '@/integrations/supabase/client';

export interface ConnectionResult {
  success: boolean;
  connectionId?: string;
  error?: string;
  alreadyExists?: boolean;
  requiresNDA?: boolean;
  /** True when the daily 10-swipe cap was hit (free plan). */
  swipeLimitReached?: boolean;
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
      // If connection was rejected, delete it so a new request can be sent
      if (existingConnection.status === 'rejected') {
        const { error: deleteError } = await supabase
          .from('connections')
          .delete()
          .eq('id', existingConnection.id);

        if (deleteError) {
          console.error('Error deleting rejected connection:', deleteError);
          throw deleteError;
        }
        // Continue to create new connection below
      } else {
        // For pending or accepted connections, don't allow new request
        return {
          success: false,
          alreadyExists: true,
          error: existingConnection.status === 'pending' 
            ? 'Connection request already pending' 
            : 'Already connected with this user',
        };
      }
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
      // Ensure message is never null/undefined - database requires non-null
      const senderName = fromProfile?.name && fromProfile.name.trim() ? fromProfile.name : 'Someone';
      const notificationMessage = `${senderName} wants to connect with you!`;

      await supabase.from('notifications').insert({
        user_id: toProfile.user_id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: notificationMessage,
        related_user_id: fromProfile?.user_id ?? null,
        related_id: newConnection.id,
        is_read: false,
      });

      // 5. Send email notification
      try {
        // Get recipient's email
        const { data: { user: recipient } } = await supabase.auth.getUser();
        
        // Get recipient profile for email
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('name, user_id')
          .eq('id', toProfileId)
          .single();

        if (recipientProfile) {
          // We need to invoke the edge function to send email
          await supabase.functions.invoke('send-connection-email', {
            body: {
              type: 'connection_request',
              recipientEmail: '', // Will be fetched server-side
              recipientName: recipientProfile.name || 'User',
              senderName: senderName,
              connectionId: newConnection.id,
            },
          });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the connection request if email fails
      }
    }

    // 5. Record the 'like' interaction via RPC (enforces daily swipe cap server-side)
    try {
      await recordInteractionViaRpc(fromProfileId, toProfileId, 'like');
    } catch (interactionError) {
      const msg = interactionError instanceof Error ? interactionError.message : '';
      if (msg.includes('DAILY_SWIPE_LIMIT_REACHED')) {
        return {
          success: false,
          swipeLimitReached: true,
          error: "You've used all 10 swipes for today. Upgrade to keep swiping.",
        };
      }
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
 * Records an interaction via the SECURITY DEFINER RPC. The RPC also runs the
 * daily swipe limiter (10/day for free plan, unlimited for paid).
 */
async function recordInteractionViaRpc(
  fromProfileId: string,
  toProfileId: string,
  type: 'like' | 'pass'
) {
  const { error } = await supabase.rpc('record_interaction', {
    p_from_profile_id: fromProfileId,
    p_to_profile_id: toProfileId,
    p_interaction_type: type,
  });

  if (error) {
    // Surface the limiter error verbatim so callers can detect it
    if (error.message?.includes('DAILY_SWIPE_LIMIT_REACHED')) {
      throw new Error('DAILY_SWIPE_LIMIT_REACHED');
    }
    console.error('record_interaction RPC error:', error.message);
    throw new Error(error.message || 'Failed to record interaction');
  }
}

/**
 * Records a pass interaction. Returns `{ swipeLimitReached: true }` when the
 * caller is a Free user who has used today's quota.
 * @param fromProfileId - The PROFILE ID of the person passing
 * @param toProfileId   - The PROFILE ID of the person being passed on
 */
export async function recordPass(
  fromProfileId: string,
  toProfileId: string
): Promise<{ success: boolean; swipeLimitReached?: boolean; error?: string }> {
  try {
    await recordInteractionViaRpc(fromProfileId, toProfileId, 'pass');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('DAILY_SWIPE_LIMIT_REACHED')) {
      return {
        success: false,
        swipeLimitReached: true,
        error: "You've used all 10 swipes for today.",
      };
    }
    console.error('Error recording pass:', error);
    return { success: false, error: msg || 'Failed to record pass' };
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
