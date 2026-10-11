/** Format whole-rupiah amounts identically across server and browser ICU versions. */
export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}
