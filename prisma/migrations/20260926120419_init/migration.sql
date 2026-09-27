-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ADMIN', 'LAWYER', 'REVIEWER', 'READER');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('DRAFT', 'FILES_UPLOADED', 'ANALYSIS_PENDING', 'ANALYSIS_RUNNING', 'ANALYSIS_COMPLETED', 'QUESTIONNAIRE_GENERATED', 'IN_REVIEW', 'APPROVED', 'EXPORTED', 'ARCHIVED', 'ERROR');

-- CreateEnum
CREATE TYPE "CertaintyLevel" AS ENUM ('CONFIRMADO', 'PROBABLE', 'NO_DETERMINADO', 'INFERIDO', 'CONTRADICTORIO');

-- CreateEnum
CREATE TYPE "RuleApplicability" AS ENUM ('APLICABLE', 'POTENCIALMENTE_APLICABLE', 'NO_DETERMINADA', 'NO_IDENTIFICADA', 'REQUIERE_VALIDACION_JURIDICA');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('VALIDADA', 'PENDIENTE_REVISION', 'REQUIERE_VALIDACION_JURIDICA', 'DESACTUALIZADA', 'DEROGADA', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "RuleRegime" AS ENUM ('VIGENTE', 'FUTURO', 'TRANSICION');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('TRANSCRIPT', 'DOCUMENT', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADED', 'SCANNING', 'CLEAN', 'QUARANTINED', 'PROCESSED', 'ERROR', 'DELETED');

-- CreateEnum
CREATE TYPE "FindingType" AS ENUM ('PROCESSING_ACTIVITY', 'DATA_SUBJECT_CATEGORY', 'DATA_CATEGORY', 'SENSITIVE_DATA', 'TECHNOLOGY', 'PROVIDER', 'THIRD_PARTY', 'INTERNATIONAL_TRANSFER', 'INCIDENT', 'SECURITY_MEASURE', 'RETENTION_PRACTICE', 'EXISTING_DOCUMENT', 'RIGHTS_MANAGEMENT', 'BUSINESS_ACTIVITY', 'SECTOR');

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('TRANSCRIPT', 'DOCUMENT', 'WEB', 'MANUAL');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'DATE', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO', 'YES_NO_UNKNOWN', 'TABLE', 'FILE', 'MATRIX', 'ADDRESS', 'PERSON_OR_PROVIDER', 'STRUCTURED_LEGAL');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('ACTIVE', 'DRAFT', 'DEPRECATED', 'AI_PROPOSED');

-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('DRAFT', 'GENERATED', 'IN_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'DOCX', 'JSON', 'CSV');

-- CreateEnum
CREATE TYPE "ValidationTaskType" AS ENUM ('LEGAL', 'TECHNICAL', 'CLIENT_CONFIRMATION');

-- CreateEnum
CREATE TYPE "ValidationTaskStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "WebAnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "AIExecutionKind" AS ENUM ('EXTRACTION', 'CLASSIFICATION', 'QUESTION_GENERATION', 'GAP_DETECTION', 'CONTRADICTION_DETECTION', 'COVERAGE_REVIEW', 'WORDING_REVIEW', 'SOURCE_REVIEW', 'EXECUTIVE_SUMMARY', 'EXPLANATION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "diagnosisId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "commercialName" TEXT,
    "identifier" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Chile',
    "region" TEXT,
    "comuna" TEXT,
    "address" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "representative" TEXT,
    "economicActivity" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sectorKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approximateSize" TEXT,
    "employeeCount" INTEGER,
    "estimatedDataSubjects" INTEGER,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'DRAFT',
    "regimeMode" "RuleRegime" NOT NULL DEFAULT 'VIGENTE',
    "targetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "kind" "FileKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'UPLOADED',
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedDocument" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "docType" TEXT,
    "usedOcr" BOOLEAN NOT NULL DEFAULT false,
    "ocrProvider" TEXT,
    "confidence" DOUBLE PRECISION,
    "pageCount" INTEGER,
    "pages" JSONB,
    "classification" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingTranscript" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "fileId" TEXT,
    "rawText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "analysisResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "MeetingTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebAnalysis" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "WebAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "pagesVisited" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "resultSummary" JSONB,

    CONSTRAINT "WebAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebFinding" (
    "id" TEXT NOT NULL,
    "webAnalysisId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technology" TEXT,
    "evidence" TEXT NOT NULL,
    "certainty" "CertaintyLevel" NOT NULL,
    "possibleProvider" TEXT,
    "possibleProcessing" TEXT,
    "possibleTransfer" BOOLEAN NOT NULL DEFAULT false,
    "possibleRisk" TEXT,
    "requiresValidation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProfile" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "type" "FindingType" NOT NULL,
    "description" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "certainty" "CertaintyLevel" NOT NULL,
    "sourceType" "EvidenceSourceType" NOT NULL,
    "sourceDocumentId" TEXT,
    "sourceLocation" TEXT,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" TEXT,
    "relatedNorm" TEXT,
    "relatedArticle" TEXT,
    "notes" TEXT,
    "requiresLegalValidation" BOOLEAN NOT NULL DEFAULT false,
    "requiresClientConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "findingId" TEXT,
    "sourceType" "EvidenceSourceType" NOT NULL,
    "sourceId" TEXT,
    "excerpt" TEXT NOT NULL,
    "location" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "officialRef" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "LegalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Chile',
    "subject" TEXT NOT NULL,
    "norm" TEXT NOT NULL,
    "article" TEXT,
    "clause" TEXT,
    "status" "RuleStatus" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "regime" "RuleRegime" NOT NULL DEFAULT 'VIGENTE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "sourceId" TEXT,
    "officialUrl" TEXT,
    "excerpt" TEXT,
    "scope" TEXT,
    "activationConditions" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "risk" TEXT,
    "severity" TEXT,
    "relatedQuestionCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredEvidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewDate" TIMESTAMP(3),
    "reviewerId" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'REQUIERE_VALIDACION_JURIDICA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalRuleVersion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "changeNote" TEXT,

    CONSTRAINT "LegalRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalEvaluation" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "regime" "RuleRegime" NOT NULL,
    "applicability" "RuleApplicability" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "evidenceRefs" JSONB NOT NULL,
    "certainty" "CertaintyLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activationIndicators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commonProcessing" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commonSubjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dataCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sensitiveData" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commonProviders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commonRisks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "officialLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectorLegalRule" (
    "sectorId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,

    CONSTRAINT "SectorLegalRule_pkey" PRIMARY KEY ("sectorId","ruleId")
);

-- CreateTable
CREATE TABLE "DiagnosisSector" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "certainty" "CertaintyLevel" NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "text" TEXT NOT NULL,
    "answerType" "AnswerType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "processingTag" TEXT,
    "trigger" JSONB,
    "followUp" JSONB,
    "risk" TEXT,
    "norm" TEXT,
    "article" TEXT,
    "source" TEXT,
    "requiredEvidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "help" TEXT,
    "lawyerExplanation" TEXT,
    "clientExplanation" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "visibilityCondition" JSONB,
    "requirednessCondition" JSONB,
    "dependency" JSONB,
    "justification" TEXT,
    "legalMatter" TEXT,
    "riskLevel" TEXT,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "allowsDontKnow" BOOLEAN NOT NULL DEFAULT true,
    "allowsNotApplicable" BOOLEAN NOT NULL DEFAULT true,
    "status" "QuestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "author" TEXT,
    "reviewDate" TIMESTAMP(3),
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSector" (
    "questionId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,

    CONSTRAINT "QuestionSector_pkey" PRIMARY KEY ("questionId","sectorId")
);

-- CreateTable
CREATE TABLE "QuestionVersion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireQuestion" (
    "id" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRequiredOverride" BOOLEAN,
    "sourceNote" TEXT,
    "aiProposed" BOOLEAN NOT NULL DEFAULT false,
    "addedByLawyer" BOOLEAN NOT NULL DEFAULT false,
    "discardedReason" TEXT,
    "requiresLegalReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireAnswer" (
    "id" TEXT NOT NULL,
    "questionnaireQuestionId" TEXT NOT NULL,
    "value" JSONB,
    "notApplicable" BOOLEAN NOT NULL DEFAULT false,
    "dontKnow" BOOLEAN NOT NULL DEFAULT false,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "questionnaireId" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "summary" JSONB NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFinding" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "checkCode" TEXT NOT NULL,
    "checkName" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedEntity" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "ReviewFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "signatureHash" TEXT NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "questionnaireId" TEXT,
    "format" "ExportFormat" NOT NULL,
    "generatedById" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageKey" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExecution" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT,
    "kind" "AIExecutionKind" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputSummary" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "validations" JSONB NOT NULL,
    "errors" JSONB,
    "sourcesUsed" JSONB,
    "executedById" TEXT,
    "durationMs" INTEGER,

    CONSTRAINT "AIExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationTask" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "type" "ValidationTaskType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ValidationTaskStatus" NOT NULL DEFAULT 'OPEN',
    "relatedEntity" JSONB,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "ValidationTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_idx" ON "AuditEvent"("organizationId");

-- CreateIndex
CREATE INDEX "AuditEvent_diagnosisId_idx" ON "AuditEvent"("diagnosisId");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Diagnosis_organizationId_idx" ON "Diagnosis"("organizationId");

-- CreateIndex
CREATE INDEX "Diagnosis_status_idx" ON "Diagnosis"("status");

-- CreateIndex
CREATE INDEX "File_diagnosisId_idx" ON "File"("diagnosisId");

-- CreateIndex
CREATE INDEX "File_checksumSha256_idx" ON "File"("checksumSha256");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractedDocument_fileId_key" ON "ExtractedDocument"("fileId");

-- CreateIndex
CREATE INDEX "ExtractedDocument_fileId_idx" ON "ExtractedDocument"("fileId");

-- CreateIndex
CREATE INDEX "MeetingTranscript_diagnosisId_idx" ON "MeetingTranscript"("diagnosisId");

-- CreateIndex
CREATE INDEX "WebAnalysis_diagnosisId_idx" ON "WebAnalysis"("diagnosisId");

-- CreateIndex
CREATE INDEX "WebFinding_webAnalysisId_idx" ON "WebFinding"("webAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProfile_diagnosisId_key" ON "OrganizationProfile"("diagnosisId");

-- CreateIndex
CREATE INDEX "Finding_diagnosisId_type_idx" ON "Finding"("diagnosisId", "type");

-- CreateIndex
CREATE INDEX "Finding_certainty_idx" ON "Finding"("certainty");

-- CreateIndex
CREATE INDEX "Evidence_diagnosisId_idx" ON "Evidence"("diagnosisId");

-- CreateIndex
CREATE INDEX "Evidence_findingId_idx" ON "Evidence"("findingId");

-- CreateIndex
CREATE INDEX "LegalSource_authority_idx" ON "LegalSource"("authority");

-- CreateIndex
CREATE UNIQUE INDEX "LegalRule_code_key" ON "LegalRule"("code");

-- CreateIndex
CREATE INDEX "LegalRule_regime_status_idx" ON "LegalRule"("regime", "status");

-- CreateIndex
CREATE INDEX "LegalRule_subject_idx" ON "LegalRule"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "LegalRuleVersion_ruleId_version_key" ON "LegalRuleVersion"("ruleId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "LegalEvaluation_diagnosisId_ruleId_regime_key" ON "LegalEvaluation"("diagnosisId", "ruleId", "regime");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_key_key" ON "Sector"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisSector_diagnosisId_sectorId_key" ON "DiagnosisSector"("diagnosisId", "sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_code_key" ON "Question"("code");

-- CreateIndex
CREATE INDEX "Question_category_idx" ON "Question"("category");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersion_questionId_version_key" ON "QuestionVersion"("questionId", "version");

-- CreateIndex
CREATE INDEX "Questionnaire_diagnosisId_idx" ON "Questionnaire"("diagnosisId");

-- CreateIndex
CREATE INDEX "QuestionnaireQuestion_questionnaireId_idx" ON "QuestionnaireQuestion"("questionnaireId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireQuestion_questionnaireId_questionId_key" ON "QuestionnaireQuestion"("questionnaireId", "questionId");

-- CreateIndex
CREATE INDEX "QuestionnaireAnswer_questionnaireQuestionId_idx" ON "QuestionnaireAnswer"("questionnaireQuestionId");

-- CreateIndex
CREATE INDEX "Review_diagnosisId_idx" ON "Review"("diagnosisId");

-- CreateIndex
CREATE INDEX "ReviewFinding_reviewId_idx" ON "ReviewFinding"("reviewId");

-- CreateIndex
CREATE INDEX "Approval_diagnosisId_idx" ON "Approval"("diagnosisId");

-- CreateIndex
CREATE INDEX "Export_diagnosisId_idx" ON "Export"("diagnosisId");

-- CreateIndex
CREATE INDEX "AIExecution_diagnosisId_idx" ON "AIExecution"("diagnosisId");

-- CreateIndex
CREATE INDEX "ValidationTask_diagnosisId_status_idx" ON "ValidationTask"("diagnosisId", "status");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedDocument" ADD CONSTRAINT "ExtractedDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTranscript" ADD CONSTRAINT "MeetingTranscript_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTranscript" ADD CONSTRAINT "MeetingTranscript_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebAnalysis" ADD CONSTRAINT "WebAnalysis_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebFinding" ADD CONSTRAINT "WebFinding_webAnalysisId_fkey" FOREIGN KEY ("webAnalysisId") REFERENCES "WebAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "LegalRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRule" ADD CONSTRAINT "LegalRule_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LegalSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRule" ADD CONSTRAINT "LegalRule_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalRuleVersion" ADD CONSTRAINT "LegalRuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "LegalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalEvaluation" ADD CONSTRAINT "LegalEvaluation_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalEvaluation" ADD CONSTRAINT "LegalEvaluation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "LegalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorLegalRule" ADD CONSTRAINT "SectorLegalRule_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectorLegalRule" ADD CONSTRAINT "SectorLegalRule_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "LegalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSector" ADD CONSTRAINT "DiagnosisSector_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSector" ADD CONSTRAINT "DiagnosisSector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSector" ADD CONSTRAINT "QuestionSector_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSector" ADD CONSTRAINT "QuestionSector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questionnaire" ADD CONSTRAINT "Questionnaire_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireQuestion" ADD CONSTRAINT "QuestionnaireQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_questionnaireQuestionId_fkey" FOREIGN KEY ("questionnaireQuestionId") REFERENCES "QuestionnaireQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFinding" ADD CONSTRAINT "ReviewFinding_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFinding" ADD CONSTRAINT "ReviewFinding_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationTask" ADD CONSTRAINT "ValidationTask_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationTask" ADD CONSTRAINT "ValidationTask_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
