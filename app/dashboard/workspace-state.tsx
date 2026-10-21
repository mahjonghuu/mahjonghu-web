"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { outletApi } from "@/lib/outlet";
import { tableApi } from "@/lib/table";
import { bookingApi } from "@/lib/booking";
import type { BookingRecord } from "@/lib/booking";
import type { OutletApiRecord } from "@/lib/outlet";
import type { WorkspaceData } from "./model";

const toOutlet = (outlet: OutletApiRecord) => ({
  id: String(outlet.id),
  name: outlet.name,
  city: outlet.city,
  address: outlet.address,
  active: Boolean(outlet.active ?? outlet.isActive),
  visibility: outlet.visibility,
  openingHour: Number(outlet.openingHour),
  closingHour: Number(outlet.closingHour),
  rate: outlet.rate,
  rateTiers: outlet.rateTiers,
});

const bookingTransaction = (booking: BookingRecord) => ({
  id: booking.id,
  outletId: booking.outletId,
  tableId: booking.tableId,
  date: booking.startsAt.slice(0, 10),
  customer: booking.customerName,
  hours: booking.durationHours,
  amount: Number(booking.totalAmountIdr),
});

/** Workspace data loaded from the authenticated backend APIs. */
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

/** Loads shared dashboard data from the backend for all dashboard routes. */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoWorkspaceData>({
    outlets: [],
    tables: [],
    transactions: [],
  });
  const [outletFilter, setOutletFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([outletApi.list(), tableApi.list(), bookingApi.list()])
      .then(([outlets, tables, bookings]) => {
        if (!active) return;
        setData({
          outlets: outlets.map(toOutlet),
          tables,
          transactions: bookings
            .filter((booking) => booking.status === "completed")
            .map(bookingTransaction),
        });
      })
      .catch((error: unknown) => {
        console.error("Dashboard data could not be loaded.", error);
      });
    return () => {
      active = false;
    };
  }, []);

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

/** Returns shared dashboard state or throws outside its provider. */
export function useWorkspace(): WorkspaceState {
  const state = useContext(WorkspaceContext);
  if (!state)
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  return state;
}
