import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from '../src/schema/typeDefs.js';
import { resolvers } from '../src/resolvers/releaseResolvers.js';

const prisma = new PrismaClient();

let server;

beforeAll(async () => {
  server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
});

afterAll(async () => {
  await server.stop();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.release.deleteMany({});
});

describe('Release GraphQL API', () => {
  describe('Query: releases', () => {
    it('should return an empty list when no releases exist', async () => {
      const response = await server.executeOperation(
        {
          query: `query { releases { id name status } }`,
        },
        { contextValue: { prisma } }
      );

      expect(response.body.kind).toBe('single');
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data.releases).toEqual([]);
    });

    it('should return all releases ordered by date descending', async () => {
      await prisma.release.create({
        data: { name: 'Old Release', date: new Date('2024-01-01'), completedSteps: [] },
      });
      await prisma.release.create({
        data: { name: 'New Release', date: new Date('2024-06-01'), completedSteps: [] },
      });

      const response = await server.executeOperation(
        {
          query: `query { releases { name date status } }`,
        },
        { contextValue: { prisma } }
      );

      const releases = response.body.singleResult.data.releases;
      expect(releases).toHaveLength(2);
      expect(releases[0].name).toBe('New Release');
      expect(releases[1].name).toBe('Old Release');
    });
  });

  describe('Mutation: createRelease', () => {
    it('should create a new release with PLANNED status', async () => {
      const response = await server.executeOperation(
        {
          query: `
            mutation CreateRelease($input: CreateReleaseInput!) {
              createRelease(input: $input) {
                id
                name
                status
                completedSteps
              }
            }
          `,
          variables: {
            input: {
              name: 'Version 1.0.0',
              date: '2024-10-01',
              additionalInfo: 'First release',
            },
          },
        },
        { contextValue: { prisma } }
      );

      const release = response.body.singleResult.data.createRelease;
      expect(release.name).toBe('Version 1.0.0');
      expect(release.status).toBe('PLANNED');
      expect(release.completedSteps).toEqual([]);
      expect(release.id).toBeDefined();
    });

    it('should reject a release without a name', async () => {
      const response = await server.executeOperation(
        {
          query: `
            mutation CreateRelease($input: CreateReleaseInput!) {
              createRelease(input: $input) { id }
            }
          `,
          variables: {
            input: { name: '', date: '2024-10-01' },
          },
        },
        { contextValue: { prisma } }
      );

      expect(response.body.singleResult.errors).toBeDefined();
      expect(response.body.singleResult.errors[0].message).toContain('Release name is required');
    });
  });

  describe('Mutation: toggleStep', () => {
    it('should toggle a step on and compute ONGOING status', async () => {
      const created = await prisma.release.create({
        data: { name: 'Test Release', date: new Date('2024-10-01'), completedSteps: [] },
      });

      const response = await server.executeOperation(
        {
          query: `
            mutation ToggleStep($id: ID!, $stepIndex: Int!) {
              toggleStep(id: $id, stepIndex: $stepIndex) {
                completedSteps
                status
              }
            }
          `,
          variables: { id: created.id, stepIndex: 0 },
        },
        { contextValue: { prisma } }
      );

      const release = response.body.singleResult.data.toggleStep;
      expect(release.completedSteps).toContain(0);
      expect(release.status).toBe('ONGOING');
    });

    it('should toggle a step off when already completed', async () => {
      const created = await prisma.release.create({
        data: { name: 'Test Release', date: new Date('2024-10-01'), completedSteps: [0, 1] },
      });

      const response = await server.executeOperation(
        {
          query: `
            mutation ToggleStep($id: ID!, $stepIndex: Int!) {
              toggleStep(id: $id, stepIndex: $stepIndex) {
                completedSteps
                status
              }
            }
          `,
          variables: { id: created.id, stepIndex: 0 },
        },
        { contextValue: { prisma } }
      );

      const release = response.body.singleResult.data.toggleStep;
      expect(release.completedSteps).not.toContain(0);
      expect(release.completedSteps).toContain(1);
    });

    it('should compute DONE status when all steps completed', async () => {
      const created = await prisma.release.create({
        data: {
          name: 'Test Release',
          date: new Date('2024-10-01'),
          completedSteps: [0, 1, 2, 3, 4, 5], // 6 of 7
        },
      });

      const response = await server.executeOperation(
        {
          query: `
            mutation ToggleStep($id: ID!, $stepIndex: Int!) {
              toggleStep(id: $id, stepIndex: $stepIndex) {
                completedSteps
                status
              }
            }
          `,
          variables: { id: created.id, stepIndex: 6 }, // Complete last step
        },
        { contextValue: { prisma } }
      );

      const release = response.body.singleResult.data.toggleStep;
      expect(release.status).toBe('DONE');
    });
  });

  describe('Mutation: deleteRelease', () => {
    it('should delete an existing release', async () => {
      const created = await prisma.release.create({
        data: { name: 'To Delete', date: new Date('2024-10-01'), completedSteps: [] },
      });

      const response = await server.executeOperation(
        {
          query: `
            mutation DeleteRelease($id: ID!) {
              deleteRelease(id: $id)
            }
          `,
          variables: { id: created.id },
        },
        { contextValue: { prisma } }
      );

      expect(response.body.singleResult.data.deleteRelease).toBe(true);

      // Verify it's actually deleted
      const found = await prisma.release.findUnique({ where: { id: created.id } });
      expect(found).toBeNull();
    });
  });

  describe('Mutation: updateRelease', () => {
    it('should update release additional info', async () => {
      const created = await prisma.release.create({
        data: { name: 'Update Test', date: new Date('2024-10-01'), completedSteps: [] },
      });

      const response = await server.executeOperation(
        {
          query: `
            mutation UpdateRelease($id: ID!, $input: UpdateReleaseInput!) {
              updateRelease(id: $id, input: $input) {
                name
                additionalInfo
              }
            }
          `,
          variables: {
            id: created.id,
            input: { additionalInfo: 'Updated notes' },
          },
        },
        { contextValue: { prisma } }
      );

      const release = response.body.singleResult.data.updateRelease;
      expect(release.additionalInfo).toBe('Updated notes');
      expect(release.name).toBe('Update Test');
    });
  });
});
