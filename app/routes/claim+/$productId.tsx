import { redirect, type DataFunctionArgs } from '@remix-run/node'
import {
	useLoaderData,
	useFetcher,
} from '@remix-run/react'
import invariant from 'tiny-invariant'
import { requireAuthenticated } from '~/utils/auth.server'
import { Button } from '~/utils/forms'
import { useForm } from '@conform-to/react'

import {
	claimPurchase,
	findProduct,
	type Product,
} from '~/utils/resource.server'
import { getSession } from '~/utils/session.server'

export async function loader({ request, params }: DataFunctionArgs) {
	await requireAuthenticated(request)
	invariant(params.productId, 'Missing username')
	const product = findProduct(params.productId)
	if (!product) {
		return redirect('/products')
	}
	return product
}

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.clone().formData()
	const productId = formData.get('productId')
	const response = {
		status: 'error',
		message: '',
	}

	if (!productId) {
		response.message =
			'Something went wrong while selecting a product. Please try again.'
	}

	const product = findProduct(String(productId))

	if (!product) {
		response.message = 'This product does not exist in our record.'
	}

	const session = await getSession(request.headers.get('cookie'))
	const { sessionId } = session.data

	const claim = await claimPurchase(product!, sessionId)

	if (!claim) {
		response.message =
			'Something went wrong. Can not make transaction at the moment.'
	}
	response.status = 'success'
	response.message = `Your purchase claim is passed. You have received ${product?.carbon} Carbon Bear tokens`
	return response
}

const ProductDetails = () => {
	const product = useLoaderData<Product>()
	const claimFetcher = useFetcher<typeof action>()

	const [claimForm] = useForm({
		id: 'inline-claim',
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="mt-10 flex p-4">
			<div>
				<div className="w-[40rem] border">
					<img alt={product.name} src={product.image} className="max-w-full" />
				</div>
			</div>
			<div className="ml-20">
				<h3 className="text-h2">{product.name}</h3>
				<div className="mt-16">
					<label className="text-h4">Carbon Reduction: </label>
					<span className="text-h5">{product.carbon} tons</span>
				</div>
				<div className="mt-12">{product.description}</div>
				<div className="mt-12">
					<p>
						You can always track your transactions{' '}
						<a
							className="font-extrabold text-blue-500"
							target="__blank"
							href="https://testnet.xrpl.org"
						>
							here
						</a>
					</p>
				</div>
				<div className="mt-12">
					<claimFetcher.Form {...claimForm.props} method="POST">
						<input type="hidden" name="productId" value={product.id} />
						<Button
							status={
								claimFetcher.state === 'submitting'
									? 'pending'
									: claimFetcher.data?.status ?? 'idle'
							}
							variant="primary"
							size="md"
							type="submit"
						>
							Claim Purchase
						</Button>
					</claimFetcher.Form>
					{!!claimFetcher.data?.message && !!claimFetcher.data?.status && (
						<div className="mt-2">
							{
								<span
									className={
										claimFetcher.data.status == 'error'
											? 'text-red-500'
											: 'text-green-500'
									}
								>
									{claimFetcher.data.message}
								</span>
							}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ProductDetails
