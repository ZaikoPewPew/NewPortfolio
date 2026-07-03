import { env } from "../../../config/env.config";
import { createDataSource } from "../../_shared/createDataSource";
import { getMockBookReading } from "./book.mock";
import { getApiBookReading } from "./book.api";

export const getBookReading = createDataSource({
  mode: env.book.mode,
  mock: getMockBookReading,
  api: getApiBookReading,
});
