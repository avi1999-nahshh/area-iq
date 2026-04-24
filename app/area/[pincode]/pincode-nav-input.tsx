"use client";

export function PincodeNavInput({ currentPincode }: { currentPincode: string }) {
  return (
    <input
      type="text"
      defaultValue={currentPincode}
      placeholder="enter a 6-digit pincode"
      maxLength={6}
      pattern="[0-9]{6}"
      className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none min-w-0"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const val = (e.target as HTMLInputElement).value.trim();
          if (/^\d{6}$/.test(val)) {
            window.location.href = `/area/${val}`;
          }
        }
      }}
    />
  );
}
