import Dialog from '@radix-ui/react-dialog/dist/index.js'
import { type ReactNode } from 'react'

interface ModalShape {
	onClose: () => void
	open: boolean
	children: ReactNode
	title: string
	subHeader?: ReactNode
}

export default function Modal(props: ModalShape) {
	return (
		<Dialog.Root open={props.open}>
			<Dialog.Portal className="bg-white text-black">
				<Dialog.Overlay className="fixed inset-0 backdrop-blur-[2px]" />
				<Dialog.Content
					onEscapeKeyDown={props.onClose}
					onInteractOutside={props.onClose}
					onPointerDownOutside={props.onClose}
					className="fixed left-1/2 top-1/2 w-[30vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-night-500 p-12 shadow-lg"
				>
					<Dialog.Title className="text-center">
						<h3 className="text-h3">{props.title}</h3>
						{!!props.subHeader && (
							<p className="mt-4 text-white">{props.subHeader}</p>
						)}
					</Dialog.Title>
					{props.children}
					<Dialog.Close
						onClick={props.onClose}
						className="absolute right-3 top-3"
					>
						❌
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
