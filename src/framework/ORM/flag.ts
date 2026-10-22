/** ORM / 数据源模块标记：Application.registry(EnableOrm()) 识别 */
export const ORM_MODULE_FLAG = Symbol.for("pangza.orm.module");

let ormEnabled = false;

export function markOrmEnabled(enabled = true): void {
  ormEnabled = enabled;
}

export function isOrmEnabled(): boolean {
  return ormEnabled;
}
