import Color from "color";
import StringUtil from "../clz/StringUtil";
import { Color as TColor } from 'tvision-color';
import type {
    CustomSkinConfig,
    ThemeRadiusPreset,
    ThemeSizePreset,
    ThemeSkinColors,
    ThemeSkinPreset,
    ThemeSkinType,
} from '@/utils/data/themeSkin';
import {
    buildCustomSkinPreset,
    getThemeSkinPreset,
    getThemeSizeTokens,
    THEME_RADIUS_PRESETS,
} from '@/utils/data/themeSkin';

export interface ThemeSkinApplyOptions {
    customSkin?: CustomSkinConfig;
    radiusPreset?: ThemeRadiusPreset;
    sizePreset?: ThemeSizePreset;
    enableShadow?: boolean;
    enableBorder?: boolean;
}

const THEME_STYLE_ID = 'pangza-dynamic-theme';

type SemanticType = keyof typeof SEMANTIC_TOKEN_MAP;

/** 语义色各状态对应的色阶槽位，与 TDesign 官方主题保持一致 */
const SEMANTIC_TOKEN_MAP = {
    brand: {
        light: { main: 7, hover: 6, active: 8, focus: 2, disabled: 3, light: 1, lightHover: 2 },
        dark: { main: 8, hover: 7, active: 9, focus: 2, disabled: 3, light: 1, lightHover: 2 },
    },
    success: {
        light: { main: 5, hover: 4, active: 6, focus: 2, disabled: 3, light: 1, lightHover: 2 },
        dark: { main: 5, hover: 4, active: 6, focus: 2, disabled: 3, light: 1, lightHover: 2 },
    },
    warning: {
        light: { main: 5, hover: 4, active: 6, focus: 2, disabled: 3, light: 1, lightHover: 2 },
        dark: { main: 5, hover: 4, active: 6, focus: 2, disabled: 3, light: 1, lightHover: 2 },
    },
    error: {
        light: { main: 6, hover: 5, active: 7, focus: 2, disabled: 3, light: 1, lightHover: 2 },
        dark: { main: 6, hover: 5, active: 7, focus: 2, disabled: 3, light: 1, lightHover: 2 },
    },
} as const;


interface ColorOption {
    count?: number;
    color?: string;
}

export function createNameSpace(name: string) {

    let prefixName = name;

    function b(block: string = '') {
        return StringUtil.buildString(prefixName, block ? { split: '-', text: block } : '').trim();
    }

    function e(element: string = '') {
        return StringUtil.buildString(prefixName, element ? { split: '__', text: element } : '').trim();
    }

    function m(modifier: string = '') {
        return StringUtil.buildString(prefixName, modifier ? { split: '--', text: modifier } : '').trim();
    }

    function be(block: string = '', element: string = '') {
        return StringUtil.buildString(prefixName, block ? { split: '-', text: block } : '', element ? { split: '__', text: element } : '').trim();
    }

    function bm(block: string = '', modifier: string = '') {
        return StringUtil.buildString(prefixName, block ? { split: '-', text: block } : '', modifier ? { split: '__', text: modifier } : '').trim();
    }

    function em(element: string = '', modifier: string = '') {
        return StringUtil.buildString(prefixName, element ? { split: '-', text: element } : '', modifier ? { split: '__', text: modifier } : '').trim();
    }

    function bem(block: string = '', element: string = '', modifier: string = '') {
        return StringUtil.buildString(prefixName, block ? { split: '-', text: block } : '', element ? { split: '-', text: element } : '', modifier ? { split: '__', text: modifier } : '').trim();
    }

    function getName() {
        return prefixName;
    }

    return {
        b,
        e,
        m,
        bm,
        be,
        em,
        bem,
        getName
    }
}

export function getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name)
}

export function mixColor(baseColor: string, ...colors: string[]) {
    let mixColor = Color(baseColor);
    colors.forEach(item => {
        mixColor = mixColor.mix(Color(item));
    })
    return mixColor.string();
}

