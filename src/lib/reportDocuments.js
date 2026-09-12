// Count the original import files represented by the selected accounting period.
// This is a read-only query; a file containing many account rows counts only once.
export async function loadReportDocuments(client, year, actorId) {
  const { data, error } = await client.rpc('get_import_batches', { p_actor_id: actorId, p_batch_type: 'pl_estimate' })
  // The existing RPC caps its results at 100; never present a truncated count as complete.
  if (error || !Array.isArray(data) || data.length >= 100) return null
  const files = data.filter(row => Number(row.year) === Number(year))
  const months = Array.from({ length: 12 }, (_, i) => {
    let count = 0
    for (const row of files) {
      const range = String(row.month_range ?? row.month ?? '').split('-').map(Number)
      if (!range[0]) return null
      if (range.length > 1 && i + 1 >= range[0] && i + 1 <= range[1]) return null
      if (range.length === 1 && range[0] === i + 1) count++
    }
    return count
  })
  return { total: new Set(files.map(row => row.id)).size, months }
}
