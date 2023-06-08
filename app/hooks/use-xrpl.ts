import { useCallback, useMemo, useEffect } from 'react'
import { Client as xrplClient } from 'xrpl'
import { generateSeed, deriveKeypair } from 'ripple-keypairs'
// import { encodeSeed } from 'ripple-address-codec';
import { useXRPLClient } from '@nice-xrpl/react-xrpl'

export const Networks = {
	Testnet: 'wss://s.altnet.rippletest.net:51233',
	Devnet: 'wss://s.devnet.rippletest.net:51233',
}

export function useCreateAccount() {
	const client = useXRPLClient()

	const create = useCallback(async () => {
		await client.connect()
		const fund_result = await client.fundWallet()
		const test_wallet = fund_result.wallet
		const response = await client.request({
			command: 'account_info',
			account: test_wallet.address,
			ledger_index: 'validated',
		})
		return { account: response.result.account_data, wallet: test_wallet }
	}, [client])

	return create
}

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
			return response
		},
		[client],
	)

	return get
}
