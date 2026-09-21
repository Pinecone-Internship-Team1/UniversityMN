import { gql } from "@apollo/client";

// ---- University ----

export const LIST_UNIVERSITIES = gql`
  query AdminListUniversities {
    universities {
      id
      name
      shortName
      type
      location
      isActive
    }
  }
`;

export const CREATE_UNIVERSITY = gql`
  mutation AdminCreateUniversity($input: CreateUniversityInput!) {
    createUniversity(input: $input) {
      id
    }
  }
`;

export const UPDATE_UNIVERSITY = gql`
  mutation AdminUpdateUniversity($id: ID!, $input: UpdateUniversityInput!) {
    updateUniversity(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_UNIVERSITY = gql`
  mutation AdminDeleteUniversity($id: ID!) {
    deleteUniversity(id: $id)
  }
`;

// ---- Faculty ----

export const LIST_FACULTIES = gql`
  query AdminListFaculties {
    faculties {
      id
      name
      description
      universityId
      university {
        id
        name
      }
    }
  }
`;

export const CREATE_FACULTY = gql`
  mutation AdminCreateFaculty($input: CreateFacultyInput!) {
    createFaculty(input: $input) {
      id
    }
  }
`;

export const UPDATE_FACULTY = gql`
  mutation AdminUpdateFaculty($id: ID!, $input: UpdateFacultyInput!) {
    updateFaculty(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_FACULTY = gql`
  mutation AdminDeleteFaculty($id: ID!) {
    deleteFaculty(id: $id)
  }
`;

// ---- Program ----

export const LIST_PROGRAMS = gql`
  query AdminListPrograms {
    programs {
      id
      name
      degree
      duration
      language
      isActive
      universityId
      facultyId
      university {
        id
        name
      }
      faculty {
        id
        name
      }
    }
  }
`;

export const CREATE_PROGRAM = gql`
  mutation AdminCreateProgram($input: CreateProgramInput!) {
    createProgram(input: $input) {
      id
    }
  }
`;

export const UPDATE_PROGRAM = gql`
  mutation AdminUpdateProgram($id: ID!, $input: UpdateProgramInput!) {
    updateProgram(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_PROGRAM = gql`
  mutation AdminDeleteProgram($id: ID!) {
    deleteProgram(id: $id)
  }
`;

// ---- AdmissionRequirement ----

export const LIST_ADMISSION_REQUIREMENTS = gql`
  query AdminListAdmissionRequirements {
    admissionRequirements {
      id
      programId
      academicYear
      minimumScore
      description
      program {
        id
        name
      }
      subjects {
        id
        name
      }
    }
  }
`;

export const CREATE_ADMISSION_REQUIREMENT = gql`
  mutation AdminCreateAdmissionRequirement($input: CreateAdmissionRequirementInput!) {
    createAdmissionRequirement(input: $input) {
      id
    }
  }
`;

export const UPDATE_ADMISSION_REQUIREMENT = gql`
  mutation AdminUpdateAdmissionRequirement($id: ID!, $input: UpdateAdmissionRequirementInput!) {
    updateAdmissionRequirement(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_ADMISSION_REQUIREMENT = gql`
  mutation AdminDeleteAdmissionRequirement($id: ID!) {
    deleteAdmissionRequirement(id: $id)
  }
`;

// ---- Subject ----

export const LIST_SUBJECTS = gql`
  query AdminListSubjects {
    subjects {
      id
      name
    }
  }
`;

export const CREATE_SUBJECT = gql`
  mutation AdminCreateSubject($input: CreateSubjectInput!) {
    createSubject(input: $input) {
      id
    }
  }
`;

export const UPDATE_SUBJECT = gql`
  mutation AdminUpdateSubject($id: ID!, $input: UpdateSubjectInput!) {
    updateSubject(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_SUBJECT = gql`
  mutation AdminDeleteSubject($id: ID!) {
    deleteSubject(id: $id)
  }
`;
