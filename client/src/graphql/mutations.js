import { gql } from '@apollo/client';

export const CREATE_RELEASE = gql`
  mutation CreateRelease($input: CreateReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      date
      status
      additionalInfo
      completedSteps
    }
  }
`;

export const UPDATE_RELEASE = gql`
  mutation UpdateRelease($id: ID!, $input: UpdateReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      id
      name
      date
      status
      additionalInfo
      completedSteps
    }
  }
`;

export const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

export const TOGGLE_STEP = gql`
  mutation ToggleStep($id: ID!, $stepIndex: Int!) {
    toggleStep(id: $id, stepIndex: $stepIndex) {
      id
      completedSteps
      status
    }
  }
`;
