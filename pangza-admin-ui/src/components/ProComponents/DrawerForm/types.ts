import type { ProFormOption, ProFormProps } from '../ProForm/types';
import { type TdDrawerProps } from 'tdesign-vue-next';

export interface DrawerFormProps {
    options: ProFormOption[];
    request?: ProFormProps['request'];
    formProps?: Optional<ProFormProps, 'options'>;
    header?: TdDrawerProps['header'];
    width?: TdDrawerProps['size'];
    drawerProps?: TdDrawerProps;
}
