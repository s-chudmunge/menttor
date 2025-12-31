import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn(
    "Supabase admin configuration is missing. Admin operations will be disabled."
  );

  const disabledOperation = (methodName: string) => {
    throw new Error(
      `Supabase admin operation "${methodName}" is disabled due to missing configuration.`
    );
  };

  // Create a proxy that intercepts all property access and method calls
  // and makes them throw an error or return a proxy that throws an error.
  supabaseAdmin = new Proxy({} as SupabaseClient, {
    get: (target, prop, receiver) => {
      // For any property access or method call on the mocked client,
      // return a function that throws an error.
      // This ensures that any attempt to use the disabled client results in a clear error.
      console.error(
        `Attempted to access property or method '${String(
          prop
        )}' via disabled Supabase admin client. Admin operations are unavailable.`
      );
      // Return a function that throws, or a proxy for nested objects
      // to ensure deep access also throws.
      if (prop === 'from') { // 'from' is a common starting point
        return (tableName: string) => {
          console.error(`Attempted to access table '${tableName}' via disabled Supabase admin client.`);
          return new Proxy({}, { get: () => () => disabledOperation(`from(${tableName})`) });
        };
      } else if (prop === 'auth') { // 'auth' is another common entry point
        return new Proxy({}, { get: (authTarget, authProp) => {
          console.error(`Attempted to access auth method '${String(authProp)}' via disabled Supabase admin client.`);
          return () => disabledOperation(`auth.${String(authProp)}`);
        }});
      }
      
      // For all other properties, return a function that throws
      return () => disabledOperation(String(prop));
    },
    apply: (target, thisArg, argumentsList) => {
      // This handles direct function calls if the proxy itself is treated as a function (unlikely for SupabaseClient)
      disabledOperation("direct function call on SupabaseAdmin mock");
    },
  });
}

export { supabaseAdmin };
