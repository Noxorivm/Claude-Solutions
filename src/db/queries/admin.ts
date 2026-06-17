import { asc, count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  courses,
  lessonChecklistItems,
  lessonResources,
  lessons,
  lessonTechniques,
  modules,
  practiceSessions,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
  techniques,
  user,
  userTechniques,
} from "@/db/schema";

export interface StatusCounts {
  draft: number;
  published: number;
  archived: number;
  total: number;
}

export interface AdminSummary {
  courses: StatusCounts;
  lessons: StatusCounts;
  modules: number;
  techniques: number;
  users: number;
}

function statusCounts(
  rows: Array<{ status: string; total: number }>,
): StatusCounts {
  const get = (status: string) =>
    rows.find((row) => row.status === status)?.total ?? 0;
  const draft = get("draft");
  const published = get("published");
  const archived = get("archived");
  return { draft, published, archived, total: draft + published + archived };
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const courseRows = await db
    .select({ status: courses.status, total: count() })
    .from(courses)
    .groupBy(courses.status);
  const lessonRows = await db
    .select({ status: lessons.status, total: count() })
    .from(lessons)
    .groupBy(lessons.status);
  const [{ total: moduleCount }] = await db
    .select({ total: count() })
    .from(modules);
  const [{ total: techniqueCount }] = await db
    .select({ total: count() })
    .from(techniques);
  const [{ total: userCount }] = await db.select({ total: count() }).from(user);

  return {
    courses: statusCounts(courseRows),
    lessons: statusCounts(lessonRows),
    modules: moduleCount,
    techniques: techniqueCount,
    users: userCount,
  };
}

export interface AdminCourseRow {
  id: string;
  slug: string;
  title: string;
  levelId: number;
  orderInLevel: number;
  status: string;
  moduleCount: number;
  lessonCount: number;
  updatedAt: Date;
}

export async function getAdminCourses(): Promise<AdminCourseRow[]> {
  return db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      levelId: courses.levelId,
      orderInLevel: courses.orderInLevel,
      status: courses.status,
      moduleCount: sql<number>`count(distinct ${modules.id})`.mapWith(Number),
      lessonCount: sql<number>`count(${lessons.id})`.mapWith(Number),
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(modules, eq(modules.courseId, courses.id))
    .leftJoin(lessons, eq(lessons.moduleId, modules.id))
    .groupBy(courses.id)
    .orderBy(asc(courses.levelId), asc(courses.orderInLevel));
}

export interface AdminModuleLessonRow {
  id: string;
  slug: string;
  title: string;
  order: number;
  status: string;
}

export interface AdminModuleRow {
  id: string;
  title: string;
  order: number;
  lessonCount: number;
  lessons: AdminModuleLessonRow[];
}

export interface AdminCourseDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  descriptionMd: string | null;
  levelId: number;
  orderInLevel: number;
  estHours: string | null;
  isRequired: boolean;
  status: "draft" | "published" | "archived";
  modules: AdminModuleRow[];
  totalLessons: number;
}

export async function getAdminCourseDetail(
  slug: string,
): Promise<AdminCourseDetail | null> {
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1);
  const course = rows[0];
  if (!course) {
    return null;
  }

  const [moduleRows, lessonRows] = await Promise.all([
    db
      .select({ id: modules.id, title: modules.title, order: modules.order })
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(asc(modules.order)),
    db
      .select({
        id: lessons.id,
        slug: lessons.slug,
        title: lessons.title,
        order: lessons.order,
        status: lessons.status,
        moduleId: lessons.moduleId,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(modules.courseId, course.id))
      .orderBy(asc(lessons.order)),
  ]);

  const withLessons: AdminModuleRow[] = moduleRows.map((mod) => {
    const own = lessonRows.filter((lesson) => lesson.moduleId === mod.id);
    return {
      ...mod,
      lessonCount: own.length,
      lessons: own.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        order: lesson.order,
        status: lesson.status,
      })),
    };
  });

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    descriptionMd: course.descriptionMd,
    levelId: course.levelId,
    orderInLevel: course.orderInLevel,
    estHours: course.estHours,
    isRequired: course.isRequired,
    status: course.status,
    modules: withLessons,
    totalLessons: lessonRows.length,
  };
}

export interface AdminLessonRow {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  order: number;
  updatedAt: Date;
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
}

