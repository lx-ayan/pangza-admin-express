import { generateCreateTableSql } from '@/views/tools/database/utils/generateTableCode';
import type { TableConfig } from '@/views/tools/database/types';
import { snakeToCamel } from '../constants';
import type { CodeFileItem, CodeGenField, CodeGenModel } from '../types';

function lowerFirst(value: string) {
    return value.charAt(0).toLowerCase() + value.slice(1);
}

function getApiFileName(businessName: string) {
    return snakeToCamel(businessName);
}

function getServicePackage(model: CodeGenModel) {
    return `cn.pangza.service.service.tool.${model.genConfig.moduleName}`;
}

function getControllerPackage(model: CodeGenModel) {
    return `cn.pangza.controller.tool.${model.genConfig.moduleName}`;
}

function getEntityPackage(model: CodeGenModel) {
    return `${model.genConfig.packageName}.${model.genConfig.moduleName}`;
}

function getDtoPackage(model: CodeGenModel) {
    return `${getEntityPackage(model)}.dto`;
}

function getMapperPackage(model: CodeGenModel) {
    return `cn.pangza.service.mapper.tool.${model.genConfig.moduleName}`;
}

function getInsertFields(model: CodeGenModel) {
    return model.fieldList.filter((field) => field.fieldName !== 'id' && field.isInsert);
}

function getQueryFields(model: CodeGenModel) {
    return model.fieldList.filter((field) => field.isQuery && field.fieldName !== 'id');
}

function getRequiredFields(model: CodeGenModel) {
    return model.fieldList.filter((field) => field.isRequired && field.fieldName !== 'id');
}

function javaTypeToTsType(javaType: string) {
    switch (javaType) {
        case 'Integer':
        case 'Long':
        case 'BigDecimal':
            return 'number';
        case 'Boolean':
            return 'boolean';
        default:
            return 'string';
    }
}

function buildImports(fields: CodeGenField[]) {
    const imports = new Set<string>(['import lombok.Data;', 'import cn.pangza.common.mybatisplus.entity.BaseEntity;']);
    if (fields.some((field) => field.javaType === 'LocalDateTime')) {
        imports.add('import java.time.LocalDateTime;');
    }
    if (fields.some((field) => field.javaType === 'BigDecimal')) {
        imports.add('import java.math.BigDecimal;');
    }
    if (fields.some((field) => field.javaType === 'Date')) {
        imports.add('import java.util.Date;');
    }
    return [...imports].join('\n');
}

/** 生成实体类 */
function generateDomain(model: CodeGenModel) {
    const { genConfig, fieldList } = model;
    const lines = [
        `package ${getEntityPackage(model)};`,
        '',
        buildImports(fieldList),
        'import com.baomidou.mybatisplus.annotation.TableId;',
        'import com.baomidou.mybatisplus.annotation.TableName;',
        '',
        '/**',
        ` * ${genConfig.functionName}`,
        ` * @author ${genConfig.author}`,
        ' */',
        '@Data',
        `@TableName("${model.tableName}")`,
        `public class ${genConfig.entityName} extends BaseEntity {`,
        '',
        '    @TableId',
        '    private String id;',
    ];

    fieldList
        .filter((field) => field.fieldName !== 'id')
        .forEach((field) => {
            const comment = field.comment ? ` //${field.comment}` : '';
            lines.push(`    private ${field.javaType} ${field.javaField};${comment}`);
        });

    lines.push('}');
    return lines.join('\n');
}

/** 生成 CreateDTO */
function generateCreateDTO(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const fields = getInsertFields(model);
    const lines = [
        `package ${getDtoPackage(model)};`,
        '',
        'import lombok.Data;',
        '',
        '@Data',
        `public class Create${entity}DTO {`,
    ];

    fields.forEach((field) => {
        const comment = field.comment ? ` //${field.comment}` : '';
        lines.push(`    private ${field.javaType} ${field.javaField};${comment}`);
    });

    lines.push('}');
    return lines.join('\n');
}

