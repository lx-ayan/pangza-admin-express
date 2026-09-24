import type { ProFormOption, ProFormProps } from '../ProForm/types';
import { type TdDialogProps } from 'tdesign-vue-next';

export interface ModalFormProps {
    options: ProFormOption[];
    request?: ProFormProps['request'];
    formProps?: Optional<ProFormProps, 'options'>;
    header?: TdDialogProps['header'];
    width?: TdDialogProps['width'];
    dialogProps?: TdDialogProps;
    stopRequest?: boolean;
}

export interface ModalFormInstance {
    request: () => void;
    reset: () => void;
    open: () => void;
    close: () => void;
    setFormItem: (key: string, value: any) => void;
    getFormItem: (key: string) => any;
    getFormValue: () => any;
    validate: () => Promise<any>;
}