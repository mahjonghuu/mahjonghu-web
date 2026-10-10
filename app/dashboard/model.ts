/** In-memory outlet record; IDs remain stable when display details change. */
export type Outlet = {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
};
/** Operational table state, independent from historical paid transactions. */
export type MahjongTable = {
  id: string;
  outletId: string;
  name: string;
  rate: number;
  status: "Tersedia" | "Digunakan" | "Perawatan";
};
/** Paid demo transaction; historical amounts do not change with table pricing. */
export type Transaction = {
  id: string;
  outletId: string;
  tableId: string;
  date: string;
  customer: string;
  hours: number;
  amount: number;
};
/** Formats whole rupiah amounts for the Indonesian interface. */
export const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
/** Creates deterministic sample data; refreshing intentionally resets all changes. */
export function initialData() {
  const outlets: Outlet[] = [
    {
      id: "o1",
      name: "MahjongHu Senopati",
      city: "Jakarta Selatan",
      address: "Jl. Senopati No. 28, Kebayoran Baru",
      active: true,
    },
    {
      id: "o2",
      name: "MahjongHu Kelapa Gading",
      city: "Jakarta Utara",
      address: "Jl. Boulevard Raya No. 16, Kelapa Gading",
      active: true,
    },
    {
      id: "o3",
      name: "MahjongHu BSD",
      city: "Tangerang Selatan",
      address: "Ruko The Icon, Blok B No. 12, BSD City",
      active: true,
    },
  ];
  const tables: MahjongTable[] = outlets.flatMap((outlet, index) =>
    Array.from({ length: 4 }, (_, i) => ({
      id: `t${index * 4 + i + 1}`,
      outletId: outlet.id,
      name: `Meja ${String(i + 1).padStart(2, "0")}`,
      rate: i === 3 ? 100000 : 75000,
      status:
        i === 0
          ? "Digunakan"
          : i === 3 && index === 1
            ? "Perawatan"
            : "Tersedia",
    })),
  );
  const transactions: Transaction[] = Array.from({ length: 24 }, (_, i) => {
    const table = tables[i % tables.length];
    const hours = 2 + (i % 3);
    return {
      id: `TRX-${String(1024 - i)}`,
      outletId: table.outletId,
      tableId: table.id,
      date: `2026-10-${String(10 - Math.floor(i / 3)).padStart(2, "0")}`,
      customer: [
        "Andi Pratama",
        "Clara Wijaya",
        "Budi Santoso",
        "Diana Putri",
        "Kevin Tan",
        "Sarah Lim",
      ][i % 6],
      hours,
      amount: table.rate * hours,
    };
  });
  return { outlets, tables, transactions };
}