/** 生成 ListDTO */
function generateListDTO(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const queryFields = getQueryFields(model);
    const lines = [
        `package ${getDtoPackage(model)};`,
        '',
        'import lombok.Data;',
        '',
        '@Data',
        `public class ${entity}ListDTO {`,
        '    private String keyword;',
    ];

    queryFields.forEach((field) => {
        const comment = field.comment ? ` //${field.comment}` : '';
        lines.push(`    private ${field.javaType} ${field.javaField};${comment}`);
    });

    lines.push('}');
    return lines.join('\n');
}

/** 生成 PageDTO */
function generatePageDTO(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const queryFields = getQueryFields(model);
    const lines = [
        `package ${getDtoPackage(model)};`,
        '',
        'import lombok.Data;',
        '',
        '@Data',
        `public class ${entity}PageDTO {`,
        '    private String keyword;',
    ];

    queryFields.forEach((field) => {
        const comment = field.comment ? ` //${field.comment}` : '';
        lines.push(`    private ${field.javaType} ${field.javaField};${comment}`);
    });

    lines.push('    private String beginDate;');
    lines.push('    private String endDate;');
    lines.push('}');
    return lines.join('\n');
}

/** 生成 Mapper 接口 */
function generateMapper(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    return [
        `package ${getMapperPackage(model)};`,
        '',
        `import ${getEntityPackage(model)}.${entity};`,
        'import com.baomidou.mybatisplus.core.mapper.BaseMapper;',
        'import org.apache.ibatis.annotations.Mapper;',
        '',
        '@Mapper',
        `public interface ${entity}Mapper extends BaseMapper<${entity}> {`,
        '}',
    ].join('\n');
}

/** 生成 Service 接口 */
function generateService(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    return [
        `package ${getServicePackage(model)};`,
        '',
        `import ${getEntityPackage(model)}.${entity};`,
        `import ${getDtoPackage(model)}.Create${entity}DTO;`,
        `import ${getDtoPackage(model)}.${entity}ListDTO;`,
        `import ${getDtoPackage(model)}.${entity}PageDTO;`,
        'import cn.pangza.common.utils.entity.PageRequest;',
        'import cn.pangza.common.utils.entity.PageResult;',
        'import cn.pangza.common.web.exception.BusinessException;',
        'import com.baomidou.mybatisplus.extension.service.IService;',
        '',
        'import java.util.List;',
        '',
        `public interface ${entity}Service extends IService<${entity}> {`,
        '',
        `    void create${entity}(Create${entity}DTO dto) throws BusinessException;`,
        '',
        `    void update${entity}(${entity} ${lowerFirst(entity)}) throws BusinessException;`,
        '',
        `    void delete${entity}(String id);`,
        '',
        `    PageResult<${entity}> get${entity}Page(PageRequest<${entity}PageDTO> pageRequest);`,
        '',
        `    List<${entity}> get${entity}List(${entity}ListDTO listDTO);`,
        '}',
    ].join('\n');
}

