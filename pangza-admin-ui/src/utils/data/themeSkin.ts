export type ThemeSkinType = 'tdesign' | 'arco' | 'element' | 'ant' | 'custom';

export type ThemeRadiusPreset = 'none' | 'small' | 'medium' | 'large';
export type ThemeSizePreset = 'compact' | 'default' | 'comfortable';

export interface ThemeSkinColors {
    brand: string;
    success: string;
    warning: string;
    error: string;
}

export interface ThemeSurfaceColors {
    page: string;
    secondaryContainer: string;
    container: string;
}

export interface CustomSkinConfig {
    colors: ThemeSkinColors;
    surface: {
        light: ThemeSurfaceColors;
        dark: ThemeSurfaceColors;
    };
    componentBorder: {
        light: string;
        dark: string;
    };
}

export interface ThemeRadiusTokens {
    small: string;
    default: string;
    medium: string;
    large: string;
    extraLarge: string;
}

export interface ThemeSizeTokens {
    sizes: string[];
    fontSizes: {
        linkSmall: string;
        linkMedium: string;
        linkLarge: string;
        bodySmall: string;
        bodyMedium: string;
        bodyLarge: string;
        titleSmall: string;
        titleMedium: string;
        titleLarge: string;
    };
    lineHeights: {
        linkSmall: string;
        linkMedium: string;
        linkLarge: string;
        bodySmall: string;
        bodyMedium: string;
        bodyLarge: string;
        titleSmall: string;
        titleMedium: string;
        titleLarge: string;
    };
}

export const THEME_RADIUS_PRESETS: Record<ThemeRadiusPreset, ThemeRadiusTokens> = {
    none: {
        small: '0px',
        default: '0px',
        medium: '0px',
        large: '0px',
        extraLarge: '0px',
    },
    small: {
        small: '2px',
        default: '3px',
        medium: '4px',
        large: '6px',
        extraLarge: '8px',
    },
    medium: {
        small: '2px',
        default: '6px',
        medium: '8px',
        large: '12px',
        extraLarge: '16px',
    },
    large: {
        small: '4px',
        default: '8px',
        medium: '12px',
        large: '16px',
        extraLarge: '24px',
    },
};

const BASE_SIZES = [2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];
const BASE_FONT_SIZES = {
    linkSmall: 12,
    linkMedium: 14,
    linkLarge: 16,
    bodySmall: 12,
    bodyMedium: 14,
    bodyLarge: 16,
    titleSmall: 14,
    titleMedium: 16,
    titleLarge: 18,
};
const BASE_LINE_HEIGHTS = {
    linkSmall: 20,
    linkMedium: 22,
    linkLarge: 24,
    bodySmall: 20,
    bodyMedium: 22,
    bodyLarge: 24,
    titleSmall: 22,
    titleMedium: 24,
    titleLarge: 26,
};

const SIZE_SCALE_MAP: Record<ThemeSizePreset, number> = {
    compact: 0.875,
    default: 1,
    comfortable: 1.125,
};

function scalePx(value: number, scale: number) {
    return `${Math.round(value * scale)}px`;
}

export function getThemeSizeTokens(preset: ThemeSizePreset): ThemeSizeTokens {
    const scale = SIZE_SCALE_MAP[preset];
    return {
        sizes: BASE_SIZES.map((size) => scalePx(size, scale)),
        fontSizes: {
            linkSmall: scalePx(BASE_FONT_SIZES.linkSmall, scale),
            linkMedium: scalePx(BASE_FONT_SIZES.linkMedium, scale),
            linkLarge: scalePx(BASE_FONT_SIZES.linkLarge, scale),
            bodySmall: scalePx(BASE_FONT_SIZES.bodySmall, scale),
            bodyMedium: scalePx(BASE_FONT_SIZES.bodyMedium, scale),
            bodyLarge: scalePx(BASE_FONT_SIZES.bodyLarge, scale),
            titleSmall: scalePx(BASE_FONT_SIZES.titleSmall, scale),
            titleMedium: scalePx(BASE_FONT_SIZES.titleMedium, scale),
            titleLarge: scalePx(BASE_FONT_SIZES.titleLarge, scale),
        },
        lineHeights: {
            linkSmall: scalePx(BASE_LINE_HEIGHTS.linkSmall, scale),
            linkMedium: scalePx(BASE_LINE_HEIGHTS.linkMedium, scale),
            linkLarge: scalePx(BASE_LINE_HEIGHTS.linkLarge, scale),
            bodySmall: scalePx(BASE_LINE_HEIGHTS.bodySmall, scale),
            bodyMedium: scalePx(BASE_LINE_HEIGHTS.bodyMedium, scale),
            bodyLarge: scalePx(BASE_LINE_HEIGHTS.bodyLarge, scale),
            titleSmall: scalePx(BASE_LINE_HEIGHTS.titleSmall, scale),
            titleMedium: scalePx(BASE_LINE_HEIGHTS.titleMedium, scale),
            titleLarge: scalePx(BASE_LINE_HEIGHTS.titleLarge, scale),
        },
    };
}

