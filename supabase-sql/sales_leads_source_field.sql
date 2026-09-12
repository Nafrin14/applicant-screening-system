-- Adds the lead source field ("where did the customer hear about us" --
-- Google, Repeat Client, Optin Claim for Website, etc., as several of the
-- uploaded CSVs already record it under a "Source" column) to sales_leads
-- and the Final Lead Report.
--
-- Run this once in the Supabase SQL editor.

alter table sales_leads
  add column if not exists source text;