export function mixColorByOption(baseColor: string, option: ColorOption = {}) {
    const isDark = document.documentElement.getAttribute('theme-mode') === 'dark';
    const { count = 1, color = isDark ? '#333' : '#FFF' } = option;

    let mixColor = Color(baseColor);

    for (let i = 0; i < count; i++) {
        mixColor = mixColor.mix(Color(color))
    }

    return mixColor.string();
}

/**
 * 将色阶对齐到 TDesign 主色槽位，并锚定用户输入的精确色值
 */
function alignPaletteToMainSlot(
    palette: string[],
    primaryIndex: number,
    mainIndex0: number,
    inputColor: string,
) {
    const shift = mainIndex0 - primaryIndex;
    const aligned: string[] = new Array(10);

    for (let index = 0; index < 10; index += 1) {
        const sourceIndex = index - shift;
        if (sourceIndex >= 0 && sourceIndex < 10) {
            aligned[index] = palette[sourceIndex];
            continue;
        }

        if (sourceIndex < 0) {
            const mixRatio = Math.min(0.85, 0.2 + Math.abs(sourceIndex) * 0.12);
            aligned[index] = Color(palette[0]).mix(Color('#ffffff'), mixRatio).hex();
            continue;
        }

        const mixRatio = Math.min(0.85, 0.2 + (sourceIndex - 9) * 0.12);
        aligned[index] = Color(palette[9]).mix(Color('#000000'), mixRatio).hex();
    }

    aligned[mainIndex0] = Color(inputColor).hex();
    return aligned;
}

/**
 * 根据主色计算语义色的交互态颜色，避免暗色模式下 hover/active 偏灰
 */
function buildSemanticStateColor(
    mainHex: string,
    mode: 'light' | 'dark',
    state: 'hover' | 'active' | 'focus' | 'disabled' | 'light' | 'lightHover',
) {
    const base = Color(mainHex);

    switch (state) {
        case 'hover':
            return mode === 'dark' ? base.darken(0.14).saturate(0.05).hex() : base.darken(0.08).hex();
        case 'active':
            return mode === 'dark' ? base.lighten(0.12).saturate(0.05).hex() : base.darken(0.16).hex();
        case 'focus':
            return mode === 'dark' ? base.mix(Color('#000000'), 0.65).hex() : base.mix(Color('#ffffff'), 0.72).hex();
        case 'disabled':
            return mode === 'dark' ? base.mix(Color('#000000'), 0.45).hex() : base.mix(Color('#ffffff'), 0.55).hex();
        case 'light':
            return mode === 'dark' ? `${base.hex()}33` : base.mix(Color('#ffffff'), 0.88).hex();
        case 'lightHover':
            return mode === 'dark' ? `${base.hex()}55` : base.mix(Color('#ffffff'), 0.78).hex();
        default:
            return mainHex;
    }
}

function createAlignedPalette(color: string, mode: 'light' | 'dark', type: SemanticType) {
    const { colors, primary } = TColor.getColorGradations({
        colors: [color],
        remainInput: true,
    })[0];

    const mainIndex1 = SEMANTIC_TOKEN_MAP[type][mode].main;
    const mainIndex0 = mainIndex1 - 1;
    let palette = alignPaletteToMainSlot(colors, primary, mainIndex0, color);

    if (mode === 'dark') {
        palette[0] = `${palette[mainIndex0]}33`;
    }

    return {
        palette,
        mainIndex0,
        mainIndex1,
        inputColor: Color(color).hex(),
    };
}

