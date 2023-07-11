import { type XRPLWalletInitialState } from '@nice-xrpl/react-xrpl'
import { type AccountInfoResponse } from 'xrpl'

export interface AccountInfoShape extends XRPLWalletInitialState {
	account: AccountInfoResponse
}

const AccountInfo = ({ account, wallet }: AccountInfoShape) => {
	return (
		<div className="overflow-auto lg:overflow-visible mt-4">
			<b className="text-lg">Please save below information for future use</b>

			<div><b>Account ID(Use this Id to login) : </b>{account.result.account_data.Account}</div>
			<div><b>Wallet Private Key : </b>{wallet.privateKey}</div>
			<div><b>Wallet Public Key : </b>{wallet.publicKey}</div>
			<div><b>Seed : </b>{wallet.seed}</div>
		</div>
	)
}

export default AccountInfo
