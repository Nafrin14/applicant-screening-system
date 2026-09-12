import { useState } from 'react';
import { supabase } from '../../../../core/lib/supabase';
import { getDateRange } from '../utils/dateRange';

// ─────────────────────────────────────────────────────────────────────────
// Filtering, selection and bulk-delete for the "CSV Vault" tab
// (uploadedCsvFiles / selectedCsvIds are owned by useSalesAdminData so a
// refetch there — which also clears selection — stays a single source of
// truth; this hook just adds the filter UI state on top).
// ─────────────────────────────────────────────────────────────────────────
export default function useCsvVault(uploadedCsvFiles, selectedCsvIds, setSelectedCsvIds, refetch, { notify, confirmDialog, showToast }) {
  const [csvFilterName, setCsvFilterName] = useState('');
  const [csvDatePreset, setCsvDatePreset] = useState('');
  const [csvCustomStart, setCsvCustomStart] = useState('');
  const [csvCustomEnd, setCsvCustomEnd] = useState('');
  const [csvFilterStatus, setCsvFilterStatus] = useState('');

  const uniqueCsvNames = [...new Set(uploadedCsvFiles.map(f=>f.profiles?.name).filter(Boolean))].sort();

  const resolveDateRange = () => {
    if (csvDatePreset==='custom') return {start:csvCustomStart,end:csvCustomEnd};
    if (csvDatePreset) return getDateRange(csvDatePreset);
    return {start:'',end:''};
  };

  const filteredCsvFiles = uploadedCsvFiles.filter(f => {
    if (csvFilterName && f.profiles?.name!==csvFilterName) return false;
    if (csvFilterStatus && f.status!==csvFilterStatus) return false;
    const {start,end} = resolveDateRange();
    const fd = f.created_at?.split('T')[0]||'';
    if (start && fd<start) return false;
    if (end   && fd>end)   return false;
    return true;
  });

  const handleCsvCheckbox = (id) => setSelectedCsvIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const handleSelectAllCsvs = (e) => setSelectedCsvIds(e.target.checked?filteredCsvFiles.map(f=>f.id):[]);

  // Changing any filter clears the current selection, same as the original
  // inline onChange handlers did.
  const handleFilterNameChange = (v) => { setCsvFilterName(v); setSelectedCsvIds([]); };
  const handleDatePresetChange = (v) => { setCsvDatePreset(v); setCsvCustomStart(''); setCsvCustomEnd(''); setSelectedCsvIds([]); };
  const handleCustomStartChange = (v) => { setCsvCustomStart(v); setSelectedCsvIds([]); };
  const handleCustomEndChange = (v) => { setCsvCustomEnd(v); setSelectedCsvIds([]); };
  const handleFilterStatusChange = (v) => { setCsvFilterStatus(v); setSelectedCsvIds([]); };

  const handleBulkDeleteCsvs = async () => {
    if (!selectedCsvIds.length) return;
    if (!(await confirmDialog(`Delete ${selectedCsvIds.length} file(s)?`, { danger: true, confirmLabel: 'Delete' }))) return;
    try {
      const {error} = await supabase.from('csv_uploads').delete().in('id',selectedCsvIds);
      if (error) throw error;
      showToast(`${selectedCsvIds.length} file(s) deleted.`); setSelectedCsvIds([]); refetch();
    } catch { notify('Error deleting files.', { type: 'error' }); }
  };

  const clearCsvFilters = () => { setCsvFilterName('');setCsvDatePreset('');setCsvCustomStart('');setCsvCustomEnd('');setCsvFilterStatus('');setSelectedCsvIds([]); };

  return {
    csvFilterName,
    csvDatePreset,
    csvCustomStart,
    csvCustomEnd,
    csvFilterStatus,
    onFilterNameChange: handleFilterNameChange,
    onDatePresetChange: handleDatePresetChange,
    onCustomStartChange: handleCustomStartChange,
    onCustomEndChange: handleCustomEndChange,
    onFilterStatusChange: handleFilterStatusChange,
    uniqueCsvNames,
    filteredCsvFiles,
    handleCsvCheckbox,
    handleSelectAllCsvs,
    handleBulkDeleteCsvs,
    clearCsvFilters,
  };
}
