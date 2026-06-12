import { writeFileSync } from "node:fs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const documentBucket = process.env.SUPABASE_DOCUMENT_BUCKET || "steward-documents";
const internalBucket = process.env.SUPABASE_INTERNAL_BUCKET || "internal-files";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.");
  process.exit(1);
}

const contents = `window.STEWARD_PORTAL_CONFIG = {
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
  documentBucket: ${JSON.stringify(documentBucket)},
  internalBucket: ${JSON.stringify(internalBucket)}
};
`;

writeFileSync("config.js", contents);
console.log("Wrote config.js for Supabase.");
