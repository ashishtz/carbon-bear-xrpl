import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type DataFunctionArgs,
	type LinksFunction,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import { Networks, XRPLClient } from '@nice-xrpl/react-xrpl'

import tailwindStylesheetUrl from './styles/tailwind.css'
import { getEnv } from './utils/env.server'
import { getSession } from '~/utils/session.server'
import Header from '~/components/header';

export const links: LinksFunction = () => {
	return [
		{
			rel: 'apple-touch-icon',
			sizes: '180x180',
			href: '/favicons/apple-touch-icon.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '32x32',
			href: '/favicons/favicon-32x32.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '16x16',
			href: '/favicons/favicon-16x16.png',
		},
		{ rel: 'manifest', href: '/site.webmanifest' },
		{ rel: 'icon', href: '/favicon.ico' },
		{ rel: 'stylesheet', href: '/fonts/nunito-sans/font.css' },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export const meta: V2_MetaFunction = () => {
	return [
		{ title: 'Carbon Bear' },
		{
			name: 'description',
			content: 'Earn carbon tokens and sell it to the market',
		},
	]
}

export async function loader({ request }: DataFunctionArgs) {
	const session = await getSession(request.headers.get('cookie'))

	const isAuthenticated = session?.data?.sessionId || false
	return json({ ENV: getEnv(), isAuthenticated })
}

export default function App() {
	const data = useLoaderData<typeof loader>()
	return (
		<html lang="en" className="dark h-full">
			<head>
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="flex h-full flex-col justify-between bg-night-700 text-white">
				<div className="flex-1">
					<XRPLClient network={Networks.Testnet}>
						{data.isAuthenticated && <Header />}
						<Outlet />
					</XRPLClient>
				</div>
				<div className="h-5" />
				<ScrollRestoration />
				<Scripts />
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(data.ENV)}`,
					}}
				/>
				<LiveReload />
			</body>
		</html>
	)
}
