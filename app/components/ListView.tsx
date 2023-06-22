import { type BookOffer } from 'xrpl'
import { Button } from '~/utils/forms'

interface ListViewShape {
	records: BookOffer[]
	onChange: (record: BookOffer) => void
	accountid: string
	type: 'seller' | 'buyer'
}

const ListView = ({
	records,
	onChange,
	accountid,
	type = 'buyer',
}: ListViewShape) => {
	return (
		<>
			<div className="ml-7 mr-7 mt-7 flex justify-between text-sm font-extrabold">
				<label className="w-1/2">BEAR Tokens</label>
				<label className="w-1/2">XRP</label>
				<label className="w-1/2">XRP/Token</label>
				<label className="w-1/2">Accept Offer</label>
			</div>
			<div className="mt-1 h-[1px] bg-gray-500" />
			{records.map(record => {
				const bearTokens =
					type === 'buyer'
						? record.TakerGets?.value || record.TakerGets || 0
						: record.TakerPays?.value || 0
				const xrpTokens =
					type === 'buyer' ? record.TakerPays || 0 : record.TakerGets || 0
				return (
					<div
						key={record.Sequence}
						className="ml-7 mr-7 flex items-center justify-between pb-5 pt-5"
					>
						{/* <span className="w-1/2">{Number(bearTokens).toFixed(2)}</span> */}
						<span className="w-1/2">{bearTokens}</span>
						<span className="w-1/2">{Number(xrpTokens) / 1000000}</span>
						<span className="w-1/2">
							{Number(xrpTokens) / 1000000 / Number(bearTokens)}
						</span>
						<span className="flex w-1/2 justify-center">
							<Button
								variant="secondary"
								size="xs"
								onClick={() => {
									onChange(record)
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
