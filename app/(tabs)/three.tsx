import { CameraView, useCameraPermissions } from 'expo-camera'
import { useEffect, useRef, useState } from 'react'
import { Dimensions } from 'react-native'
import { Button, Card, Paragraph, Spinner, YStack } from 'tamagui'


export default function TabTwoScreen() {
  const [perm, requestPerm] = useCameraPermissions()
  const camRef = useRef<CameraView | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle')

  useEffect(() => { if (!perm) requestPerm() }, [perm])

  async function snapAndSend() {
    try {
      setLoading(true)
      setStatus('capturing...')
      const photo = await camRef.current?.takePictureAsync({ base64: true, quality: 1 })
      if (!photo?.base64) { setStatus('no photo'); return }

      setStatus('uploading...')
      const resp = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mime: 'image/jpeg',
          base64: photo.base64, // demo only
        }),
      })
      setStatus(`done: ${resp.status} ${resp.ok ? 'OK' : 'ERR'}`)
    } catch (e: any) {
      setStatus(`error: ${String(e?.message || e)}`)
    } finally {
      setLoading(false)
    }
  }

  if (!perm?.granted) {
    return (
      <YStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }} gap="$3">
        <Paragraph>We need camera access.</Paragraph>
        <Button onPress={requestPerm}>Grant permission</Button>
      </YStack>
    )
  }

  const { width } = Dimensions.get('window')
  const camHeight = Math.round(width * 4 / 3) // 4:3 preview

  return (
    <YStack style={{ flex: 1, padding: 12 }} gap="$3">
      <Card bordered elevate style={{ width: '100%', height: camHeight, overflow: 'hidden', borderRadius: 12 }}>
        <CameraView ref={camRef} style={{ width: '100%', height: '100%' }} facing="back" />
      </Card>

      <Button size="$6" onPress={snapAndSend} disabled={loading} circular>
        {loading ? <Spinner /> : 'Snap & Send'}
      </Button>

      <Paragraph>Status: {status}</Paragraph>
    </YStack>
  )
}
