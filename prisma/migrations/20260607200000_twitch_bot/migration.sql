-- CreateTable
CREATE TABLE "TwitchCommand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 5,
    "userLevel" TEXT NOT NULL DEFAULT 'EVERYONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitchCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwitchCommand_name_key" ON "TwitchCommand"("name");

-- CreateTable
CREATE TABLE "TwitchTimer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 15,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitchTimer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitchModConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "blockLinks" BOOLEAN NOT NULL DEFAULT false,
    "permitSeconds" INTEGER NOT NULL DEFAULT 60,
    "capsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "capsMinLength" INTEGER NOT NULL DEFAULT 12,
    "capsPercent" INTEGER NOT NULL DEFAULT 70,
    "blacklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 30,
    "warnMessage" TEXT,
    "modsImmune" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitchModConfig_pkey" PRIMARY KEY ("id")
);
