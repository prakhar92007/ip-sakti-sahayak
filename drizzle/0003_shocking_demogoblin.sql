ALTER TABLE `citations` ADD `claimId` varchar(100);--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `section` varchar(255);--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `page` varchar(40);--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `heading` varchar(255);--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `canonicalUrl` text;--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `contentHash` varchar(64);--> statement-breakpoint
ALTER TABLE `document_chunks` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `failureReason` text;