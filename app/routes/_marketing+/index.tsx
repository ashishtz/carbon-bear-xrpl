import {
	json,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import { useLoaderData, useSearchParams } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Spacer } from '~/components/spacer'
import { authenticator, requireAnonymous } from '~/utils/auth.server'
import { commitSession, getSession } from '~/utils/session.server'
import { InlineLogin } from '../resources+/login'

export async function loader({ request }: DataFunctionArgs) {
	await requireAnonymous(request)
	const session = await getSession(request.headers.get('cookie'))
	const error = session.get(authenticator.sessionErrorKey)
	let errorMessage: string | null = null
	if (typeof error?.message === 'string') {
		errorMessage = error.message
	}
	return json(
		{ formError: errorMessage },
		{
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		},
	)
}

export const meta: V2_MetaFunction = () => {
	return [{ title: 'Login to Carbon Bear' }]
}

export default function LoginPage() {
	const [searchParams] = useSearchParams()
	const data = useLoaderData<typeof loader>()

	const redirectTo = searchParams.get('redirectTo') || '/'

	return (
		<div className="flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mb-10 text-night-200 flex justify-center">
				<ul className="list-disc">
					<li>
						For the purpose of this demo, you only need an Account Id
						that you will get when you create an account.
					</li>
					<li>
						If you do not have an account, you can click on{' '}
						<b>Create an Account</b> and it will Create an account and give you
						the credentials. You need to create an account only once.
					</li>
					<li>
						The Account Id from those credentials will be used to log you in.
					</li>
					<li>
						Please make sure to copy all those creddentials as they are going to
						be used in the app for upcoming steps.
					</li>
				</ul>
			</div>
			<div className="mx-auto w-full max-w-md">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome back!</h1>
					<p className="text-body-md text-night-200">
						Please enter your details.
					</p>
					<p className="text-body-sm text-night-200">
						Since it's a demo, I am curretly using <b>testnet</b> for all the transactions.
					</p>
				</div>
				<Spacer size="xs" />
				<InlineLogin redirectTo={redirectTo} formError={data.formError} />
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
