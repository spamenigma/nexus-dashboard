-- CreateTable: Notification
CREATE TABLE "Notification" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "integrationId"   TEXT,
    "integrationName" TEXT,
    "type"            TEXT NOT NULL,
    "severity"        TEXT NOT NULL,
    "message"         TEXT NOT NULL,
    "read"            INTEGER NOT NULL DEFAULT 0,
    "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: NotificationChannel
CREATE TABLE "NotificationChannel" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "name"      TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "config"    TEXT NOT NULL DEFAULT '{}',
    "enabled"   INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
