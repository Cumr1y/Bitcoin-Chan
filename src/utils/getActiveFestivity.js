const festivities = require("./festivities");

/**
 * Determina si hay una festividad activa hoy
 * @returns {Object|null} La festividad activa o null
 */
module.exports = () => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  for (const [name, festivity] of Object.entries(festivities)) {
    const { dates, range } = festivity;
    const festivityDate = new Date(today.getFullYear(), dates.month - 1, dates.day);
    
    // Calcular rango de fechas
    const startDate = new Date(festivityDate);
    startDate.setDate(startDate.getDate() - range);
    
    const endDate = new Date(festivityDate);
    endDate.setDate(endDate.getDate() + range);

    // Verificar si hoy está en el rango
    if (today >= startDate && today <= endDate) {
      return {
        name,
        ...festivity,
      };
    }
  }

  return null;
};
