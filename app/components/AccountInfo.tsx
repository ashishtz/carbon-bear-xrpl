import { type XRPLWalletInitialState } from '@nice-xrpl/react-xrpl'
import { type AccountRoot } from 'xrpl/dist/npm/models/ledger'

export interface AccountInfoShape extends XRPLWalletInitialState {
	account: AccountRoot
}

const AccountInfo = ({ account, wallet }: AccountInfoShape) => {
	return (
		<div>
			<b className="text-lg">Please save below information for future use</b>

			<div><b>AccountId(Use this Id to login): </b>{account.Account}</div>
			<div><b>Wallet Public Key: </b>{wallet.publicKey}</div>
			<div><b>Wallet Private Key: </b>{wallet.privateKey}</div>
		</div>
	)
}

export default AccountInfo
