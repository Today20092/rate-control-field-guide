/** The guide's chapters, in reading order. Drives the rail, the mobile contents and the section ids. */
export const chapters = [
  { id: 'one-picture', short: 'One picture', title: 'How one picture gets small' },
  { id: 'every-frame', short: 'Every frame', title: 'Video is a flip book' },
  { id: 'keys', short: 'I, P and B frames', title: 'Store the changes, not the pictures' },
  { id: 'editing', short: 'H.264 vs ProRes', title: 'Small files or smooth editing' },
  { id: 'bitrate', short: 'Bitrate', title: 'Bitrate is a budget for every pixel' },
  { id: 'tradeoffs', short: 'Trade-offs', title: 'Size, quality and two kinds of speed' },
  { id: 'rate-control', short: 'Rate control', title: 'Rate control: the setting you choose' },
] as const

export type ChapterId = (typeof chapters)[number]['id']
