import { useCallback, useEffect, useState } from 'react'
import { type DataFunctionArgs, json } from '@remix-run/node'
import { type BookOffer } from 'xrpl'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { conform, useForm } from '@conform-to/react'

import { Button, ErrorList, Field } from '~/utils/forms'
import Modal from '~/components/modal'
import { requireAuthenticated } from '~/utils/auth.server'
import { useSellOffers, useXrpValue } from '~/hooks/use-xrpl'
import { getSession } from '~/utils/session.server'
import { createOffer, validateWallet } from '~/utils/xrpl.server'
import ListView from '~/components/ListView'
import { AcceptOffer } from '../resources+/accept-offer'

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
	const [showDesc, setShowDesc] = useState(false)
	const [offer, setOffer] = useState<BookOffer>({})
	const [acceptOpen, setAcceptOpen] = useState(false)
	const [loading, setLoading] = useState(true)
	const usd = useXrpValue()

	const handleOffers = useCallback(() => {
		setLoading(true)
		getSellerOffers(data.issuer!)
			.then(offers => {
				setBuyerOffers(
					offers.buy.filter(offer => typeof offer.TakerGets === 'string'),
				)
				return true
			})
			.catch(err => {
				console.log('err', err)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [setBuyerOffers, getSellerOffers, data.issuer, setLoading])

	useEffect(() => {
		handleOffers()
	}, [handleOffers])

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
			<div className="px-4 py-8">
				<span
					onClick={() => {
						setShowDesc(prev => !prev)
					}}
					className="cursor-pointer text-lg text-white"
					title="Page Information"
				>
					&#9432; Page Explaination
				</span>
				{showDesc && (
					<div className="container mx-auto">
						<p className="mb-6 mt-4">
							Welcome to the Sell page, designed specifically for individuals
							who are purchasing carbon-reducing products, verifying their
							purchases through our app, and receiving CARBON tokens. This
							platform provides an opportunity for users to sell their tokens,
							ensuring a seamless experience. Similar to buyers, sellers have
							two options for selling their tokens.
						</p>
						<p className="mb-6">
							The first option is to browse through the list of offers created
							by buyers within the app and accept any of those offers. By
							selecting the "Accept" button, a popup window will appear,
							prompting sellers to enter their Seed ID. This Seed ID is the same
							identifier they received during their account creation process. By
							providing this ID, the request will be sent to the server, which
							will then facilitate the transaction, converting their tokens into
							XRP currency.
						</p>
						<p className="mb-2 mt-8">
							Alternatively, if sellers do not wish to accept any of the buyer's
							offers, they can create their own sell offer by clicking the
							"Create Sell Offer" button on this page. Upon clicking the button,
							a popup window will appear with three input fields.
						</p>
						<ol className="mb-8 list-decimal pl-6">
							<li>
								Bear Token Amount: In this field, sellers can specify the
								quantity of tokens they wish to sell.
							</li>
							<li>
								XRP Amount/Token: Here, sellers can indicate the desired amount
								of XRP they would like to receive for each BEAR token.
							</li>
							<li>
								Wallet Seed: Sellers will provide the Seed ID of their account
								in this field. It's important to note that, for demo purposes,
								this request is being passed to the server. However, in the
								actual implementation, security measures will be implemented to
								ensure the protection of transaction-related information, and no
								sensitive data will be sent to the server.
							</li>
						</ol>
						<p className="mb-2 mt-8">
							Upon submitting the form, the server will create the new sell
							offer, which will be listed on the "Buy" page. Transactions on
							this platform are automated, ensuring a streamlined process. If a
							seller's sell offer is more favorable (i.e., cheaper) than any of
							the buyer's offers, the transaction will be executed
							automatically, and the sellers will receive XRP currency as a
							result.
						</p>
						<p className="mb-2 mt-8">
							We strive to provide an efficient and user-friendly platform,
							where sellers can explore available offers or create their own,
							while benefiting from the automatic transaction process. Rest
							assured that security measures will be implemented to safeguard
							sensitive information in the actual implementation of the
							platform.
						</p>
					</div>
				)}
			</div>
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
								isLoading={loading}
								type="seller"
								records={buyerOffers}
								accountid={data.accountId}
								onChange={rec => {
									setOffer(rec)
									setAcceptOpen(true)
								}}
							/>
						</div>
					</div>
				</div>
			</div>
			<Modal
				title="Sell Tokens Offer"
				open={openSell}
				onClose={toggleModal}
				subHeader={
					<>
						<b>Current market rate:</b> {`${usd} USD per XRP`}
					</>
				}
			>
				<div className="mt-8">
					<offerFetcher.Form {...form.props} method="POST" action="/profile">
						<div className="mb-10">
							<div className="mb-4 text-night-400">
								For the demo, your seed key will be sent to the server, but this
								will be changed in the real product. This is due to a limitation
								in polyfills that I didn’t have time to fix for the demo.
							</div>
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
			<AcceptOffer
				offerType="sell"
				isOpen={acceptOpen}
				onAccepted={() => {
					handleOffers()
					setAcceptOpen(false)
				}}
				offer={offer}
				toggle={() => {
					setAcceptOpen(prev => !prev)
				}}
			/>
		</>
	)
}
