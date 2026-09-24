import type { PersistenceOptions } from 'pinia-plugin-persistedstate';

const PINIA_CONFIG = {

}

export function setPiniaPersistedStateConfig(key: string): PersistenceOptions {
    return {
        key,
        storage: localStorage,
    }
}

export default PINIA_CONFIG;