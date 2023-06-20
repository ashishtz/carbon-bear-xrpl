import { useCallback, useEffect, useState } from 'react'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { type BookOffer } from 'xrpl'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { conform, useForm } from '@conform-to/react'

import { Button, ErrorList, Field } from '~/utils/forms'
import Modal from '~/components/modal'
import { requireAuthenticated } from '~/utils/auth.server'
import { useSellOffers } from '~/hooks/use-xrpl'
import { getSession } from '~/utils/session.server'
import { createSellOffer, validateWallet } from '~/utils/xrpl.server'

export const CreateOfferSchema = z.object({
	seed: z.string().min(1, 'Account seed is required'),
	xrp: z.string().min(1, 'Amount is required'),
	bear: z.string().min(1, 'XRP Amount is required'),
})

export async function loader({ request }: DataFunctionArgs) {
	await requireAuthenticated(request)

	const session = await getSession(request.headers.get('cookie'))
	const { sessionId } = session.data

	const issuer = process.env.ADMIN_ACCOUNT_ID

	return { issuer, accountId: sessionId }
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

	const offer = await createSellOffer(wallet, submission.value)
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
					'': 'Something went wrong while Creating an offer. Please try again later',
				},
			},
		} as const,
		{ status: 500 },
	)
}

export default function MarketPlace() {
	const [openBuy, setOpenBuy] = useState(false)
	const [tokensToSell, setTokensToSell] = useState(0)
	const data = useLoaderData<typeof loader>()
	const getOffers = useSellOffers()
	const offerFetcher = useFetcher<typeof action>()

	useEffect(() => {
		getOffers(data.issuer!).then(offers => {
			console.log('offers', offers);
			setTokensToSell(
				offers.buy.reduce((acc, curr) => {
					return acc + (+curr.TakerGets?.value || 0)
				}, 0),
			)
		})
	}, [getOffers, data, setTokensToSell])

	useEffect(() => {
		if (offerFetcher.data?.status === 'success') {
			setTimeout(() => {
				setOpenBuy(false)
			}, 500)
		}
	}, [offerFetcher.data?.status, setOpenBuy])

	const toggleModal = () => setOpenBuy(prev => !prev)

	const [form, fields] = useForm({
		id: 'inline-acceptOffer',
		constraint: getFieldsetConstraint(CreateOfferSchema),
		lastSubmission: offerFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: CreateOfferSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<>
			<div className="flex min-h-full flex-col pb-10 pt-10">
				<div className="mx-auto h-full w-full max-w-3xl">
					<div className="flex h-[90vh] flex-col justify-between gap-2 border border-white p-7 text-center">
						<div>
							<div className="text-6xl font-black">On Sale</div>
							<div className="mt-5 text-2xl font-semibold">
								{tokensToSell} Bear Tokens
							</div>
						</div>
						<div className="flex w-full justify-center text-center">
							<Button size="md" variant="primary" onClick={toggleModal}>
								BUY
							</Button>
						</div>
					</div>
				</div>
			</div>
			<Modal title="Buy Tokens" open={openBuy} onClose={toggleModal}>
				<div className="mt-8">
					<offerFetcher.Form
						{...form.props}
						method="POST"
						action="/marketplace"
					>
						<div className="mb-10">
							<Field
								labelProps={{
									htmlFor: fields.xrp.id,
									children: 'XRP Per Token',
								}}
								inputProps={conform.input(fields.xrp, {
									type: 'number',
								})}
								errors={fields.xrp.errors}
							/>

							<Field
								labelProps={{
									htmlFor: fields.bear.id,
									children: 'Bear Tokens',
								}}
								inputProps={conform.input(fields.bear, {
									type: 'number',
								})}
								errors={fields.bear.errors}
							/>

							<Field
								labelProps={{
									htmlFor: fields.seed.id,
									children: 'Wallet Seed',
								}}
								inputProps={conform.input(fields.seed, {
									type: 'password',
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
								CREATE
							</Button>
						</div>
					</offerFetcher.Form>
				</div>
			</Modal>
		</>
	)
}
