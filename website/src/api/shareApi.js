import api from "./apiClient";

export const shareCredits = (sharedUserId) =>
  api.post("/share", { sharedUserId });

export const getReceivedShares = () =>
  api.get("/share/recived");

export const getPostedShares = () =>
  api.get("/share/posted");
  