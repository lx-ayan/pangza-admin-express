"use strict";

/** user_role / user-role / userRole → user_role (table) */
function toSnake(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .replace(/__+/g, "_")
    .toLowerCase();
}

/** user_role → userRole */
function toCamel(name) {
  const snake = toSnake(name);
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** user_role → UserRole */
function toPascal(name) {
  const camel = toCamel(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** user_role → user-role (url segment often snake or kebab; we use snake for path) */
function toApiPath(name) {
  return toSnake(name).replace(/_/g, "-");
}

/** file base under src/* : prefer camel for multi-word, keep simple names as-is */
function toFileBase(name) {
  return toCamel(name);
}

module.exports = {
  toSnake,
  toCamel,
  toPascal,
  toApiPath,
  toFileBase,
};
