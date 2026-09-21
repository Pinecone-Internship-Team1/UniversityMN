import { admissionTypeDefs } from "./admission";
import { facultyTypeDefs } from "./faculty";
import { programTypeDefs } from "./program";
import { schemaTypeDefs } from "./schema";
import { universityTypeDefs } from "./university";
import { userTypeDefs } from "./user";

export const typeDefs = [
  schemaTypeDefs,
  universityTypeDefs,
  facultyTypeDefs,
  programTypeDefs,
  admissionTypeDefs,
  userTypeDefs,
];
