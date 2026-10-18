export type QuantityControlProps = {
  readonly value: number
  readonly onChange: (value: number) => void
  readonly min?: number
  readonly label: string
}
