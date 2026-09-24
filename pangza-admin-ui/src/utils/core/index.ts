export * from './date';
export * from './css';
export * from './store';
export * from './encrypt';
export * from './encryptTransport';

export function filterByValue(data: LabelOptionList, value: string | number, defaultValue?: string): string {
    const item = data.find(i => i.value == value);
    return item?.label || (defaultValue !== undefined ? defaultValue : '');
}