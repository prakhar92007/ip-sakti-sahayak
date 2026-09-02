CREATE TABLE `citations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int,
	`documentId` int,
	`citationId` varchar(100) NOT NULL,
	`section` varchar(255),
	`excerpt` text,
	`relevanceScore` varchar(20),
	`retrievedAt` timestamp,
	CONSTRAINT `citations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255) NOT NULL,
	`language` varchar(16) NOT NULL DEFAULT 'en',
	`jurisdiction` varchar(80) NOT NULL DEFAULT 'India',
	`productType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`documentType` varchar(100),
	`sourceUrl` text,
	`version` varchar(80),
	`retrievedAt` timestamp,
	`chunkCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`mode` varchar(40) NOT NULL DEFAULT 'DEMO MODE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_research` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`kind` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`referenceId` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_research_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screenings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`productName` varchar(255) NOT NULL,
	`targetMarket` varchar(80) NOT NULL,
	`input` text NOT NULL,
	`result` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `screenings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`title` varchar(255) NOT NULL,
	`publisher` varchar(255) NOT NULL,
	`jurisdiction` varchar(80) NOT NULL,
	`category` varchar(100) NOT NULL,
	`status` enum('DEMO SOURCE','VERIFIED SOURCE') NOT NULL,
	`indexedAt` timestamp,
	`documentCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`)
);
