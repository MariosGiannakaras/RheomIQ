'use strict';

// Public desktop client configuration. These values are intentionally packaged with the app.
// SUPABASE_URL and the Supabase publishable key are public client identifiers, not secrets.
// CARD_VAULT_KEY must never be added here; desktop card-secret operations use the protected
// production MyFinHub API so the vault encryption key remains server-side.
module.exports = Object.freeze({
  supabaseUrl: '__MYFINHUB_SUPABASE_URL__',
  supabasePublishableKey: '__MYFINHUB_SUPABASE_PUBLISHABLE_KEY__',
  productionOrigin: 'https://mgfinhub.vercel.app',
});
