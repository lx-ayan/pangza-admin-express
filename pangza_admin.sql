/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80013
 Source Host           : localhost:3306
 Source Schema         : pangza_admin

 Target Server Type    : MySQL
 Target Server Version : 80013
 File Encoding         : 65001

 Date: 22/10/2026 11:51:23
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for book
-- ----------------------------
DROP TABLE IF EXISTS `book`;
CREATE TABLE `book`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `author` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of book
-- ----------------------------
INSERT INTO `book` VALUES (1, '今天中午吃什么', '张三');

-- ----------------------------
-- Table structure for menu
-- ----------------------------
DROP TABLE IF EXISTS `menu`;
CREATE TABLE `menu`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '-1',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `path` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `permission` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `auth` tinyint(4) NULL DEFAULT NULL,
  `hidden` tinyint(4) NULL DEFAULT NULL,
  `link` tinyint(4) NULL DEFAULT NULL,
  `frame` tinyint(4) NULL DEFAULT NULL,
  `href` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `sort_num` int(11) NULL DEFAULT NULL,
  `parent_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '-1',
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`, `name`, `title`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of menu
-- ----------------------------
INSERT INTO `menu` VALUES ('1', 'system', '/system', '系统管理', '1', 'system', 1, 0, 0, 0, NULL, 'settings', 99, '-1', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('10', 'components.toolgroup.auth', '/components/toolgroup/auth', '权限控制', '1', 'components:toolgroup:auth', 1, 0, 0, 0, NULL, NULL, 6, '29', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('11', 'components.chartgroup.chartcard', '/components/chartgroup/chartcard', '图表卡片', '1', 'components:chartgroup:chartcard', 1, 0, 0, 0, NULL, NULL, 7, '26', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('111', 'system.config', '/system/config', '系统配置', '1', 'system:config', 1, 0, 0, 0, NULL, NULL, 105, '1', '2026-08-10 12:09:15', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('112', 'system.config.list', '/system/config/list', '配置列表', '2', 'system:config:list', 1, 0, 0, 0, NULL, NULL, 201, '111', '2026-08-10 12:09:15', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('113', 'system.config.page', '/system/config/page', '配置分页', '2', 'system:config:page', 1, 0, 0, 0, NULL, NULL, 200, '111', '2026-08-10 12:09:15', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('114', 'system.config.update', '/system/config/update', '配置修改', '2', 'system:config:update', 1, 0, 0, 0, NULL, NULL, 202, '111', '2026-08-10 12:09:15', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('12', 'components.chartgroup.charts', '/components/chartgroup/charts', '图表组件', '1', 'components:chartgroup:charts', 1, 0, 0, 0, NULL, NULL, 8, '26', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('13', 'components.icongroup.circletag', '/components/icongroup/circletag', '圆点标签', '1', 'components:icongroup:circletag', 1, 0, 0, 0, NULL, NULL, 9, '27', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('14', 'components.icongroup.coloricon', '/components/icongroup/coloricon', '彩色图标', '1', 'components:icongroup:coloricon', 1, 0, 0, 0, NULL, NULL, 10, '27', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('15', 'components.toolgroup.contextmenu', '/components/toolgroup/contextmenu', '右键菜单', '1', 'components:toolgroup:contextmenu', 1, 0, 0, 0, NULL, NULL, 11, '29', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('16', 'components.cardgroup.demoblock', '/components/cardgroup/demoblock', '示例区块', '1', 'components:cardgroup:demoblock', 1, 0, 0, 0, NULL, NULL, 12, '28', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('17', 'components.toolgroup.emptydata', '/components/toolgroup/emptydata', '空数据', '1', 'components:toolgroup:emptydata', 1, 0, 0, 0, NULL, NULL, 13, '29', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('18', 'components.toolgroup.error', '/components/toolgroup/error', '失败结果', '1', 'components:toolgroup:error', 1, 0, 0, 0, NULL, NULL, 14, '29', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('19', 'components.cardgroup.graycard', '/components/cardgroup/graycard', '灰底卡片', '1', 'components:cardgroup:graycard', 1, 0, 0, 0, NULL, NULL, 15, '28', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2', 'system.user', '/system/user', '用户管理', '1', 'system:user', 1, 0, 0, 0, NULL, NULL, 100, '1', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('20', 'components.icongroup.myicon', '/components/icongroup/myicon', '图标', '1', 'components:icongroup:myicon', 1, 0, 0, 0, NULL, NULL, 16, '27', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081611856674787330', 'components', '/components', '组件示例', '1', 'components', 1, 0, 0, 0, NULL, 'Component', 0, '-1', '2026-07-27 13:25:16', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081612555252912129', 'components.tablegroup.table', '/components/tablegroup/table', '表格组件', '1', 'components:tablegroup:table', 1, 0, 0, 0, NULL, '', 0, '25', '2026-07-27 13:28:02', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081620612150185986', 'components.formitem:form', '/components/formitem/form', '表单组件', '1', 'components:formitem:form', 1, 0, 0, 0, NULL, NULL, 1, '24', '2026-07-27 14:00:03', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081918567847522306', 'components.interactgroup.modalform', '/components/interactgroup/modalform', '表单弹窗', '1', 'components:interactgroup:modalform', 1, 0, 0, 0, NULL, NULL, 2, '30', '2026-07-28 09:44:01', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081919840202223618', 'components.interactgroup.drawerform', '/components/interactgroup/drawerform', '抽屉表单', '1', 'components:interactgroup:drawerform', 1, 0, 0, 0, NULL, NULL, 3, '30', '2026-07-28 09:49:05', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081920450284711938', 'components.interactgroup.dialog', '/components/interactgroup/dialog', '弹框组件', '1', 'components:interactgroup:dialog', 1, 0, 0, 0, NULL, NULL, 4, '30', '2026-07-28 09:51:30', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081920838337523714', 'components.formitem', '/components/formitem', '表单项示例', '1', 'components:formitem', 1, 0, 0, 0, NULL, NULL, 999999, '2081611856674787330', '2026-07-28 09:53:03', '2026-07-28 10:57:08', NULL, NULL, 1);
INSERT INTO `menu` VALUES ('2081921331356987393', 'components.formitem.select', '/components/formitem/select', '选择器组件', '1', 'components:formitem:select', 1, 0, 0, 0, NULL, NULL, 0, '24', '2026-07-28 09:55:00', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081921431030427649', 'components.formitem.radio', '/components/formitem/radio', '单选组件', '1', 'components:formitem:radio', 1, 0, 0, 0, NULL, NULL, 0, '24', '2026-07-28 09:55:24', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081921563679485954', 'components.formitem.checkbox', '/components/formitem/checkbox', '多选框组件', '1', 'components:formitem:checkbox', 1, 0, 0, 0, NULL, NULL, 0, '24', '2026-07-28 09:55:56', '2026-07-28 10:07:37', NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2081924406721343489', 'components.tablegroup.actionlist', '/components/tablegroup/actionlist', '操作列表', '1', 'components:tablegroup:actionlist', 1, 0, 0, 0, NULL, NULL, 5, '25', '2026-07-28 10:07:14', '2026-07-28 10:07:51', NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2082275011956523009', 'tools', '/tools', '开发工具', '1', 'tools', 1, 0, 0, 0, NULL, 'LucideToolCase', 0, '-1', '2026-07-29 09:20:24', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2082279983850930177', 'tools.data', '/tools/data', '数据仓库', '1', 'tools:data', 1, 0, 0, 0, NULL, NULL, 0, '2082275011956523009', '2026-07-29 09:40:10', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2082280159122505729', 'tools.database', '/tools/database', '库表生成', '1', 'tools:database', 1, 0, 0, 0, NULL, NULL, 0, '2082275011956523009', '2026-07-29 09:40:51', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2082280344238112769', 'tools.form', '/tools/form', '表单设计', '1', 'tools:form', 1, 0, 0, 0, NULL, NULL, 0, '2082275011956523009', '2026-07-29 09:41:36', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2082280492070551553', 'tools.code', '/tools/code', '代码生成', '1', 'tools:code', 1, 0, 0, 0, NULL, NULL, 0, '2082275011956523009', '2026-07-29 09:42:11', NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('2086651745808039937', 'components.interactgroup.stepform', '/components/interactgroup/stepform', '分步表单', '1', 'components:interactgroup:stepform', 1, 0, 0, 0, NULL, NULL, 999, '30', '2026-08-10 11:11:59', '2026-08-10 11:12:53', NULL, NULL, 0);
INSERT INTO `menu` VALUES ('21', 'components.tablegroup.rendercolumn', '/components/tablegroup/rendercolumn', '字段列', '1', 'components:tablegroup:rendercolumn', 1, 0, 0, 0, NULL, NULL, 18, '25', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('22', 'components.cardgroup.selectcardgroup', '/components/cardgroup/selectcardgroup', '卡片选择', '1', 'components:cardgroup:selectcardgroup', 1, 0, 0, 0, NULL, NULL, 17, '28', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('23', 'components.toolgroup.success', '/components/toolgroup/success', '成功结果', '1', 'components:toolgroup:success', 1, 0, 0, 0, NULL, NULL, 19, '29', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('24', 'components.formitem', '/components/formitem', '表单类组件', '1', 'components:formgroup', 1, 0, 0, 0, NULL, NULL, NULL, '2081611856674787330', NULL, '2026-07-28 10:57:21', NULL, NULL, 0);
INSERT INTO `menu` VALUES ('25', 'components.tablegroup', '/components/tablegroup', '表格列表组件', '1', 'components:tablegroup', 1, 0, 0, 0, NULL, NULL, NULL, '2081611856674787330', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('26', 'components.chartgroup', '/components/chartgroup', '图表可视化', '1', 'components:chartgroup', 1, 0, 0, 0, NULL, NULL, NULL, '2081611856674787330', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('27', 'components.icongroup', '/components/icongroup', '标签图标组件', '1', 'components:icongroup', 1, 0, 0, 0, NULL, NULL, NULL, '2081611856674787330', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('28', 'components.cardgroup', '/components/cardgroup', '卡片容器组件', '1', 'components:cardgroup', 1, 0, 0, 0, NULL, NULL, NULL, '2081611856674787330', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('29', 'components.toolgroup', '/components/toolgroup', '状态工具组件', '1', 'components:toolgroup', 1, 0, 0, 0, NULL, NULL, NULL, '2081611856674787330', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('3', 'system.menu', '/system/menu', '菜单管理', '1', 'system:menu', 1, 0, 0, 0, NULL, NULL, 101, '1', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('30', 'components.interactgroup', '/components/interactgroup', '交互类组件', '1', 'components:interactgroup', 1, 0, 0, 0, NULL, NULL, NULL, '2081611856674787330', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('4', 'system.role', '/system/role', '角色管理', '1', 'system:role', 1, 0, 0, 0, NULL, NULL, 102, '1', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5', 'system.log', '/system/log', '日志管理', '1', 'system:log', 1, 0, 0, 0, NULL, NULL, 103, '1', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f6926d0-8971-11f1-a5d7-f4a80de6dec5', 'system.user.page', '/system/user/page', '用户分页列表', '2', 'system:user:page', 1, 0, 0, 0, NULL, NULL, 200, '2', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f69498d-8971-11f1-a5d7-f4a80de6dec5', 'system.user.get', '/system/user/get', '用户详情', '2', 'system:user:read', 1, 0, 0, 0, NULL, NULL, 201, '2', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f694cc5-8971-11f1-a5d7-f4a80de6dec5', 'system.user.create', '/system/user/create', '用户新增', '2', 'system:user:create', 1, 0, 0, 0, NULL, NULL, 202, '2', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f694e08-8971-11f1-a5d7-f4a80de6dec5', 'system.user.update', '/system/user/update', '用户编辑', '2', 'system:user:update', 1, 0, 0, 0, NULL, NULL, 203, '2', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f694f37-8971-11f1-a5d7-f4a80de6dec5', 'system.user.delete', '/system/user/delete', '用户删除', '2', 'system:user:delete', 1, 0, 0, 0, NULL, NULL, 204, '2', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f695038-8971-11f1-a5d7-f4a80de6dec5', 'system.menu.page', '/system/menu/page', '菜单分页列表', '2', 'system:menu:page', 1, 0, 0, 0, NULL, NULL, 200, '3', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f695136-8971-11f1-a5d7-f4a80de6dec5', 'system.menu.get', '/system/menu/get', '菜单详情', '2', 'system:menu:read', 1, 0, 0, 0, NULL, NULL, 201, '3', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f695256-8971-11f1-a5d7-f4a80de6dec5', 'system.menu.create', '/system/menu/create', '菜单新增', '2', 'system:menu:create', 1, 0, 0, 0, NULL, NULL, 202, '3', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f695383-8971-11f1-a5d7-f4a80de6dec5', 'system.menu.update', '/system/menu/update', '菜单编辑', '2', 'system:menu:update', 1, 0, 0, 0, NULL, NULL, 203, '3', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f695490-8971-11f1-a5d7-f4a80de6dec5', 'system.menu.delete', '/system/menu/delete', '菜单删除', '2', 'system:menu:delete', 1, 0, 0, 0, NULL, NULL, 204, '3', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f695632-8971-11f1-a5d7-f4a80de6dec5', 'system.role.page', '/system/role/page', '角色分页列表', '2', 'system:role:page', 1, 0, 0, 0, NULL, NULL, 200, '4', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f6957a8-8971-11f1-a5d7-f4a80de6dec5', 'system.role.get', '/system/role/get', '角色详情', '2', 'system:role:read', 1, 0, 0, 0, NULL, NULL, 201, '4', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f6958a2-8971-11f1-a5d7-f4a80de6dec5', 'system.role.create', '/system/role/create', '角色新增', '2', 'system:role:create', 1, 0, 0, 0, NULL, NULL, 202, '4', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f6959af-8971-11f1-a5d7-f4a80de6dec5', 'system.role.update', '/system/role/update', '角色编辑', '2', 'system:role:update', 1, 0, 0, 0, NULL, NULL, 203, '4', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('5f695ab7-8971-11f1-a5d7-f4a80de6dec5', 'system.role.delete', '/system/role/delete', '角色删除', '2', 'system:role:delete', 1, 0, 0, 0, NULL, NULL, 204, '4', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('6', 'system.schedule', '/system/schedule', '任务管理', '1', 'system:schedule', 1, 0, 0, 0, NULL, NULL, 104, '1', NULL, NULL, NULL, NULL, 0);
INSERT INTO `menu` VALUES ('7', 'home', '/home', '仪表盘', '1', NULL, 1, NULL, 0, 0, NULL, 'home', 0, '-1', NULL, NULL, NULL, NULL, 0);

-- ----------------------------
-- Table structure for menu_role
-- ----------------------------
DROP TABLE IF EXISTS `menu_role`;
CREATE TABLE `menu_role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 644 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of menu_role
-- ----------------------------
INSERT INTO `menu_role` VALUES (15, '7', '2');
INSERT INTO `menu_role` VALUES (574, '2082275011956523009', '2082297025844981762');
INSERT INTO `menu_role` VALUES (575, '2082279983850930177', '2082297025844981762');
INSERT INTO `menu_role` VALUES (576, '2082280159122505729', '2082297025844981762');
INSERT INTO `menu_role` VALUES (577, '2082280344238112769', '2082297025844981762');
INSERT INTO `menu_role` VALUES (578, '2082280492070551553', '2082297025844981762');
INSERT INTO `menu_role` VALUES (587, '7', '1');
INSERT INTO `menu_role` VALUES (588, '2081611856674787330', '1');
INSERT INTO `menu_role` VALUES (589, '24', '1');
INSERT INTO `menu_role` VALUES (590, '2081921331356987393', '1');
INSERT INTO `menu_role` VALUES (591, '2081921431030427649', '1');
INSERT INTO `menu_role` VALUES (592, '2081921563679485954', '1');
INSERT INTO `menu_role` VALUES (593, '2081620612150185986', '1');
INSERT INTO `menu_role` VALUES (594, '25', '1');
INSERT INTO `menu_role` VALUES (595, '2081612555252912129', '1');
INSERT INTO `menu_role` VALUES (596, '2081924406721343489', '1');
INSERT INTO `menu_role` VALUES (597, '21', '1');
INSERT INTO `menu_role` VALUES (598, '26', '1');
INSERT INTO `menu_role` VALUES (599, '11', '1');
INSERT INTO `menu_role` VALUES (600, '12', '1');
INSERT INTO `menu_role` VALUES (601, '27', '1');
INSERT INTO `menu_role` VALUES (602, '13', '1');
INSERT INTO `menu_role` VALUES (603, '14', '1');
INSERT INTO `menu_role` VALUES (604, '20', '1');
INSERT INTO `menu_role` VALUES (605, '28', '1');
INSERT INTO `menu_role` VALUES (606, '16', '1');
INSERT INTO `menu_role` VALUES (607, '19', '1');
INSERT INTO `menu_role` VALUES (608, '22', '1');
INSERT INTO `menu_role` VALUES (609, '29', '1');
INSERT INTO `menu_role` VALUES (610, '10', '1');
INSERT INTO `menu_role` VALUES (611, '15', '1');
INSERT INTO `menu_role` VALUES (612, '17', '1');
INSERT INTO `menu_role` VALUES (613, '18', '1');
INSERT INTO `menu_role` VALUES (614, '23', '1');
INSERT INTO `menu_role` VALUES (615, '30', '1');
INSERT INTO `menu_role` VALUES (616, '2081918567847522306', '1');
INSERT INTO `menu_role` VALUES (617, '2081919840202223618', '1');
INSERT INTO `menu_role` VALUES (618, '2081920450284711938', '1');
INSERT INTO `menu_role` VALUES (619, '2086651745808039937', '1');
INSERT INTO `menu_role` VALUES (620, '1', '1');
INSERT INTO `menu_role` VALUES (621, '2', '1');
INSERT INTO `menu_role` VALUES (622, '5f6926d0-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (623, '5f69498d-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (624, '5f694cc5-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (625, '5f694e08-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (626, '5f694f37-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (627, '3', '1');
INSERT INTO `menu_role` VALUES (628, '5f695038-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (629, '5f695136-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (630, '5f695256-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (631, '5f695383-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (632, '5f695490-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (633, '4', '1');
INSERT INTO `menu_role` VALUES (634, '5f695632-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (635, '5f6957a8-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (636, '5f6958a2-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (637, '5f6959af-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (638, '5f695ab7-8971-11f1-a5d7-f4a80de6dec5', '1');
INSERT INTO `menu_role` VALUES (639, '5', '1');
INSERT INTO `menu_role` VALUES (640, '6', '1');
INSERT INTO `menu_role` VALUES (641, '111', '1');
INSERT INTO `menu_role` VALUES (642, '113', '1');
INSERT INTO `menu_role` VALUES (643, '112', '1');
INSERT INTO `menu_role` VALUES (644, '114', '1');

-- ----------------------------
-- Table structure for mock_data_pool
-- ----------------------------
DROP TABLE IF EXISTS `mock_data_pool`;
CREATE TABLE `mock_data_pool`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '数据键名',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '数据描述',
  `data_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '数据内容，JSON 数组',
  `sort_num` int(11) NULL DEFAULT 0 COMMENT '排序',
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name`(`name`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '微数据-模拟数据池' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of mock_data_pool
-- ----------------------------
INSERT INTO `mock_data_pool` VALUES ('2082000000000000001', 'username', '用户名', '[\"user\",\"bob\",\"tom\",\"lucy\",\"lili\",\"mary\"]', 1, '2026-07-29 10:00:09', '2026-07-29 10:58:58', NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082000000000000002', 'city', '城市', '[\"淮北\",\"北京\",\"上海\",\"广州\",\"深圳\",\"杭州\",\"南京\",\"苏州\"]', 2, '2026-07-29 10:00:09', '2026-07-30 10:52:27', NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082000000000000003', 'computed', '电脑', '[\"华硕\",\"联想\",\"苹果\"]', 3, '2026-07-29 10:00:09', NULL, NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082000000000000004', 'sex', '性别', '[\"男\",\"女\",\"保密\"]', 4, '2026-07-29 10:00:09', NULL, NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082000000000000005', 'goods', '商品数据', '[\"iphone 14\",\"Huawei Mate50 Pro\",\"小米 13\",\"Mac Book Pro 2023\",\"Huawei MateBook Pro\"]', 5, '2026-07-29 10:00:09', NULL, NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082000000000000006', 'itTag', '程序员技术标签', '[\"前端\",\"后端\",\"javascript\",\"vue\",\"react\",\"typescript\",\"java\",\"springboot\"]', 6, '2026-07-29 10:00:09', '2026-07-29 10:39:21', NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082000000000000007', 'book', '书名', '[\"三国演义\",\"水浒传\",\"红楼梦\",\"西游记\"]', 7, '2026-07-29 10:00:09', NULL, NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082000000000000008', 'subway', '地铁', '[\"1号线\",\"2号线\",\"3号线\"]', 8, '2026-07-29 10:00:09', NULL, NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082324237189013505', 'avatar', '用户头像', '[\"https://p3-pc-sign.douyinpic.com/aweme-avatar/tos-cn-i-0813_os9CxFA7AWufC6UWGqAaAKCiYAIAQAxZDXfKEg~tplv-8yspqt5zfm-300x300.webp?lk3s=93de098e&x-expires=1785470400&x-signature=0r%2F2MA5mhU20YgC506cdUSxc8lY%3D&from=2480802190&s=profile&se=false&sc=avatar&l=202607291230234B31B42682EC8570288F\",\"https://p3-pc.douyinpic.com/img/aweme-avatar/tos-cn-i-0813c000-ce_okFAAEKDwiAErqZFfAq9EAAjIBAWTQQSAZOCee~c5_300x300.jpeg?from=2956013662\",\"//p11.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_d4ba3c95f2c4e0158b1b80d66981edb5\",\"//p11.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_26e808d926869f8415b672265b59ac43\",\"//p11.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c000-ce_oIWIwXIEZWATEWo7MiUeAkiAhBzvf2Ap9AE7Ae\"]', 0, '2026-07-29 12:36:01', '2026-07-29 12:36:29', NULL, NULL, 1);
INSERT INTO `mock_data_pool` VALUES ('2082659037926076417', 'food', '食物', '[\"红烧肉\",\"锅包肉\",\"地锅鸡\",\"香菇青菜\",\"西红柿炒鸡蛋\",\"黄瓜炒鸡蛋\",\"豆芽粉丝\",\"豆角焖面\"]', 0, '2026-07-30 10:46:23', NULL, NULL, NULL, 0);
INSERT INTO `mock_data_pool` VALUES ('2082660729702789121', 'company', '公司', '[\"阿里巴巴\",\"腾讯\",\"京东\",\"字节跳动\",\"科大讯飞\"]', 0, '2026-07-30 10:53:07', NULL, NULL, NULL, 0);

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `name_zh` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of role
-- ----------------------------
INSERT INTO `role` VALUES ('1', 'ROLE_admin', '管理员', '访问系统全部权限，最高级权限', NULL, NULL, NULL, NULL, 0);
INSERT INTO `role` VALUES ('2', 'ROLE_user', '普通用户', '访问部分功能', NULL, NULL, NULL, NULL, 0);
INSERT INTO `role` VALUES ('2018891297289850882', 'ROLE_hr', '人事专员', '处理人事相关的业务角色', NULL, NULL, NULL, NULL, 1);
INSERT INTO `role` VALUES ('2018891791487913986', 'ROLE_saler', '销售专员', '处理销售相关业务的角色', NULL, NULL, NULL, NULL, 1);
INSERT INTO `role` VALUES ('2082297025844981762', 'ROLE_developer', '开发人员', '开发人员具有的权限', '2026-07-29 10:47:53', NULL, NULL, NULL, 0);

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config`  (
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键',
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
  `config_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置名称',
  `config_value` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '配置值',
  `config_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'string' COMMENT '值类型：string/boolean/number/json',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `public_flag` tinyint(4) NULL DEFAULT 0 COMMENT '是否对前端公开：1是 0否',
  `sort_num` int(11) NULL DEFAULT 0 COMMENT '排序',
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_by` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_config_key`(`config_key`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sys_config
-- ----------------------------
INSERT INTO `sys_config` VALUES ('sys_config_encrypt_enabled', 'security.encrypt.enabled', '开启加密传输', 'false', 'boolean', '开启后接口请求体与响应 data 使用 AES 加密', 1, 1, '2026-08-10 12:09:15', '2026-08-10 12:36:13', NULL, NULL, 0);
INSERT INTO `sys_config` VALUES ('sys_config_system_name', 'system.name', '系统名称', 'Pangza Admin', 'string', '系统展示名称', 1, 2, '2026-08-10 12:09:15', '2026-08-10 12:39:36', NULL, NULL, 0);

-- ----------------------------
-- Table structure for sys_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `avatar` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `controller_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `method_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `business` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `oper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `time_long` int(11) NULL DEFAULT NULL,
  `response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `create_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `update_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `error_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `delete_flag` tinyint(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1404 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sys_log
-- ----------------------------

-- ----------------------------
-- Table structure for sys_schedule
-- ----------------------------
DROP TABLE IF EXISTS `sys_schedule`;
CREATE TABLE `sys_schedule`  (
  `id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务标题',
  `cron` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Cron 表达式',
  `bean_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Spring Bean 名称',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务描述',
  `status` tinyint(4) NULL DEFAULT 1 COMMENT '状态：1启用 0停用',
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_by` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_sys_schedule_status`(`status`) USING BTREE,
  INDEX `idx_sys_schedule_title`(`title`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '定时任务' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sys_schedule
-- ----------------------------
INSERT INTO `sys_schedule` VALUES ('1', '清理系统日志', '0 0 2 * * ?', 'sysLogCleanTask', '每天凌晨 2 点清理过期系统日志（示例任务）', 1, '2026-08-10 12:49:30', '2026-08-10 13:06:54', NULL, NULL, 0);
INSERT INTO `sys_schedule` VALUES ('2', '同步用户缓存', '0 */30 * * * ?', 'userCacheSyncTask', '每 30 分钟同步一次用户权限缓存（示例任务）', 0, '2026-08-10 12:49:30', NULL, NULL, NULL, 0);
INSERT INTO `sys_schedule` VALUES ('2086685135819190274', '三秒执行', '0/3 * * * * ?', 'sysLogTask', '三秒执行描述', 0, '2026-08-10 13:24:40', '2026-08-10 13:35:24', NULL, NULL, 0);

-- ----------------------------
-- Table structure for table_config
-- ----------------------------
DROP TABLE IF EXISTS `table_config`;
CREATE TABLE `table_config`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '表名',
  `table_comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '表描述',
  `field_config` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '字段配置 JSON 数组',
  `sort_num` int(11) NULL DEFAULT 0 COMMENT '排序',
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_table_name`(`table_name`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '微数据-创建库表配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of table_config
-- ----------------------------
INSERT INTO `table_config` VALUES ('2082338777519804417', 'hello_world', '用户', '[{\"id\":\"1785302704980_xbqa30\",\"fieldName\":\"demo\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"\",\"mockType\":\"username\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false}]', 0, '2026-07-29 13:33:47', '2026-07-29 14:41:50', NULL, NULL, 0);
INSERT INTO `table_config` VALUES ('2082342664091914241', 'test_table', '测试表格', '[{\"id\":\"1785304131110_33gwku\",\"fieldName\":\"id\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"会议 ID\",\"mockType\":\"\",\"primaryKey\":true,\"autoIncrement\":false,\"notNull\":true,\"indexed\":true,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_s5k531\",\"fieldName\":\"community_id\",\"fieldType\":\"bigint\",\"defaultValue\":\"\",\"comment\":\"小区 ID\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_nfmo1a\",\"fieldName\":\"name\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"会议名称\",\"mockType\":\"username\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":true,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_hufp8t\",\"fieldName\":\"start_time\",\"fieldType\":\"datetime\",\"defaultValue\":\"\",\"comment\":\"开始时间\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"datetime\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_g8velg\",\"fieldName\":\"end_time\",\"fieldType\":\"datetime\",\"defaultValue\":\"\",\"comment\":\"结束时间\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"datetime\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_3m9ec7\",\"fieldName\":\"status\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"会议状态\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":true,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_yss43l\",\"fieldName\":\"attachments\",\"fieldType\":\"text\",\"defaultValue\":\"\",\"comment\":\"会议附件 JSON，存储文件地址列表\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":true,\"hideInTable\":false,\"formSlot\":true,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_9luf26\",\"fieldName\":\"type\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"会议类型\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_f9d7aa\",\"fieldName\":\"introduction\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"会议介绍\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":true,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"textarea\",\"hideInForm\":false,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_cmvi4f\",\"fieldName\":\"delete_flag\",\"fieldType\":\"tinyint\",\"defaultValue\":\"\",\"comment\":\"逻辑删除：0 - 未删除，1 - 已删除\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":true,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":true,\"hideInTable\":true,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":true,\"disabled\":false,\"readOnly\":false},{\"id\":\"1785304131110_cudxz9\",\"fieldName\":\"create_time\",\"fieldType\":\"datetime\",\"defaultValue\":\"\",\"comment\":\"创建时间\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":false,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"datetime\",\"hideInForm\":true,\"disabled\":true,\"readOnly\":true},{\"id\":\"1785304131110_nxccjz\",\"fieldName\":\"update_time\",\"fieldType\":\"datetime\",\"defaultValue\":\"\",\"comment\":\"更新时间\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":true,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"datetime\",\"hideInForm\":true,\"disabled\":true,\"readOnly\":true},{\"id\":\"1785304131110_rv04jf\",\"fieldName\":\"create_by\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"创建人\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":true,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":true,\"disabled\":true,\"readOnly\":true},{\"id\":\"1785304131110_klt272\",\"fieldName\":\"update_by\",\"fieldType\":\"varchar\",\"defaultValue\":\"\",\"comment\":\"更新人\",\"mockType\":\"\",\"primaryKey\":false,\"autoIncrement\":false,\"notNull\":false,\"indexed\":false,\"mybatis\":true,\"swagger\":true,\"hideInSearch\":true,\"hideInTable\":false,\"formSlot\":false,\"searchSlot\":false,\"advancedSearchType\":\"input\",\"hideInForm\":true,\"disabled\":true,\"readOnly\":true}]', 0, '2026-07-29 13:49:14', '2026-07-29 14:41:50', NULL, NULL, 0);

-- ----------------------------
-- Table structure for test
-- ----------------------------
DROP TABLE IF EXISTS `test`;
CREATE TABLE `test`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(255) NULL DEFAULT NULL,
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of test
-- ----------------------------
INSERT INTO `test` VALUES (2, 'hello2', 1, NULL, NULL);
INSERT INTO `test` VALUES (3, 'hello', NULL, NULL, NULL);
INSERT INTO `test` VALUES (4, 'logic_1789377093191', 1, '2026-09-14 17:11:33', '2026-09-14 17:11:33');
INSERT INTO `test` VALUES (5, 'logic_http', 1, '2026-09-14 17:12:17', '2026-09-14 17:12:43');
INSERT INTO `test` VALUES (6, 'ok2', 0, '2026-09-14 17:40:26', '2026-09-14 17:40:26');
INSERT INTO `test` VALUES (7, 'todel', 1, '2026-09-14 17:40:26', '2026-09-14 17:40:26');
INSERT INTO `test` VALUES (8, 'hello', 0, '2026-09-14 17:42:03', '2026-09-14 17:42:03');
INSERT INTO `test` VALUES (9, 'ent_upd_1789440288009', 0, '2026-09-15 10:44:48', '2026-09-15 10:44:48');
INSERT INTO `test` VALUES (10, 'via_table', 0, '2026-09-15 10:44:48', '2026-09-15 10:44:48');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `nick_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `avatar` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `delete_flag` tinyint(4) NULL DEFAULT 0,
  `create_time` datetime(0) NULL DEFAULT NULL,
  `update_time` datetime(0) NULL DEFAULT NULL,
  `create_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `update_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES ('1', 'admin', '$2a$10$4VokRpxE2fn2tVYLIZtXrO6yhLw9UHVeI8mnooYssf3rat1MaDznO', '我是大帅哥', 'https://p3-pc.douyinpic.com/img/aweme-avatar/tos-cn-i-0813c000-ce_okFAAEKDwiAErqZFfAq9EAAjIBAWTQQSAZOCee~c5_300x300.jpeg?from=2956013662', '1515099153@qq.com', '安徽淮北', '18256112206', 0, '2025-12-30 08:00:00', '2026-01-06 11:07:37', '1', '1');
INSERT INTO `user` VALUES ('2', 'yuantou', '$2a$10$4491FwyAWcCQAebE3C6ym.jFP8bCMRmLN1AcQRGjpxkWAR2SKKfPK', '小圆', 'https://p9-pc-sign.douyinpic.com/tos-cn-i-0813c000-ce/ogwAEiSM1EACXCY5ABEXBHjMiAfEeIPe2ArIi8~tplv-dy-aweme-images:q75.webp?biz_tag=aweme_images&from=327834062&lk3s=138a59ce&s=PackSourceEnum_PUBLISH&sc=image&se=false&x-expires=1787889600&x-signature=aLhQxAday4JF013%2BycgAGU47yD8%3D', 'yuantou990528@gmail.com', '江苏徐州', '18256112206', 0, '2026-02-05 09:41:10', '2026-07-29 12:40:40', NULL, NULL);
INSERT INTO `user` VALUES ('2019650952119185410', 'xiaoquan', '$2a$10$Q7YmsY0n.Y6dnVnf/XmT1OMSaOQAVwokMXxCcg4yrWaeu4LsUzrXa', '小泉说房产', 'https://p3-pc.douyinpic.com/img/aweme-avatar/tos-cn-i-0813c000-ce_oUAAAf52DEBoFAJAHLEXaTIIJEeQjs5wse9R5A~c5_300x300.jpeg?from=2956013662', 'xiaoquan@gmail.com', '山东济南', '15555555555', 0, NULL, '2026-02-12 16:14:57', NULL, NULL);
INSERT INTO `user` VALUES ('2019652052863889409', 'dengchangtao', '$2a$10$Y2YOFySNl23/Y.OLwr7S8u/8.FF/Vgkjm4tw0oM.1kDpOgKZ7JmNm', '邓昌涛', 'https://www.itheima.com/images/teacher/aiapp/20251211103036%E9%82%93%E6%98%8C%E6%B6%9B.png', 'dengchaotang@gmail.com', '湖北武汉', '13333333333', 0, NULL, NULL, NULL, NULL);
INSERT INTO `user` VALUES ('2019655772427186177', 'zhaozhengchuan', '$2a$10$ER/USIrL/Pgro4a.Srooe.IOV6/lI4LbUjgrx9Kizgk598i2DdDbG', '赵正川', 'https://p3-pc.douyinpic.com/img/aweme-avatar/tos-cn-avt-0015_0ff39d393338f349964dabc7179a1eb8~c5_300x300.jpeg?from=2956013662', 'zhaozhengchuan@gmail.com', '安徽淮北', '922179795', 0, NULL, NULL, NULL, NULL);
INSERT INTO `user` VALUES ('2019699716393508865', 'zongxuan', '$2a$10$lgYcDZPBE6a6BZQB7N1n7ubZQ1wuiI4F8wSW5Pxcm6OaS2DGOnj2a', '宗眩', 'https://p3-pc.douyinpic.com/img/aweme-avatar/tos-cn-avt-0015_1350a97976e1fe9a996ef1b9fac8f8ee~c5_300x300.jpeg?from=2956013662', 'zongxuan@gmail.com', '江苏徐州', '15888888888', 0, '2026-02-06 17:08:31', '2026-02-06 17:23:27', NULL, NULL);

-- ----------------------------
-- Table structure for user_role
-- ----------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `role_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1876385794 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_role
-- ----------------------------
INSERT INTO `user_role` VALUES (685223937, '1', '1');
INSERT INTO `user_role` VALUES (685223938, '1', '2');
INSERT INTO `user_role` VALUES (752332802, '1', '2082297025844981762');
INSERT INTO `user_role` VALUES (1876385794, '2019699716393508865', '2082297025844981762');

SET FOREIGN_KEY_CHECKS = 1;
