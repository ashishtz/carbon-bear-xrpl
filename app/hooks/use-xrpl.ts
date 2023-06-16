import { useCallback } from 'react'
import { useXRPLClient, useCreateWallet } from '@nice-xrpl/react-xrpl'

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
