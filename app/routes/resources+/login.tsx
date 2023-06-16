import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, redirect, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useActionData } from '@remix-run/react'
import { AuthorizationError } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import { z } from 'zod'
import { authenticator } from '~/utils/auth.server'
import { Button, ErrorList, Field } from '~/utils/forms'
import { safeRedirect } from '~/utils/misc'
import { commitSession, getSession } from '~/utils/session.server'
import { useCreateAccount } from '~/hooks/use-xrpl'
import React, { useState } from 'react'
import AccountInfo from '~/components/AccountInfo'
import { createAccount } from '~/utils/xrpl.server'

export const LoginFormSchema = z.object({
	accountId: z.string(),
	redirectTo: z.string().optional(),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.clone().formData()

	const formType = formData.get('formType')

	if (formType === 'login') {
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

	const submission = await createAccount()

	if (submission?.account && submission.wallet) {
		return json(submission)
	}
}

export function InlineLogin({
	redirectTo,
	formError,
}: {
	redirectTo?: string
	formError?: string | null
}) {
	const loginFetcher = useFetcher<typeof action>()
	const registerFetcher = useFetcher<typeof action>()
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

	const [registerForm] = useForm({
		id: 'inline-register',
		shouldRevalidate: 'onBlur',
	})

	return (
		<div>
			<div className="mx-auto w-full max-w-md px-8">
				<loginFetcher.Form
					method="POST"
					action="/resources/login"
					name="login"
					{...form.props}
				>
					<input type="hidden" name="formType" value="login" />
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
					<registerFetcher.Form
						{...registerForm.props}
						method="POST"
						action="/resources/login"
						name="registration"
					>
						<input type="hidden" name="formType" value="registration" />
						<Button
							status={
								registerFetcher.state === 'submitting' ? 'pending' : 'idle'
							}
							variant="none"
							type="submit"
						>
							Create an account
						</Button>
					</registerFetcher.Form>
				</div>
			</div>
			{!!registerFetcher.data && <AccountInfo {...registerFetcher.data} />}
		</div>
	)
}
