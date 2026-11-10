const paths = {
  download: 'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5',
  close: 'M5 5l14 14M19 5L5 19',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  search: 'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  edit: 'M15 4l5 5M4 20l5-1L21 7l-5-5L4 14v6',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  chart: 'M4 20V10h4v10M10 20V4h4v16M16 20v-8h4v8',
  plus: 'M12 5v14M5 12h14',
  history: 'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2',
  calendar: 'M5 5h14v15H5zM8 3v4M16 3v4M5 10h14',
  check: 'M5 12l4 4L19 6',
  file: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  scale: 'M12 3v18M6 21h12M4 7h16M5 7l-3 7h6L5 7M19 7l-3 7h6l-3-7',
  cash: 'M3 6h18v12H3zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  inbox: 'M5 4h14l3 12v4H2v-4L5 4M2 15h6l2 3h4l2-3h6',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M17 4a4 4 0 0 1 0 7M22 21v-2a4 4 0 0 0-3-4',
  store: 'M3 10l2-6h14l2 6M4 10v11h16V10M9 21v-7h6v7M3 10h18',
  menu: 'M4 6h16M4 12h16M4 18h16',
  collapse: 'M14 5l-7 7 7 7M20 5l-7 7 7 7',
  refresh: 'M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3',
}
export default function Icon({ name = 'file', size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.file} /></svg>
}
