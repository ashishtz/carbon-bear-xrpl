import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { AuthorizationError } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { z } from 'zod'
import { authenticator } from '~/utils/auth.server'
import { Button, ErrorList, Field } from '~/utils/forms'
import { safeRedirect } from '~/utils/misc'
import { commitSession, getSession } from '~/utils/session.server'
import { useCreateAccount } from '~/hooks/use-xrpl'
import { useState } from 'react'
import AccountInfo from '~/components/AccountInfo'

export const LoginFormSchema = z.object({
	accountId: z.string(),
	redirectTo: z.string().optional(),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.clone().formData()
	const submission = parse(formData, {
		schema: LoginFormSchema,
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

	let sessionId: string | null = null
	try {
		sessionId = await authenticator.authenticate(FormStrategy.name, request, {
			throwOnError: true,
		})
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
				{ status: 400 },
			)
		}
		throw error
	}

	const session = await getSession(request.headers.get('cookie'))
	session.set(authenticator.sessionKey, sessionId)
	const { redirectTo } = submission.value
	const newCookie = await commitSession(session, {
		maxAge: 60 * 60 * 24 * 7,
	})
	if (redirectTo) {
		throw redirect(safeRedirect(redirectTo), {
			headers: { 'Set-Cookie': newCookie },
		})
	}
	
	return json({ status: 'success', submission } as const, {
		headers: { 'Set-Cookie': newCookie },
	})
}

export function InlineLogin({
	redirectTo,
	formError,
}: {
	redirectTo?: string
	formError?: string | null
}) {
	const loginFetcher = useFetcher<typeof action>()
	const createAccount = useCreateAccount()
	const [isLoading, setIsLoading] = useState(false)
	const [accountInfo, setAccountInfo] = useState<any>(null)

	const [form, fields] = useForm({
		id: 'inline-login',
		constraint: getFieldsetConstraint(LoginFormSchema),
		lastSubmission: loginFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: LoginFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	const createNewAccount = () => {
		setIsLoading(true)
		createAccount()
			.then(info => {
				setAccountInfo(info)
			})
			.catch(err => {
				console.log('err', err)
			})
			.finally(() => {
				setIsLoading(false)
			})
	}

	return (
		<div>
			<div className="mx-auto w-full max-w-md px-8">
				<loginFetcher.Form
					method="POST"
					action="/resources/login"
					name="login"
					{...form.props}
				>
					<Field
						labelProps={{
							htmlFor: fields.accountId.id,
							children: 'Account Id',
						}}
						inputProps={conform.input(fields.accountId, { type: 'password' })}
						errors={fields.accountId.errors}
					/>

					<input
						value={redirectTo}
						{...conform.input(fields.redirectTo)}
						type="hidden"
					/>
					<ErrorList errors={formError ? [formError] : []} />
					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="flex items-center justify-between gap-6 pt-3">
						<Button
							className="w-full"
							size="md"
							variant="primary"
							status={
								loginFetcher.state === 'submitting'
									? 'pending'
									: loginFetcher.data?.status ?? 'idle'
							}
							type="submit"
							disabled={loginFetcher.state !== 'idle'}
						>
							Log in
						</Button>
					</div>
				</loginFetcher.Form>
				<div className="flex items-center justify-center gap-2 pt-6">
					<span className="text-night-200">New here?</span>
					<Button
						status={isLoading ? 'pending' : 'idle'}
						onClick={createNewAccount}
					>
						Create an account
					</Button>
				</div>
			</div>
			{!!accountInfo && <AccountInfo {...accountInfo} />}
		</div>
	)
}
