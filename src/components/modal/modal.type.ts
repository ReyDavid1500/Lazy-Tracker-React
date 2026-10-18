import type { ReactNode } from 'react'

export type ModalProps = {
  readonly open: boolean
  readonly onClose: () => void
  readonly title?: string
  readonly children: ReactNode
}