function buildQueryWrapperLines(model: CodeGenModel, formVar: string) {
    const queryFields = getQueryFields(model);
    const lines: string[] = [
        `        QueryWrapper<${model.genConfig.entityName}> queryWrapper = new QueryWrapper<>();`,
        `        if (${formVar} == null) {`,
        '            return queryWrapper;',
        '        }',
    ];

    queryFields.forEach((field) => {
        const getter = `get${field.javaField.charAt(0).toUpperCase()}${field.javaField.slice(1)}()`;
        if (field.queryType === 'LIKE') {
            lines.push(`        if (StringUtils.isNotBlank(${formVar}.${getter})) {`);
            lines.push(`            queryWrapper.like("${field.fieldName}", ${formVar}.${getter});`);
            lines.push('        }');
        } else {
            lines.push(`        if (${formVar}.${getter} != null) {`);
            lines.push(`            queryWrapper.eq("${field.fieldName}", ${formVar}.${getter});`);
            lines.push('        }');
        }
    });

    const likeFields = queryFields.filter((field) => field.queryType === 'LIKE');
    if (likeFields.length) {
        lines.push(`        if (StringUtils.isNotBlank(${formVar}.getKeyword())) {`);
        lines.push('            queryWrapper.and(wrapper -> {');
        likeFields.forEach((field, index) => {
            if (index > 0) {
                lines.push('                wrapper.or();');
            }
            lines.push(`                wrapper.like("${field.fieldName}", ${formVar}.getKeyword());`);
        });
        lines.push('            });');
        lines.push('        }');
    }

  if (formVar.includes('PageDTO')) {
        lines.push(`        if (StringUtils.isNotBlank(${formVar}.getBeginDate())) {`);
        lines.push(`            queryWrapper.ge("create_time", ${formVar}.getBeginDate());`);
        lines.push('        }');
        lines.push(`        if (StringUtils.isNotBlank(${formVar}.getEndDate())) {`);
        lines.push(`            queryWrapper.le("create_time", ${formVar}.getEndDate() + " 23:59:59");`);
        lines.push('        }');
    }

    lines.push('        return queryWrapper;');
    return lines;
}

/** 生成 Service 实现 */
function generateServiceImpl(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const serviceVar = lowerFirst(entity);
    const wrapperMethodPage = `build${entity}PageWrapper`;
    const wrapperMethodList = `build${entity}ListWrapper`;

    return [
        `package ${getServicePackage(model)}.impl;`,
        '',
        `import ${getEntityPackage(model)}.${entity};`,
        `import ${getDtoPackage(model)}.Create${entity}DTO;`,
        `import ${getDtoPackage(model)}.${entity}ListDTO;`,
        `import ${getDtoPackage(model)}.${entity}PageDTO;`,
        `import ${getMapperPackage(model)}.${entity}Mapper;`,
        `import ${getServicePackage(model)}.${entity}Service;`,
        'import cn.pangza.common.utils.entity.PageRequest;',
        'import cn.pangza.common.utils.entity.PageResult;',
        'import cn.pangza.common.web.exception.BusinessException;',
        'import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;',
        'import com.baomidou.mybatisplus.extension.plugins.pagination.Page;',
        'import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;',
        'import org.apache.commons.lang3.StringUtils;',
        'import org.springframework.beans.BeanUtils;',
        'import org.springframework.stereotype.Service;',
        '',
        'import java.util.List;',
        '',
        '@Service',
        `public class ${entity}ServiceImpl extends ServiceImpl<${entity}Mapper, ${entity}> implements ${entity}Service {`,
        '',
        '    @Override',
        `    public void create${entity}(Create${entity}DTO dto) throws BusinessException {`,
        `        ${entity} ${serviceVar} = new ${entity}();`,
        '        BeanUtils.copyProperties(dto, ' + serviceVar + ');',
        `        this.save(${serviceVar});`,
        '    }',
        '',
        '    @Override',
        `    public void update${entity}(${entity} ${serviceVar}) throws BusinessException {`,
        `        this.updateById(${serviceVar});`,
        '    }',
        '',
        '    @Override',
        `    public void delete${entity}(String id) {`,
        '        this.removeById(id);',
        '    }',
        '',
        '    @Override',
        `    public PageResult<${entity}> get${entity}Page(PageRequest<${entity}PageDTO> pageRequest) {`,
        `        QueryWrapper<${entity}> queryWrapper = ${wrapperMethodPage}(pageRequest.getForm());`,
        '        queryWrapper.orderByDesc("create_time");',
        '        Page<' + entity + '> page = new Page<>(pageRequest.getPageNum(), pageRequest.getPageSize());',
        '        return PageResult.pageToPageResult(this.page(page, queryWrapper));',
        '    }',
        '',
        '    @Override',
        `    public List<${entity}> get${entity}List(${entity}ListDTO listDTO) {`,
        `        QueryWrapper<${entity}> queryWrapper = ${wrapperMethodList}(listDTO);`,
        '        queryWrapper.orderByDesc("create_time");',
        '        return this.list(queryWrapper);',
        '    }',
        '',
        `    private QueryWrapper<${entity}> ${wrapperMethodPage}(${entity}PageDTO form) {`,
        ...buildQueryWrapperLines(model, 'form'),
        '    }',
        '',
        `    private QueryWrapper<${entity}> ${wrapperMethodList}(${entity}ListDTO form) {`,
        ...buildQueryWrapperLines(model, 'form'),
        '    }',
        '}',
    ].join('\n');
}

