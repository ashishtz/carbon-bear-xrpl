import { useState } from 'react'
import { Button } from '~/utils/forms'
import Modal from '~/components/modal'

export default function UserProfile() {
	const [openSell, setOpenSell] = useState(false)
	const toggleModal = () => setOpenSell(prev => !prev)

	return (
		<>
			<div className="p-10">
				<div className="mb-4 flex justify-end">
					<Button size="sm" variant="primary" onClick={toggleModal}>
						SELL
					</Button>
				</div>
				<div className="flex items-center justify-between text-center">
					<div className="w-[45%] border border-white p-3">
						<h3 className="mb-2 text-h3">Tokens</h3>
						<div className="flex justify-between">
							<div className="w-[45%]">
								<h4 className="text-h4">Available</h4>
								<div className="text-h5">2000</div>
							</div>
							<div className="w-[45%]">
								<h4 className="text-h4">On Sale</h4>
								<div className="text-h5">2000</div>
							</div>
						</div>
					</div>
					<div className="w-[45%] border border-white  p-3">
						<h3 className="mb-2 text-h3">Income</h3>
						<div className="flex justify-between">
							<div className="w-[45%]">
								<h4 className="text-h4">Pending</h4>
								<div className="text-h5">$2,000</div>
							</div>
							<div className="w-[45%]">
								<h4 className="text-h4">Earned</h4>
								<div className="text-h5">$2,000</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className=" p-4">
						<h2 className="text-lg font-bold">Item 1</h2>
						<p>Description of Item 1</p>
					</div>
					<div className=" p-4">
						<h2 className="text-lg font-bold">Item 2</h2>
						<p>Description of Item 2</p>
					</div>
					<div className=" p-4">
						<h2 className="text-lg font-bold">Item 3</h2>
						<p>Description of Item 3</p>
					</div>
					<div className=" p-4">
						<h2 className="text-lg font-bold">Item 4</h2>
						<p>Description of Item 4</p>
					</div>
					<div className=" p-4">
						<h2 className="text-lg font-bold">Item 5</h2>
						<p>Description of Item 5</p>
					</div>
					<div className=" p-4">
						<h2 className="text-lg font-bold">Item 6</h2>
						<p>Description of Item 6</p>
					</div>
				</div>
			</div>

			<Modal title="Sell Tokens" open={openSell} onClose={toggleModal}>
				<div className="mt-8">
					<div className="mb-10">
						<label htmlFor="tokens" className="block">
							Number of tokens
						</label>
						<input
							type="number"
							id="tokens"
							placeholder="Enter number of tokens to sell"
							className="h-12 w-full rounded-lg border border-night-400 bg-night-700 px-4 text-body-xs caret-white outline-none focus:border-accent-purple disabled:bg-night-400"
						/>
					</div>
					<div className="flex justify-center">
						<Button size="sm" variant="primary">
							SELL
						</Button>
					</div>
				</div>
			</Modal>
		</>
	)
}
