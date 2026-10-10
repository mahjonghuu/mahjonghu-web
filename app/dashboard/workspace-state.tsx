"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { initialData, type WorkspaceData } from "./model";

/** Named shape of the in-memory demo state used by dashboard features. */
export type DemoWorkspaceData = WorkspaceData;
type WorkspaceState = {
  data: DemoWorkspaceData;
  setData: Dispatch<SetStateAction<DemoWorkspaceData>>;
  outletFilter: string;
  setOutletFilter: Dispatch<SetStateAction<string>>;
  from: string;
  setFrom: Dispatch<SetStateAction<string>>;
  to: string;
  setTo: Dispatch<SetStateAction<string>>;
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

/** Keeps demo state alive while navigating between dashboard route segments. */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialData);
  const [outletFilter, setOutletFilter] = useState("all");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-10");

  return (
    <WorkspaceContext.Provider
      value={{
        data,
        setData,
        outletFilter,
        setOutletFilter,
        from,
        setFrom,
        to,
        setTo,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

/** Returns shared demo workspace state or throws outside its provider. */
export function useWorkspace(): WorkspaceState {
  const state = useContext(WorkspaceContext);
  if (!state)
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  return state;
}