export const THEME_RADIUS_OPTIONS = [
    { label: '直角', value: 'none' },
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
] as const;

export const THEME_SIZE_OPTIONS = [
    { label: '紧凑', value: 'compact' },
    { label: '默认', value: 'default' },
    { label: '宽松', value: 'comfortable' },
] as const;

export interface ThemeSkinPreset extends ThemeSkinColors {
    id: Exclude<ThemeSkinType, 'custom'>;
    name: string;
    gray: {
        light: string[];
        dark: string[];
    };
    fontGray: {
        light: [string, string, string, string];
        dark: [string, string, string, string];
    };
    componentBorder: {
        light: string;
        dark: string;
    };
    surface: {
        light: {
            page: string;
            secondaryContainer: string;
            container: string;
        };
        dark: {
            page: string;
            secondaryContainer: string;
            container: string;
        };
    };
}

const TDESIGN_GRAY_LIGHT = [
    '#f3f3f3', '#eee', '#e8e8e8', '#ddd', '#c6c6c6', '#a6a6a6', '#8b8b8b',
    '#777', '#5e5e5e', '#4b4b4b', '#393939', '#2c2c2c', '#242424', '#181818',
];

const ARCO_GRAY_LIGHT = [
    '#f7f8fa', '#f2f3f5', '#e5e6eb', '#c9cdd4', '#a9aeb8', '#86909c', '#6b7785',
    '#4e5969', '#272e3b', '#1d2129', '#17171a', '#141416', '#101011', '#0a0a0b',
];

const ELEMENT_GRAY_LIGHT = [
    '#f5f7fa', '#ebeef5', '#e4e7ed', '#dcdfe6', '#d3d6dc', '#c0c4cc', '#a8abb2',
    '#909399', '#73767a', '#606266', '#484a4d', '#303133', '#262729', '#1d1e1f',
];

const ANT_GRAY_LIGHT = [
    '#fafafa', '#f5f5f5', '#f0f0f0', '#ededed', '#d9d9d9', '#bfbfbf', '#8c8c8c',
    '#737373', '#595959', '#434343', '#383838', '#2e2e2e', '#262626', '#1f1f1f',
];

/** 深色模式中性色阶，按各设计体系特征微调 */
const TDESIGN_GRAY_DARK = [...TDESIGN_GRAY_LIGHT];
const ARCO_GRAY_DARK = [
    '#17171a', '#1d1d21', '#232326', '#2a2a2e', '#313135', '#3a3a3f', '#48484d',
    '#5a5a61', '#6b6b73', '#7d7d87', '#92929c', '#a9a9b3', '#c2c2cc', '#dcdce6',
];
const ELEMENT_GRAY_DARK = [
    '#1d1e1f', '#222325', '#27292c', '#2d3033', '#34373b', '#3d4146', '#484c52',
    '#54585f', '#62666e', '#71757d', '#82868f', '#959aa3', '#abafb8', '#c4c8d0',
];
const ANT_GRAY_DARK = [
    '#141414', '#1f1f1f', '#262626', '#303030', '#373737', '#424242', '#4d4d4d',
    '#595959', '#666666', '#737373', '#8c8c8c', '#a6a6a6', '#bfbfbf', '#d9d9d9',
];

