/**
 * Framework 统一导出入口。
 *
 * @example
 * import { Application, Auth, Redis, Controller, GetMapping } from "@/framework";
 */

// ─── Application（HTTP / 装饰器门面）─────────────────────────────
export {
  default as Application,
  applicationStart,
  ParamType,
  Controller,
  GetMapping,
  PostMapping,
  PutMapping,
  DeleteMapping,
  AuthCheckLogin,
  AuthCheckRole,
  AuthCheckPermission,
  AuthIgnore,
  Log,
  Flux,
  RequestBody,
  RequestQuery,
  RequestPath,
  RequestHeader,
  RequestCookie,
  Value,
  BusinessType,
  OperType,
  RateLimiter,
  RepeatSubmit,
  RateLimiterType,
  Transactional,
  getLogger,
  logger,
  configureLogger,
  JsonFormat,
  JsonInclude,
  JsonIncludeType,
  JsonProperty,
  ObjectMapper,
  convert,
  copyProperties,
  pick,
  ControllerAdvice,
  ExceptionHandler,
  BizException,
  registerHandler,
  Validate,
  NotNull,
  Min,
  Max,
  Email,
  Phone,
  Custom,
  validateHandler,
  ValidationError,
} from "./Application";
export type {
  RouteOption,
  ApplicationInit,
  ApplicationDestroy,
} from "./Application";

// ─── Auth ───────────────────────────────────────────────────────
export {
  default as Auth,
  matchesIgnore,
  isGloballyIgnored,
  AuthUtil,
  getAuthOptions,
  isSessionExpired,
  AUTH_MIDDLEWARE_FLAG,
  AuthError,
  NotLoginError,
  NotPermissionError,
  NotRoleError,
  createAuthToken,
  generateStyleToken,
  verifyAuthToken,
} from "./Auth";
export type {
  AuthOptions,
  AuthSession,
  LoginId,
  LoginOptions,
  TokenStyle,
  AuthCheckMode,
  ResolvedAuthOptions,
} from "./Auth";

// ─── Redis（含限流 / 防重复提交）────────────────────────────────
export {
  default as Redis,
  RATE_LIMIT_KEY,
  REPEAT_SUBMIT_KEY,
  CACHE_KEY,
  LOCK_KEY,
  GuardError,
  LockError,
  applyRateLimit,
  applyRepeatSubmit,
  Cacheable,
  CacheEvict,
  Redisson,
  createRedisson,
  defaultRedissonConfig,
} from "./Redis";
export type {
  RedisConfig,
  RedisTlsConfig,
  RedisMode,
  RedisClusterConfig,
  RedisSentinelConfig,
  RateLimitOption,
  RateLimitMode,
  RepeatSubmitOption,
  RateLimiterTypeValue,
  CacheableOption,
  CacheEvictOption,
  TryLockOption,
  WithLockOption,
  LockHandle,
  RedissonClient,
  RedissonConfig,
  RLock,
  RReadWriteLock,
  RSemaphore,
  RCountDownLatch,
  RAtomicLong,
  RBucket,
  RMap,
  RSet,
  RList,
  RScoredSortedSet,
  RTopic,
  RRateLimiter,
  RBitSet,
  RQueue,
} from "./Redis";

// ─── ORM ────────────────────────────────────────────────────────
export {
  default as Db,
  BaseMapper,
  table,
  useTable,
  clearTableCache,
  QueryWrapper,
  TableSearch,
  OperTypeEnum,
  getTableSearchMeta,
  getQueryWrapper,
  getQueryWrapperAndPage,
  assertIdent,
  assertSafeUint,
  escapeLike,
  assertSafeLastSql,
  configureOrm,
  getOrmConfig,
  setMetaObjectHandler,
  getMetaObjectHandler,
  configureSqlLog,
  getSqlLogRuntime,
  renderSqlLog,
  detectSqlType,
  DEFAULT_SQL_LOG_FORMAT,
  OrmError,
  OptimisticLockError,
  Select,
  Insert,
  Update,
  Delete,
  Param,
  MAPPER_ENTITY_KEY,
  registerFieldSelect,
  getFieldSelects,
  getFieldSelect,
  hydrateFieldSelects,
  hydrateRelations,
  buildRowParamContext,
  ManyToOne,
  OneToMany,
  ManyToMany,
  getRelations,
  getRelation,
  MapperXml,
  xmlMapper,
  loadXmlMappers,
  parseMapperXml,
  renderStatementSql,
  parseMybatisSql,
  buildParamContext,
  TableName,
  TableId,
  TableField,
  getTableName,
  getEntityFields,
  getEntityIdField,
  getEntityTableMeta,
  applyEntityFieldFills,
  IdType,
  resolveIdType,
  setIdentifierGenerator,
  getIdentifierGenerator,
  defaultIdentifierGenerator,
  DataSource,
  getDialect,
} from "./ORM";
export type {
  FieldSelectOptions,
  FieldSelectMeta,
  HydrateFieldSelectOptions,
  HydrateRelationsOptions,
  RelationMeta,
  ManyToOneOptions,
  OneToManyOptions,
  ManyToManyOptions,
  ParsedSql,
  MysqlConfig,
  MapperOptions,
  MapperTableOptions,
  PageQuery,
  IPage,
  SqlFragment,
  ResolvedOrmConfig,
  MetaObjectHandler,
  SqlLogParts,
  SqlLogInfo,
  SqlLogFormatFn,
  FieldFillValue,
  TableFieldOptions,
  TableIdOptions,
  EntityFieldMeta,
  EntityTableMeta,
  TableSearchOptions,
  TableSearchMeta,
  QueryWrapperAndPage,
  SqlExecuteOptions,
  SelectOptions,
  SelectQueryOptions,
  TransactionalOptions,
  TransactionPropagation,
  XmlMapperApi,
  MapperXmlOptions,
  DbType,
  Dialect,
  DataSourceConfig,
  IdTypeValue,
  IdentifierGenerator,
} from "./ORM";

