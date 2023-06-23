import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { AuthorizationError } from 'remix-auth'
import { z } from 'zod'
import { Button, ErrorList, Field } from '~/utils/forms'
import { getSession } from '~/utils/session.server'
import { acceptOffer, validateWallet } from '~/utils/xrpl.server'
import { type BookOffer } from 'xrpl'
import { useEffect, useMemo } from 'react'
import Modal from '~/components/modal'
import { useXrpValue } from '~/hooks/use-xrpl'

interface AcceptOfferShape {
	offer: BookOffer
	onAccepted: () => void
	isOpen: boolean
	toggle: () => void
	offerType: 'buy' | 'sell'
}

export const AcceptOfferSchema = z.object({
	seed: z.string().min(1, 'Account ID is required'),
	xrp: z.string().min(1, 'Account ID is required'),
	bear: z.string().min(1, 'Account ID is required'),
	offerType: z.string().min(1, 'Account ID is required'),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.clone().formData()

	const submission = parse(formData, {
		schema: AcceptOfferSchema,
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

	const wallet = await validateWallet(submission.value?.seed!, sessionId)
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
	try {
		const accept = await acceptOffer(wallet, submission.value)
		if (accept) {
			return json(
				{
					status: 'success',
					submission,
				} as const,
				{ status: 200 },
			)
		}
	} catch (error) {
		if (error instanceof AuthorizationError) {
			return json(
				{
					status: 'error',
					submission: {
						...submission,
						error: {
							// show authorization error as a form level error message.
							'': error.message,
						},
					},
				} as const,
				{ status: 500 },
			)
		}
		throw error
	}

	return json(
		{
			status: 'error',
			submission: {
				...submission,
				error: {
					'': 'Something went wrong while Accepting an offer. Please try again later',
				},
			},
		} as const,
		{ status: 500 },
	)
}

export function AcceptOffer({
	offer,
	onAccepted,
	isOpen,
	toggle,
	offerType,
}: AcceptOfferShape) {
	const offerFetcher = useFetcher<typeof action>()
	const usd = useXrpValue()

	const [form, fields] = useForm({
		id: 'inline-login',
		constraint: getFieldsetConstraint(AcceptOfferSchema),
		lastSubmission: offerFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: AcceptOfferSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const payload = useMemo(() => {
		const bear =
			offerType === 'buy'
				? offer.TakerGets?.value || 0
				: offer.TakerPays?.value || 0
		const xrpTokens =
			offerType === 'buy' ? offer.TakerPays || 0 : offer.TakerGets || 0

		return {
			bear,
			xrp: Number(xrpTokens) / 1000000 / Number(bear),
		}
	}, [offerType, offer])

	useEffect(() => {
		if (offerFetcher.data?.status === 'success') {
			onAccepted()
		}
	}, [onAccepted, offerFetcher])

	return (
		<Modal
			title="Accept Offer"
			open={isOpen}
			onClose={toggle}
			subHeader={
				<>
					<b>Current market rate:</b> {`${usd} USD per XRP`}
				</>
			}
		>
			<offerFetcher.Form
				method="POST"
				action="/resources/accept-offer"
				name="accept-offer"
				{...form.props}
			>
				<div className="mb-10 mt-10">
					<div className="mb-4 text-night-400">
						For the demo, your seed key will be sent to the server, but this
						will be changed in the real product. This is due to a limitation in
						polyfills that I didn’t have time to fix for the demo.
					</div>
					<Field
						labelProps={{
							htmlFor: fields.seed.id,
							children: 'Wallet Seed',
						}}
						inputProps={conform.input(fields.seed, { type: 'password' })}
						errors={fields.seed.errors}
					/>
					<input
						value={offerType}
						{...conform.input(fields.offerType)}
						type="hidden"
					/>
					<input
						value={payload.bear}
						{...conform.input(fields.bear)}
						type="hidden"
					/>
					<input
						value={payload.xrp}
						{...conform.input(fields.xrp)}
						type="hidden"
					/>
					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="flex items-center justify-between gap-6 pt-3">
						<Button
							className="w-full"
							size="md"
							variant="primary"
							status={
								offerFetcher.state === 'submitting'
									? 'pending'
									: offerFetcher.data?.status ?? 'idle'
							}
							type="submit"
							disabled={offerFetcher.state !== 'idle'}
						>
							Accept
						</Button>
					</div>
				</div>
			</offerFetcher.Form>
		</Modal>
	)
}