export function buildSemanticColorMap(
    theme: string,
    colorPalette: Array<string>,
    mode: 'light' | 'dark',
    mainIndex0: number,
) {
    return {
        '--td-brand-color': colorPalette[mainIndex0] ?? theme,
        '--td-brand-color-1': colorPalette[0],
        '--td-brand-color-2': colorPalette[1],
        '--td-brand-color-3': colorPalette[2],
        '--td-brand-color-4': colorPalette[3],
        '--td-brand-color-5': colorPalette[4],
        '--td-brand-color-6': colorPalette[5],
        '--td-brand-color-7': colorPalette[6],
        '--td-brand-color-8': colorPalette[7],
        '--td-brand-color-9': colorPalette[8],
        '--td-brand-color-10': colorPalette[9],
    };
}

export function createSemanticColorMap(
    color: string,
    mode: 'light' | 'dark',
    type: SemanticType = 'brand',
) {
    const mainIndex0 = SEMANTIC_TOKEN_MAP[type][mode].main - 1;
    const { palette } = createAlignedPalette(color, mode, type);
    return buildSemanticColorMap(color, palette, mode, mainIndex0);
}

function buildSemanticCssVars(
    prefix: SemanticType,
    color: string,
    mode: 'light' | 'dark',
) {
    const tokens = SEMANTIC_TOKEN_MAP[prefix][mode];
    const mainIndex0 = tokens.main - 1;
    const { palette } = createAlignedPalette(color, mode, prefix);
    const colorMap = buildSemanticColorMap(color, palette, mode, mainIndex0);
    const mainColor = palette[mainIndex0];
    const lines: string[] = [];

    for (let index = 1; index <= 10; index += 1) {
        lines.push(`--td-${prefix}-color-${index}: ${colorMap[`--td-brand-color-${index}`]};`);
    }

    lines.push(`--td-${prefix}-color: ${mainColor};`);
    lines.push(`--td-${prefix}-color-hover: ${buildSemanticStateColor(mainColor, mode, 'hover')};`);
    lines.push(`--td-${prefix}-color-active: ${buildSemanticStateColor(mainColor, mode, 'active')};`);
    lines.push(`--td-${prefix}-color-focus: ${buildSemanticStateColor(mainColor, mode, 'focus')};`);
    lines.push(`--td-${prefix}-color-disabled: ${buildSemanticStateColor(mainColor, mode, 'disabled')};`);
    lines.push(`--td-${prefix}-color-light: ${buildSemanticStateColor(mainColor, mode, 'light')};`);
    lines.push(`--td-${prefix}-color-light-hover: ${buildSemanticStateColor(mainColor, mode, 'lightHover')};`);

    if (prefix === 'brand') {
        lines.push(`--td-text-color-brand: ${mainColor};`);
        lines.push(`--td-text-color-link: ${mode === 'dark' ? mainColor : buildSemanticStateColor(mainColor, mode, 'active')};`);
    }

    return lines;
}

