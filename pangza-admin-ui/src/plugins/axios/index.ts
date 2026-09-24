import AXIOS_CONFIG from "@/config/axios.config";
import VAxios from "./VAxios";

const request = VAxios.createVAxios({
    timeout: 10000,
    ...AXIOS_CONFIG
});

export default request;