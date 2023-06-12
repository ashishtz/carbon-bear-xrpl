import { prisma } from '~/utils/db.server.js'

async function seed() {
	await prisma.admincreds.create({
		data: {
			accountId: "rGsLBEDkPNCworXVWnLWve6XnrzzPgAaNH",
			privatekey: "ED1265EF704DA8DF3456A16F461ACCCA5F329D4DD761EBDE3EDA13C59F84BF3A75",
			publicKey: "ED947D42A78D03C211021F61993B82C78AA61B3D5C980350FCEFA8857DD940B498"
		}
	})
	await Promise.resolve(1);
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

/*
eslint
	@typescript-eslint/no-unused-vars: "off",
*/
