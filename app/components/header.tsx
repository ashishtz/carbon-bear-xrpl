import { ButtonLink } from '~/utils/forms'
import { Link } from '@remix-run/react'
import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'

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

const Header = () => {
	const { pathname } = useLocation()

	const activePath = useMemo(() => {
		return pathname.replace('/', '')
	}, [pathname])

	return (
		<div className="flex items-center justify-between bg-accent-purple p-1 shadow-sm">
			<div className="flex">
				<div className="mx-4 flex items-center text-body-lg font-extrabold">
					<Link to="/home">Carbon Bear</Link>
				</div>
				{tabs.map(tab => (
					<ButtonLink
						key={`header-${tab.match}`}
						style={{
							borderRadius: 'unset',
							padding: '1.25rem',
							...(activePath === tab.match
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
}

export default Header
