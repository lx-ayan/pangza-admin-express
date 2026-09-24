type SizeEnum = 'small' | 'base' | 'large';

interface OptionData {
    render?: () => any;
    disabled?: boolean;
    [key: string]: any;
}

interface ISelectData {
    label: string;
    value: string;
    disabled?: boolean;
    render?: (data: Omit<ISelectData, 'render'>) => any;
    meta?: any;
}

type OptionDataProps = OptionData[] | (() => OptionData[]) | (() => Promise<OptionData[]>)

