import { CurrentAnimation } from '../data/State.ts'

export const Logo = () => (
  <lottie-player
    src={CurrentAnimation.value}
    key={CurrentAnimation.value}
    background="transparent"
    speed=".25"
    style="width: 300px; height: 300px;" loop autoplay
  />
)

export const LogoBottom = () => (
  <lottie-player
    src={CurrentAnimation.value}
    key={CurrentAnimation.value}
    background="transparent"
    speed=".25"
    style="width: 200px; height: 200px;" loop autoplay
  />
)