/** 生成 Controller */
function generateController(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const business = model.genConfig.businessName;
    const serviceVar = lowerFirst(entity);
    const requiredFields = getRequiredFields(model);

    const createChecks = requiredFields
        .filter((field) => field.isInsert)
        .map((field) => {
            const getter = `get${field.javaField.charAt(0).toUpperCase()}${field.javaField.slice(1)}()`;
            if (field.javaType === 'String') {
                return `        Preconditions.checkArgument(StringUtils.isNotBlank(dto.${getter}), ConstantUtil.RESPONSE_PARAM_ERROR_MESSAGE);`;
            }
            return `        Preconditions.checkArgument(dto.${getter} != null, ConstantUtil.RESPONSE_PARAM_ERROR_MESSAGE);`;
        });

    const updateChecks = [
        '        Preconditions.checkArgument(StringUtils.isNotBlank(' + serviceVar + '.getId()), ConstantUtil.RESPONSE_PARAM_ERROR_MESSAGE);',
        ...requiredFields.map((field) => {
            const getter = `get${field.javaField.charAt(0).toUpperCase()}${field.javaField.slice(1)}()`;
            if (field.javaType === 'String') {
                return `        Preconditions.checkArgument(StringUtils.isNotBlank(${serviceVar}.${getter}), ConstantUtil.RESPONSE_PARAM_ERROR_MESSAGE);`;
            }
            return `        Preconditions.checkArgument(${serviceVar}.${getter} != null, ConstantUtil.RESPONSE_PARAM_ERROR_MESSAGE);`;
        }),
    ];

    return [
        `package ${getControllerPackage(model)};`,
        '',
        'import cn.dev33.satoken.annotation.SaCheckRole;',
        'import cn.dev33.satoken.annotation.SaMode;',
        `import ${getEntityPackage(model)}.${entity};`,
        `import ${getDtoPackage(model)}.Create${entity}DTO;`,
        `import ${getDtoPackage(model)}.${entity}ListDTO;`,
        `import ${getDtoPackage(model)}.${entity}PageDTO;`,
        `import ${getServicePackage(model)}.${entity}Service;`,
        'import cn.pangza.common.utils.entity.ConstantUtil;',
        'import cn.pangza.common.utils.entity.PageRequest;',
        'import cn.pangza.common.utils.entity.PageResult;',
        'import cn.pangza.common.utils.entity.ResponseData;',
        'import cn.pangza.common.web.annotation.RepeatSubmit;',
        'import cn.pangza.common.web.exception.BusinessException;',
        'import cn.pangza.service.auth.annotation.Log;',
        'import cn.pangza.service.auth.enums.BusinessEnum;',
        'import com.google.common.base.Preconditions;',
        'import jakarta.annotation.Resource;',
        'import org.apache.commons.lang3.StringUtils;',
        'import org.springframework.web.bind.annotation.*;',
        '',
        'import java.util.List;',
        '',
        '@RestController',
        `@RequestMapping("/api/${business}")`,
        `public class ${entity}Controller {`,
        '',
        '    @Resource',
        `    private ${entity}Service ${serviceVar}Service;`,
        '',
        `    @Log(title = "获取${model.genConfig.functionName}列表", businessEnum = BusinessEnum.LIST)`,
        '    @SaCheckRole(value = {"ROLE_admin", "ROLE_developer"}, mode = SaMode.OR)',
        '    @PostMapping("/list")',
        `    public ResponseData<List<${entity}>> get${entity}List(@RequestBody(required = false) ${entity}ListDTO listDTO) {`,
        `        return ResponseData.success(${serviceVar}Service.get${entity}List(listDTO));`,
        '    }',
        '',
        `    @Log(title = "获取${model.genConfig.functionName}分页", businessEnum = BusinessEnum.LIST)`,
        '    @PostMapping("/page")',
        '    @SaCheckRole(value = {"ROLE_admin", "ROLE_developer"}, mode = SaMode.OR)',
        `    public ResponseData<PageResult<${entity}>> get${entity}Page(@RequestBody PageRequest<${entity}PageDTO> pageRequest) {`,
        `        return ResponseData.success(${serviceVar}Service.get${entity}Page(pageRequest));`,
        '    }',
        '',
        '    @RepeatSubmit',
        `    @Log(title = "创建${model.genConfig.functionName}", businessEnum = BusinessEnum.CREATE)`,
        '    @PostMapping("/create")',
        '    @SaCheckRole(value = {"ROLE_admin", "ROLE_developer"}, mode = SaMode.OR)',
        `    public ResponseData create${entity}(@RequestBody Create${entity}DTO dto) throws BusinessException {`,
        ...(createChecks.length ? createChecks : ['        // TODO: 按需补充参数校验']),
        `        ${serviceVar}Service.create${entity}(dto);`,
        '        return ResponseData.success();',
        '    }',
        '',
        '    @RepeatSubmit',
        `    @Log(title = "修改${model.genConfig.functionName}", businessEnum = BusinessEnum.UPDATE)`,
        '    @PostMapping("/update")',
        '    @SaCheckRole(value = {"ROLE_admin", "ROLE_developer"}, mode = SaMode.OR)',
        `    public ResponseData update${entity}(@RequestBody ${entity} ${serviceVar}) throws BusinessException {`,
        ...updateChecks,
        `        ${serviceVar}Service.update${entity}(${serviceVar});`,
        '        return ResponseData.success();',
        '    }',
        '',
        `    @Log(title = "删除${model.genConfig.functionName}", businessEnum = BusinessEnum.DELETE)`,
        '    @PostMapping("/delete/{id}")',
        '    @SaCheckRole(value = {"ROLE_admin", "ROLE_developer"}, mode = SaMode.OR)',
        `    public ResponseData delete${entity}(@PathVariable String id) {`,
        '        Preconditions.checkArgument(StringUtils.isNotBlank(id), ConstantUtil.RESPONSE_PARAM_ERROR_MESSAGE);',
        `        ${serviceVar}Service.delete${entity}(id);`,
        '        return ResponseData.success();',
        '    }',
        '',
        '    @PostMapping("/get/{id}")',
        '    @SaCheckRole(value = {"ROLE_admin", "ROLE_developer"}, mode = SaMode.OR)',
        `    public ResponseData<${entity}> get${entity}(@PathVariable String id) {`,
        '        Preconditions.checkArgument(StringUtils.isNotBlank(id), ConstantUtil.RESPONSE_PARAM_ERROR_MESSAGE);',
        `        return ResponseData.success(${serviceVar}Service.getById(id));`,
        '    }',
        '}',
    ].join('\n');
}

