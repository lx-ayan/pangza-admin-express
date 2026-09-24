import { Component } from "@/framework/Service";

/** 示例任务：清理系统日志 */
@Component("sysLogCleanTask")
export class SysLogCleanTask {
  execute() {
    console.log("[sysLogCleanTask] 示例任务执行：清理过期系统日志");
  }
}

/** 示例任务：同步用户缓存 */
@Component("userCacheSyncTask")
export class UserCacheSyncTask {
  execute() {
    console.log("[userCacheSyncTask] 示例任务执行：同步用户权限缓存");
  }
}

/** 示例任务：系统日志 */
@Component("sysLogTask")
export class SysLogTask {
  execute() {
    console.log("[sysLogTask] 示例任务执行");
  }
}
