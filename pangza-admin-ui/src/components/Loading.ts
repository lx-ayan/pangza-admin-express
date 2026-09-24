import ObjectUtil from "@/utils/clz/ObjectUtil";
import {
  LoadingPlugin,
  type LoadingInstance,
  type TdLoadingProps,
} from "tdesign-vue-next";

let loadingInstance: Nullable<LoadingInstance> = null;

export function showFullLoading(
  loadingText: any,
  options: TdLoadingProps = {}
) {
  if (ObjectUtil.isNull(loadingInstance)) {
    loadingInstance = LoadingPlugin({
      showOverlay: true,
      content: loadingText,
      size: "24px",
      ...options,
    });
  }
}

export function hideFullLoading() {
  if (!ObjectUtil.isNull(loadingInstance)) {
    loadingInstance!.hide();
  }
}
