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
import { useEffect } from 'react'
import Modal from '~/components/modal'

interface AcceptOfferShape {
	offer: BookOffer
	onAccepted: () => void
	isOpen: boolean
	toggle: () => void
}

export const AcceptOfferSchema = z.object({
	seed: z.string().min(1, 'Account ID is required'),
	sequence: z.string().min(1, 'Account ID is required'),
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
}: AcceptOfferShape) {
	const offerFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'inline-login',
		constraint: getFieldsetConstraint(AcceptOfferSchema),
		lastSubmission: offerFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: AcceptOfferSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	useEffect(() => {
		if (offerFetcher.data?.status === 'success') {
			onAccepted()
		}
	}, [onAccepted, offerFetcher])

	return (
		<Modal title="Accept Offer" open={isOpen} onClose={toggle}>
			<offerFetcher.Form
				method="POST"
				action="/resources/accept-offer"
				name="accept-offer"
				{...form.props}
			>
				<div className="mb-10 mt-10">
					<Field
						labelProps={{
							htmlFor: fields.seed.id,
							children: 'Wallet Seed',
						}}
						inputProps={conform.input(fields.seed, { type: 'password' })}
						errors={fields.seed.errors}
					/>

					<input
						value={offer.Sequence}
						{...conform.input(fields.sequence)}
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
