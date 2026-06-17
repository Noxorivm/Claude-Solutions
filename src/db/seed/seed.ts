import "dotenv/config";

import { count, eq, sql } from "drizzle-orm";

import { auth } from "../../lib/auth";
import { client, db } from "../index";
import {
  achievements,
  courses,
  lessonChecklistItems,
  lessons,
  lessonTechniques,
  levels,
  modules,
  quizOptions,
  quizQuestions,
  quizzes,
  techniques,
  user,
} from "../schema";
import {
  achievementsSeed,
  curriculum,
  quizzesSeed,
  techniquesSeed,
} from "./curriculum";

// Idempotencia: upsert por slug/id donde hay clave natural; los hijos sin
// clave natural (checklist items, preguntas de quiz) solo se insertan si la
// lección/quiz aún no tiene, para no duplicar ni romper FKs de progreso.
async function main(): Promise<void> {
  await db.transaction(async (tx) => {
    for (const level of curriculum) {
      await tx
        .insert(levels)
        .values({
          id: level.id,
          slug: level.slug,
          name: level.name,
          tagline: level.tagline,
          descriptionMd: level.descriptionMd,
        })
        .onConflictDoUpdate({
          target: levels.id,
          set: {
            slug: level.slug,
            name: level.name,
            tagline: level.tagline,
            descriptionMd: level.descriptionMd,
          },
        });
    }

    const techniqueIdBySlug = new Map<string, string>();
    for (const technique of techniquesSeed) {
      const [row] = await tx
        .insert(techniques)
        .values({
          slug: technique.slug,
          name: technique.name,
          category: technique.category,
          levelNumber: technique.levelNumber,
        })
        .onConflictDoUpdate({
          target: techniques.slug,
          set: {
            name: technique.name,
            category: technique.category,
            levelNumber: technique.levelNumber,
          },
        })
        .returning({ id: techniques.id });
      techniqueIdBySlug.set(technique.slug, row.id);
    }

    for (const level of curriculum) {
      let orderInLevel = 0;
      for (const course of level.courses) {
        orderInLevel += 1;
        const courseValues = {
          levelId: level.id,
          title: course.title,
          summary: course.summary,
          orderInLevel,
          estHours: course.estHours ?? null,
          isRequired: course.isRequired ?? true,
          status: course.status,
        };
        const [courseRow] = await tx
          .insert(courses)
          .values({ slug: course.slug, ...courseValues })
          .onConflictDoUpdate({ target: courses.slug, set: courseValues })
          .returning({ id: courses.id });

        let moduleOrder = 0;
        for (const mod of course.modules) {
          moduleOrder += 1;
          const [moduleRow] = await tx
            .insert(modules)
            .values({
              courseId: courseRow.id,
              title: mod.title,
              order: moduleOrder,
            })
            .onConflictDoUpdate({
              target: [modules.courseId, modules.order],
              set: { title: mod.title },
            })
            .returning({ id: modules.id });

          // Reordenamiento seguro (EX-N0-T1): aparca los órdenes
          // existentes del módulo fuera del rango final (negándolos)
          // antes de reasignarlos. Evita colisiones transitorias de
          // UNIQUE(module_id, order) al INSERTAR lecciones en medio o
          // MOVER lecciones entre módulos (slug estable; el order final
          // 1..N siempre queda libre). Las lecciones que llegan de otro
          // módulo se reubican por slug en el bucle siguiente.
          await tx
            .update(lessons)
            .set({ order: sql`${lessons.order} * -1` })
            .where(eq(lessons.moduleId, moduleRow.id));

          let lessonOrder = 0;
          for (const lesson of mod.lessons ?? []) {
            lessonOrder += 1;
            const lessonValues = {
              moduleId: moduleRow.id,
              title: lesson.title,
              type: lesson.type,
              durationMin: lesson.durationMin,
              order: lessonOrder,
              // Por lección si se indica (lecciones en borrador dentro de
              // un curso publicado, EX-N0-T1); si no, hereda del curso.
              status: lesson.status ?? course.status,
            };
            const [lessonRow] = await tx
              .insert(lessons)
              .values({
                slug: lesson.slug,
                contentMd: "[REDACTAR]",
                ...lessonValues,
              })
              .onConflictDoUpdate({ target: lessons.slug, set: lessonValues })
              .returning({ id: lessons.id });

            if (lesson.checklist && lesson.checklist.length > 0) {
              const [{ existing }] = await tx
                .select({ existing: count() })
                .from(lessonChecklistItems)
                .where(eq(lessonChecklistItems.lessonId, lessonRow.id));
              if (existing === 0) {
                await tx.insert(lessonChecklistItems).values(
                  lesson.checklist.map((text, index) => ({
                    lessonId: lessonRow.id,
                    text,
                    order: index + 1,
                  })),
                );
              }
            }

            for (const techniqueSlug of lesson.techniques ?? []) {
              const techniqueId = techniqueIdBySlug.get(techniqueSlug);
              if (!techniqueId) {
                throw new Error(
                  `Técnica desconocida "${techniqueSlug}" en la lección ${lesson.slug}`,
                );
              }
              await tx
                .insert(lessonTechniques)
                .values({ lessonId: lessonRow.id, techniqueId })
                .onConflictDoNothing();
            }
          }
        }
      }
    }

    for (const quiz of quizzesSeed) {
      const lessonRows = await tx
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.slug, quiz.lessonSlug));
      const lessonRow = lessonRows[0];
      if (!lessonRow) {
        throw new Error(`Quiz sin lección: ${quiz.lessonSlug}`);
      }
      const existingQuiz = await tx
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.lessonId, lessonRow.id));
      if (existingQuiz.length === 0) {
        const [quizRow] = await tx
          .insert(quizzes)
          .values({ lessonId: lessonRow.id, passPct: quiz.passPct })
          .returning({ id: quizzes.id });
        let questionOrder = 0;
        for (const question of quiz.questions) {
          questionOrder += 1;
          const [questionRow] = await tx
            .insert(quizQuestions)
            .values({
              quizId: quizRow.id,
              order: questionOrder,
              prompt: question.prompt,
              explanation: question.explanation,
              kind: question.kind,
            })
            .returning({ id: quizQuestions.id });
          await tx.insert(quizOptions).values(
            question.options.map((option, index) => ({
              questionId: questionRow.id,
              text: option.text,
              isCorrect: option.isCorrect,
              order: index + 1,
            })),
          );
        }
      }
    }

    for (const achievement of achievementsSeed) {
      await tx
        .insert(achievements)
        .values(achievement)
        .onConflictDoUpdate({
          target: achievements.slug,
          set: {
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            criteria: achievement.criteria,
          },
        });
    }
  });

  // Admin fuera de la transacción: better-auth hace sus propias escrituras
  // (user + account con hash) a través del adapter.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Faltan SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD en el entorno (.env).",
    );
  }
  const existingAdmin = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, adminEmail));
  if (existingAdmin.length === 0) {
    await auth.api.signUpEmail({
      body: { name: "Admin", email: adminEmail, password: adminPassword },
    });
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.email, adminEmail));
    console.log(`Admin creado y promovido: ${adminEmail}`);
  } else {
    console.log(`Admin ya existente, sin cambios: ${adminEmail}`);
  }

  const tables = [
    ["levels", levels],
    ["techniques", techniques],
    ["courses", courses],
    ["modules", modules],
    ["lessons", lessons],
    ["lesson_checklist_items", lessonChecklistItems],
    ["lesson_techniques", lessonTechniques],
    ["quizzes", quizzes],
    ["quiz_questions", quizQuestions],
    ["quiz_options", quizOptions],
    ["achievements", achievements],
    ["user", user],
  ] as const;
  console.log("— Resumen del seed —");
  for (const [name, table] of tables) {
    const [{ total }] = await db.select({ total: count() }).from(table);
    console.log(`${name}: ${total}`);
  }

  await client.end();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(
      "ERROR en el seed:",
      error instanceof Error ? error.message : error,
    );
    await client.end({ timeout: 1 }).catch(() => undefined);
    process.exit(1);
  });
