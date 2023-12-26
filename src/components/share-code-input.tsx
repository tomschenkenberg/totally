"use client";

import { Input } from "@/components/ui/input";
import { useShareCodeStore } from "@/lib/stores/share-code";

const ShareCodeInput = () => {
  const currentShareCode = useShareCodeStore((state) => state.uniqueCode);
  const setShareCode = useShareCodeStore((state) => state.setUniqueCode);

  return (
    <div className="relative space-y-2 text-base">
      <Input
        id="share-code"
        value={currentShareCode}
        onChange={(e) => {
          setShareCode(e.target.value);
        }}
        required
      />
    </div>
  );
};

export default ShareCodeInput;
