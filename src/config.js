window.Rolecrft = window.Rolecrft || {};

(function(ns){
  const runtimeEnv = typeof globalThis !== 'undefined' ? globalThis.ROLECRFT_ENV : undefined;

  ns.runtimeConfig = {
    supabaseUrl: runtimeEnv?.supabaseUrl || 'https://syrpitwhpsajthojpbcg.supabase.co',
    supabaseAnonKey: runtimeEnv?.supabaseAnonKey || 'sb_publishable_39eUMs3_hVddJhQozmtkxw_mBq1OOiS',
  };

  ns.validateRuntimeConfig = function validateRuntimeConfig() {
    if (!ns.runtimeConfig.supabaseUrl || !ns.runtimeConfig.supabaseAnonKey) {
      throw new Error('Missing Supabase runtime configuration. See .env.example for expected values.');
    }
  };
})(window.Rolecrft);
