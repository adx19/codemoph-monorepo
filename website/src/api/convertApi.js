import apiClient from "./apiClient";

export const convertCode = ({ prompt, fromLang, toLang }) =>
  apiClient.post("/convert", { prompt, fromLang, toLang });