/** 生成 Mapper XML */
function generateMapperXml(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    return [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">',
        `<mapper namespace="${getMapperPackage(model)}.${entity}Mapper">`,
        '',
        `    <resultMap id="${entity}Result" type="${getEntityPackage(model)}.${entity}">`,
        '        <id property="id" column="id" />',
        ...model.fieldList
            .filter((field) => field.fieldName !== 'id')
            .map((field) => `        <result property="${field.javaField}" column="${field.fieldName}" />`),
        '    </resultMap>',
        '',
        '</mapper>',
    ].join('\n');
}

/** 生成 SQL */
function generateSql(model: CodeGenModel) {
    const tableConfig: TableConfig = {
        tableName: model.tableName,
        tableComment: model.tableComment,
        fieldList: model.fieldList,
    };
    return generateCreateTableSql(tableConfig);
}

/** 生成前端类型定义 */
function generateApiTypes(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const apiName = getApiFileName(model.genConfig.businessName);
    const entityFields = model.fieldList.filter((field) => field.fieldName !== 'id');

    const interfaceFields = [
        '    id: string;',
        ...entityFields.map((field) => {
            const optional = field.notNull ? '' : '?';
            return `    ${field.javaField}${optional}: ${javaTypeToTsType(field.javaType)};`;
        }),
        '    createTime?: string;',
        '    updateTime?: string;',
    ];

    const listDtoFields = getQueryFields(model).map((field) => `    ${field.javaField}?: ${javaTypeToTsType(field.javaType)};`);
    const pageDtoFields = [
        ...listDtoFields,
        '    beginDate?: string;',
        '    endDate?: string;',
    ];

    return [
        `export interface ${entity} {`,
        ...interfaceFields,
        '}',
        '',
        `export type Create${entity}DTO = ExcludeAndPartial<${entity}, 'id' | 'createTime' | 'updateTime'>;`,
        '',
        `export type Update${entity}DTO = ${entity};`,
        '',
        `export interface ${entity}ListDTO {`,
        '    keyword?: string;',
        ...listDtoFields,
        '}',
        '',
        `export interface ${entity}PageDTO {`,
        '    keyword?: string;',
        ...pageDtoFields,
        '}',
        '',
        `// api file: ${apiName}.ts`,
    ].join('\n');
}

