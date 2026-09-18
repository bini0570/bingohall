const { supabase } = require('./src/db');
(async () => {
  try {
    const { data: rows, error: err2 } = await supabase.from('tasks').select('*').limit(1);
    if(rows && rows.length > 0) console.log("Tasks Columns:", Object.keys(rows[0]));
    else {
      const { data: ins, error: err3 } = await supabase.from('tasks').insert({
        title: 'dummy'
      }).select('*').single();
      console.log("Tasks Insert Error:", err3);
    }
    
    const { data: proms, error: perr } = await supabase.from('promocodes').select('*').limit(1);
    if(proms && proms.length > 0) console.log("Promos Columns:", Object.keys(proms[0]));
    else {
      const { data: insP, error: err4 } = await supabase.from('promocodes').insert({
        code: 'dummy'
      }).select('*').single();
      console.log("Promos Insert Error:", err4);
    }
  } catch(e) {
    console.error(e);
  }
})();
