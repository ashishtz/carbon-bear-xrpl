import { ButtonLink } from '~/utils/forms'
import { Link } from '@remix-run/react'
import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'

const tabs = [
	{
		title: 'Market',
		path: '/marketplace',
		match: 'marketplace',
	},
	{
		title: 'Products',
		path: '/products',
		match: 'products',
	},
	{
		title: 'Profile',
		path: '/profile',
		match: 'profile',
	},
]

const activePathStyle = {
	fontWeight: 'bold',
}

const Header = () => {
	const { pathname } = useLocation()

	const activePath = useMemo(() => {
		return pathname.replace('/', '')
	}, [pathname])

	return (
		<div className="flex items-center justify-between bg-accent-purple p-1 shadow-sm">
			<div className="flex">
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
