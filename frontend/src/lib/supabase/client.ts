import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedSupabaseClient: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    cachedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
    return cachedSupabaseClient;
  } else {
    console.warn(
      'Supabase client configuration is missing. Supabase operations will be disabled.'
    );

    const disabledOperation = (methodName: string) => {
      throw new Error(
        `Supabase client operation "${methodName}" is disabled due to missing configuration.`
      );
    };

    cachedSupabaseClient = new Proxy({} as SupabaseClient, {
      get: (target, prop, receiver) => {
        console.error(
          `Attempted to access property or method '${String(
            prop
          )}' via disabled Supabase client. Supabase operations are unavailable.`
        );
        if (prop === 'from') {
          return (tableName: string) => {
            console.error(`Attempted to access table '${tableName}' via disabled Supabase client.`);
            return new Proxy({}, { get: () => () => disabledOperation(`from(${tableName})`) });
          };
        } else if (prop === 'auth') {
          return new Proxy({}, { get: (authTarget, authProp) => {
            console.error(`Attempted to access auth method '${String(authProp)}' via disabled Supabase client.`);
            if (authProp === 'onAuthStateChange') {
              return () => ({
                data: {
                  subscription: {
                    unsubscribe: () => console.warn('Supabase authentication is disabled.')
                  }
                }
              });
            }
            return () => disabledOperation(`auth.${String(authProp)}`);
          }});
        } else if (prop === 'rpc' || prop === 'storage' || prop === 'functions') {
          return new Proxy({}, { get: () => () => disabledOperation(String(prop)) });
        }
        return () => disabledOperation(String(prop));
      },
      apply: (target, thisArg, argumentsList) => {
        disabledOperation("direct function call on Supabase client mock");
      },
    });
    return cachedSupabaseClient;
  }
};

export { getSupabaseClient };
