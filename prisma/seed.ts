import { prisma } from '~/utils/db.server.js'
import { deleteAllData } from 'tests/setup/utils.js'

async function seed() {
	deleteAllData()
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