/** 生成前端 API */
function generateApiTs(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const business = model.genConfig.businessName;
    const apiName = getApiFileName(business);

    return [
        "import useRequest from '@/hooks/core/useRequest';",
        "import type { ProTableRequest, ProTableResult } from '@/components/ProComponents';",
        'import type {',
        `    Create${entity}DTO,`,
        `    ${entity},`,
        `    ${entity}ListDTO,`,
        `    ${entity}PageDTO,`,
        `    Update${entity}DTO,`,
        `} from '@/types/api/${apiName}';`,
        '',
        `const request = useRequest('/api/${business}', {`,
        '    wait: 300,',
        '});',
        '',
        `/** 获取${model.genConfig.functionName}列表 */`,
        `export function get${entity}List(data?: ${entity}ListDTO) {`,
        `    return request.post<${entity}[]>('/list', data ?? {});`,
        '}',
        '',
        `/** 获取${model.genConfig.functionName}分页 */`,
        `export function get${entity}Page(data: ProTableRequest<${entity}PageDTO>) {`,
        `    return request.post<ProTableResult<${entity}>>('/page', data);`,
        '}',
        '',
        `/** 创建${model.genConfig.functionName} */`,
        `export function create${entity}(data: Create${entity}DTO) {`,
        "    return request.post('/create', data);",
        '}',
        '',
        `/** 更新${model.genConfig.functionName} */`,
        `export function update${entity}(data: Update${entity}DTO) {`,
        "    return request.post('/update', data);",
        '}',
        '',
        `/** 删除${model.genConfig.functionName} */`,
        `export function delete${entity}(id: string) {`,
        '    return request.post(`/delete/${id}`);',
        '}',
        '',
        `/** 获取${model.genConfig.functionName}详情 */`,
        `export function get${entity}(id: string) {`,
        `    return request.post<${entity}>(\`/get/\${id}\`);`,
        '}',
    ].join('\n');
}

/** 生成前端页面 */
function generateIndexVue(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const functionName = model.genConfig.functionName;
    const apiName = getApiFileName(model.genConfig.businessName);
    const listFields = model.fieldList.filter((field) => field.isList);

    const columns = listFields.map((field) => `    { key: '${field.javaField}', label: '${field.comment || field.fieldName}' },`).join('\n');

    return [
        '<script setup lang="ts">',
        `import { get${entity}Page } from '@/api/${apiName}';`,
        "import { ProTable, type ProTableOption } from '@/components/ProComponents';",
        "import { ref } from 'vue';",
        '',
        'const options = ref<ProTableOption[]>([',
        columns,
        ']);',
        '',
        'function request(data: any) {',
        `    return get${entity}Page(data);`,
        '}',
        '</script>',
        '',
        '<template>',
        '    <ProTable :options="options" :request="request" hide-form>',
        '        <template #pro-table-title>',
        `            <div>${functionName}</div>`,
        '        </template>',
        '    </ProTable>',
        '</template>',
    ].join('\n');
}

