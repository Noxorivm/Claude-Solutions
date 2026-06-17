CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."lesson_type" AS ENUM('article', 'video', 'practice', 'quiz', 'milestone');--> statement-breakpoint
CREATE TYPE "public"."resource_kind" AS ENUM('pdf', 'image', 'link', 'file');--> statement-breakpoint
CREATE TYPE "public"."technique_category" AS ENUM('cards', 'coins', 'mentalism', 'classics', 'stage', 'theory');--> statement-breakpoint
CREATE TYPE "public"."video_provider" AS ENUM('youtube', 'vimeo', 'file');--> statement-breakpoint
CREATE TYPE "public"."xp_reason" AS ENUM('lesson', 'quiz', 'milestone', 'practice', 'achievement', 'adjust');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('started', 'completed');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level_id" smallint NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description_md" text,
	"cover_url" text,
	"order_in_level" integer NOT NULL,
	"est_hours" numeric(4, 1),
	"is_required" boolean DEFAULT true NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "courses_level_order_unique" UNIQUE("level_id","order_in_level")
);
--> statement-breakpoint
CREATE TABLE "lesson_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"text" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"kind" "resource_kind" NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_techniques" (
	"lesson_id" uuid NOT NULL,
	"technique_id" uuid NOT NULL,
	CONSTRAINT "lesson_techniques_pk" PRIMARY KEY("lesson_id","technique_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" "lesson_type" NOT NULL,
	"content_md" text,
	"video_url" text,
	"video_provider" "video_provider",
	"duration_min" integer,
	"order" integer NOT NULL,
	"xp_override" integer,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_slug_unique" UNIQUE("slug"),
	CONSTRAINT "lessons_module_order_unique" UNIQUE("module_id","order")
);
--> statement-breakpoint
CREATE TABLE "levels" (
	"id" smallint PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"description_md" text,
	CONSTRAINT "levels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "modules_course_order_unique" UNIQUE("course_id","order")
);
--> statement-breakpoint
CREATE TABLE "quiz_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"prompt" text NOT NULL,
	"explanation" text,
	"kind" text DEFAULT 'single' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"pass_pct" integer DEFAULT 80 NOT NULL,
	CONSTRAINT "quizzes_lesson_id_unique" UNIQUE("lesson_id")
);
--> statement-breakpoint
CREATE TABLE "techniques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "technique_category" NOT NULL,
	"level_number" smallint NOT NULL,
	"description_md" text,
	CONSTRAINT "techniques_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uploads_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text,
	"criteria" jsonb NOT NULL,
	CONSTRAINT "achievements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "activity_days" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"practice_sec" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "activity_days_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" text NOT NULL,
	"achievement_id" uuid NOT NULL,
	"earned_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_achievements_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" "xp_reason" NOT NULL,
	"lesson_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"technique_id" uuid,
	"lesson_id" uuid,
	"duration_sec" integer NOT NULL,
	"self_rating" smallint,
	"notes" text,
	"performed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "practice_sessions_duration_check" CHECK ("practice_sessions"."duration_sec" >= 60),
	CONSTRAINT "practice_sessions_self_rating_check" CHECK ("practice_sessions"."self_rating" between 1 and 5),
	CONSTRAINT "practice_sessions_target_check" CHECK ("practice_sessions"."technique_id" is not null or "practice_sessions"."lesson_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "user_techniques" (
	"user_id" text NOT NULL,
	"technique_id" uuid NOT NULL,
	"mastery" smallint DEFAULT 0 NOT NULL,
	"last_practiced_at" timestamp with time zone,
	"next_review_at" timestamp with time zone,
	"interval_days" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "user_techniques_pk" PRIMARY KEY("user_id","technique_id"),
	CONSTRAINT "user_techniques_mastery_check" CHECK ("user_techniques"."mastery" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "checklist_progress" (
	"user_id" text NOT NULL,
	"item_id" uuid NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "checklist_progress_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "progress_status" DEFAULT 'started' NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "lesson_progress_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "milestone_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"ratings" jsonb NOT NULL,
	"reflection" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"user_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"content_md" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" uuid NOT NULL,
	"score_pct" integer NOT NULL,
	"passed" boolean NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_checklist_items" ADD CONSTRAINT "lesson_checklist_items_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_techniques" ADD CONSTRAINT "lesson_techniques_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_techniques" ADD CONSTRAINT "lesson_techniques_technique_id_techniques_id_fk" FOREIGN KEY ("technique_id") REFERENCES "public"."techniques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "techniques" ADD CONSTRAINT "techniques_level_number_levels_id_fk" FOREIGN KEY ("level_number") REFERENCES "public"."levels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_days" ADD CONSTRAINT "activity_days_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_technique_id_techniques_id_fk" FOREIGN KEY ("technique_id") REFERENCES "public"."techniques"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_techniques" ADD CONSTRAINT "user_techniques_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_techniques" ADD CONSTRAINT "user_techniques_technique_id_techniques_id_fk" FOREIGN KEY ("technique_id") REFERENCES "public"."techniques"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_progress" ADD CONSTRAINT "checklist_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_progress" ADD CONSTRAINT "checklist_progress_item_id_lesson_checklist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."lesson_checklist_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_submissions" ADD CONSTRAINT "milestone_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_submissions" ADD CONSTRAINT "milestone_submissions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "uploads_created_by_idx" ON "uploads" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "xp_events_user_created_idx" ON "xp_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "practice_sessions_user_performed_idx" ON "practice_sessions" USING btree ("user_id","performed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_techniques_user_review_idx" ON "user_techniques" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE INDEX "lesson_progress_user_status_idx" ON "lesson_progress" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_quiz_idx" ON "quiz_attempts" USING btree ("user_id","quiz_id");