import xrpl, { Wallet } from 'xrpl'
import { Networks } from '@nice-xrpl/react-xrpl'

const xrplClient = () => new xrpl.Client(Networks.Devnet)

export async function getUserInfo(accountId: string) {
	const client = xrplClient()
	await client.connect()

	const response = await client.request({
		command: 'account_info',
		account: accountId,
		ledger_index: 'current',
	})
	await client.disconnect()
	return response
}

export async function getUserWallet(accountId: string) {
	const wallet = Wallet.fromSeed(process.env.ADMIN_SEED!);
	console.log('wallet', wallet);
	return wallet;
}
