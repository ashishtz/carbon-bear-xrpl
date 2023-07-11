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
import {
	type BalanceShape,
	useAccountBalance,
	useSellOffers,
	BEAR,
	useXrpValue,
} from '~/hooks/use-xrpl'
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
	const adminId = process.env.ADMIN_ACCOUNT_ID
	return { accountId: sessionId, adminId }
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

export default function UserProfile() {
	const [openSell, setOpenSell] = useState(false)
	const [balance, setBalance] = useState<BalanceShape | null>(null)
	const [tokensOnSell, setTokensOnSell] = useState(0)
	const [showDesc, setShowDesc] = useState(false)
	const { accountId, adminId } = useLoaderData<typeof loader>()
	const getBalance = useAccountBalance(accountId)
	const toggleModal = () => setOpenSell(prev => !prev)
	const offerFetcher = useFetcher<typeof action>()
	const getOnSale = useSellOffers()
	const usd = useXrpValue()


	useEffect(() => {
		if (offerFetcher.data?.status === 'success') {
			setTimeout(() => {
				setOpenSell(false)
			}, 500)
		}
	}, [offerFetcher.data?.status, setOpenSell])

	useEffect(() => {
		getBalance(accountId)
			.then(bal => {
				return setBalance(bal)
			})
			.then(() => getOnSale(adminId!, accountId))
			.then(offers => {
				const onSale = offers.buy.reduce((acc, curr) => {
					const takerGets = curr.TakerGets
					if (
						curr.Account === accountId &&
						(takerGets?.currency || 'XRP') === BEAR
					) {
						return acc + +(takerGets.value || 0)
					}
					return acc
				}, 0)

				setTokensOnSell(onSale)
			})
			.catch(err => {
				console.log('err', err)
			})
	}, [getBalance, accountId, getOnSale, adminId, setTokensOnSell])

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
							Welcome to the Profile page, a central hub for both sellers and
							buyers. Here, users can conveniently access important information
							related to their account and transactions.
						</p>
						<p className="mb-2">
							On this page, users can view the quantity of BEAR tokens they
							currently possess, providing them with an overview of their token
							holdings. Additionally, they can also see the amount of BEAR
							tokens they have listed for sale, allowing for easy monitoring of
							their selling activities.
						</p>
						<p className="mb-2">
							Furthermore, users can readily check the XRP balance of their
							account, providing a clear understanding of their available XRP
							funds.
						</p>
						<p className="mb-2">
							Please note that the current implementation of the Profile page is
							a basic version, aimed at providing essential functionality. In
							the future, we have plans to enhance this page by introducing a
							comprehensive list of user transactions and additional details,
							further enriching the user experience.
						</p>
					</div>
				)}
			</div>
			<div className="p-10">
				<div className="mb-4 flex justify-end">
					<Button size="sm" variant="primary" onClick={toggleModal}>
						Create Sell Offer
					</Button>
				</div>
				<div className="flex items-center justify-between text-center flex-wrap">
					<div className="w-full mb-8 md:mb-0 md:w-[45%] border border-white p-3">
						<h3 className="mb-2 text-h3">Bear Tokens</h3>
						<div className="flex justify-between">
							<div className="w-[45%]">
								<h4 className="text-h4">Available</h4>
								<div className="text-h5">{balance?.total || 0}</div>
							</div>
							<div className="w-[45%]">
								<h4 className="text-h4">On Sale</h4>
								<div className="text-h5">{tokensOnSell}</div>
							</div>
						</div>
					</div>
					<div className="w-full md:w-[45%] border border-white  p-3">
						<h3 className="mb-2 text-h3">XRP</h3>
						<div className="flex justify-center">
							<div className="w-[45%]">
								<h4 className="h-8 text-h4"></h4>
								<div className="text-h5">{balance?.xrp || 0}</div>
							</div>
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
		</>
	)
}
