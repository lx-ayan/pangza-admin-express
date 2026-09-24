<script setup lang="ts">
import { getMenuWithChildren } from '@/api/menu';
import { bindMenu, getRoleMenuIds } from '@/api/role';
import type { MenuResult } from '@/types/api/menu';
import ArrayUtil from '@/utils/clz/ArrayUtil';
import { ChevronDownIcon, ChevronRightIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

interface PermissionNode {
    id: string;
    title: string;
    type?: string;
    children: PermissionNode[];
}

const props = withDefaults(
    defineProps<{
        roleId: string;
        theme?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
    }>(),
    {
        theme: 'primary',
    },
);

const menuGroups = ref<PermissionNode[]>([]);
const selectValues = ref<string[]>([]);
const keyword = ref('');
const expandedGroups = ref<Set<string>>(new Set());
const expandedSubs = ref<Set<string>>(new Set());

const selectSet = computed(() => new Set(selectValues.value));

/**
 * 将菜单树转为权限节点
 */
function mapMenuNode(item: MenuResult): PermissionNode {
    return {
        id: item.id,
        title: item.meta?.title || item.title || item.name || '',
        type: item.meta?.type || item.type,
        children: ArrayUtil.isEmpty(item.children)
            ? []
            : item.children!.map(mapMenuNode),
    };
}

/**
 * 收集节点及其全部子孙 id
 */
function collectIds(node: PermissionNode): string[] {
    const ids = [node.id];
    node.children.forEach((child) => {
        ids.push(...collectIds(child));
    });
    return ids;
}

/**
 * 子模块下的可勾选「操作项」：有子节点则取子节点，否则自身作为页面权限
 */
function getActionNodes(sub: PermissionNode): PermissionNode[] {
    if (sub.children.length) {
        return sub.children;
    }
    return [sub];
}

function getActionIds(sub: PermissionNode): string[] {
    return getActionNodes(sub).flatMap(collectIds);
}

function isGroupExpanded(id: string) {
    return expandedGroups.value.has(id);
}

function isSubExpanded(id: string) {
    return expandedSubs.value.has(id);
}

function toggleGroup(id: string) {
    const next = new Set(expandedGroups.value);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    expandedGroups.value = next;
}

function toggleSub(id: string) {
    const next = new Set(expandedSubs.value);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    expandedSubs.value = next;
}

function toggleIds(ids: string[], checked: boolean) {
    const set = new Set(selectValues.value);
    ids.forEach((id) => {
        if (checked) {
            set.add(id);
        } else {
            set.delete(id);
        }
    });
    selectValues.value = [...set];
}

function getNodeCheckState(node: PermissionNode) {
    const ids = collectIds(node);
    const checkedCount = ids.filter((id) => selectSet.value.has(id)).length;
    return {
        checked: checkedCount === ids.length && ids.length > 0,
        indeterminate: checkedCount > 0 && checkedCount < ids.length,
    };
}

function handleNodeCheck(node: PermissionNode, checked: boolean) {
    toggleIds(collectIds(node), checked);
}

/**
 * 子模块全选状态
 */
function getSubCheckState(sub: PermissionNode) {
    const ids = [sub.id, ...getActionIds(sub)];
    const uniqueIds = [...new Set(ids)];
    const checkedCount = uniqueIds.filter((id) => selectSet.value.has(id)).length;
    return {
        checked: checkedCount === uniqueIds.length && uniqueIds.length > 0,
        indeterminate: checkedCount > 0 && checkedCount < uniqueIds.length,
    };
}

function handleSubCheckAll(sub: PermissionNode, checked: boolean) {
    const ids = [sub.id, ...getActionIds(sub)];
    toggleIds([...new Set(ids)], checked);
}

function handleExpandAll() {
    const groups = new Set<string>();
    const subs = new Set<string>();
    filteredGroups.value.forEach((group) => {
        groups.add(group.id);
        group.children.forEach((sub) => {
            if (sub.children.length) {
                subs.add(sub.id);
            }
        });
    });
    expandedGroups.value = groups;
    expandedSubs.value = subs;
}

function handleCollapseAll() {
    expandedGroups.value = new Set();
    expandedSubs.value = new Set();
}

function handleCheckAll() {
    const ids: string[] = [];
    filteredGroups.value.forEach((group) => {
        ids.push(...collectIds(group));
    });
    selectValues.value = [...new Set(ids)];
}

function handleCancelCheck() {
    selectValues.value = [];
}

/**
 * 按关键词过滤分组树（保留命中节点的祖先路径）
 */
const filteredGroups = computed(() => {
    const key = keyword.value.trim();
    if (!key) {
        return menuGroups.value;
    }

    function filterNode(node: PermissionNode): PermissionNode | null {
        const children = node.children
            .map(filterNode)
            .filter((item): item is PermissionNode => item != null);
        if (node.title.includes(key) || children.length) {
            return { ...node, children };
        }
        return null;
    }

    return menuGroups.value
        .map(filterNode)
        .filter((item): item is PermissionNode => item != null);
});

function handleSearch() {
    if (!keyword.value.trim()) {
        return;
    }
    handleExpandAll();
}

function handleVisibleChange(v: boolean) {
    if (!v) {
        return;
    }
    keyword.value = '';
    getMenuWithChildren()
        .then((res) => {
            menuGroups.value = (res || []).map(mapMenuNode);
            // 默认展开全部分组与子模块
            handleExpandAll();
            return getRoleMenuIds(props.roleId);
        })
        .then((res) => {
            selectValues.value = res || [];
        });
}

function handleConfirm(dialogInstance: DialogInstance) {
    bindMenu({
        roleId: props.roleId,
        menuIds: selectValues.value,
    }).then(() => {
        dialogInstance.destroy();
        MessagePlugin.success('绑定成功');
    });
}
</script>

<template>
    <DialogLink
        :dialogProps="{ width: '760px', placement: 'center' }"
        header="角色权限设置"
        hover="color"
        :theme="theme"
        @confirm="handleConfirm"
        @visible-change="handleVisibleChange"
    >
        绑定权限
        <template #content>
            <div class="role-permission">
                <div class="role-permission__toolbar">
                    <div class="role-permission__search">
                        <t-input
                            v-model="keyword"
                            clearable
                            placeholder="请输入菜单名称"
                            @enter="handleSearch"
                        />
                        <t-button theme="primary" @click="handleSearch">
                            <template #icon>
                                <MyIcon :size="16" name="search" />
                            </template>
                        </t-button>
                    </div>
                    <div class="role-permission__actions">
                        <t-button variant="outline" @click="handleExpandAll">展开全部</t-button>
                        <t-button variant="outline" @click="handleCollapseAll">收起全部</t-button>
                        <t-button variant="outline" @click="handleCheckAll">选中全部</t-button>
                        <t-button variant="outline" @click="handleCancelCheck">取消选中</t-button>
                    </div>
                </div>

                <div class="role-permission__body">
                    <div
                        v-for="group in filteredGroups"
                        :key="group.id"
                        class="perm-group"
                    >
                        <div
                            class="perm-group__header"
                            @click="toggleGroup(group.id)"
                        >
                            <span class="perm-group__title">{{ group.title }}</span>
                            <ChevronDownIcon
                                v-if="isGroupExpanded(group.id)"
                                size="18px"
                                class="perm-group__arrow"
                            />
                            <ChevronRightIcon
                                v-else
                                size="18px"
                                class="perm-group__arrow"
                            />
                        </div>

                        <div
                            v-show="isGroupExpanded(group.id)"
                            class="perm-group__content"
                        >
                            <!-- 叶子分组：如仪表盘 -->
                            <div
                                v-if="!group.children.length"
                                class="perm-action-grid"
                            >
                                <label class="perm-action-item">
                                    <t-checkbox
                                        :checked="getNodeCheckState(group).checked"
                                        :indeterminate="getNodeCheckState(group).indeterminate"
                                        @change="(checked: boolean) => handleNodeCheck(group, checked)"
                                    />
                                    <span>{{ group.title }}</span>
                                </label>
                            </div>

                            <div
                                v-for="sub in group.children"
                                :key="sub.id"
                                class="perm-sub"
                            >
                                <div class="perm-sub__header">
                                    <div
                                        class="perm-sub__left"
                                        @click="sub.children.length && toggleSub(sub.id)"
                                    >
                                        <ChevronDownIcon
                                            v-if="sub.children.length && isSubExpanded(sub.id)"
                                            size="16px"
                                            class="perm-sub__arrow"
                                        />
                                        <ChevronRightIcon
                                            v-else-if="sub.children.length"
                                            size="16px"
                                            class="perm-sub__arrow"
                                        />
                                        <span
                                            v-else
                                            class="perm-sub__arrow-placeholder"
                                        />
                                        <span class="perm-sub__title">{{ sub.title }}</span>
                                    </div>
                                    <t-checkbox
                                        :checked="getSubCheckState(sub).checked"
                                        :indeterminate="getSubCheckState(sub).indeterminate"
                                        @change="(checked: boolean) => handleSubCheckAll(sub, checked)"
                                    >
                                        全选
                                    </t-checkbox>
                                </div>

                                <div
                                    v-show="!sub.children.length || isSubExpanded(sub.id)"
                                    class="perm-action-grid"
                                >
                                    <label
                                        v-for="action in getActionNodes(sub)"
                                        :key="action.id"
                                        class="perm-action-item"
                                    >
                                        <t-checkbox
                                            :checked="getNodeCheckState(action).checked"
                                            :indeterminate="getNodeCheckState(action).indeterminate"
                                            @change="(checked: boolean) => handleNodeCheck(action, checked)"
                                        />
                                        <span>{{ action.title }}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <t-empty
                        v-if="!filteredGroups.length"
                        description="暂无菜单数据"
                    />
                </div>
            </div>
        </template>
    </DialogLink>
</template>

<style scoped lang="scss">
.role-permission {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 62vh;
}

.role-permission__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
}