function buildNeutralCssVars(preset: ThemeSkinPreset, mode: 'light' | 'dark') {
    const isDarkMode = mode === 'dark';
    const grayPalette = isDarkMode ? preset.gray.dark : preset.gray.light;
    const fontGray = isDarkMode ? preset.fontGray.dark : preset.fontGray.light;
    const surface = isDarkMode ? preset.surface.dark : preset.surface.light;
    const lines: string[] = [];

    grayPalette.forEach((color, index) => {
        lines.push(`--td-gray-color-${index + 1}: ${color};`);
    });

    if (isDarkMode) {
        lines.push(`--td-font-white-1: ${fontGray[0]};`);
        lines.push(`--td-font-white-2: ${fontGray[1]};`);
        lines.push(`--td-font-white-3: ${fontGray[2]};`);
        lines.push(`--td-font-white-4: ${fontGray[3]};`);
        lines.push('--td-text-color-primary: var(--td-font-white-1);');
        lines.push('--td-text-color-secondary: var(--td-font-white-2);');
        lines.push('--td-text-color-placeholder: var(--td-font-white-3);');
        lines.push('--td-text-color-disabled: var(--td-font-white-4);');
        lines.push(`--td-bg-color-page: ${surface.page};`);
        lines.push(`--td-bg-color-container: ${surface.container};`);
        lines.push(`--td-bg-color-secondarycontainer: ${surface.secondaryContainer};`);
        lines.push('--td-bg-color-container-hover: var(--td-gray-color-12);');
        lines.push('--td-bg-color-container-active: var(--td-gray-color-10);');
        lines.push('--td-bg-color-secondarycontainer-hover: var(--td-gray-color-11);');
        lines.push('--td-bg-color-secondarycontainer-active: var(--td-gray-color-9);');
        lines.push('--td-bg-color-container-select: var(--td-gray-color-9);');
        lines.push('--td-bg-color-component: var(--td-gray-color-11);');
        lines.push('--td-bg-color-component-hover: var(--td-gray-color-10);');
        lines.push('--td-bg-color-component-active: var(--td-gray-color-9);');
        lines.push('--td-bg-color-secondarycomponent: var(--td-gray-color-10);');
        lines.push('--td-bg-color-secondarycomponent-hover: var(--td-gray-color-9);');
        lines.push('--td-bg-color-secondarycomponent-active: var(--td-gray-color-8);');
        lines.push('--td-bg-color-component-disabled: var(--td-gray-color-12);');
        lines.push('--td-bg-color-specialcomponent: transparent;');
        lines.push('--td-text-color-anti: #fff;');
        lines.push(`--td-component-border: ${preset.componentBorder.dark};`);
        lines.push('--td-component-stroke: var(--td-gray-color-11);');
        lines.push('--td-border-level-1-color: var(--td-gray-color-11);');
        lines.push('--td-border-level-2-color: var(--td-gray-color-9);');
    } else {
        lines.push(`--td-font-gray-1: ${fontGray[0]};`);
        lines.push(`--td-font-gray-2: ${fontGray[1]};`);
        lines.push(`--td-font-gray-3: ${fontGray[2]};`);
        lines.push(`--td-font-gray-4: ${fontGray[3]};`);
        lines.push('--td-text-color-primary: var(--td-font-gray-1);');
        lines.push('--td-text-color-secondary: var(--td-font-gray-2);');
        lines.push('--td-text-color-placeholder: var(--td-font-gray-3);');
        lines.push('--td-text-color-disabled: var(--td-font-gray-4);');
        lines.push(`--td-bg-color-page: ${surface.page};`);
        lines.push(`--td-bg-color-container: ${surface.container};`);
        lines.push(`--td-bg-color-secondarycontainer: ${surface.secondaryContainer};`);
        lines.push('--td-bg-color-container-hover: var(--td-gray-color-1);');
        lines.push('--td-bg-color-container-active: var(--td-gray-color-3);');
        lines.push('--td-bg-color-secondarycontainer-hover: var(--td-gray-color-2);');
        lines.push('--td-bg-color-secondarycontainer-active: var(--td-gray-color-4);');
        lines.push('--td-bg-color-container-select: var(--td-gray-color-4);');
        lines.push('--td-bg-color-component: var(--td-gray-color-3);');
        lines.push('--td-bg-color-component-hover: var(--td-gray-color-4);');
        lines.push('--td-bg-color-component-active: var(--td-gray-color-6);');
        lines.push('--td-bg-color-secondarycomponent: var(--td-gray-color-4);');
        lines.push('--td-bg-color-secondarycomponent-hover: var(--td-gray-color-5);');
        lines.push('--td-bg-color-secondarycomponent-active: var(--td-gray-color-6);');
        lines.push('--td-bg-color-component-disabled: var(--td-gray-color-2);');
        lines.push('--td-bg-color-specialcomponent: #fff;');
        lines.push('--td-text-color-anti: var(--td-font-white-1);');
        lines.push(`--td-component-border: ${preset.componentBorder.light};`);
        lines.push('--td-component-stroke: var(--td-gray-color-3);');
        lines.push('--td-border-level-1-color: var(--td-gray-color-3);');
        lines.push('--td-border-level-2-color: var(--td-gray-color-4);');
    }

    return lines;
}

