-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "subjectId" TEXT,
    "studentId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Material_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Material" ("createdAt", "description", "fileName", "fileUrl", "id", "kind", "subjectId", "title", "tutorId") SELECT "createdAt", "description", "fileName", "fileUrl", "id", "kind", "subjectId", "title", "tutorId" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
