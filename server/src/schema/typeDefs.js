export const typeDefs = `#graphql
  """
  Represents a software release with its checklist steps
  """
  type Release {
    id: ID!
    name: String!
    date: String!
    status: ReleaseStatus!
    additionalInfo: String
    completedSteps: [Int!]!
    createdAt: String!
    updatedAt: String!
  }

  """
  Auto-computed status based on step completion
  """
  enum ReleaseStatus {
    PLANNED
    ONGOING
    DONE
  }

  type Query {
    """Fetch all releases, ordered by date descending"""
    releases: [Release!]!
    """Fetch a single release by ID"""
    release(id: ID!): Release
  }

  type Mutation {
    """Create a new release"""
    createRelease(input: CreateReleaseInput!): Release!
    """Update an existing release"""
    updateRelease(id: ID!, input: UpdateReleaseInput!): Release!
    """Delete a release by ID"""
    deleteRelease(id: ID!): Boolean!
    """Toggle a step on/off for a release"""
    toggleStep(id: ID!, stepIndex: Int!): Release!
  }

  input CreateReleaseInput {
    name: String!
    date: String!
    additionalInfo: String
    completedSteps: [Int!]
  }

  input UpdateReleaseInput {
    name: String
    date: String
    additionalInfo: String
    completedSteps: [Int!]
  }
`;
