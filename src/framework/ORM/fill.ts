import { AuthUtil } from "@/framework/Auth/AuthUtil";
import { getMetaObjectHandler, getOrmConfig } from "./config";
import type { ResolvedOrmConfig } from "./types";

function now(): Date {
  return new Date();
}

function assignIfAbsent(
  entity: Record<string, any>,
  field: string | undefined,
  value: unknown
): void {
  if (!field || value === undefined || value === null) return;
  if (entity[field] === undefined) {
    entity[field] = value;
  }
}

async function currentUser(): Promise<unknown> {
  try {
    return await AuthUtil.getLoginIdDefaultNull();
  } catch {
    return null;
  }
}

/** 插入前默认填充 + 用户拦截 */
export async function applyInsertFill(
  entity: Record<string, any>,
  cfg: ResolvedOrmConfig,
  fillEnabled: boolean
): Promise<void> {
  if (fillEnabled) {
    const user = await currentUser();
    assignIfAbsent(entity, cfg.fillCreateTime, now());
    assignIfAbsent(entity, cfg.fillUpdateTime, now());
    assignIfAbsent(entity, cfg.fillCreateBy, user);
    assignIfAbsent(entity, cfg.fillUpdateBy, user);
  }
  await getMetaObjectHandler()?.insert?.(entity);
}

/** 更新 / 逻辑删除前默认填充 + 用户拦截 */
export async function applyUpdateFill(
  entity: Record<string, any>,
  cfg: ResolvedOrmConfig,
  fillEnabled: boolean
): Promise<void> {
  if (fillEnabled) {
    const user = await currentUser();
    assignIfAbsent(entity, cfg.fillUpdateTime, now());
    assignIfAbsent(entity, cfg.fillUpdateBy, user);
  }
  await getMetaObjectHandler()?.update?.(entity);
}

export { getOrmConfig };
