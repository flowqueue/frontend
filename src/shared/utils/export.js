export function downloadTextFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function toCsv(rows, headers) {
  const escape = (value) => {
    const text = String(value ?? '')
    return /[",\n;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  return [
    headers.map(h => escape(h.label)).join(';'),
    ...rows.map(row => headers.map(h => escape(typeof h.value === 'function' ? h.value(row) : row[h.value])).join(';')),
  ].join('\n')
}

export function downloadCsv(filename, rows, headers) {
  downloadTextFile(filename, toCsv(rows, headers), 'text/csv;charset=utf-8')
}

export function downloadJson(filename, data) {
  downloadTextFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8')
}

export function downloadReport(filename, title, sections = []) {
  const content = [
    title,
    `Generado: ${new Date().toLocaleString('es-PE')}`,
    '',
    ...sections.flatMap(section => [
      `## ${section.title}`,
      ...(section.lines ?? []),
      '',
    ]),
  ].join('\n')
  downloadTextFile(filename, content, 'text/plain;charset=utf-8')
}

export async function shareOrCopy(payload) {
  const text = payload.text ?? payload.title ?? ''
  if (navigator.share) {
    await navigator.share(payload)
    return 'shared'
  }
  await navigator.clipboard.writeText(text)
  return 'copied'
}
