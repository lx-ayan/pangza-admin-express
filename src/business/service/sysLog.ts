import { BaseService, Service } from "@/framework/Service";
import { QueryWrapper } from "@/framework/ORM";
import SysLogMapper from "@/business/mapper/sysLog";
import { rowsToCamel } from "@/framework/utils/case";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";

/** 对齐 Java SysLogPageDTO + UI 搜索表单 */
export interface SysLogPageForm {
  username?: string;
  title?: string;
  methodName?: string;
  business?: number | string;
  oper?: number | string;
  /** UI：1 成功(=200) / 其它 失败(!=200) */
  status?: number | string;
  beginDate?: string;
  endDate?: string;
}

function isBlank(v: unknown): boolean {
  return v == null || String(v).trim() === "";
}

function normalizeDayStart(date: string): string {
  const s = String(date).trim();
  if (/\d{2}:\d{2}/.test(s)) return s;
  return `${s} 00:00:00`;
}

function normalizeDayEnd(date: string): string {
  const s = String(date).trim();
  if (/\d{2}:\d{2}/.test(s)) return s;
  return `${s} 23:59:59`;
}

@Service(SysLogMapper)
export default class SysLogService extends BaseService {
  /** 构建与分页/导出共用的查询条件 */
  buildQueryWrapper(form: SysLogPageForm = {}): QueryWrapper {
    const wrapper = new QueryWrapper();

    if (!isBlank(form.username)) {
      wrapper.like("username", String(form.username));
    }
    if (!isBlank(form.title)) {
      wrapper.like("title", String(form.title));
    }
    if (!isBlank(form.methodName)) {
      wrapper.eq("method_name", String(form.methodName));
    }
    if (!isBlank(form.business)) {
      wrapper.eq("business", String(form.business));
    }
    if (!isBlank(form.oper)) {
      wrapper.eq("oper", String(form.oper));
    }

    if (!isBlank(form.status)) {
      const status = Number(form.status);
      if (status === 1) {
        wrapper.eq("status", "200");
      } else {
        wrapper.ne("status", "200");
      }
    }

    if (!isBlank(form.beginDate)) {
      wrapper.ge("create_time", normalizeDayStart(String(form.beginDate)));
    }
    // 修正 Java 端误用 beginDate 的问题：按 endDate 做结束日过滤
    if (!isBlank(form.endDate)) {
      wrapper.le("create_time", normalizeDayEnd(String(form.endDate)));
    }

    wrapper.orderByDesc("create_time");
    return wrapper;
  }

  async getPageResult(
    pageRequest: PageRequest<SysLogPageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const form = pageRequest?.form ?? {};
    const wrapper = this.buildQueryWrapper(form);

    const page = await this.selectPage(
      { current: pageNum, size: pageSize },
      wrapper
    );
    return toPageResult({
      ...page,
      records: rowsToCamel(page.records as any),
    });
  }

  /** 导出用：按条件拉取（上限保护） */
  async listForExport(
    form: SysLogPageForm = {},
    limit = 5000
  ): Promise<Record<string, unknown>[]> {
    const list = await this.selectList(this.buildQueryWrapper(form), limit);
    return rowsToCamel(list as any);
  }
}
