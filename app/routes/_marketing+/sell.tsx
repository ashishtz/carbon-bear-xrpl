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
import { createOffer, validateWallet } from '~/utils/xrpl.server'
import ListView from '~/components/ListView'

export const CreateOfferSchema = z.object({
	seed: z.string().min(1, 'Account seed is required'),
	amount: z.string().min(1, 'Amount is required'),
	xrp: z.string().min(1, 'XRP Amount is required'),
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
					'': 'Something went wrong while Creating an offer. Please try again later',
				},
			},
		} as const,
		{ status: 500 },
	)
}

export default function Sell() {
	const [openSell, setOpenSell] = useState(false)
	const [buyerOffers, setBuyerOffers] = useState<BookOffer[]>([])
	const data = useLoaderData<typeof loader>()
	const getSellerOffers = useSellOffers()
	const offerFetcher = useFetcher<typeof action>()

	const handleOffers = useCallback(
		(offers: BookOffer[]) => {
			setBuyerOffers(
				offers.filter(offer => typeof offer.TakerGets === 'string'),
			)
		},
		[setBuyerOffers],
	)

	useEffect(() => {
		getSellerOffers(data.issuer!).then(offers => {
			handleOffers(offers.buy)
			return true
		})
	}, [getSellerOffers, data, handleOffers])

	useEffect(() => {
		if (offerFetcher.data?.status === 'success') {
			setTimeout(() => {
				setOpenSell(false)
			}, 500)
		}
	}, [offerFetcher.data?.status, setOpenSell])

	const toggleModal = () => setOpenSell(prev => !prev)

	const [form, fields] = useForm({
		id: 'inline-create-sell-offer',
		constraint: getFieldsetConstraint(CreateOfferSchema),
		lastSubmission: offerFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: CreateOfferSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<>
			<div className="my-5 flex w-full justify-end pr-5 text-center">
				<Button size="sm" variant="primary" onClick={toggleModal}>
					Create Sell Offer
				</Button>
			</div>
			<div className="flex min-h-full pb-10 pt-10 md:flex-wrap">
				<div className="mx-auto h-full w-full max-w-3xl">
					<div className="flex h-[90vh] flex-col gap-2 border border-white p-7 text-center">
						<div className="mb-5">
							<div className="text-5xl font-black">Buy Offers</div>
						</div>
						<div>
							<ListView
								type="seller"
								records={buyerOffers}
								accountid={data.accountId}
								onChange={rec => {
									console.log('rec', rec)
								}}
							/>
						</div>
					</div>
				</div>
			</div>
			<Modal title="Sell Tokens Offer" open={openSell} onClose={toggleModal}>
				<div className="mt-8">
					<offerFetcher.Form {...form.props} method="POST" action="/profile">
						<div className="mb-10">
							<Field
								labelProps={{
									htmlFor: fields.amount.id,
									children: 'Bear Token Amount',
								}}
								inputProps={conform.input(fields.amount, {
									type: 'number',
								})}
								errors={fields.amount.errors}
							/>

							<Field
								labelProps={{
									htmlFor: fields.xrp.id,
									children: 'XRP Amount/Token',
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
								CREATE
							</Button>
						</div>
					</offerFetcher.Form>
				</div>
			</Modal>
		</>
	)
}
