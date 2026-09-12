import { useEffect, useState } from 'react';
import { supabase } from '../../../../core/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────
// Business -> salesperson assignment. This is the single source of truth
// the Final Lead Report reads at generation time instead of trusting
// whatever salesperson name got baked into a sales_leads row when its CSV
// was uploaded -- reassigning a business here takes effect on every future
// report immediately, without touching old rows or CSV data.
// ─────────────────────────────────────────────────────────────────────────
export default function useBusinessAssignments({ notify, showToast } = {}) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_assignments')
        .select('id, business_location, salesperson_name, salesperson_user_id, updated_at')
        .order('business_location', { ascending: true });
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error('Error loading business assignments:', err);
      notify?.('Could not load business assignments. Has supabase-sql/business_assignments.sql been run yet?', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const saveAssignment = async (businessLocation, salespersonName, salespersonUserId = null) => {
    const location = (businessLocation || '').trim();
    const name = (salespersonName || '').trim();
    if (!location || !name) {
      notify?.('Enter both a business and a salesperson name.', { type: 'error' });
      return false;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('business_assignments')
        .upsert(
          {
            business_location: location,
            salesperson_name: name,
            salesperson_user_id: salespersonUserId,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null,
          },
          { onConflict: 'business_location' }
        );
      if (error) throw error;
      showToast?.(`${location} is now assigned to ${name}.`);
      await fetchAssignments();
      return true;
    } catch (err) {
      console.error('Error saving business assignment:', err);
      notify?.('Could not save that assignment.', { type: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { assignments, loading, saving, saveAssignment, refetch: fetchAssignments };
}
