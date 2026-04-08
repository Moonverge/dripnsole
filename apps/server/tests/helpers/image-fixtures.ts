import sharp from 'sharp'

export async function tinyJpeg(): Promise<Buffer> {
  return sharp({
    create: { width: 2, height: 2, channels: 3, background: '#ffffff' },
  })
    .jpeg()
    .toBuffer()
}

export async function tinyPng(): Promise<Buffer> {
  return sharp({
    create: { width: 2, height: 2, channels: 3, background: '#ffffff' },
  })
    .png()
    .toBuffer()
}

export async function tinyWebp(): Promise<Buffer> {
  return sharp({
    create: { width: 2, height: 2, channels: 3, background: '#ffffff' },
  })
    .webp()
    .toBuffer()
}
