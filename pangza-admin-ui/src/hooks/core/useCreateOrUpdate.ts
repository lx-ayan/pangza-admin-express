import { ref } from "vue";

function useCreateOrUpdate(getApi: Function) {
    const currentId = ref<Nullable<string>>(null);
    const visible = ref(false);

    function openModal(id: Nullable<string>) {
        currentId.value = id;
        visible.value = true;
    }

    function closeModal() {
        visible.value = false;
        currentId.value = null;
    }

    async function request() {
        return currentId.value ? getApi && getApi(currentId.value) : null;
    }

    return [currentId, visible, {
        request,
        openModal,
        closeModal
    }] as const
};

export default useCreateOrUpdate;