import { Button } from '~/utils/forms'
import Modal from '~/components/modal'
import { useState } from 'react'
import {
	type DataFunctionArgs,
} from '@remix-run/node'
import { requireAuthenticated } from '~/utils/auth.server'

export async function loader({ request }: DataFunctionArgs) {
	await requireAuthenticated(request)
	return null;
}

export default function MarketPlace() {
	const [openBuy, setOpenBuy] = useState(false)

	const toggleModal = () => setOpenBuy(prev => !prev)

	return (
		<>
			<div className="flex min-h-full flex-col pb-10 pt-10">
				<div className="mx-auto h-full w-full max-w-3xl">
					<div className="flex h-[90vh] flex-col justify-between gap-2 border border-white p-7 text-center">
						<div>
							<div className="text-6xl font-black">On Sale</div>
							<div className="mt-5 text-2xl font-semibold">25000 Tokens</div>
						</div>
						<div className="flex w-full justify-center text-center">
							<Button size="md" variant="primary" onClick={toggleModal}>
								BUY
							</Button>
						</div>
						<div>
							<div className="text-2xl font-black">Rates</div>
							<div className="text-xl font-semibold">$5/Token</div>
						</div>
					</div>
				</div>
			</div>
			<Modal title="Buy Tokens" open={openBuy} onClose={toggleModal}>
				<div className="mt-8">
					<div className="mb-10">
						<label htmlFor="tokens" className="block">
							Number of tokens
						</label>
						<input
							type="number"
							placeholder="Enter number of tokens to buy"
							id="tokens"
							className="h-12 w-full rounded-lg border border-night-400 bg-night-700 px-4 text-body-xs caret-white outline-none focus:border-accent-purple disabled:bg-night-400"
						/>
					</div>
					<div className="flex justify-center">
						<Button size="sm" variant="primary">
							BUY
						</Button>
					</div>
				</div>
			</Modal>
		</>
	)
}
