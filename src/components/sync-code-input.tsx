"use client";

import { Input } from "@/components/ui/input";
import { useSharingStore } from "@/lib/stores/sharing";
import { Cross1Icon } from "@radix-ui/react-icons";
import { useState } from "react";

const SyncCodeInput = () => {
  const currentSyncCode = useSharingStore((state) => state.syncWithCode);
  const setSyncCode = useSharingStore((state) => state.setSyncWithCode);
  const ownAppCode = useSharingStore((state) => state.uniqueAppCode);
  const [inputValue, setInputValue] = useState(currentSyncCode || "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value === ownAppCode) {
      setSyncCode("");
      return;
    }
    setSyncCode(value);
  };

  const handleClear = () => {
    setInputValue("");
    setSyncCode("");
  };

  return (
    <div className="relative space-y-2 text-base">
      <Input
        className="text-xl font-semibold p-3 font-mono"
        id="sync-code"
        defaultValue={currentSyncCode || ""}
        onChange={(e) => handleInputChange(e)}
        required
      />
      {currentSyncCode && (
        <button
          onClick={handleClear}
          className="absolute right-0 top-1 mt-2 mr-2">
          <Cross1Icon />
        </button>
      )}
      {inputValue === ownAppCode && (
        <p className="text-white p-1 border-red-500 border-1 border rounded ">
          Code cannot be the same as your own app code.
        </p>
      )}
    </div>
  );
};

export default SyncCodeInput;
