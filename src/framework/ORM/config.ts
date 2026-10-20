import { configProfile, ormEnvConfig } from "@/framework/config";
import type { MetaObjectHandler, ResolvedOrmConfig } from "./types";
import { configureSqlLog } from "./sqlLog";

let runtime: Partial<ResolvedOrmConfig> = {};
let metaObjectHandler: MetaObjectHandler | undefined;

function strOrUndef(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/** 读取当前全局 ORM 配置（YAML + configure 覆盖） */
export function getOrmConfig(): ResolvedOrmConfig {
  return {
    logicDelete: runtime.logicDelete ?? ormEnvConfig.logicDelete,
    logicDeleteField:
      runtime.logicDeleteField ?? ormEnvConfig.logicDeleteField,
    logicDeleteValue:
      runtime.logicDeleteValue ?? ormEnvConfig.logicDeleteValue,
    logicNotDeleteValue:
      runtime.logicNotDeleteValue ?? ormEnvConfig.logicNotDeleteValue,
    optimisticLock: runtime.optimisticLock ?? ormEnvConfig.optimisticLock,
    versionField: runtime.versionField ?? ormEnvConfig.versionField,
    idType: runtime.idType ?? ormEnvConfig.idType,
    mapUnderscoreToCamelCase:
      runtime.mapUnderscoreToCamelCase ??
      ormEnvConfig.mapUnderscoreToCamelCase,
    fillCreateTime:
      runtime.fillCreateTime ?? strOrUndef(ormEnvConfig.fillCreateTime),
    fillUpdateTime:
      runtime.fillUpdateTime ?? strOrUndef(ormEnvConfig.fillUpdateTime),
    fillCreateBy:
      runtime.fillCreateBy ?? strOrUndef(ormEnvConfig.fillCreateBy),
    fillUpdateBy:
      runtime.fillUpdateBy ?? strOrUndef(ormEnvConfig.fillUpdateBy),
    sqlLog: runtime.sqlLog ?? ormEnvConfig.sqlLog,
    sqlLogFormat: runtime.sqlLogFormat ?? ormEnvConfig.sqlLogFormat,
    sqlLogParts: runtime.sqlLogParts ?? ormEnvConfig.sqlLogParts,
    sqlLogLevel: runtime.sqlLogLevel ?? ormEnvConfig.sqlLogLevel,
    batchInsertSize:
      runtime.batchInsertSize ?? ormEnvConfig.batchInsertSize,
    batchUpdateSize:
      runtime.batchUpdateSize ?? ormEnvConfig.batchUpdateSize,
    batchInSize: runtime.batchInSize ?? ormEnvConfig.batchInSize,
    mapperLocations:
      runtime.mapperLocations ?? ormEnvConfig.mapperLocations ?? [],
    mapperReload: runtime.mapperReload ?? ormEnvConfig.mapperReload ?? false,
  };
}

function syncSqlLogFromConfig(): void {
  const cfg = getOrmConfig();
  // 生产环境：除非 configureOrm / YAML 显式打开，否则强制关闭 SQL 日志
  const production = configProfile === "production";
  const enabled =
    production && runtime.sqlLog === undefined && ormEnvConfig.sqlLog !== true
      ? false
      : !!cfg.sqlLog;
  if (production && enabled) {
    console.warn(
      "[ORM] 生产环境已开启 SQL 日志，请确认不会泄露敏感参数；日志已对 password/token 等字段脱敏"
    );
  }
  configureSqlLog({
    enabled,
    format: cfg.sqlLogFormat,
    parts: cfg.sqlLogParts,
    level: cfg.sqlLogLevel,
  });
}

// 模块加载时按 YAML 同步一次
syncSqlLogFromConfig();

/**
 * 运行时覆盖全局配置（表级 MapperOptions 仍可再覆盖）。
 * 会清空 Mapper 缓存，使逻辑删除 / 乐观锁等快照配置生效。
 */
export function configureOrm(patch: Partial<ResolvedOrmConfig> = {}): void {
  runtime = { ...runtime, ...patch };
  syncSqlLogFromConfig();
  // 延迟加载，避免 config ↔ table ↔ BaseMapper 循环依赖
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { clearTableCache } = require("./table") as {
    clearTableCache: () => void;
  };
  clearTableCache();
}

/** 注册创建 / 修改拦截（在默认填充之后执行） */
export function setMetaObjectHandler(handler?: MetaObjectHandler): void {
  metaObjectHandler = handler;
}

export function getMetaObjectHandler(): MetaObjectHandler | undefined {
  return metaObjectHandler;
}
