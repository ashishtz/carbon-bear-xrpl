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
import ListView from '~/components/ListView'
import { AcceptOffer } from '../resources+/accept-offer'

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

export default function Buy() {
	const [openBuy, setOpenBuy] = useState(false)
	const [tokensToSell, setTokensToSell] = useState(0)
	const [sellerOffers, setSellerOffers] = useState<BookOffer[]>([])
	const data = useLoaderData<typeof loader>()
	const getSellerOffers = useSellOffers()
	const offerFetcher = useFetcher<typeof action>()
	const [showDesc, setShowDesc] = useState(false)
	const [offer, setOffer] = useState<BookOffer>({})
	const [acceptOpen, setAcceptOpen] = useState(false)

	const handleOffers = useCallback(() => {
		getSellerOffers(data.issuer!).then(offers => {
			setTokensToSell(
				offers.buy.reduce((acc, curr) => {
					return acc + (+curr.TakerGets?.value || 0)
				}, 0),
			)
			setSellerOffers(
				offers.buy.filter(offer => typeof offer.TakerPays === 'string'),
			)
		})
	}, [setSellerOffers, getSellerOffers, data.issuer])

	useEffect(() => {
		handleOffers()
	}, [handleOffers])

	useEffect(() => {
		if (offerFetcher.data?.status === 'success') {
			setTimeout(() => {
				setOpenBuy(false)
			}, 500)
		}
	}, [offerFetcher.data?.status, setOpenBuy])

	const toggleModal = () => setOpenBuy(prev => !prev)

	const [form, fields] = useForm({
		id: 'inline-accept-offer',
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
							Welcome to the dedicated page for companies interested in
							purchasing CARBON tokens. Below, you will find a comprehensive
							list of the current offers available in the market. Companies have
							the option to accept any of these offers or, if they prefer a
							different arrangement, they can create a personalized buy offer by
							simply clicking the "Create Buy Offer" button.
						</p>
						<p className="mb-6">
							Upon clicking the "Create Buy Offer" button, a convenient popup
							window will appear, providing three input fields for
							customization:
						</p>
						<p className="mb-2 mt-8">
							The popup will have the following input fields:
						</p>
						<ol className="mb-8 list-decimal pl-6">
							<li>
								XRP Per Token: In this field, companies can specify the amount
								of XRP they are willing to offer per CARBON token. This allows
								for flexibility in negotiating the best price.
							</li>
							<li>
								Bear Tokens: Here, companies can indicate the desired quantity
								of CARBON tokens they wish to purchase. This allows for precise
								control over the transaction volume.
							</li>
							<li>
								Wallet Seed: To facilitate the transaction, companies are
								required to provide their unique Seed ID, which serves as a
								secure identifier. This Seed ID is obtained during the account
								registration process. Please note that, for the purpose of this
								demo, the transactions are currently processed on the server
								(although this will not be the case in the final design). We
								assure you that the necessary precautions will be taken to
								ensure the security of your secret keys in the actual
								implementation.
							</li>
						</ol>
						<p className="mb-2 mt-8">
							When companies choose to accept an offer, a popup window will
							open, requesting them to provide their Seed ID. The Seed ID serves
							as a unique identifier and is necessary for the transaction to be
							completed. Once the Seed ID is provided, it will be securely sent
							to the server for processing. By sending the Seed ID to the
							server, the necessary steps will be taken to finalize the
							transaction on behalf of the company. This streamlined process
							ensures the smooth completion of transactions, offering
							convenience to the companies involved. Please note that while the
							Seed ID is sent to the server for the purpose of this demo, it is
							important to emphasize that in the final design, appropriate
							security measures will be implemented to safeguard the
							confidentiality of the Seed ID and ensure the protection of
							sensitive information during the transaction process.
						</p>
						<p className="mb-2 mt-8">
							In XRPL (XRP Ledger), transactions are executed automatically
							based on predefined conditions. For instance, consider a scenario
							where someone has created a Sell offer of 1 XRP per BEAR token. If
							a company then creates a Buy offer of 1.5 or 2 XRP per BEAR token,
							the transaction will be automatically executed, and the company
							will acquire the tokens at the most favorable price available.
						</p>
						<p className="mb-2 mt-8">
							This automatic process ensures that transactions occur seamlessly
							without requiring manual intervention. By allowing buyers to set
							their desired purchase price, the XRPL facilitates efficient and
							transparent market dynamics. Companies have the opportunity to
							acquire tokens at competitive prices, benefiting from the
							automation and efficiency provided by the XRPL.
						</p>
					</div>
				)}
			</div>
			<div className="my-5 flex w-full justify-end pr-5 text-center">
				<Button size="sm" variant="primary" onClick={toggleModal}>
					Create Buy Offer
				</Button>
			</div>
			<div className="flex min-h-full pb-10 pt-10 md:flex-wrap">
				<div className="mx-auto h-full w-full max-w-3xl ">
					<div className="flex h-[90vh] flex-col gap-2 border border-white p-7 text-center">
						<div className="mb-5">
							<div className="text-5xl font-black">Sell Offers</div>
							<div className="mr-5 mt-5 text-2xl font-semibold text-night-300">
								<b>{tokensToSell.toFixed(2)}</b> Bear Tokens to sell in the
								market
							</div>
						</div>
						<div>
							<ListView
								records={sellerOffers}
								type="buyer"
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
			<Modal title="Buy Tokens" open={openBuy} onClose={toggleModal}>
				<div className="mt-8">
					<offerFetcher.Form {...form.props} method="POST" action="/buy">
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
