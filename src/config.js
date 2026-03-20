const runtimeEnv = typeof globalThis !== 'undefined' ? globalThis.ROLECRFT_ENV : undefined;

export const runtimeConfig = {
  supabaseUrl: runtimeEnv?.supabaseUrl || 'https://syrpitwhpsajthojpbcg.supabase.co',
  supabaseAnonKey: runtimeEnv?.supabaseAnonKey || 'sb_publishable_39eUMs3_hVddJhQozmtkxw_mBq1OOiS',
};

export function validateRuntimeConfig() {
  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseAnonKey) {
    throw new Error('Missing Supabase runtime configuration. See .env.example for expected values.');
  }
}