function buildEffectCssVars(options: ThemeSkinApplyOptions) {
    const lines: string[] = [];

    if (options.enableShadow === false) {
        lines.push('--td-shadow-1: none;');
        lines.push('--td-shadow-2: none;');
        lines.push('--td-shadow-3: none;');
    }

    if (options.enableBorder === false) {
        lines.push('--td-component-border: transparent;');
        lines.push('--td-component-stroke: transparent;');
        lines.push('--td-border-level-1-color: transparent;');
        lines.push('--td-border-level-2-color: transparent;');
    }

    return lines;
}

function buildRadiusCssVars(radiusPreset: ThemeRadiusPreset) {
    const radius = THEME_RADIUS_PRESETS[radiusPreset];
    return [
        `--td-radius-small: ${radius.small};`,
        `--td-radius-default: ${radius.default};`,
        `--td-radius-medium: ${radius.medium};`,
        `--td-radius-large: ${radius.large};`,
        `--td-radius-extraLarge: ${radius.extraLarge};`,
    ];
}

function buildSizeCssVars(sizePreset: ThemeSizePreset) {
    const sizeTokens = getThemeSizeTokens(sizePreset);
    const lines = sizeTokens.sizes.map((value, index) => `--td-size-${index + 1}: ${value};`);

    lines.push(`--td-font-size-link-small: ${sizeTokens.fontSizes.linkSmall};`);
    lines.push(`--td-font-size-link-medium: ${sizeTokens.fontSizes.linkMedium};`);
    lines.push(`--td-font-size-link-large: ${sizeTokens.fontSizes.linkLarge};`);
    lines.push(`--td-font-size-body-small: ${sizeTokens.fontSizes.bodySmall};`);
    lines.push(`--td-font-size-body-medium: ${sizeTokens.fontSizes.bodyMedium};`);
    lines.push(`--td-font-size-body-large: ${sizeTokens.fontSizes.bodyLarge};`);
    lines.push(`--td-font-size-title-small: ${sizeTokens.fontSizes.titleSmall};`);
    lines.push(`--td-font-size-title-medium: ${sizeTokens.fontSizes.titleMedium};`);
    lines.push(`--td-font-size-title-large: ${sizeTokens.fontSizes.titleLarge};`);

    lines.push(`--td-line-height-link-small: ${sizeTokens.lineHeights.linkSmall};`);
    lines.push(`--td-line-height-link-medium: ${sizeTokens.lineHeights.linkMedium};`);
    lines.push(`--td-line-height-link-large: ${sizeTokens.lineHeights.linkLarge};`);
    lines.push(`--td-line-height-body-small: ${sizeTokens.lineHeights.bodySmall};`);
    lines.push(`--td-line-height-body-medium: ${sizeTokens.lineHeights.bodyMedium};`);
    lines.push(`--td-line-height-body-large: ${sizeTokens.lineHeights.bodyLarge};`);
    lines.push(`--td-line-height-title-small: ${sizeTokens.lineHeights.titleSmall};`);
    lines.push(`--td-line-height-title-medium: ${sizeTokens.lineHeights.titleMedium};`);
    lines.push(`--td-line-height-title-large: ${sizeTokens.lineHeights.titleLarge};`);

    return lines;
}

function collectThemeSkinCssLines(
    colors: ThemeSkinColors,
    preset: ThemeSkinPreset,
    mode: 'light' | 'dark',
    options: ThemeSkinApplyOptions = {},
) {
    return [
        ...buildSemanticCssVars('brand', colors.brand, mode),
        ...buildSemanticCssVars('success', colors.success, mode),
        ...buildSemanticCssVars('warning', colors.warning, mode),
        ...buildSemanticCssVars('error', colors.error, mode),
        ...buildNeutralCssVars(preset, mode),
        ...(options.radiusPreset ? buildRadiusCssVars(options.radiusPreset) : []),
        ...(options.sizePreset ? buildSizeCssVars(options.sizePreset) : []),
        ...buildEffectCssVars(options),
    ];
}

