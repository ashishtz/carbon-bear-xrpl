import { mintToken } from "./xrpl.server";

export type Product = typeof products[0];

const products = [
	{
		id: 1,
		image:
			'https://cdni.autocarindia.com/Utils/ImageResizer.ashx?n=http%3A%2F%2Fcdni.autocarindia.com%2FNews%2Ftesla_model_x.jpg&c=0',
		name: 'Tesla Model X',
		carbon: '600',
		description:
			'A major difference between electric and gas cars is that electric cars car keep getting cleaner over time. A Tesla on the average US electricity mix saves some 600 pounds of CO2e per year compared to an efficient new gas car. But in 10 years, that gas car will be sputtering along with lower efficiency due to wear and tear. The electric car will get cleaner as the grid gets cleaner.',
	},
	{
		id: 2,
		image: 'https://fdn2.gsmarena.com/vv/pics/apple/apple-watch-se-2.jpg',
		name: 'Apple Watch SE',
		carbon: '400',
		description:
			'Stay on top of your health with high and low heart rate, and irregular heart rhythm notifications;Apple Watch can detect if you’ve taken a hard fall, then automatically call emergency services for you; Emergency SOS lets you call for help when you need it;Sync your favourite music and podcasts',
	},
]

export const getProducts = () => {
	return products
}

export const findProduct = (id: string) => {
	return products.find(product => product.id === +id)
}


export const claimPurchase = (product: Product, accountId: string) => {
	return mintToken(accountId, product);
}