-- Phase 4: publication, events and private messages. Phase 5: fee and payment ledger.
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT,
    "startsAt" DATETIME NOT NULL, "endsAt" DATETIME NOT NULL, "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT', "audience" TEXT NOT NULL DEFAULT 'INSTITUTION',
    "departmentId" TEXT, "courseId" TEXT, "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarEvent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CalendarEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT', "publishedAt" DATETIME, "expiresAt" DATETIME,
    "audience" TEXT NOT NULL DEFAULT 'INSTITUTION', "departmentId" TEXT, "courseId" TEXT,
    "createdById" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Announcement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Announcement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY, "directKey" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY, "conversationId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastReadAt" DATETIME,
    CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY, "conversationId" TEXT NOT NULL, "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "FeeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY, "studentId" TEXT NOT NULL, "category" TEXT NOT NULL,
    "description" TEXT NOT NULL, "amountDueMinor" INTEGER NOT NULL, "amountPaidMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR', "dueDate" DATETIME, "academicPeriod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNPAID', "administrativeNotes" TEXT, "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeeRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY, "feeRecordId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL, "currency" TEXT NOT NULL, "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED', "transactionReference" TEXT NOT NULL,
    "receiptNumber" TEXT, "paidAt" DATETIME NOT NULL, "recordedById" TEXT NOT NULL,
    "reversedAt" DATETIME, "reversedById" TEXT, "reversalReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRecord_feeRecordId_fkey" FOREIGN KEY ("feeRecordId") REFERENCES "FeeRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRecord_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CalendarEvent_status_startsAt_idx" ON "CalendarEvent"("status", "startsAt");
CREATE INDEX "CalendarEvent_audience_departmentId_idx" ON "CalendarEvent"("audience", "departmentId");
CREATE INDEX "CalendarEvent_courseId_idx" ON "CalendarEvent"("courseId");
CREATE INDEX "Announcement_status_publishedAt_idx" ON "Announcement"("status", "publishedAt");
CREATE INDEX "Announcement_audience_departmentId_idx" ON "Announcement"("audience", "departmentId");
CREATE INDEX "Announcement_courseId_idx" ON "Announcement"("courseId");
CREATE UNIQUE INDEX "Conversation_directKey_key" ON "Conversation"("directKey");
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX "ConversationParticipant_userId_conversationId_idx" ON "ConversationParticipant"("userId", "conversationId");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "FeeRecord_studentId_status_idx" ON "FeeRecord"("studentId", "status");
CREATE INDEX "FeeRecord_dueDate_idx" ON "FeeRecord"("dueDate");
CREATE UNIQUE INDEX "PaymentRecord_transactionReference_key" ON "PaymentRecord"("transactionReference");
CREATE UNIQUE INDEX "PaymentRecord_receiptNumber_key" ON "PaymentRecord"("receiptNumber");
CREATE INDEX "PaymentRecord_studentId_paidAt_idx" ON "PaymentRecord"("studentId", "paidAt");
CREATE INDEX "PaymentRecord_feeRecordId_status_idx" ON "PaymentRecord"("feeRecordId", "status");
