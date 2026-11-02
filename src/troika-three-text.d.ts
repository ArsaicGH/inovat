// What the museum uses of the text library (troika-three-text, installed with drei). Its own
// type descriptions are not linked from its package and leave out BatchedText.
declare module 'troika-three-text' {
  import { Mesh } from 'three'
  export class Text extends Mesh {
    text: string
    font: string | null
    fontSize: number
    color: number | string
    anchorX: number | 'left' | 'center' | 'right'
    anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom'
    whiteSpace: 'normal' | 'nowrap'
    sync(callback?: () => void): void
    dispose(): void
  }
  // Draws any number of Text objects added to it in one step.
  export class BatchedText extends Text {
    addText(text: Text): void
    removeText(text: Text): void
  }
}
