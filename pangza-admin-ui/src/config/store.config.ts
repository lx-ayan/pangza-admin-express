type TimeUnit = "s" | "min" | "h" | "d";

interface StoreConfig {
  timeUnit: TimeUnit;
  prefix: string;
}

const storageUtilConfig: StoreConfig = {
  timeUnit: "s",
  prefix: "pz-",
};

export default storageUtilConfig;
