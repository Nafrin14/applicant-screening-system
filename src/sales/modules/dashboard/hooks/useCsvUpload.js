import { useState } from "react";
import { supabase } from "../../../../core/lib/supabase";
import Papa from "papaparse";
import confetti from "canvas-confetti";
import { buildLeadRows } from "../utils/csvLeadParser";

// ─────────────────────────────────────────────────────────────────────────
// CSV upload flow, shared by the sales-rep dashboard and the admin's
// "Upload Leads CSV" panel on View Salesperson Records: validates the
// picked files are .csv, records them in csv_uploads, parses each with
// Papa Parse and inserts the resulting rows into sales_leads, then
// refreshes the upload history and shows the success toast/confetti.
//
// `getTargetUserId`, when given, lets an admin upload a CSV on another
// salesperson's behalf -- the rows get attributed to that salesperson's
// user_id instead of whoever is actually logged in (used when a
// salesperson is on leave and can't upload themselves). Leave it out (the
// rep dashboard's own usage) and rows are attributed to the logged-in
// user, exactly as before.
// ─────────────────────────────────────────────────────────────────────────
export default function useCsvUpload({ notify, refetch, getTargetUserId }) {
  const [uploading, setUploading] = useState(false);
  const [uploadToast, setUploadToast] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const invalidFiles = files.filter(
      (file) => !file.name.toLowerCase().endsWith(".csv")
    );

    if (invalidFiles.length > 0) {
      notify("Please upload CSV files only.", { type: "error" });
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not logged in.");

      const targetUserId = getTargetUserId?.() || user.id;

      // Fetch the current business -> salesperson assignments once per
      // batch, so buildLeadRows can prefer them over the static filename
      // mapping in accountMapping.js.
      const { data: assignmentRows } = await supabase
        .from("business_assignments")
        .select("business_location, salesperson_name");
      const assignmentMap = Object.fromEntries(
        (assignmentRows || []).map((a) => [a.business_location, a.salesperson_name])
      );

      // Step A: Save file to csv_uploads and get back the ID
      const uploadData = files.map((file) => ({
        user_id: targetUserId,
        file_name: file.name,
        file_path: file.name,
        status: "success",
      }));

      const { data: insertedFiles, error: uploadError } = await supabase
        .from("csv_uploads")
        .insert(uploadData)
        .select();

      if (uploadError) throw uploadError;

      // Step B: Parse each CSV file and save rows to sales_leads
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const csvUploadId = insertedFiles[i].id;

        console.log(`📁 Processing file ${i + 1}:`, file.name);
        console.log("📋 CSV Upload ID:", csvUploadId);

        await new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              console.log("STEP 1 - Papa parsed rows:", results.data.length);
              console.log("STEP 2 - Headers:", Object.keys(results.data[0] || {}));
              console.log("STEP 3 - First row:", results.data[0]);

              const leadRows = buildLeadRows(results.data, {
                fileName: file.name,
                userId: targetUserId,
                csvUploadId,
                assignmentMap,
              });

              if (leadRows.length > 0) {
                const { data, error: leadError } = await supabase
                  .from("sales_leads")
                  .insert(leadRows)
                  .select();

                console.log("STEP 6 - Insert result:", data);
                console.log("STEP 7 - Insert error:", leadError);

                if (leadError) {
                  console.error("❌ Error inserting leads:", leadError);
                } else {
                  console.log(`✅ Successfully inserted ${leadRows.length} leads`);
                }
              } else {
                console.warn("⚠️ No rows to insert for file:", file.name);
              }

              resolve();
            },
            error: (error) => {
              console.error("❌ Papa Parse error:", error);
              resolve();
            },
          });
        });
      }

      await refetch();

      confetti({
        particleCount: 250,
        spread: 130,
        origin: { y: 0.6 },
      });

      setUploadedFileName(
        files.length === 1
          ? files[0].name
          : `${files.length} CSV files uploaded`
      );

      setUploadToast(true);

      setTimeout(() => {
        setUploadToast(false);
      }, 2500);
    } catch (err) {
      console.error("❌ Upload error:", err);
      notify(err.message || "Upload failed.", { type: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return {
    uploading,
    uploadToast,
    uploadedFileName,
    handleFileUpload,
  };
}
