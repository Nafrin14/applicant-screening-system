import { useState } from 'react';
import { supabase } from '../../../../core/lib/supabase';
import { useNotification } from '../../../../core/context/NotificationContext';

import useSalesAdminData from '../hooks/useSalesAdminData';
import useUserManagement from '../hooks/useUserManagement';
import useCsvVault from '../hooks/useCsvVault';
import useAuditReport from '../hooks/useAuditReport';

import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import OverviewTab from '../components/admin/OverviewTab';
import UsersTab from '../components/admin/UsersTab';
import UserFormTab from '../components/admin/UserFormTab';
import CsvVaultTab from '../components/admin/CsvVaultTab';
import AiReportTab from '../components/admin/AiReportTab';

export default function SalesAdminDashboard() {
  const { notify, confirmDialog } = useNotification();

  // ── Navigation & UI ────────────────────────────────────────────────────────
  // ─── FIX: default tab opens on CSV Vault (View Salesperson Records) ───────
  const [activeTab, setActiveTab] = useState('csv-vault');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overviewUserFilter, setOverviewUserFilter] = useState('');
  const [notification, setNotification] = useState('');

  const showToast = (msg) => { setNotification(msg); setTimeout(()=>setNotification(''),4500); };

  const {
    salesUsers,
    uploadedCsvFiles,
    markedDates,
    unupdatedUsers,
    loading,
    selectedCsvIds,
    setSelectedCsvIds,
    refetch: fetchDashboardData,
  } = useSalesAdminData({ onError: showToast });

  const userMgmt = useUserManagement(fetchDashboardData, { notify, confirmDialog, showToast, setActiveTab });
  const csvVault = useCsvVault(uploadedCsvFiles, selectedCsvIds, setSelectedCsvIds, fetchDashboardData, { notify, confirmDialog, showToast });
  const auditReport = useAuditReport({ showToast });

  const handleLogout = async () => {
    if (await confirmDialog('Log out?')) {
      await supabase.auth.signOut();
      localStorage.removeItem('isLoggedIn');
      window.location.href='/login';
    }
  };

  return (
    <div className="flex bg-slate-50 text-slate-800 font-sans">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-x-hidden lg:ml-72 h-screen overflow-y-auto">
        <AdminHeader
          activeTab={activeTab}
          isEditing={userMgmt.isEditing}
          loading={loading}
          onRefresh={fetchDashboardData}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6 lg:space-y-8 flex-1">

          {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────── */}
          {activeTab==='overview' && (
            <OverviewTab
              salesUsers={salesUsers}
              uploadedCsvFiles={uploadedCsvFiles}
              unupdatedUsers={unupdatedUsers}
              overviewUserFilter={overviewUserFilter}
              setOverviewUserFilter={setOverviewUserFilter}
              markedDates={markedDates}
              onAddUser={userMgmt.handleOpenCreateMode}
              onGenerateReport={() => setActiveTab('ai-report')}
            />
          )}

          {/* ── TAB 2: MANAGE USERS ─────────────────────────────────────── */}
          {activeTab==='users' && (
            <UsersTab
              salesUsers={salesUsers}
              uploadedCsvFiles={uploadedCsvFiles}
              unupdatedUsers={unupdatedUsers}
              onAddUser={userMgmt.handleOpenCreateMode}
              onEdit={userMgmt.handleOpenEditMode}
              onDelete={userMgmt.handleDeleteUser}
            />
          )}

          {/* ── TAB 3: USER FORM ────────────────────────────────────────── */}
          {activeTab==='user-form' && (
            <UserFormTab
              isEditing={userMgmt.isEditing}
              formName={userMgmt.formName} setFormName={userMgmt.setFormName}
              formEmail={userMgmt.formEmail} setFormEmail={userMgmt.setFormEmail}
              formPassword={userMgmt.formPassword} setFormPassword={userMgmt.setFormPassword}
              formResetPassword={userMgmt.formResetPassword} setFormResetPassword={userMgmt.setFormResetPassword}
              onSubmit={userMgmt.handleSaveUserForm}
              onCancel={() => setActiveTab('users')}
            />
          )}

          {/* ── TAB 4: CSV VAULT ────────────────────────────────────────── */}
          {activeTab==='csv-vault' && (
            <CsvVaultTab
              csvFilterName={csvVault.csvFilterName} onFilterNameChange={csvVault.onFilterNameChange}
              csvDatePreset={csvVault.csvDatePreset} onDatePresetChange={csvVault.onDatePresetChange}
              csvCustomStart={csvVault.csvCustomStart} onCustomStartChange={csvVault.onCustomStartChange}
              csvCustomEnd={csvVault.csvCustomEnd} onCustomEndChange={csvVault.onCustomEndChange}
              csvFilterStatus={csvVault.csvFilterStatus} onFilterStatusChange={csvVault.onFilterStatusChange}
              uniqueCsvNames={csvVault.uniqueCsvNames}
              filteredCsvFiles={csvVault.filteredCsvFiles}
              selectedCsvIds={selectedCsvIds}
              onCheckbox={csvVault.handleCsvCheckbox}
              onSelectAll={csvVault.handleSelectAllCsvs}
              onBulkDelete={csvVault.handleBulkDeleteCsvs}
              onClearFilters={csvVault.clearCsvFilters}
            />
          )}

          {/* ── TAB 5: AI REPORT ────────────────────────────────────────── */}
          {activeTab==='ai-report' && (
            <AiReportTab
              salesUsers={salesUsers}
              pdfFilterUser={auditReport.pdfFilterUser} setPdfFilterUser={auditReport.setPdfFilterUser}
              pdfFilterStart={auditReport.pdfFilterStart} setPdfFilterStart={auditReport.setPdfFilterStart}
              pdfFilterEnd={auditReport.pdfFilterEnd} setPdfFilterEnd={auditReport.setPdfFilterEnd}
              pdfFilterStage={auditReport.pdfFilterStage} setPdfFilterStage={auditReport.setPdfFilterStage}
              pdfGenerating={auditReport.pdfGenerating}
              onDownload={auditReport.handleDownloadAIPdf}
              aiGenerating={auditReport.aiGenerating}
              aiProgress={auditReport.aiProgress}
              aiProgressLabel={auditReport.aiProgressLabel}
              reportData={auditReport.reportData}
            />
          )}

        </main>
      </div>

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 bg-slate-900 text-white text-xs px-4 py-3 lg:px-5 lg:py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 max-w-[90vw] lg:max-w-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"/>
          <p className="font-bold tracking-wide">{notification}</p>
        </div>
      )}
    </div>
  );
}
