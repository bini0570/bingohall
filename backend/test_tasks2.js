const { supabase } = require('./src/db');
(async () => {
  try {
    const { data: ins, error: err3 } = await supabase.from('tasks').insert({
      type: 'DAILY', title: 'dummy'
    }).select('*').single();
    if(ins) console.log("Tasks Columns:", Object.keys(ins));
    else console.log("Tasks Insert Error:", err3);
    
    const { data: proms, error: err4 } = await supabase.from('promo_codes').insert({
      code: 'dummy', discount: 10, reward_amount: 10
    }).select('*').single();
    if(proms) console.log("Promos Columns:", Object.keys(proms));
    else console.log("Promos Insert Error:", err4);
  } catch(e) {
    console.error(e);
  }
})();
