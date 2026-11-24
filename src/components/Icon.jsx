const paths = {
  previous: 'm14 6-6 6 6 6',
  next: 'm10 6 6 6-6 6',
  pause: 'M9 6v12m6-12v12',
  play: 'm8 5 10 7-10 7z',
  market: 'M3 18V9m6 9V4m6 14v-7m6 7V6',
  star: 'm12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3Z',
  bell: 'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4',
  wallet: 'M4 7h15a1 1 0 0 1 1 1v3m0 5v3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3m4 4h-5a2.5 2.5 0 0 0 0 5h5v-5Z',
  search: 'M15.5 15.5 21 21M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  external: 'M6 18 18 6M7 6h11v11',
  reload: 'M20 10a8 8 0 1 0-1 7m1-13v6h-6',
  rise: 'm3 16 6-6 4 4 8-8m-6 0h6v6',
  fall: 'm3 8 6 6 4-4 8 8m-6 0h6v-6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  enter: 'M13 4h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6M3 12h12m-5-5 5 5-5 5',
}
export default function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    <path d={paths[name]} />
  </svg>
}
