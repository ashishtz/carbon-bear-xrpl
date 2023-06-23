import { type DataFunctionArgs } from '@remix-run/node'
import { requireAuthenticated } from '~/utils/auth.server'
import { getProducts } from '~/utils/resource.server'
import { useLoaderData, useNavigate } from '@remix-run/react'
import React, { useState } from 'react'

export async function loader({ request }: DataFunctionArgs) {
	await requireAuthenticated(request)
	return getProducts()
}

export default function UserProfile() {
	const products = useLoaderData<typeof loader>()
	const [showDesc, setShowDesc] = useState(false)

	const navigate = useNavigate()

	return (
		<>
			<div className="px-4 py-8">
				<span
					onClick={() => {
						setShowDesc(prev => !prev)
					}}
					className="cursor-pointer text-lg text-white"
					title="Page Information"
				>
					&#9432; Page Explaination
				</span>
				{showDesc && (
					<div className="container mx-auto">
						<p className="mb-6 mt-4">
							Welcome to the Verified Claims page, where individuals can
							confidently assert their carbon reduction efforts by utilizing
							goods and services that have received certification from a trusted
							Carbon Reduction Authority. At Carbon Bear, we reward users with
							BEAR tokens, representing a reduction of 1 gram of carbon. These
							valuable BEAR tokens can be exchanged for XRP, which in turn can
							be converted to a local fiat currency such as USD.
						</p>
						<p className="mb-6">
							On this page, you will find a comprehensive list of all the
							verified products available within our app. Users have the
							privilege to select the specific product they have purchased and
							subsequently verify their purchase. It's important to note that,
							for the purpose of this demo, all product data presented here is
							static, and there is no actual verification of purchase occurring.
							Additionally, as we are currently utilizing the testnet, no real
							transactions will take place from users' actual accounts.
						</p>
						<p className="mb-6">
							By participating in our platform and making verified claims,
							individuals can showcase their commitment to carbon reduction
							while being rewarded with BEAR tokens. These tokens hold tangible
							value and can be exchanged for XRP, enabling users to benefit from
							their sustainable actions. Our aim is to provide a transparent and
							reliable ecosystem where users can be recognized and rewarded for
							their positive environmental impact.
						</p>
						<p className="mb-2 mt-8">
							Please keep in mind that while the verification process is
							simulated in this demo, we are dedicated to implementing robust
							mechanisms for authenticating purchase claims and ensuring the
							accuracy of carbon reduction efforts in our actual implementation.
						</p>
					</div>
				)}
			</div>
			<div className="p-10">
				<div className="flex items-center justify-evenly text-center">
					{products.map(product => {
						return (
							<div
								className="h-[40rem] w-[40rem] cursor-pointer border border-white pb-2"
								key={product.name}
								onClick={() => {
									navigate(`/claim/${product.id}`)
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
									<div className="mt-6 w-full">
										<label className="text-body-md font-bold">
											Carbon Reduction
										</label>
										<div>{product.carbon} grams</div>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</>
	)
}
