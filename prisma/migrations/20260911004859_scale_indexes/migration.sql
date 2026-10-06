-- CreateIndex
CREATE INDEX "Material_tutorId_idx" ON "Material"("tutorId");

-- CreateIndex
CREATE INDEX "Material_studentId_idx" ON "Material"("studentId");

-- CreateIndex
CREATE INDEX "Review_tutorId_idx" ON "Review"("tutorId");

-- CreateIndex
CREATE INDEX "TutorSubject_subjectId_idx" ON "TutorSubject"("subjectId");

-- CreateIndex
CREATE INDEX "TutoringRequest_tutorId_idx" ON "TutoringRequest"("tutorId");
