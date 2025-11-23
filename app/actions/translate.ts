'use server'

import { LingoDotDevEngine } from "lingo.dev/sdk";

const lingoDotDev = new LingoDotDevEngine({
  apiKey: process.env.LINGODOTDEV_API_KEY!,
});

export async function translateText(
  text: string,
  targetLocale: string = "en"
) {
  try {
    const result = await lingoDotDev.localizeText(text, {
      sourceLocale: "en",
      targetLocale,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Translation error:", error);
    return { success: false, error: "Failed to translate text" };
  }
}
