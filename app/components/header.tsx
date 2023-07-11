import { ButtonLink } from '~/utils/forms'
import { Link } from '@remix-run/react'
import { useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Spacer } from './spacer'

const tabs = [
	{
		title: 'Claim',
		path: '/claim',
		match: 'claim',
	},
	{
		title: 'Buy',
		path: '/buy',
		match: 'buy',
	},
	{
		title: 'Sell',
		path: '/sell',
		match: 'sell',
	},
	{
		title: 'AMM',
		path: '/amm',
		match: 'amm',
	},
	{
		title: 'Profile',
		path: '/profile',
		match: 'profile',
	},
]

const Desktop = ({ activePath }: { activePath: string }) => (
	<div className="hidden items-center justify-between bg-accent-purple p-1 shadow-sm md:flex">
		<div className="flex flex-1">
			<div className="mx-4 flex items-center text-body-lg font-extrabold">
				<Link to="/home">Carbon Bear</Link>
			</div>
			{tabs.map(tab => (
				<ButtonLink
					key={`header-${tab.match}`}
					style={{
						borderRadius: 'unset',
						padding: '1.25rem',
						...(activePath.startsWith(tab.match)
							? {
									fontWeight: 'bold',
							  }
							: { fontWeight: '500' }),
					}}
					to={tab.path}
					variant="none"
					size="md"
				>
					{tab.title}
				</ButtonLink>
			))}
		</div>
		<div className="mr-4">
			<Link to="/logout">Logout</Link>
		</div>
	</div>
)

const Mobile = ({ activePath }: { activePath: string }) => {
	const [open, setOpen] = useState(false)
	return (
		<div className="relative">
			<div className="flex h-16 bg-accent-purple p-1 shadow-sm md:hidden">
				<div className="flex flex-1">
					<div className="mx-4 flex items-center text-body-lg font-extrabold">
						<Link to="/home">Carbon Bear</Link>
					</div>
				</div>
				<div className="mr-8 flex items-center justify-center font-extrabold">
					<div
						className="cursor-pointer space-y-2"
						onClick={() => setOpen(prev => !prev)}
					>
						<div className="h-0.5 w-8 bg-white" />
						<div className="h-0.5 w-8 bg-white" />
						<div className="h-0.5 w-8 bg-white" />
					</div>
				</div>
			</div>
			{open && (
				<div className="absolute w-full bg-white">
					{tabs.map(tab => (
						<ButtonLink
							key={`header-${tab.match}`}
							onClick={() => setOpen(prev => !prev)}
							style={{
								borderRadius: 'unset',
								padding: '1.25rem',
								color: '#000',
								...(activePath.startsWith(tab.match)
									? {
											fontWeight: 'bold',
									  }
									: { fontWeight: '500' }),
							}}
							to={tab.path}
							variant="none"
							size="md"
						>
							{tab.title}
						</ButtonLink>
					))}
					<hr />
					<ButtonLink
						style={{
							borderRadius: 'unset',
							padding: '1.25rem',
							color: '#000',
							fontWeight: 'normal' 
						}}
						variant="none"
						size="md"
						to="/logout"
					>
						Logout
					</ButtonLink>
				</div>
			)}
		</div>
	)
}

const Header = () => {
	const { pathname } = useLocation()

	const activePath = useMemo(() => {
		return pathname.replace('/', '')
	}, [pathname])

	return (
		<>
			<Desktop activePath={activePath} />
			<Mobile activePath={activePath} />
		</>
	)
}

export default Header
