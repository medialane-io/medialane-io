import "server-only";
import {
  uploadJsonToBackend as sdkUploadJson,
  uploadFileToBackend as sdkUploadFile,
  uploadDirectoryToBackend as sdkUploadDirectory,
  getBackendSignedUrl as sdkGetSignedUrl,
  type BackendMetadataConfig,
} from "@medialane/sdk";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export type { BackendUploadResult } from "@medialane/sdk";

const config: BackendMetadataConfig = {
  backendUrl: MEDIALANE_BACKEND_URL,
  apiKey: MEDIALANE_API_KEY,
};

export const uploadJsonToBackend = (json: unknown) => sdkUploadJson(config, json);
export const uploadFileToBackend = (file: File) => sdkUploadFile(config, file);
export const uploadDirectoryToBackend = (files: { name: string; content: unknown }[]) =>
  sdkUploadDirectory(config, files);
export const getBackendSignedUrl = (kind: "image" | "document" | "media" = "image") =>
  sdkGetSignedUrl(config, kind);
