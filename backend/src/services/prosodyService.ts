import http from 'http'
import { ProsodyData } from '../types'

export async function analyzeProsody(
  audioBuffer: Buffer,
  text: string
): Promise<ProsodyData | null> {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      audio_base64: audioBuffer.toString('base64'),
      text,
      sample_rate: 16000,
    })

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as ProsodyData)
          } catch {
            resolve(null)
          }
        })
      }
    )

    req.on('error', () => resolve(null))
    req.setTimeout(5000, () => { req.destroy(); resolve(null) })
    req.write(body)
    req.end()
  })
}
