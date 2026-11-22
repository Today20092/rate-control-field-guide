import { Composition } from 'remotion'
import { NoKeyFrame, NO_KEY_DURATION } from './NoKeyFrame'

export const RemotionRoot = () => (
  <Composition
    id="NoKeyFrame"
    component={NoKeyFrame}
    durationInFrames={NO_KEY_DURATION}
    fps={30}
    width={1280}
    height={720}
  />
)
