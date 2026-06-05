import { useEffect, useRef } from 'react'

type Props = { isRecording: boolean }

export default function WaveformVisualizer({ isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isRecording) {
      cancelAnimationFrame(animRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      streamRef.current = stream
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)

      const draw = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const barW = canvas.width / data.length
        data.forEach((v, i) => {
          const h = Math.max(2, (v / 255) * canvas.height)
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - h)
          gradient.addColorStop(0, '#6C63FF')
          gradient.addColorStop(1, '#4ECDC4')
          ctx.fillStyle = gradient
          ctx.fillRect(i * barW, canvas.height - h, Math.max(1, barW - 1), h)
        })
        animRef.current = requestAnimationFrame(draw)
      }
      draw()
    }).catch(() => {
      // Microphone access denied — waveform stays hidden
    })

    return () => {
      cancelAnimationFrame(animRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [isRecording])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={40}
      className={`transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0 h-0'}`}
    />
  )
}