function cssLinesToStyleVars(lines: string[]) {
    const style: Record<string, string> = {};

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return;
        }

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim().replace(/;$/, '');
        style[key] = value;
    });

    return style;
}

function buildThemeSkinBlock(
    skinId: ThemeSkinType,
    colors: ThemeSkinColors,
    preset: ThemeSkinPreset,
    mode: 'light' | 'dark',
) {
    const selector = mode === 'dark'
        ? `:root[theme-skin="${skinId}"][theme-mode="dark"]`
        : `:root[theme-skin="${skinId}"][theme-mode="light"]`;

    const cssLines = collectThemeSkinCssLines(colors, preset, mode);

    return `${selector} {\n  ${cssLines.join('\n  ')}\n}`;
}

/**
 * 获取指定皮肤与模式下的 CSS 变量，用于局部主题预览
 */
export function getThemeSkinStyleVars(
    skinId: ThemeSkinType,
    colors: ThemeSkinColors,
    mode: 'light' | 'dark',
    options: ThemeSkinApplyOptions = {},
) {
    const preset = skinId === 'custom' && options.customSkin
        ? buildCustomSkinPreset(options.customSkin)
        : getThemeSkinPreset(skinId) ?? getThemeSkinPreset('tdesign')!;

    return cssLinesToStyleVars(collectThemeSkinCssLines(colors, preset, mode, options));
}

/**
 * 应用皮肤主题色：主题色、成功色、警告色、错误色、中性色
 */
export function applyThemeSkin(
    skinId: ThemeSkinType,
    colors: ThemeSkinColors,
    mode: 'light' | 'dark',
    options: ThemeSkinApplyOptions = {},
) {
    const preset = skinId === 'custom' && options.customSkin
        ? buildCustomSkinPreset(options.customSkin)
        : getThemeSkinPreset(skinId) ?? getThemeSkinPreset('tdesign')!;

    const lightBlock = buildThemeSkinBlock(skinId, colors, preset, 'light');
    const darkBlock = buildThemeSkinBlock(skinId, colors, preset, 'dark');
    const globalLines: string[] = [];

    if (options.radiusPreset) {
        globalLines.push(...buildRadiusCssVars(options.radiusPreset));
    }

    if (options.sizePreset) {
        globalLines.push(...buildSizeCssVars(options.sizePreset));
    }

    globalLines.push(...buildEffectCssVars(options));

    const globalBlock = globalLines.length
        ? `:root {\n  ${globalLines.join('\n  ')}\n}`
        : '';

    upsertThemeStyle([globalBlock, lightBlock, darkBlock].filter(Boolean).join('\n'));
    document.documentElement.setAttribute('theme-skin', skinId);
    document.documentElement.setAttribute('theme-color', colors.brand);

    if (options.radiusPreset) {
        document.documentElement.setAttribute('theme-radius', options.radiusPreset);
    }

    if (options.sizePreset) {
        document.documentElement.setAttribute('theme-size', options.sizePreset);
    }
}

function upsertThemeStyle(css: string) {
    let style = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement('style');
        style.id = THEME_STYLE_ID;
        document.head.appendChild(style);
    }
    style.innerText = css;
}

export function generateColorMap(
    theme: string,
    colorPalette: Array<string>,
    mode: 'light' | 'dark',
    brandColorIdx: number,
) {
    return buildSemanticColorMap(theme, colorPalette, mode, brandColorIdx);
}

export function rgb2Hex(color: string) {
    return Color(color).hex();
}

export function color2Arr(color: string) {
    return Color(color).array();
}