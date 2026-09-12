import { useEffect, useState } from 'react';
import { supabase } from '../../../../core/lib/supabase';
import { formatDateString } from '../../../utils/helpers';

// ─────────────────────────────────────────────────────────────────────────
// Loads the data the Sales Admin Dashboard is built on: active sales reps,
// uploaded CSV files (with the uploader's profile joined in), the set of
// dates that have any upload (for the calendar), and which reps have not
// uploaded anything today. Re-fetches on mount, and exposes `refetch` so
// mutations elsewhere (user CRUD, CSV bulk-delete) can pull fresh data.
// ─────────────────────────────────────────────────────────────────────────
export default function useSalesAdminData({ onError } = {}) {
  const [salesUsers, setSalesUsers] = useState([]);
  const [uploadedCsvFiles, setUploadedCsvFiles] = useState([]);
  const [markedDates, setMarkedDates] = useState([]);
  const [unupdatedUsers, setUnupdatedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCsvIds, setSelectedCsvIds] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: pError } = await supabase
        .from('profiles').select('*').eq('role','user').eq('is_active',true).order('created_at',{ascending:false});
      if (pError) throw pError;
      setSalesUsers(profiles||[]);

      const { data: csvFiles, error: cError } = await supabase
        .from('csv_uploads').select(`id,file_name,status,created_at,user_id,profiles:user_id(name,email)`).order('created_at',{ascending:false});
      if (cError) throw cError;
      setUploadedCsvFiles(csvFiles||[]);
      setMarkedDates([...new Set((csvFiles||[]).map(i=>formatDateString(i.created_at)))]);

      const todayStamp = new Date().toISOString().split('T')[0];
      const activeTodayEmails = new Set((csvFiles||[]).filter(f=>f.created_at?.startsWith(todayStamp)).map(f=>f.profiles?.email).filter(Boolean));
      setUnupdatedUsers((profiles||[]).filter(u=>!activeTodayEmails.has(u.email)));
      setSelectedCsvIds([]);
    } catch(err) {
      console.error(err);
      onError?.('Error pulling data from database.');
    }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchDashboardData(); },[]);

  return {
    salesUsers,
    uploadedCsvFiles,
    markedDates,
    unupdatedUsers,
    loading,
    selectedCsvIds,
    setSelectedCsvIds,
    refetch: fetchDashboardData,
  };
}
