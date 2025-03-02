CREATE TABLE "account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "channel_member" (
	"channel_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "channel_member_channel_id_user_id_pk" PRIMARY KEY("channel_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "channel_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(256) NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_conversation" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conversation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user1_id" varchar(255) NOT NULL,
	"user2_id" varchar(255) NOT NULL,
	"channel_id" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "message_attachment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_attachment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"message_id" integer NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"embedding" vector(1536),
	CONSTRAINT "message_attachment_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "message_reaction" (
	"message_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"emoji" varchar(32) NOT NULL,
	CONSTRAINT "message_reaction_message_id_user_id_emoji_pk" PRIMARY KEY("message_id","user_id","emoji")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"content" text NOT NULL,
	"channel_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_reply" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"attachment_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(1536),
	"is_bot" boolean DEFAULT false NOT NULL,
	CONSTRAINT "message_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "messages_to_parents" (
	"message_id" integer NOT NULL,
	"parent_id" integer NOT NULL,
	CONSTRAINT "messages_to_parents_message_id_parent_id_pk" PRIMARY KEY("message_id","parent_id")
);
--> statement-breakpoint
CREATE TABLE "saved_message" (
	"message_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	CONSTRAINT "saved_message_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_avatar" (
	"user_id" varchar(255) NOT NULL,
	"image" varchar(2048),
	"name" varchar(255) NOT NULL,
	"video_id" varchar(255),
	"video_prompt" varchar(255),
	"voice_id" varchar(255),
	"voice_prompt" varchar(255),
	"text_prompt" varchar(255),
	CONSTRAINT "user_avatar_user_id_pk" PRIMARY KEY("user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"user_visibility" varchar(255) DEFAULT 'public',
	"user_status" varchar(255) DEFAULT 'active',
	"password" varchar(255),
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"user_name_embedding" vector(1536),
	"last_online" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"image" varchar(2048)
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_member" ADD CONSTRAINT "channel_member_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_member" ADD CONSTRAINT "channel_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user1_id_user_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user2_id_user_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reaction" ADD CONSTRAINT "message_reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_to_parents" ADD CONSTRAINT "messages_to_parents_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_to_parents" ADD CONSTRAINT "messages_to_parents_parent_id_message_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_message" ADD CONSTRAINT "saved_message_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_message" ADD CONSTRAINT "saved_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_avatar" ADD CONSTRAINT "user_avatar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_member_channel_id_idx" ON "channel_member" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "channel_member_user_id_idx" ON "channel_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_created_by_idx" ON "channel" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "channel_name_idx" ON "channel" USING btree ("name");--> statement-breakpoint
CREATE INDEX "conversation_user1_idx" ON "conversation" USING btree ("user1_id");--> statement-breakpoint
CREATE INDEX "conversation_user2_idx" ON "conversation" USING btree ("user2_id");--> statement-breakpoint
CREATE INDEX "attachment_message_id_idx" ON "message_attachment" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "attachment_file_content_embedding_idx" ON "message_attachment" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "message_reaction_message_emoji_idx" ON "message_reaction" USING btree ("message_id","emoji");--> statement-breakpoint
CREATE INDEX "message_channel_id_idx" ON "message" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "message_user_id_idx" ON "message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_content_embedding_idx" ON "message" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_name_embedding_idx" ON "user" USING hnsw ("user_name_embedding" vector_cosine_ops);