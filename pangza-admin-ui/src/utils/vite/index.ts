const BOOL_VALUE = ["true", "false"] as const;
const IS_NUMBER_REG = /^\d+$/;
const IS_ARRAY_REG = /'/g;

function buildEnv(env: Record<string, any>): ImportMetaEnv {
  const viteEnv = JSON.parse(JSON.stringify(env));
  for (const key in env) {
    if (BOOL_VALUE.includes(env[key] as (typeof BOOL_VALUE)[number])) {
      viteEnv[key] = env[key] === "true";
    } else if (IS_NUMBER_REG.test(env[key])) {
      viteEnv[key] = Number(env[key]);
    } else if (viteEnv[key] === "undefined") {
      viteEnv[key] = undefined;
    } else if (viteEnv[key] === "null") {
      viteEnv[key] = null;
    } else if (key === "VITE_PROXY") {
      viteEnv[key] = viteEnv[key].replace(IS_ARRAY_REG, '"');
      viteEnv[key] = JSON.parse(viteEnv[key]);
    } else {
      viteEnv[key] = env[key];
    }
  }
  return viteEnv;
}

export function getEnv() {
  return buildEnv(import.meta.env);
}
