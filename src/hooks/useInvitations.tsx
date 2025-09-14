import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useInvitations() {
  const { user, organization } = useAuth();
  const [loading, setLoading] = useState(false);

  const generateInviteToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createInvitation = async (email: string, role: 'owner' | 'admin' | 'manager' | 'employee' | 'viewer') => {
    if (!user || !organization) {
      toast.error('Você precisa estar logado para enviar convites');
      return { error: 'Não autenticado' };
    }

    setLoading(true);
    try {
      const invitationToken = generateInviteToken();
      
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: organization.id,
          email: email.toLowerCase(),
          role: role,
          invited_by: user.id,
          invitation_token: invitationToken
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('Este email já foi convidado para esta organização');
        } else {
          toast.error('Erro ao criar convite: ' + error.message);
        }
        return { error };
      }

      toast.success('Convite enviado com sucesso!');
      return { data, inviteLink: `${window.location.origin}/invite/${invitationToken}` };
    } catch (error) {
      toast.error('Erro ao criar convite');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const getInvitations = async () => {
    if (!organization) return { data: [] };

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        profiles!invitations_invited_by_fkey(full_name)
      `)
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  };

  const getInvitationByToken = async (token: string) => {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        organizations(name, logo_url),
        profiles!invitations_invited_by_fkey(full_name)
      `)
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    return { data, error };
  };

  const cancelInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        toast.error('Erro ao cancelar convite');
        return { error };
      }

      toast.success('Convite cancelado com sucesso');
      return { success: true };
    } catch (error) {
      toast.error('Erro ao cancelar convite');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createInvitation,
    getInvitations,
    getInvitationByToken,
    cancelInvitation,
    loading
  };
}