// List of tools available to the assistant
// No need to include the top-level wrapper object as it is added in lib/tools/tools.ts
// More information on function calling: https://platform.openai.com/docs/guides/function-calling

export const toolsList = [
  {
    name: "get_weather",
    description: "Get the weather for a given location",
    parameters: {
      location: {
        type: "string",
        description: "Location to get weather for",
      },
      unit: {
        type: "string",
        description: "Unit to get weather in",
        enum: ["celsius", "fahrenheit"],
      },
    },
  },
  {
    name: "get_joke",
    description: "Get a programming joke",
    parameters: {},
  },
  {
    name: "generate_image",
    description:
      "Generate an image from a text prompt. Returns a data URL you can embed in markdown.",
    parameters: {
      prompt: {
        type: "string",
        description: "Text prompt describing the image to generate",
      },
    },
  },
  {
    name: "generate_images",
    description:
      "Generate 6 images from a text prompt. Returns URLs you can embed in markdown.",
    parameters: {
      prompt: {
        type: "string",
        description: "Text prompt describing the images to generate",
      },
      imageDataUrl: {
        type: "string",
        description:
          "Optional base64 data URL of an input photo to reimagine into the prompt (data:image/*;base64,...)" ,
      },
    },
  },
  {
    name: "send_email",
    description:
      "Send an email. Defaults to dry_run=true (preview only) unless explicitly set to false.",
    required: ["to", "subject", "text"],
    strict: false,
    parameters: {
      to: {
        type: "string",
        description: "Recipient email address",
      },
      subject: {
        type: "string",
        description: "Email subject line",
      },
      text: {
        type: "string",
        description: "Plaintext email body",
      },
      html: {
        type: "string",
        description: "Optional HTML email body",
      },
      dry_run: {
        type: "boolean",
        description:
          "If true, do not send; return a preview payload. Set false only when user explicitly approves sending.",
      },
    },
  },
  {
    name: "local_list_dir",
    description: "List directory entries on the local development machine (dev mode only).",
    parameters: {
      path: {
        type: "string",
        description: "Path relative to the workspace root. Use '/' for the root.",
      },
    },
  },
  {
    name: "local_read_file",
    description: "Read a text file on the local development machine (dev mode only).",
    parameters: {
      path: {
        type: "string",
        description: "Path to the file relative to the workspace root.",
      },
    },
  },
  {
    name: "local_write_file",
    description: "Write a text file on the local development machine (dev mode only).",
    parameters: {
      path: {
        type: "string",
        description: "Path to the file relative to the workspace root.",
      },
      content: {
        type: "string",
        description: "Full file contents to write.",
      },
    },
  },
  {
    name: "local_run_command",
    description: "Run an allowlisted shell command on the local development machine (dev mode only).",
    parameters: {
      command: {
        type: "string",
        description: "Command to run, e.g. 'ls -la'. Only allowlisted binaries will run.",
      },
      cwd: {
        type: "string",
        description: "Working directory relative to workspace root. Use '/' for root.",
      },
    },
  },
];
