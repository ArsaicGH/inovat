import Museum from './world/Museum'
import Hud from './ui/Hud'

// Two layers: the 3D world underneath, the HTML interface on top.
function App() {
  return (
    <>
      <Museum />
      <Hud />
    </>
  )
}

export default App
