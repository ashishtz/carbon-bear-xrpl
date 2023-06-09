import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { authenticator } from '~/utils/auth.server'

export async function loader({ request }: DataFunctionArgs) {
	await authenticator.logout(request, { redirectTo: '/' })
	return redirect('/')
}
