const { saveActions } = require("../utils/utils");

async function drainQueue (domain, actions, q) {
    if (q.length() > 0) await q.drain();
  
    if (actions.length > 0) {
      saveActions(actions);
    }
  
    return true;
  };

module.exports = drainQueue;