.role-permission__search {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 280px;
}

.role-permission__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.role-permission__body {
    flex: 1;
    overflow: auto;
    border: 1px solid var(--td-component-border);
    border-radius: 6px;
}

.perm-group + .perm-group {
    border-top: 1px solid var(--td-component-border);
}

.perm-group__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--td-bg-color-secondarycontainer);
    cursor: pointer;
    user-select: none;

    &:hover {
        background: var(--td-bg-color-container-hover);
    }
}

.perm-group__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.perm-group__arrow {
    color: var(--td-text-color-secondary);
}

.perm-group__content {
    padding: 8px 12px 12px;
    background: var(--td-bg-color-container);
}

.perm-sub + .perm-sub {
    margin-top: 8px;
}

.perm-sub__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 8px 8px 4px;
}

.perm-sub__left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    cursor: pointer;
}

.perm-sub__arrow {
    color: var(--td-text-color-placeholder);
    flex-shrink: 0;
}

.perm-sub__arrow-placeholder {
    width: 16px;
    flex-shrink: 0;
}

.perm-sub__title {
    font-size: 14px;
    color: var(--td-text-color-primary);
}

.perm-action-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 24px;
    padding: 4px 8px 8px 28px;
}

.perm-action-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    font-size: 14px;
    color: var(--td-text-color-primary);
    cursor: pointer;
}
</style>
