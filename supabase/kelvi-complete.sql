-- First-time Kelvi tables on the Aarla OS Supabase project.
-- All objects live in schema `kelvi`. Paste into the SQL Editor if you prefer
-- not to run Prisma CLI. Does not touch Aarla OS `public` tables.
-- Generated from prisma/schema.prisma — regenerate with:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "kelvi";

-- CreateTable
CREATE TABLE "kelvi"."Player" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "displayName" TEXT NOT NULL,
    "instagramHandle" TEXT,
    "city" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "kelvi"."MagicLink" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "displayName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "playerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Game" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Question" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "internalTitle" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaKind" TEXT,
    "categoryId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "acceptableAnswers" JSONB NOT NULL,
    "releaseAt" TIMESTAMP(3) NOT NULL,
    "expireAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "competitive" BOOLEAN NOT NULL DEFAULT true,
    "scoringConfig" JSONB,
    "streakRule" TEXT NOT NULL DEFAULT 'consecutive_correct',
    "sponsorName" TEXT,
    "venueHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Attempt" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "gameSessionId" TEXT,
    "venueId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "clientOpenedAt" TIMESTAMP(3),
    "clientSubmittedAt" TIMESTAMP(3),
    "responseMs" INTEGER,
    "answer" TEXT,
    "correct" BOOLEAN,
    "score" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."GameSession" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "venueId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."PlayerGameStats" (
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalPlayed" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "bestResponseMs" INTEGER,
    "lastPlayedAt" TIMESTAMP(3),

    CONSTRAINT "PlayerGameStats_pkey" PRIMARY KEY ("playerId","gameId")
);

-- CreateTable
CREATE TABLE "kelvi"."PlayerCategoryStats" (
    "playerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerCategoryStats_pkey" PRIMARY KEY ("playerId","categoryId")
);

-- CreateTable
CREATE TABLE "kelvi"."WeeklyScore" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "attempted" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "totalResponseMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeeklyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."PlayerAchievement" (
    "playerId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("playerId","achievementId")
);

-- CreateTable
CREATE TABLE "kelvi"."Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."Reward" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "playerId" TEXT,
    "voucherCode" TEXT,
    "voucherAmount" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelvi"."LivePresence" (
    "questionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivePresence_pkey" PRIMARY KEY ("questionId","playerId")
);

-- CreateTable
CREATE TABLE "kelvi"."AppConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "kelvi"."Player"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "kelvi"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "kelvi"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "kelvi"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "kelvi"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "kelvi"."MagicLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "kelvi"."Game"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "kelvi"."Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Question_number_key" ON "kelvi"."Question"("number");

-- CreateIndex
CREATE INDEX "Question_releaseAt_expireAt_idx" ON "kelvi"."Question"("releaseAt", "expireAt");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "kelvi"."Question"("status");

-- CreateIndex
CREATE INDEX "Attempt_questionId_correct_responseMs_idx" ON "kelvi"."Attempt"("questionId", "correct", "responseMs");

-- CreateIndex
CREATE INDEX "Attempt_playerId_submittedAt_idx" ON "kelvi"."Attempt"("playerId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_playerId_questionId_key" ON "kelvi"."Attempt"("playerId", "questionId");

-- CreateIndex
CREATE INDEX "WeeklyScore_gameId_weekStart_points_idx" ON "kelvi"."WeeklyScore"("gameId", "weekStart", "points");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScore_playerId_gameId_weekStart_key" ON "kelvi"."WeeklyScore"("playerId", "gameId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "kelvi"."Achievement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "kelvi"."Venue"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_weekStart_type_key" ON "kelvi"."Reward"("weekStart", "type");

-- AddForeignKey
ALTER TABLE "kelvi"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "kelvi"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "kelvi"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."MagicLink" ADD CONSTRAINT "MagicLink_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Question" ADD CONSTRAINT "Question_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "kelvi"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Question" ADD CONSTRAINT "Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "kelvi"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "kelvi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Attempt" ADD CONSTRAINT "Attempt_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Attempt" ADD CONSTRAINT "Attempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "kelvi"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Attempt" ADD CONSTRAINT "Attempt_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "kelvi"."GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Attempt" ADD CONSTRAINT "Attempt_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "kelvi"."Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."GameSession" ADD CONSTRAINT "GameSession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "kelvi"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."GameSession" ADD CONSTRAINT "GameSession_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "kelvi"."Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."PlayerGameStats" ADD CONSTRAINT "PlayerGameStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."PlayerGameStats" ADD CONSTRAINT "PlayerGameStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "kelvi"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."PlayerCategoryStats" ADD CONSTRAINT "PlayerCategoryStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."PlayerCategoryStats" ADD CONSTRAINT "PlayerCategoryStats_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "kelvi"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."WeeklyScore" ADD CONSTRAINT "WeeklyScore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."WeeklyScore" ADD CONSTRAINT "WeeklyScore_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "kelvi"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "kelvi"."Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."Reward" ADD CONSTRAINT "Reward_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."LivePresence" ADD CONSTRAINT "LivePresence_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "kelvi"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelvi"."LivePresence" ADD CONSTRAINT "LivePresence_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "kelvi"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prisma / service role (SQL Editor on Supabase).
GRANT USAGE ON SCHEMA "kelvi" TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "kelvi" TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "kelvi" TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kelvi" GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "kelvi" GRANT ALL ON SEQUENCES TO postgres, service_role;
