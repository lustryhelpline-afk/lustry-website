/*
  PUBLIC FRONTEND CONFIG ONLY.
  Safe to commit: Supabase project URL and anon/publishable key are intended for browser use
  when Row Level Security is configured correctly. NEVER put a service_role key or AI API key here.
*/
window.LUSTRY_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY",
  submitOrderFunction: "submit-order",
  aiSupportFunction: "ai-support",
  whatsappNumber: "", // digits only with country code, e.g. 91XXXXXXXXXX; optional
  companyEmail: "",   // replace with a monitored business email
  currency: "INR"
};
