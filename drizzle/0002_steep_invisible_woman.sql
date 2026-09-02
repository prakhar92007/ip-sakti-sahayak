CREATE TABLE `document_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`chunkIndex` int NOT NULL,
	`text` text NOT NULL,
	`startOffset` int NOT NULL,
	`endOffset` int NOT NULL,
	CONSTRAINT `document_chunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` varchar(100) NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`documentId` int,
	`chunkId` int,
	`officialUrl` text NOT NULL,
	`section` varchar(255),
	`page` varchar(40),
	`excerpt` text NOT NULL,
	`relevanceScore` varchar(20) NOT NULL,
	`verificationStatus` enum('VERIFIED','UNAVAILABLE','ERROR','PENDING') NOT NULL,
	`retrievedAt` timestamp NOT NULL,
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_evidenceId_unique` UNIQUE(`evidenceId`)
);
--> statement-breakpoint
ALTER TABLE `sources` MODIFY COLUMN `status` enum('VERIFIED','UNAVAILABLE','ERROR','PENDING') NOT NULL;--> statement-breakpoint
ALTER TABLE `citations` ADD `evidenceId` varchar(100);--> statement-breakpoint
ALTER TABLE `citations` ADD `claimText` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `contentType` varchar(100);--> statement-breakpoint
ALTER TABLE `documents` ADD `extractedText` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `contentHash` varchar(64);--> statement-breakpoint
ALTER TABLE `documents` ADD `status` enum('VERIFIED','UNAVAILABLE','ERROR','PENDING') DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `officialUrl` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `sourceType` varchar(30);--> statement-breakpoint
ALTER TABLE `sources` ADD `language` varchar(16);--> statement-breakpoint
ALTER TABLE `sources` ADD `accessMethod` varchar(40);--> statement-breakpoint
ALTER TABLE `sources` ADD `lastVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sources` ADD `contentHash` varchar(64);