import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LastUpdateData {
  lastUpdate: string | null;
  isLoading: boolean;
}

export const useLastUpdate = (tableName: string): LastUpdateData => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { organization } = useAuth();

  useEffect(() => {
    const fetchLastUpdate = async () => {
      if (!organization?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('data')
          .eq('organization_id', organization.id)
          .order('data', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error(`Erro ao buscar última data de ${tableName}:`, error);
          setLastUpdate(null);
        } else if (data) {
          setLastUpdate(data.data);
        }
      } catch (error) {
        console.error(`Erro ao buscar última data de ${tableName}:`, error);
        setLastUpdate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastUpdate();
  }, [tableName, organization?.id]);

  return { lastUpdate, isLoading };
};
