import { site } from './content/site'

function App() {
  return (
    <main style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>{site.name}</h1>
      <h2>{site.subtitle}</h2>
      <p>{site.tagline}</p>
    </main>
  )
}

export default App
