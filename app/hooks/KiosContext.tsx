import { createContext, useContext } from "react";
import type { useKiosData } from "./useKiosData";
import type { useKiosActions } from "./useKiosActions";

type KiosValue = ReturnType<typeof useKiosData> & ReturnType<typeof useKiosActions>;

const KiosCtx = createContext<KiosValue | null>(null);

export const KiosProvider = KiosCtx.Provider;

export function useKios(): KiosValue {
  const v = useContext(KiosCtx);
  if (!v) throw new Error("useKios dipakai di luar KiosProvider");
  return v;
}