export async function getAdminLessons(): Promise<AdminLessonRow[]> {
  return db
    .select({
      id: lessons.id,
      slug: lessons.slug,
      title: lessons.title,
      type: lessons.type,
      status: lessons.status,
      order: lessons.order,
      updatedAt: lessons.updatedAt,
      courseId: courses.id,
      courseTitle: courses.title,
      moduleTitle: modules.title,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .orderBy(
      asc(courses.levelId),
      asc(courses.orderInLevel),
      asc(modules.order),
      asc(lessons.order),
    );
}

export interface ModuleOption {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
}

/** Módulos para el selector agrupado por curso del editor de lecciones. */
export async function getModuleOptions(): Promise<ModuleOption[]> {
  return db
    .select({
      id: modules.id,
      title: modules.title,
      courseId: courses.id,
      courseTitle: courses.title,
    })
    .from(modules)
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .orderBy(
      asc(courses.levelId),
      asc(courses.orderInLevel),
      asc(modules.order),
    );
}

export interface TechniqueOption {
  id: string;
  name: string;
  category: string;
}

export async function getTechniqueOptions(): Promise<TechniqueOption[]> {
  return db
    .select({
      id: techniques.id,
      name: techniques.name,
      category: techniques.category,
    })
    .from(techniques)
    .orderBy(asc(techniques.category), asc(techniques.name));
}

export interface AdminChecklistItem {
  id: string;
  text: string;
  order: number;
}

export interface AdminResource {
  id: string;
  kind: string;
  title: string;
  url: string;
  order: number;
}

export interface AdminLessonDetail {
  id: string;
  slug: string;
  title: string;
  type: "article" | "video" | "practice" | "quiz" | "milestone";
  contentMd: string | null;
  videoUrl: string | null;
  videoProvider: string | null;
  durationMin: number | null;
  xpOverride: number | null;
  status: "draft" | "published" | "archived";
  moduleId: string;
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  checklistItems: AdminChecklistItem[];
  resources: AdminResource[];
  techniqueIds: string[];
}

export async function getAdminLessonDetail(
  slug: string,
): Promise<AdminLessonDetail | null> {
  const rows = await db
    .select({
      lesson: lessons,
      courseSlug: courses.slug,
      courseTitle: courses.title,
      moduleTitle: modules.title,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(lessons.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }

  const [checklistRows, resourceRows, techniqueRows] = await Promise.all([
    db
      .select({
        id: lessonChecklistItems.id,
        text: lessonChecklistItems.text,
        order: lessonChecklistItems.order,
      })
      .from(lessonChecklistItems)
      .where(eq(lessonChecklistItems.lessonId, row.lesson.id))
      .orderBy(asc(lessonChecklistItems.order)),
    db
      .select({
        id: lessonResources.id,
        kind: lessonResources.kind,
        title: lessonResources.title,
        url: lessonResources.url,
        order: lessonResources.order,
      })
      .from(lessonResources)
      .where(eq(lessonResources.lessonId, row.lesson.id))
      .orderBy(asc(lessonResources.order)),
    db
      .select({ techniqueId: lessonTechniques.techniqueId })
      .from(lessonTechniques)
      .where(eq(lessonTechniques.lessonId, row.lesson.id)),
  ]);

  return {
    id: row.lesson.id,
    slug: row.lesson.slug,
    title: row.lesson.title,
    type: row.lesson.type,
    contentMd: row.lesson.contentMd,
    videoUrl: row.lesson.videoUrl,
    videoProvider: row.lesson.videoProvider,
    durationMin: row.lesson.durationMin,
    xpOverride: row.lesson.xpOverride,
    status: row.lesson.status,
    moduleId: row.lesson.moduleId,
    courseSlug: row.courseSlug,
    courseTitle: row.courseTitle,
    moduleTitle: row.moduleTitle,
    checklistItems: checklistRows,
    resources: resourceRows,
    techniqueIds: techniqueRows.map((r) => r.techniqueId),
  };
}

export interface AdminTechniqueRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  levelNumber: number;
  lessonCount: number;
}

export async function getAdminTechniques(): Promise<AdminTechniqueRow[]> {
  return db
    .select({
      id: techniques.id,
      slug: techniques.slug,
      name: techniques.name,
      category: techniques.category,
      levelNumber: techniques.levelNumber,
      lessonCount: sql<number>`count(${lessonTechniques.lessonId})`.mapWith(
        Number,
      ),
    })
    .from(techniques)
    .leftJoin(lessonTechniques, eq(lessonTechniques.techniqueId, techniques.id))
    .groupBy(techniques.id)
    .orderBy(asc(techniques.category), asc(techniques.name));
}

export interface AdminTechniqueDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  levelNumber: number;
  descriptionMd: string | null;
  lessonLinks: number;
  practiceCount: number;
  masteryCount: number;
}

export async function getAdminTechniqueDetail(
  slug: string,
): Promise<AdminTechniqueDetail | null> {
  const rows = await db
    .select()
    .from(techniques)
    .where(eq(techniques.slug, slug))
    .limit(1);
  const technique = rows[0];
  if (!technique) {
    return null;
  }

  const [[lessonLinks], [practiceCount], [masteryCount]] = await Promise.all([
    db
      .select({ total: count() })
      .from(lessonTechniques)
      .where(eq(lessonTechniques.techniqueId, technique.id)),
    db
      .select({ total: count() })
      .from(practiceSessions)
      .where(eq(practiceSessions.techniqueId, technique.id)),
    db
      .select({ total: count() })
      .from(userTechniques)
      .where(eq(userTechniques.techniqueId, technique.id)),
  ]);

  return {
    id: technique.id,
    slug: technique.slug,
    name: technique.name,
    category: technique.category,
    levelNumber: technique.levelNumber,
    descriptionMd: technique.descriptionMd,
    lessonLinks: lessonLinks.total,
    practiceCount: practiceCount.total,
    masteryCount: masteryCount.total,
  };
}

export interface AdminQuizLessonRow {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonStatus: string;
  courseTitle: string;
  moduleTitle: string;
  quizId: string | null;
  passPct: number | null;
  questionCount: number;
  attemptCount: number;
}

export async function getAdminQuizLessons(): Promise<AdminQuizLessonRow[]> {
  return db
    .select({
      lessonId: lessons.id,
      lessonSlug: lessons.slug,
      lessonTitle: lessons.title,
      lessonStatus: lessons.status,
      courseTitle: courses.title,
      moduleTitle: modules.title,
      quizId: quizzes.id,
      passPct: quizzes.passPct,
      questionCount: sql<number>`count(distinct ${quizQuestions.id})`.mapWith(
        Number,
      ),
      attemptCount: sql<number>`count(distinct ${quizAttempts.id})`.mapWith(
        Number,
      ),
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .leftJoin(quizzes, eq(quizzes.lessonId, lessons.id))
    .leftJoin(quizQuestions, eq(quizQuestions.quizId, quizzes.id))
    .leftJoin(quizAttempts, eq(quizAttempts.quizId, quizzes.id))
    .where(eq(lessons.type, "quiz"))
    .groupBy(lessons.id, courses.id, modules.id, quizzes.id)
    .orderBy(
      asc(courses.levelId),
      asc(courses.orderInLevel),
      asc(modules.order),
      asc(lessons.order),
    );
}

export interface AdminQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface AdminQuizQuestion {
  id: string;
  order: number;
  prompt: string;
  kind: string;
  explanation: string | null;
  options: AdminQuizOption[];
}

export interface AdminQuizEditor {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  courseTitle: string;
  moduleTitle: string;
  quiz: { id: string; passPct: number } | null;
  questions: AdminQuizQuestion[];
  attemptCount: number;
}

export async function getAdminQuizEditor(
  lessonSlug: string,
): Promise<AdminQuizEditor | null> {
  const rows = await db
    .select({
      lessonId: lessons.id,
      lessonSlug: lessons.slug,
      lessonTitle: lessons.title,
      lessonType: lessons.type,
      courseTitle: courses.title,
      moduleTitle: modules.title,
      quizId: quizzes.id,
      passPct: quizzes.passPct,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .leftJoin(quizzes, eq(quizzes.lessonId, lessons.id))
    .where(eq(lessons.slug, lessonSlug))
    .limit(1);
  const row = rows[0];
  if (!row || row.lessonType !== "quiz") {
    return null;
  }

  let questions: AdminQuizQuestion[] = [];
  let attemptCount = 0;
  if (row.quizId) {
    const [questionRows, optionRows, [attempts]] = await Promise.all([
      db
        .select({
          id: quizQuestions.id,
          order: quizQuestions.order,
          prompt: quizQuestions.prompt,
          kind: quizQuestions.kind,
          explanation: quizQuestions.explanation,
        })
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, row.quizId))
        .orderBy(asc(quizQuestions.order)),
      db
        .select({
          id: quizOptions.id,
          questionId: quizOptions.questionId,
          text: quizOptions.text,
          isCorrect: quizOptions.isCorrect,
          order: quizOptions.order,
        })
        .from(quizOptions)
        .innerJoin(quizQuestions, eq(quizOptions.questionId, quizQuestions.id))
        .where(eq(quizQuestions.quizId, row.quizId))
        .orderBy(asc(quizOptions.order)),
      db
        .select({ total: count() })
        .from(quizAttempts)
        .where(eq(quizAttempts.quizId, row.quizId)),
    ]);
    attemptCount = attempts.total;
    questions = questionRows.map((question) => ({
      ...question,
      options: optionRows
        .filter((option) => option.questionId === question.id)
        .map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
          order: option.order,
        })),
    }));
  }

  return {
    lessonId: row.lessonId,
    lessonSlug: row.lessonSlug,
    lessonTitle: row.lessonTitle,
    courseTitle: row.courseTitle,
    moduleTitle: row.moduleTitle,
    quiz: row.quizId ? { id: row.quizId, passPct: row.passPct ?? 80 } : null,
    questions,
    attemptCount,
  };
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  xp: number;
  createdAt: Date;
  disabled: boolean;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      xp: user.xp,
      createdAt: user.createdAt,
      disabled: user.disabled,
    })
    .from(user)
    .orderBy(asc(user.createdAt));
}
