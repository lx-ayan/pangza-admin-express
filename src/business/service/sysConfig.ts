import { BaseService, Service } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import SysConfigMapper from "@/business/mapper/sysConfig";
import { rowsToCamel, rowToCamel } from "@/framework/utils/case";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";

export interface SysConfigPageForm {
  keyword?: string;
}

export interface UpdateSysConfigDTO {
  id: string;
  configKey?: string;
  configName?: string;
  configValue?: string;
  configType?: string;
  remark?: string;
  publicFlag?: number;
  sortNum?: number;
}

@Service(SysConfigMapper)
export default class SysConfigService extends BaseService {
  private cache = new Map<string, string>();
  private cacheReady = false;

  /** 公开配置 Map：configKey → configValue */
  async getPublicConfigMap(): Promise<Record<string, string>> {
    const list = await this.selectList(
      new QueryWrapper().eq("public_flag", 1).orderByAsc("sort_num")
    );
    const rows = rowsToCamel<{
      configKey?: string;
      configValue?: string;
    }>(list as any);
    const result: Record<string, string> = {};
    for (const item of rows) {
      if (item.configKey) {
        result[item.configKey] = String(item.configValue ?? "");
      }
    }
    return result;
  }

  async ensureCache(): Promise<void> {
    if (this.cacheReady) return;
    await this.refreshCache();
  }

  async refreshCache(): Promise<void> {
    const list = await this.selectList(new QueryWrapper());
    const rows = rowsToCamel<{
      configKey?: string;
      configValue?: string;
    }>(list as any);
    this.cache.clear();
    for (const item of rows) {
      if (item.configKey) {
        this.cache.set(item.configKey, String(item.configValue ?? ""));
      }
    }
    this.cacheReady = true;
  }

  async getConfigValue(key: string): Promise<string | undefined> {
    await this.ensureCache();
    return this.cache.get(key);
  }

  async isEncryptEnabled(): Promise<boolean> {
    const value = await this.getConfigValue("security.encrypt.enabled");
    return String(value ?? "").toLowerCase() === "true";
  }

  async getSysConfigPage(
    pageRequest: PageRequest<SysConfigPageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const form = pageRequest?.form ?? {};
    const wrapper = new QueryWrapper();
    const keyword = form.keyword?.trim();
    if (keyword) {
      wrapper.nested((w) => {
        w.like("config_key", keyword)
          .or()
          .like("config_name", keyword)
          .or()
          .like("remark", keyword);
      });
    }
    wrapper.orderByAsc("sort_num").orderByDesc("create_time");
    const page = await this.selectPage(
      { current: pageNum, size: pageSize },
      wrapper
    );
    return toPageResult({
      ...page,
      records: rowsToCamel(page.records as any),
    });
  }

  async getSysConfigList(): Promise<Record<string, unknown>[]> {
    const list = await this.selectList(
      new QueryWrapper().orderByAsc("sort_num").orderByDesc("create_time")
    );
    return rowsToCamel(list as any);
  }

  async updateSysConfig(dto: UpdateSysConfigDTO): Promise<void> {
    if (!dto?.id) throw new OrmError("参数错误");
    const exist = await this.selectById(dto.id);
    if (!exist) throw new OrmError("配置不存在");
    await this.updateById({
      id: dto.id,
      configName: dto.configName,
      configValue: dto.configValue,
      configType: dto.configType,
      remark: dto.remark,
      publicFlag: dto.publicFlag,
      sortNum: dto.sortNum,
    });
    await this.refreshCache();
  }
}
