import xrpl, {
	type AccountSet,
	type TrustSet,
	type Payment,
	type TransactionMetadata,
} from 'xrpl'
import { Networks } from '@nice-xrpl/react-xrpl'
import { type Product } from './resource.server'

const xrplClient = () =>
	new xrpl.Client(Networks.Devnet, {
		connectionTimeout: 50000,
	})

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

export const accountSet = async (accountId: string, seed: string) => {
	const client = xrplClient()
	await client.connect()

	const wallet = xrpl.Wallet.fromSeed(seed)

	const setAccount: AccountSet = {
		TransactionType: 'AccountSet',
		Account: accountId,
		Domain: stringToHex('example.com'),
		SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
		Flags:
			xrpl.AccountSetTfFlags.tfDisallowXRP |
			xrpl.AccountSetTfFlags.tfRequireDestTag,
	}

	const prepared = await client.autofill(setAccount)
	const signed = wallet.sign(prepared)

	const result = await client.submitAndWait(signed.tx_blob)

	const meta = result.result.meta as TransactionMetadata

	if (meta.TransactionResult == 'tesSUCCESS') {
		return result.result
	} else {
		return null
	}
}

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

export async function getHotWalletBalance(accountId: string) {
	const client = xrplClient()
	await client.connect()

	const balance = await client.request({
		command: 'account_lines',
		account: accountId,
		ledger_index: 'validated',
	})
	client.disconnect()
	return balance
}

export async function getColdWalletBalance(
	accountId: string,
	recepientAccountId: string,
) {
	const client = xrplClient()
	await client.connect()

	const balance = await client.request({
		command: 'gateway_balances',
		account: accountId,
		ledger_index: 'validated',
		hotwallet: [recepientAccountId],
	})
	client.disconnect()
	return balance
}

export async function mintToken(accountId: string, product: Product) {
	const client = xrplClient()
	await client.connect()

	const wallet = xrpl.Wallet.fromSeed(process.env.ADMIN_SEED!)
	const issuingAccount = wallet.address

	const trustSet_tx: TrustSet = {
		TransactionType: 'TrustSet',
		Account: accountId,
		LimitAmount: {
			currency: BEAR,
			issuer: issuingAccount,
			value: '10000000000',
		},
	}
	// Creating a trustline
	const ts_prepared = await client.autofill(trustSet_tx)
	const ts_signed = wallet.sign(ts_prepared)

	const ts_result = await client.submitAndWait(ts_signed.tx_blob)

	const meta = ts_result.result.meta as TransactionMetadata

	if (meta.TransactionResult !== 'tesSUCCESS') {
		return false
	}

	const send_token_tx: Payment = {
		TransactionType: 'Payment',
		Account: issuingAccount,
		Amount: {
			currency: BEAR,
			value: product.carbon,
			issuer: issuingAccount,
		},
		Destination: accountId,
		DestinationTag: 1,
	}

	const pay_prepared = await client.autofill(send_token_tx)
	const pay_signed = wallet.sign(pay_prepared)

	const pay_result = await client.submitAndWait(pay_signed.tx_blob)

	const payresultMeta = pay_result.result.meta as TransactionMetadata

	if (payresultMeta.TransactionResult !== 'tesSUCCESS') {
		return false
	}

	client.disconnect()

	return pay_result.result
}
