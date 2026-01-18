// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

import useToolsStore from "@/stores/useToolsStore";

export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());

  return res;
};

export const get_joke = async () => {
  const res = await fetch(`/api/functions/get_joke`).then((res) => res.json());
  return res;
};

export const generate_image = async ({
  prompt,
}: {
  prompt: string;
}) => {
  const { geminiImageEnabled } = useToolsStore.getState();
  const res = await fetch(`/api/functions/generate_image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      provider: geminiImageEnabled ? "gemini" : "openai",
    }),
  }).then((res) => res.json());
  return res;
};

export const functionsMap = {
  get_weather: get_weather,
  get_joke: get_joke,
  generate_image: generate_image,
};
