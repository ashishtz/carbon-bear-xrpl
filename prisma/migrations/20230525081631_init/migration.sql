-- CreateTable
CREATE TABLE
	"User" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"addresss" TEXT NOT NULL,
		"balance" TEXT NOT NULL,
		"role" TEXT NOT NULL,
		"privateKey" TEXT NOT NULL,
		"publicKey" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL
	);

-- CreateTable
CREATE TABLE
	"Transaction" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"amount" TEXT NOT NULL,
		"tokens" TEXT NOT NULL,
		"buyerId" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL,
		CONSTRAINT "sender_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
	);

CREATE INDEX "User_role_index" ON "User" ("role");

CREATE INDEX "Transaction_buyer_amount" on "Transaction" ("buyerId", "amount");

CREATE INDEX "Transaction_buyer_tokens" on "Transaction" ("buyerId", "tokens");