// ─── Log（操作日志模块工厂；方法装饰器见上方 Log）────────────────
export {
  default as LogModule,
  LOG_MIDDLEWARE_FLAG,
  configureLog,
  recordOperationLog,
  isLogRegistered,
  getLogOptions,
  getClientIp,
  resolveIpAddress,
  normalizeIp,
  isInternalIp,
} from "./Log";
export type {
  LogModuleOptions,
  LogRecordOption,
  BusinessTypeValue,
  OperTypeValue,
  OperationLogRecord,
} from "./Log";

// ─── Logger ─────────────────────────────────────────────────────
export {
  default as Logger,
  ensureUtf8Console,
  getRootLogger,
} from "./Logger";
export type { PinoLogger, LoggerOptions, LogLevel } from "./Logger";

// ─── Json（模块工厂；常用装饰器/工具见上方 Application 再导出）───
export {
  default as Json,
  formatDate,
  shouldOmitByInclude,
  getJsonFieldFormats,
  getJsonFieldFormat,
  getGlobalFieldFormat,
  getGlobalFieldInclude,
  getClassJsonInclude,
  getJsonFieldIncludes,
  getJsonFieldInclude,
  addBeanKey,
  getBeanKeys,
} from "./Json";
export type {
  ConvertOptions,
  JsonFormatOptions,
  JsonIncludeOptions,
  ObjectMapperOptions,
  JsonFieldFormatMeta,
  JsonFieldIncludeMeta,
} from "./Json";

// ─── Exception ──────────────────────────────────────────────────
export {
  default as Exception,
  handleException,
  registerExceptionHandler,
  clearExceptionHandlers,
  getExceptionHandlers,
  resolveExceptionHandler,
} from "./Exception";
export type {
  ExceptionContext,
  ExceptionHandlerFn,
  ExceptionHandlerResult,
  ExceptionHandlerMeta,
} from "./Exception";

// ─── Validate（规则函数 / 引擎扩展；常用装饰器见上方）────────────
export {
  notNull,
  min,
  max,
  email,
  phone,
  custom,
  getClassRules,
  isMethodValidate,
  getMethodParamTypes,
  validateHandlerSync,
  validateMethodArgs,
} from "./Validate";
export type {
  ValidateRule,
  RuleOptions,
  FieldError,
  ClassRuleMap,
  ValidatorParam,
} from "./Validate";

// ─── Service（IoC）──────────────────────────────────────────────
export {
  Container,
  Component,
  Resource,
  Bean,
  Mapper,
  Service,
  Inject,
  BaseService,
  MapperType,
  MAPPER_DELEGATE_METHODS,
} from "./Service";
export type {
  Ctor,
  IService,
  MapperDelegateMethod,
  BeanToken,
  BeanOptions,
  BeanMethodMeta,
} from "./Service";

// ─── config ─────────────────────────────────────────────────────
export {
  PORT,
  trustProxy,
  redisConfig,
  mysqlConfig,
  UPLOAD_PATH,
  UPLOAD_URL_PREFIX,
  ormEnvConfig,
  getConfig,
  getConfigValue,
  parseValueExpression,
  coerceConfigScalar,
  configProfile,
  configFiles,
} from "./config";

// ─── encrypt（仅工具方法，不含业务开关 / 中间件）────────────────
export { AESUtil, DynamicAesKeyManager } from "./encrypt";

// ─── schedule ───────────────────────────────────────────────────
export {
  ScheduleManager,
  initScheduleJobs,
  configureSchedule,
  convertQuartzCron,
  validateCron,
} from "./schedule/ScheduleManager";
export type {
  ScheduleJobEntity,
  ScheduleJobLoader,
  ScheduleModuleOptions,
} from "./schedule/ScheduleManager";

// ─── utils ──────────────────────────────────────────────────────
export { default as ResponseData } from "./utils/entity/ResponseData";
export { toPageResult } from "./utils/entity/PageResult";
export type { PageResult, PageRequest } from "./utils/entity/PageResult";
export {
  snakeToCamel,
  rowToCamel,
  rowsToCamel,
  omitPassword,
} from "./utils/case";
export { nextId } from "./utils/id";

// ─── types ──────────────────────────────────────────────────────
export { ResponseCode } from "./types/enums";