export const THEME_SKIN_PRESETS: ThemeSkinPreset[] = [
    {
        id: 'tdesign',
        name: 'TDesign',
        brand: '#0052D9',
        success: '#2BA471',
        warning: '#E37318',
        error: '#D54941',
        gray: { light: TDESIGN_GRAY_LIGHT, dark: TDESIGN_GRAY_DARK },
        fontGray: {
            light: ['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.26)'],
            dark: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.55)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.22)'],
        },
        componentBorder: { light: '#ddd', dark: '#5e5e5e' },
        surface: {
            light: { page: '#f3f3f3', secondaryContainer: '#fafafa', container: '#ffffff' },
            dark: { page: '#181818', secondaryContainer: '#2c2c2c', container: '#242424' },
        },
    },
    {
        id: 'arco',
        name: 'Arco Design',
        brand: '#165DFF',
        success: '#00B42A',
        warning: '#FF7D00',
        error: '#F53F3F',
        gray: { light: ARCO_GRAY_LIGHT, dark: ARCO_GRAY_DARK },
        fontGray: {
            light: ['#1D2129', '#4E5969', '#86909C', '#C9CDD4'],
            dark: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.3)'],
        },
        componentBorder: { light: '#E5E6EB', dark: '#48484d' },
        surface: {
            light: { page: '#f7f8fa', secondaryContainer: '#f2f3f5', container: '#ffffff' },
            dark: { page: '#17171a', secondaryContainer: '#232326', container: '#232324' },
        },
    },
    {
        id: 'element',
        name: 'Element UI',
        brand: '#409EFF',
        success: '#67C23A',
        warning: '#E6A23C',
        error: '#F56C6C',
        gray: { light: ELEMENT_GRAY_LIGHT, dark: ELEMENT_GRAY_DARK },
        fontGray: {
            light: ['#303133', '#606266', '#909399', '#C0C4CC'],
            dark: ['#E5EAF3', '#CFD3DC', '#A3A6AD', '#6C6E72'],
        },
        componentBorder: { light: '#DCDFE6', dark: '#4c4d4f' },
        surface: {
            light: { page: '#f5f7fa', secondaryContainer: '#ebeef5', container: '#ffffff' },
            dark: { page: '#141414', secondaryContainer: '#1d1e1f', container: '#1d1e1f' },
        },
    },
    {
        id: 'ant',
        name: 'Ant Design',
        brand: '#1677FF',
        success: '#52C41A',
        warning: '#FAAD14',
        error: '#FF4D4F',
        gray: { light: ANT_GRAY_LIGHT, dark: ANT_GRAY_DARK },
        fontGray: {
            light: ['rgba(0, 0, 0, 0.88)', 'rgba(0, 0, 0, 0.65)', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.25)'],
            dark: ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.25)'],
        },
        componentBorder: { light: '#D9D9D9', dark: '#424242' },
        surface: {
            light: { page: '#f5f5f5', secondaryContainer: '#fafafa', container: '#ffffff' },
            dark: { page: '#141414', secondaryContainer: '#1f1f1f', container: '#141414' },
        },
    },
];

export function getThemeSkinPreset(id: ThemeSkinType): ThemeSkinPreset | undefined {
    return THEME_SKIN_PRESETS.find((item) => item.id === id);
}

export function getDefaultCustomSkinColors(): ThemeSkinColors {
    return {
        brand: '#4C6FFF',
        success: '#20A867',
        warning: '#E37318',
        error: '#D54941',
    };
}

export function getDefaultCustomSkinConfig(): CustomSkinConfig {
    const tdesignPreset = THEME_SKIN_PRESETS[0];
    return {
        colors: getDefaultCustomSkinColors(),
        surface: {
            light: { ...tdesignPreset.surface.light },
            dark: { ...tdesignPreset.surface.dark },
        },
        componentBorder: { ...tdesignPreset.componentBorder },
    };
}

export function buildCustomSkinPreset(config: CustomSkinConfig): ThemeSkinPreset {
    const tdesignPreset = THEME_SKIN_PRESETS[0];
    return {
        ...tdesignPreset,
        ...config.colors,
        id: 'tdesign',
        name: 'Custom',
        surface: config.surface,
        componentBorder: config.componentBorder,
    };
}
