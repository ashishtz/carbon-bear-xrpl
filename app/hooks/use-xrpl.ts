import { useCallback } from 'react'
import { useXRPLClient, useCreateWallet } from '@nice-xrpl/react-xrpl'
import xrpl, { type AccountLinesResponse } from 'xrpl'
import { BaseResponse } from 'xrpl/dist/npm/models/methods/baseMethod'

export interface BalanceShape extends AccountLinesResponse {
	total: number
}

const stringToHex = (str: string) => {
	let hex = ''
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i)
		hex += code.toString(16)
	}
	const paddingLength = 40 - hex.length
	if (paddingLength > 0) {
		hex += '0'.repeat(paddingLength)
	}
	return hex
}

const BEAR = stringToHex('BEAR')
// const REBEAR = stringToHex('REBEAR')

export const useGetAccount = () => {
	const client = useXRPLClient()

	const get = useCallback(
		async (publicKey: string) => {
			await client.connect()
			const response = await client.request({
				command: 'account_info',
				account: publicKey,
				ledger_index: 'current',
			})
			await client.disconnect()
			return response
		},
		[client],
	)

	return get
}

export function useCreateAccount() {
	const createWallet = useCreateWallet()
	const getAccount = useGetAccount()

	const create = useCallback(async () => {
		const fund_result = await createWallet('20')
		const wallet = fund_result.wallet
		const account = await getAccount(wallet.address)
		return { account, wallet }
	}, [createWallet, getAccount])

	return create
}

export function useAccountBalance(accountId: string) {
	const client = useXRPLClient()

	const getBalance = useCallback(
		async (accountId: string): Promise<BalanceShape> => {
			await client.connect()
			const balance = await client.request({
				command: 'account_lines',
				account: accountId,
				ledger_index: 'validated',
			})

			await client.disconnect()
			const total = balance.result.lines.reduce((acc, curr) => {
				if (curr.currency === BEAR) {
					return acc + Number(curr.balance)
				}
				return acc
			}, 0)
			return { ...balance, total }
		},
		[client],
	)

	return getBalance
}

export const useCreateSellOffer = () => {
	const client = useXRPLClient()

	const createOffer = useCallback(
		async (accountId: string) => {
			await client.connect()
			const offerCreateTransaction = {
				TransactionType: 'OfferCreate',
				Account: accountId,
				TakerPays: {
					currency: 'USD',
					issuer: '<issuer-address-to-sell>',
					value: '<amount-to-sell>',
				},
				TakerGets: {
					currency: '<currency-code-to-buy>',
					issuer: '<issuer-address-to-buy>',
					value: '<amount-to-buy>',
				},
			}

			await client.disconnect()
			return offerCreateTransaction
		},
		[client],
	)

	return createOffer
}

// export const useLookupOffers = () => {
// 	const client = useXRPLClient()
// 	const offers = useCallback(
// 		async (issuer: string, seller: string, amount: string): Promise<BaseResponse> => {
// 			await client.connect()
// 			const we_want = {
// 				currency: BEAR,
// 				issuer: issuer,
// 				value: amount,
// 			}
			
// 			const we_spend = {
// 				currency: 'XRP',
// 				// 25 TST * 10 USD per TST * 15% financial exchange (FX) cost
// 				value: xrpl.xrpToDrops(+amount * 10 * 1.15),
// 			}
// 			const orderbook_resp = await client.request({
// 				command: 'book_offers',
// 				taker: seller,
// 				ledger_index: 'current',
// 				taker_gets: we_want,
// 				taker_pays: we_spend,
// 			})

// 			await client.disconnect();

// 			return orderbook_resp
// 		},
// 		[client],
// 	)

// 	return offers
// }
