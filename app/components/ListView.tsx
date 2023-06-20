import { type BookOffer } from 'xrpl'
import { Button } from '~/utils/forms'

interface ListViewShape {
	records: BookOffer[]
	onChange: (sequence: number) => void
	accountid: string
}

const ListView = ({ records, onChange, accountid }: ListViewShape) => {
	return (
		<>
			<div className="ml-7 mr-7 mt-7 flex justify-between text-sm font-extrabold">
				<label className="w-1/2">Account Holder</label>
				<label className="w-1/2">Tokens To Sell</label>
				<label className="w-1/2">XRP To pay</label>
				<label className="w-1/2">Accept Offer</label>
			</div>
			<div className="mt-1 h-[1px] bg-gray-500" />
			{records.map(record => {
				return (
					<div
						key={record.index}
						className="ml-7 mr-7 flex items-center justify-between pb-5 pt-5"
					>
						<span title={record.Account} className="w-1/2 overflow-hidden">
							{record.Account}
						</span>
						<span className="w-1/2">{record.TakerGets?.value || 0}</span>
						<span className="w-1/2">{record.TakerPays}</span>
						<span className="flex w-1/2 justify-center">
							<Button
								variant="secondary"
								size="xs"
								onClick={() => {
									onChange(record.Sequence)
								}}
								disabled={record.Account === accountid}
							>
								Accept
							</Button>
						</span>
					</div>
				)
			})}
		</>
	)
}

export default ListView
