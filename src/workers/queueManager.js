const { queue } = require('async');

/**
 * Cria uma fila para processar ações.
 */
function createQueue(actions, batchSize = 2000) {
  return queue(async (action, callback) => {
    actions.push(action);

    if (actions.length >= batchSize) {
      console.log(`Saving batch of ${actions.length} actions...`);
      actions.length = 0; // Limpa as ações
    }

    callback();
  }, 100);
}

module.exports = { createQueue };
