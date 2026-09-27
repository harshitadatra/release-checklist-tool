import { TOTAL_STEPS } from '../constants/steps.js';

/**
 * Compute release status from completedSteps array.
 * - No steps completed → PLANNED
 * - All steps completed → DONE
 * - Otherwise → ONGOING
 */
function computeStatus(completedSteps) {
  const completed = completedSteps.length;
  if (completed === 0) return 'PLANNED';
  if (completed >= TOTAL_STEPS) return 'DONE';
  return 'ONGOING';
}

export const resolvers = {
  // Field-level resolver for computed status
  Release: {
    status: (parent) => computeStatus(parent.completedSteps),
    date: (parent) => parent.date.toISOString(),
    createdAt: (parent) => parent.createdAt.toISOString(),
    updatedAt: (parent) => parent.updatedAt.toISOString(),
  },

  Query: {
    releases: async (_, __, { prisma }) => {
      return prisma.release.findMany({
        orderBy: { date: 'desc' },
      });
    },

    release: async (_, { id }, { prisma }) => {
      return prisma.release.findUnique({
        where: { id },
      });
    },
  },

  Mutation: {
    createRelease: async (_, { input }, { prisma }) => {
      const { name, date, additionalInfo, completedSteps } = input;

      if (!name || !name.trim()) {
        throw new Error('Release name is required');
      }
      if (!date) {
        throw new Error('Release date is required');
      }

      const validSteps = Array.isArray(completedSteps)
        ? [...new Set(completedSteps.filter((s) => s >= 0 && s < TOTAL_STEPS))]
        : [];

      return prisma.release.create({
        data: {
          name: name.trim(),
          date: new Date(date),
          additionalInfo: additionalInfo || null,
          completedSteps: validSteps,
        },
      });
    },

    updateRelease: async (_, { id, input }, { prisma }) => {
      const existing = await prisma.release.findUnique({ where: { id } });
      if (!existing) {
        throw new Error(`Release with id ${id} not found`);
      }

      const data = {};
      if (input.name !== undefined) data.name = input.name.trim();
      if (input.date !== undefined) data.date = new Date(input.date);
      if (input.additionalInfo !== undefined) data.additionalInfo = input.additionalInfo;
      if (input.completedSteps !== undefined) {
        // Validate step indices
        const validSteps = input.completedSteps.filter(
          (s) => s >= 0 && s < TOTAL_STEPS
        );
        data.completedSteps = [...new Set(validSteps)]; // Deduplicate
      }

      return prisma.release.update({
        where: { id },
        data,
      });
    },

    deleteRelease: async (_, { id }, { prisma }) => {
      const existing = await prisma.release.findUnique({ where: { id } });
      if (!existing) {
        throw new Error(`Release with id ${id} not found`);
      }

      await prisma.release.delete({ where: { id } });
      return true;
    },

    toggleStep: async (_, { id, stepIndex }, { prisma }) => {
      if (stepIndex < 0 || stepIndex >= TOTAL_STEPS) {
        throw new Error(`Invalid step index: ${stepIndex}. Must be between 0 and ${TOTAL_STEPS - 1}`);
      }

      const release = await prisma.release.findUnique({ where: { id } });
      if (!release) {
        throw new Error(`Release with id ${id} not found`);
      }

      let completedSteps;
      if (release.completedSteps.includes(stepIndex)) {
        // Remove the step (uncheck)
        completedSteps = release.completedSteps.filter((s) => s !== stepIndex);
      } else {
        // Add the step (check)
        completedSteps = [...release.completedSteps, stepIndex];
      }

      return prisma.release.update({
        where: { id },
        data: { completedSteps },
      });
    },
  },
};
