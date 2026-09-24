const BOOL_VALUE = ["true", "false"] as const;
const IS_NUMBER_REG = /^\d+$/;
const IS_ARRAY_REG = /(\[|\])|'/g;
const CLEAN_SUFFIX_REG = /;\s*$/;

//@ts-ignore
export function parseEnv(env: Record<string, string>): ImportMetaEnv {
  const viteEnv = JSON.parse(JSON.stringify(env));

  function parseArray(key: string) {
    if (!viteEnv[key]) return;

    let str = viteEnv[key]
      .replace(CLEAN_SUFFIX_REG, '')
      .replace(IS_ARRAY_REG, (match: string) => {
        return match === '[' || match === ']' ? match : '"';
      });
    try {
      viteEnv[key] = JSON.parse(str);
    } catch (e) {
      viteEnv[key] = [];
    }

  }

  for (const key in env) {
    if (BOOL_VALUE.includes(env[key] as (typeof BOOL_VALUE)[number])) {
      viteEnv[key] = env[key] === "true";
    }

    if (IS_NUMBER_REG.test(env[key])) {
      viteEnv[key] = Number(env[key]);
    }

    if (viteEnv[key] === "undefined") {
      viteEnv[key] = undefined;
    }

    if (viteEnv[key] === "null") {
      viteEnv[key] = null;
    }

    if (["VITE_PROXY", "VITE_CDN_IMPORT", "VITE_BUILD_EXTERNAL"].includes(key)) {
      parseArray(key)
    }
  }
  return viteEnv;
}


