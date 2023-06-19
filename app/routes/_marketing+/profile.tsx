import { useEffect, useState } from 'react'
import { conform, useForm } from '@conform-to/react'
import { type DataFunctionArgs, json } from '@remix-run/node'
import { useLoaderData, useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { getFieldsetConstraint, parse } from '@conform-to/zod'

import { Button, ErrorList, Field } from '~/utils/forms'
import Modal from '~/components/modal'
import { requireAuthenticated } from '~/utils/auth.server'
import { getSession } from '~/utils/session.server'
import { type BalanceShape, useAccountBalance } from '~/hooks/use-xrpl'
import { createOffer, validateWallet } from '~/utils/xrpl.server'

export const CreateOfferSchema = z.object({
	seed: z.string().min(1, 'Account seed is required'),
	amount: z.string().min(1, 'Amount is required'),
	xrp: z.string().min(1, 'XRP Amount is required'),
})

export async function loader({ request }: DataFunctionArgs) {
	await requireAuthenticated(request)
	const session = await getSession(request.headers.get('cookie'))
	const { sessionId } = session.data
	return { accountId: sessionId }
}

export async function action({ request }: DataFunctionArgs) {
	await requireAuthenticated(request)
	const formData = await request.clone().formData()
	const submission = parse(formData, {
		schema: CreateOfferSchema,
		acceptMultipleErrors: () => true,
	})

	if (!submission.value || submission.intent !== 'submit') {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	const session = await getSession(request.headers.get('cookie'))
	const { sessionId } = session.data
	const wallet = validateWallet(submission.value?.seed, sessionId)
	if (!wallet) {
		return json({
			status: 'error',
			submission: {
				...submission,
				error: {
					seed: 'Invalid seed provided',
				},
			},
		})
	}

	const offer = await createOffer(wallet, submission.value)
	if (offer) {
		return json(
			{
				status: 'success',
				submission,
			} as const,
			{ status: 200 },
		)
	}

	return json(
		{
			status: 'error',
			submission: {
				...submission,
				error: {
					// show authorization error as a form level error message.
					'': 'Something went wrong while Creating an offer. Please try again later',
				},
			},
		} as const,
		{ status: 400 },
	)
}

export default function UserProfile() {
	const [openSell, setOpenSell] = useState(false)
	const [balance, setBalance] = useState<BalanceShape | null>(null)
	const { accountId } = useLoaderData<typeof loader>()
	const getBalance = useAccountBalance(accountId)
	const toggleModal = () => setOpenSell(prev => !prev)
	const offerFetcher = useFetcher<typeof action>()
	console.log('balance', balance)
	useEffect(() => {
		getBalance(accountId)
			.then(value => {
				setBalance(value)
			})
			.catch(err => {
				console.log('err', err)
			})
	}, [getBalance, accountId])

	const [form, fields] = useForm({
		id: 'inline-createOffer',
		constraint: getFieldsetConstraint(CreateOfferSchema),
		lastSubmission: offerFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: CreateOfferSchema })
		},
		shouldRevalidate: 'onBlur',
	})

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
						<h3 className="mb-2 text-h3">Bear Tokens</h3>
						<div className="flex justify-between">
							<div className="w-[45%]">
								<h4 className="text-h4">Available</h4>
								<div className="text-h5">{balance?.total || 0}</div>
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
			<div className="mb-3 mt-3 p-10 text-h2">Transactions</div>
			<div className="pl-10">
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
					<offerFetcher.Form {...form.props} method="POST" action="/profile">
						<div className="mb-10">
							<Field
								labelProps={{
									htmlFor: fields.amount.id,
									children: 'Amount',
								}}
								inputProps={conform.input(fields.amount, {
									type: 'number',
								})}
								errors={fields.amount.errors}
							/>

							<Field
								labelProps={{
									htmlFor: fields.xrp.id,
									children: 'XRP amount/Token',
								}}
								inputProps={conform.input(fields.xrp, {
									type: 'number',
								})}
								errors={fields.xrp.errors}
							/>

							<Field
								labelProps={{
									htmlFor: fields.seed.id,
									children: 'Wallet Seed',
								}}
								inputProps={conform.input(fields.seed, {
									type: 'text',
								})}
								errors={fields.seed.errors}
							/>
							<ErrorList errors={form.errors} id={form.errorId} />
						</div>
						<div className="flex justify-center">
							<Button
								size="sm"
								variant="primary"
								type="submit"
								status={
									offerFetcher.state === 'submitting'
										? 'pending'
										: offerFetcher.data?.status ?? 'idle'
								}
							>
								SELL
							</Button>
						</div>
					</offerFetcher.Form>
				</div>
			</Modal>
		</>
	)
}
