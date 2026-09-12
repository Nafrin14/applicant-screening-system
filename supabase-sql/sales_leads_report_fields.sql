-- Adds the extra per-lead fields the Final Lead Report needs to pull from
-- uploaded CSVs (previously only name/phone/location/business_line/
-- salesperson/stage/lead_date were captured -- see
-- src/sales/modules/dashboard/utils/csvLeadParser.js).
--
-- Run this once in the Supabase SQL editor, same as business_assignments.sql.

alter table sales_leads
  add column if not exists address text,
  add column if not exists comment text,
  add column if not exists final_status text,
  add column if not exists last_stage text;
