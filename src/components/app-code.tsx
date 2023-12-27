"use client";

import { useSharingStore } from "@/lib/stores/sharing";

const AppCode = () => {
  const appCode = useSharingStore((state) => state.uniqueAppCode);

  return (
    <div className="text-2xl font-semibold p-3 font-mono text-center">
      {appCode}
    </div>
  );
};

export default AppCode;
