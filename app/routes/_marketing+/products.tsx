import { type DataFunctionArgs } from '@remix-run/node'
import { requireAuthenticated } from '~/utils/auth.server'
import { getProducts } from '~/utils/resource.server'
import { useLoaderData, useNavigate } from '@remix-run/react'
import React from 'react'

export async function loader({ request }: DataFunctionArgs) {
	await requireAuthenticated(request)
	return getProducts()
}

export default function UserProfile() {
	const products = useLoaderData<typeof loader>()
	const navigate = useNavigate();

	return (
		<div className="p-10">
			<div className="flex items-center justify-evenly text-center">
				{products.map(product => {
					return (
						<div
							className="h-[40rem] w-[40rem] border border-white pb-2 cursor-pointer"
							key={product.name}
							onClick={() => {
								navigate(`/products/${product.id}`)
							}}
						>
							<div className="flex items-center justify-evenly bg-white">
								<img
									alt={product.name}
									src={product.image}
									className="h-[30rem] max-w-full"
								/>
							</div>
							<div>
								<h3 className="mt-4 text-h3">{product.name}</h3>
								<div className="w-full mt-6">
									<label className="text-body-md font-bold">Carbon Reduction</label>
									<div>{product.carbon} tons</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
