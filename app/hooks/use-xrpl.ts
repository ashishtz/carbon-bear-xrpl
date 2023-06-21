import { useCallback } from 'react'
import { useXRPLClient, useCreateWallet } from '@nice-xrpl/react-xrpl'
import { type AccountLinesResponse } from 'xrpl'

export interface BalanceShape extends AccountLinesResponse {
	total: number
	xrp: string
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

export const BEAR = stringToHex('BEAR')
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
		const fund_result = await createWallet('2000000000000000')
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

			const xrp = await client.getXrpBalance(accountId)
			await client.disconnect()
			const total = balance.result.lines.reduce((acc, curr) => {
				if (curr.currency === BEAR) {
					return acc + Number(curr.balance)
				}
				return acc
			}, 0)
			return { ...balance, total, xrp }
		},
		[client],
	)

	return getBalance
}

export const useSellOffers = () => {
	const client = useXRPLClient()

	const offers = useCallback(
		async (issuer: string, taker: string = '') => {
			await client.connect()
			const offers = await client.getOrderbook(
				{ currency: 'XRP' },
				{ currency: BEAR, issuer },
				taker ? { taker } : {},
			)
			await client.disconnect()
			return offers
		},
		[client],
	)

	return offers
}

export const useBuyerOffers = () => {
	const client = useXRPLClient()

	const offers = useCallback(
		async (issuer: string, taker: string = '') => {
			await client.connect()
			const offers = await client.getOrderbook(
				{ currency: BEAR, issuer },
				{ currency: 'XRP' },
				taker ? { taker } : {},
			)
			await client.disconnect()
			return offers
		},
		[client],
	)

	return offers
}