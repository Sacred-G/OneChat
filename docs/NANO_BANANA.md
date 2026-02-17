# Nano Banana Studio

Nano Banana is Gemini's native image generation capability, now available as a dedicated UI in OneChat.

## Features

### Two Models Available

1. **Nano Banana (Gemini 2.5 Flash Image)**
   - Optimized for speed and efficiency
   - 1024px resolution (1K)
   - Perfect for high-volume, low-latency tasks

2. **Nano Banana Pro (Gemini 3 Pro Image Preview)**
   - Professional asset production
   - Up to 4K resolution (1K, 2K, 4K)
   - Advanced reasoning ("Thinking" process)
   - High-fidelity text rendering
   - Search grounding capabilities

### Capabilities

- **Text-to-Image Generation**: Create images from detailed text prompts
- **Reference Image Upload**: Use uploaded images as style references
- **Multiple Aspect Ratios**: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- **Batch Generation**: Generate 1-4 images per request
- **High-Quality Output**: All images include SynthID watermark
- **Prompt Enhancement**: AI-powered prompt enhancer with style presets and professional enhancement options

## How to Access

1. Navigate to the OneChat application
2. Click the Images icon (📷) in the top navigation bar
3. Select "Nano Banana" from the available options
4. Or go directly to `/nano-banana` in your browser

## Usage Guide

### Advanced Prompt Enhancement

The Nano Banana Studio includes a powerful **Prompt Enhancer** tool that helps you create more detailed and effective prompts:

#### Features:
- **Style Presets**: Quick templates for photorealistic, artistic, commercial, fantasy, architectural, and nature photography
- **Detail Enhancements**: Add quality descriptors like "highly detailed", "ultra realistic", "8k resolution"
- **Composition Options**: Choose from rule of thirds, dramatic angles, close-up shots, and more
- **Lighting Effects**: Add professional lighting descriptions like golden hour, cinematic lighting, studio lighting
- **Custom Enhancements**: Add your own specific keywords and descriptions

#### How to Use:
1. Write your basic prompt in the text area
2. Click the "Enhance Prompt" button
3. Select a style preset (optional)
4. Choose enhancement categories that fit your vision
5. Add custom keywords if needed
6. Click "Enhance Prompt" to apply all enhancements

The enhancer intelligently combines your original prompt with selected enhancements to create a comprehensive, professional-grade prompt that yields better results.

### Basic Image Generation

1. **Select Model**: Choose between Nano Banana or Nano Banana Pro
2. **Set Parameters**:
   - Number of images (1-4)
   - Image size (1K, 2K, 4K - depending on model)
   - Aspect ratio
3. **Write Prompt**: Describe what you want to generate
4. **Optional**: Upload a reference image for style guidance
5. **Click "Generate Images"**

### Prompt Tips

- **Be Specific**: Include details about style, lighting, composition
- **Use Examples**: Click on example prompts for inspiration
- **Reference Images**: Upload images to guide the style and composition
- **Iterate**: Refine your prompts based on results

### Example Prompts

#### Photorealistic Scene
```
A photo of an everyday scene at a busy cafe serving breakfast. In the foreground is an anime man with blue hair, one of the people is a pencil sketch, another is a claymation person
```

#### Icon Design
```
An icon representing a cute dog. The background is white. Make the icons in a colorful and tactile 3D style. No text.
```

#### Product Photography
```
Put this logo on a high-end ad for a banana scented perfume. The logo is perfectly integrated into the bottle.
```

#### Architectural Visualization
```
Make a photo that is perfectly isometric. It is not a miniature, it is a captured photo that just happened to be perfectly isometric. It is a photo of a beautiful modern office interior.
```

## Model Comparison

| Feature | Nano Banana (2.5 Flash) | Nano Banana Pro (3 Pro) |
|---------|-------------------------|------------------------|
| Max Resolution | 1024px (1K) | 4096px (4K) |
| Speed | Fast | Moderate |
| Text Quality | Good | Excellent |
| Search Grounding | No | Yes |
| Thinking Process | No | Yes |
| Best For | Quick iterations, high volume | Professional assets, complex scenes |

## Technical Details

### API Endpoint
- **Path**: `/api/nano-banana/generate`
- **Method**: POST
- **Authentication**: Requires GOOGLE_API_KEY environment variable

### Request Parameters
```json
{
  "model": "gemini-2.5-flash-image" | "gemini-3-pro-image-preview",
  "prompt": "string",
  "numberOfImages": 1-4,
  "imageSize": "1K" | "2K" | "4K",
  "aspectRatio": "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9",
  "referenceImageDataUrl": "data:image/...;base64,..." (optional)
}
```

### Response
```json
{
  "urls": ["string"],
  "prompt": "string",
  "model": "string",
  "imageSize": "string",
  "aspectRatio": "string"
}
```

## Requirements

- **Google API Key**: Must be configured in environment variables
- **Environment**: `GOOGLE_API_KEY=your_google_api_key`

## Troubleshooting

### Common Issues

1. **"GOOGLE_API_KEY not configured"**
   - Ensure your Google API key is set in the environment variables
   - The key must have access to Gemini API

2. **"imageSize not supported"**
   - Nano Banana (2.5 Flash) only supports 1K images
   - Use Nano Banana Pro for 2K and 4K resolutions

3. **No images generated**
   - Check your prompt for clarity and specificity
   - Ensure reference images are valid if uploaded
   - Try a simpler prompt to test

### Best Practices

- Start with simple prompts and add complexity gradually
- Use reference images for consistent style
- Experiment with different aspect ratios for different use cases
- Use Nano Banana for quick iterations, Nano Banana Pro for final assets
- Save successful prompts for reuse

## Integration with OneChat

The Nano Banana Studio integrates seamlessly with OneChat:

- **Navigation**: Accessible from the main navigation bar
- **Theme Support**: Follows app's dark/light theme
- **Image Storage**: Generated images are automatically saved to the Image Gallery
- **Gallery Integration**: All images appear in the unified image library with source labels
- **Chat Integration**: Can be referenced in conversations
- **Responsive Design**: Works on desktop and mobile devices

### Image Gallery Features

- **Unified Storage**: All images from Nano Banana, Imagen, and chat are stored in one place
- **Source Identification**: Each image is labeled with its source (Nano Banana, Imagen, Generated)
- **Chronological Ordering**: Images are sorted by creation date (newest first)
- **Easy Access**: View, download, and open images in panels directly from the gallery
- **Color-Coded Sources**: 
  - 🟡 Nano Banana (yellow)
  - 🔵 Imagen (blue) 
  - 🟢 Generated (green)

## Future Enhancements

- [ ] Advanced prompt templates
- [ ] Batch prompt variations
- [ ] Image editing capabilities
- [ ] Style presets
- [ ] Prompt history
- [ ] Export options
- [ ] Collaboration features

For more information about Gemini's image generation capabilities, refer to the [official Gemini documentation](https://ai.google.dev/gemini-api/docs/image-generation).
