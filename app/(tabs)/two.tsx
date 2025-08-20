import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Button, Paragraph, Spinner, YStack } from 'tamagui';


export default function TabTwoScreen() {
  const [perm, requestPerm] = useCameraPermissions()
  const camRef = useRef<CameraView | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle')

  useEffect(() => { if (!perm) requestPerm() }, [perm])

  async function snapAndSend() {
    console.log('hello mark')
    try {
      setLoading(true)
      setStatus('capturing...')
      const photo = await camRef.current?.takePictureAsync({ base64: true, quality: 1 })
      if (!photo?.base64) { setStatus('no photo'); return }

      setStatus('uploading...')
      const apiUrl = Constants.expoConfig?.extra?.API_URL
      if (!apiUrl) {
        setStatus('error: API_URL not defined')
        return
      }

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ receipt: photo.base64 })
      };

      console.log('Uploading to', apiUrl)
      const resp = await fetch(`${apiUrl}/analyze/upload-receipt-azure`, requestOptions)
      console.log('Uploaded, status:', resp.status, resp.statusText)
      const data = await resp.json()
      console.log('Response:', data)

      if (!resp.ok) {
        setStatus(`error: ${resp.status} ${resp.statusText}`);
        return;
      }
      setStatus(`done: ${resp.status} ${resp.ok ? 'OK' : 'ERR'}`)
    } catch (e: any) {
      console.log(e)
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

  return (
    <YStack flex={1} /* no padding so camera can truly fill */>
      {/* Camera fills all available space between header and tab bar */}
      <YStack flex={1}>
        <CameraView
          ref={camRef}
          facing="back"
          style={StyleSheet.absoluteFillObject} // absolute: top/left/right/bottom = 0
        />

        {/* Bottom-center capture button overlay */}
        <YStack
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 24,              // or add safeInset.bottom
            alignItems: 'center',
            justifyContent: 'center',
            // pointerEvents: 'box-none', // uncomment if overlays block touches
          }}
        >
          <Button
            size="$6"
            onPress={snapAndSend}
            disabled={loading}
            // circular works if your config supports it; else use big borderRadius:
            // circular
            style={{ borderRadius: 999 }}
          >
            {loading ? <Spinner /> : 'Snap & Send'}
          </Button>
        </YStack>

        {/* Optional: status overlay (top-left) */}
        <YStack
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
          }}
        >
          <Paragraph>Status: {status}</Paragraph>
        </YStack>
      </YStack>
    </YStack>
  )
}