function buildZipPaths(model: CodeGenModel) {
    const entity = model.genConfig.entityName;
    const module = model.genConfig.moduleName;
    const apiName = getApiFileName(model.genConfig.businessName);
    const entityPath = getEntityPackage(model).replace(/\./g, '/');
    const mapperPath = getMapperPackage(model).replace(/\./g, '/');
    const servicePath = getServicePackage(model).replace(/\./g, '/');
    const controllerPath = getControllerPackage(model).replace(/\./g, '/');

    return {
        domain: `java/${entityPath}/${entity}.java`,
        createDTO: `java/${entityPath}/dto/Create${entity}DTO.java`,
        listDTO: `java/${entityPath}/dto/${entity}ListDTO.java`,
        pageDTO: `java/${entityPath}/dto/${entity}PageDTO.java`,
        mapper: `java/${mapperPath}/${entity}Mapper.java`,
        service: `java/${servicePath}/${entity}Service.java`,
        serviceImpl: `java/${servicePath}/impl/${entity}ServiceImpl.java`,
        controller: `java/${controllerPath}/${entity}Controller.java`,
        mapperXml: `resources/mapper/tool/${module}/${entity}Mapper.xml`,
        sql: `sql/${model.tableName}.sql`,
        apiTypes: `vue/src/types/api/${apiName}.d.ts`,
        api: `vue/src/api/${apiName}.ts`,
        index: `vue/src/views/${apiName}/index.vue`,
    };
}

/** 生成全部代码文件 */
export function generateCodeFiles(model: CodeGenModel): CodeFileItem[] {
    const paths = buildZipPaths(model);
    const entity = model.genConfig.entityName;

    return [
        { key: 'domain', label: `${entity}.java`, language: 'java', code: generateDomain(model), zipPath: paths.domain },
        { key: 'createDTO', label: `Create${entity}DTO.java`, language: 'java', code: generateCreateDTO(model), zipPath: paths.createDTO },
        { key: 'listDTO', label: `${entity}ListDTO.java`, language: 'java', code: generateListDTO(model), zipPath: paths.listDTO },
        { key: 'pageDTO', label: `${entity}PageDTO.java`, language: 'java', code: generatePageDTO(model), zipPath: paths.pageDTO },
        { key: 'mapper', label: `${entity}Mapper.java`, language: 'java', code: generateMapper(model), zipPath: paths.mapper },
        { key: 'service', label: `${entity}Service.java`, language: 'java', code: generateService(model), zipPath: paths.service },
        { key: 'serviceImpl', label: `${entity}ServiceImpl.java`, language: 'java', code: generateServiceImpl(model), zipPath: paths.serviceImpl },
        { key: 'controller', label: `${entity}Controller.java`, language: 'java', code: generateController(model), zipPath: paths.controller },
        { key: 'mapperXml', label: `${entity}Mapper.xml`, language: 'xml', code: generateMapperXml(model), zipPath: paths.mapperXml },
        { key: 'sql', label: `${model.tableName}.sql`, language: 'mysql', code: generateSql(model), zipPath: paths.sql },
        { key: 'apiTypes', label: `${getApiFileName(model.genConfig.businessName)}.d.ts`, language: 'typescript', code: generateApiTypes(model), zipPath: paths.apiTypes },
        { key: 'api', label: `${getApiFileName(model.genConfig.businessName)}.ts`, language: 'typescript', code: generateApiTs(model), zipPath: paths.api },
        { key: 'index', label: 'index.vue', language: 'html', code: generateIndexVue(model), zipPath: paths.index },
    ];
}
