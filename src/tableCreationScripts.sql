CREATE TABLE "public"."quizzes" (
  "quiz_id" SERIAL NOT NULL ,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "published" BOOLEAN NOT NULL,
  "createdAt" Date NOT NULL,
  "updatedAt" Date NULL DEFAULT NULL,
  "publishedAt" Date NULL DEFAULT NULL,
  PRIMARY KEY ("quiz_id")
);


CREATE TABLE "public"."questions" (
  "question_id" SERIAL PRIMARY KEY,
  "quiz_id" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes" ("quiz_id") ON DELETE CASCADE
);

CREATE TABLE "public"."options" (
  "option_id" SERIAL PRIMARY KEY,
  "question_id" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  FOREIGN KEY ("question_id") REFERENCES "public"."questions" ("question_id") ON DELETE CASCADE
)