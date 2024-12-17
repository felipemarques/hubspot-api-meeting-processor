const DISALLOWED_VALUES = new Set([
  '[not provided]',
  'placeholder',
  '[[unknown]]',
  'not set',
  'unknown',
  'undefined',
  'n/a'
]);

/**
 * Filters out null, undefined, and disallowed values from an object.
 * @param {Object} object - The input object.
 * @returns {Object} - The filtered object.
 */
function filterNullValuesFromObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([_, value]) => {
      const isNotEmptyString = value !== '' && typeof value === 'string';
      const isNotDisallowed = isNotEmptyString && !DISALLOWED_VALUES.has(value.toLowerCase());
      return value !== null && typeof value !== 'undefined' && (isNotEmptyString ? isNotDisallowed : true);
    })
  );
}

/**
 * Normalizes a property name by cleaning prefixes, suffixes, and extra underscores.
 * @param {string} key - The original key name.
 * @returns {string} - The normalized key name.
 */
function normalizePropertyName(key) {
  return key
    .toLowerCase()
    .replace(/__c$/, '')     // Remove Salesforce suffix
    .replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
    .replace(/_+/g, '_');    // Replace multiple underscores with a single one
}

/**
 * Gera filtros para datas modificadas.
 * @param {Date} date - Data inicial.
 * @param {Date} nowDate - Data final.
 * @param {string} propertyName - Nome da propriedade.
 * @returns {Object} - Objeto de filtro.
 */
function generateLastModifiedDateFilter(date, nowDate, propertyName = 'hs_lastmodifieddate') {
  return date
    ? {
        filters: [
          { propertyName, operator: 'GTE', value: `${date.valueOf()}` },
          { propertyName, operator: 'LTE', value: `${nowDate.valueOf()}` },
        ],
      }
    : {};
}

/**
 * Saves actions data to the database or logs them.
 * @param {Array|Object} actions - The actions to process.
 */
function saveActions(actions) {
  console.log('📥 Saving actions:', actions);
  // Database logic would go here
}

module.exports = {
  filterNullValuesFromObject,
  normalizePropertyName,
  saveActions,
  generateLastModifiedDateFilter
};
