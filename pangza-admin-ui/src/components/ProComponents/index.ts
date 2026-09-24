import { createInstaller } from './utils';
import {
    DialogButton,
    DialogLink,
    DrawerForm,
    ModalForm,
    StepForm,
    ProForm,
    ProFormCheckbox,
    ProFormDatePicker,
    ProFormDateRangePicker,
    ProFormInput,
    ProFormInputNumber,
    ProFormRadio,
    ProFormSelect,
    ProFormTextarea,
    ProTable
} from './components';

const components = [
    DialogButton,
    DialogLink,
    DrawerForm,
    ModalForm,
    StepForm,
    ProForm,
    ProFormCheckbox,
    ProFormDatePicker,
    ProFormDateRangePicker,
    ProFormInput,
    ProFormInputNumber,
    ProFormRadio,
    ProFormSelect,
    ProFormTextarea,
    ProTable
]

const installer = createInstaller(components);

export default installer;

export * from './components';