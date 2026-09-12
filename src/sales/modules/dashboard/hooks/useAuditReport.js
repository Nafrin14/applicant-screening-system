import { useState } from 'react';
import { downloadAuditPdf } from '../utils/generateAuditPdf';

export const AUDIT_REPORT_STAGES = ['Appointment Booked','New Leads','Pending Service Completion','General'];

// ─────────────────────────────────────────────────────────────────────────
// State + actions for the "Final Audit Report" tab: the lead-report PDF
// filters/download, and the (currently unpopulated, kept as-is from the
// original dashboard) AI narrative report state.
// ─────────────────────────────────────────────────────────────────────────
export default function useAuditReport({ showToast }) {
  // ── AI Report (kept as in the original dashboard — nothing currently sets
  //    these beyond their initial values, but the "Final Audit Report" tab
  //    still reads them, so the state stays put) ─────────────────────────
  const [aiReport, setAiReport] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressLabel, setAiProgressLabel] = useState('');
  const [reportData, setReportData] = useState(null);

  // ── PDF filter state ───────────────────────────────────────────────────
  const [pdfFilterUser, setPdfFilterUser] = useState('');
  const [pdfFilterStart, setPdfFilterStart] = useState('');
  const [pdfFilterEnd, setPdfFilterEnd] = useState('');
  const [pdfFilterStage, setPdfFilterStage] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleDownloadAIPdf = () => downloadAuditPdf({
    pdfFilterUser,
    pdfFilterStart,
    pdfFilterEnd,
    pdfFilterStage,
    showToast,
    setPdfGenerating,
  });

  return {
    aiReport, setAiReport,
    aiGenerating, setAiGenerating,
    aiProgress, setAiProgress,
    aiProgressLabel, setAiProgressLabel,
    reportData, setReportData,
    pdfFilterUser, setPdfFilterUser,
    pdfFilterStart, setPdfFilterStart,
    pdfFilterEnd, setPdfFilterEnd,
    pdfFilterStage, setPdfFilterStage,
    pdfGenerating,
    handleDownloadAIPdf,
  };
}
