const { supabase } = require('./src/db');
(async () => {
  try {
    const { data, error } = await supabase.rpc('get_columns', { table_name: 'deposits' });
    console.log("RPC Error:", error);
    
    // Alternative: Try fetching a row and dumping its keys
    const { data: rows, error: err2 } = await supabase.from('deposits').select('*').limit(1);
    console.log("Rows:", rows);
    if(rows && rows.length > 0) console.log("Columns:", Object.keys(rows[0]));
    else {
      // Just try inserting a dummy with only essential fields and see what it returns
      const { data: ins, error: err3 } = await supabase.from('deposits').insert({
        user_id: 1, amount: 10
      }).select('*').single();
      console.log("Insert Error:", err3);
      console.log("Inserted:", ins);
      if (ins) {
        console.log("Columns:", Object.keys(ins));
      }
    }
  } catch(e) {
    console.error(e);
  }
})();
