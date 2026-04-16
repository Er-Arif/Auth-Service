function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function subtractHours(date, hours) {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

function subtractDays(date, days) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

module.exports = {
  addMinutes,
  addDays,
  subtractHours,
  subtractDays,
};
