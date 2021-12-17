import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { firebase } from "../clients";
import { BUCKET_BASE_PATH } from "../utils";
import { Sentry } from "../middleware";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");

    return res;
  }

  const { name = "" } = req.query;

  if (!name) {
    res.setHeader("Content-Type", "application/json");
    res.status(400).json("Bad Request");

    return res;
  }

  // TOOD: Add API key authentication.

  try {
    const app = (name as string).replace("/", "-");
    const bucket = `${BUCKET_BASE_PATH}/${app}`;

    const storage = getStorage(firebase);
    const appRef = ref(storage, `${bucket}/${app}.zip`);
    const appConfigRef = ref(storage, `${bucket}/mf-config.ts`);
    const downloadUrl = await getDownloadURL(appRef);
    const appConfigDownloadUrl = await getDownloadURL(appConfigRef);

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ downloadUrl, appConfigDownloadUrl });

    return res;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
};
