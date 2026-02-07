"use client";

import { useState } from "react";
import { Sparkles, X, Check } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";

interface PromptEnhancerProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  placeholder?: string;
}

const ENHANCEMENT_PRESETS = [
  {
    name: "Photorealistic",
    icon: "📷",
    template: "Photorealistic {subject}, {lighting}, {composition}, shot on {camera} with {lens}, {time_of_day}, {atmosphere}, highly detailed, 8k, professional photography",
    enhancements: [
      "dramatic lighting",
      "soft natural light", 
      "golden hour",
      "blue hour",
      "studio lighting",
      "cinematic lighting"
    ]
  },
  {
    name: "Artistic",
    icon: "🎨",
    template: "{art_style} of {subject}, {artistic_elements}, {color_palette}, {texture}, {composition}, {mood}, masterpiece, award-winning",
    enhancements: [
      "impressionist style",
      "watercolor painting",
      "oil on canvas",
      "digital art",
      "concept art",
      "abstract expressionism"
    ]
  },
  {
    name: "Commercial",
    icon: "💼",
    template: "Professional product photography of {subject}, {branding}, {lighting_setup}, {background}, {composition}, marketing shot, commercial quality, clean aesthetic",
    enhancements: [
      "minimalist background",
      "studio lighting",
      "premium product shot",
      "lifestyle photography",
      "brand aesthetic",
      "commercial grade"
    ]
  },
  {
    name: "Fantasy",
    icon: "✨",
    template: "Epic fantasy {subject}, {magical_elements}, {environment}, {atmosphere}, {lighting}, {color_scheme}, {mood}, highly detailed, digital painting, concept art",
    enhancements: [
      "magical glowing elements",
      "ethereal atmosphere",
      "enchanted forest",
      "mythical creatures",
      "celestial lighting",
      "otherworldly"
    ]
  },
  {
    name: "Architectural",
    icon: "🏗️",
    template: "Architectural photography of {subject}, {perspective}, {lighting}, {materials}, {environment}, {composition}, {time_of_day}, professional architectural photography",
    enhancements: [
      "blue hour shot",
      "golden hour architecture",
      "modern minimalist",
      "urban cityscape",
      "interior design",
      "structural details"
    ]
  },
  {
    name: "Nature",
    icon: "🌿",
    template: "Nature photography of {subject}, {environment}, {lighting}, {weather}, {composition}, {time_of_day}, {atmosphere}, national geographic style, wildlife photography",
    enhancements: [
      "golden hour nature",
      "misty morning",
      "vibrant autumn colors",
      "dramatic weather",
      "macro details",
      "natural habitat"
    ]
  }
];

const DETAIL_ENHANCERS = [
  "highly detailed",
  "intricate details", 
  "ultra realistic",
  "sharp focus",
  "depth of field",
  "professional grade",
  "award winning",
  "masterpiece",
  "8k resolution",
  "ultra detailed",
  "photorealistic",
  "cinematic quality"
];

const COMPOSITION_ENHANCERS = [
  "rule of thirds",
  "leading lines",
  "symmetrical composition",
  "dynamic angle",
  "dramatic perspective",
  "close-up shot",
  "wide angle",
  "macro photography",
  "portrait orientation",
  "landscape orientation",
  "centered composition",
  "off-center subject"
];

const LIGHTING_ENHANCERS = [
  "soft natural lighting",
  "dramatic lighting",
  "golden hour",
  "blue hour",
  "studio lighting",
  "rim lighting",
  "backlit",
  "side lighting",
  "ambient lighting",
  "cinematic lighting",
  "volumetric lighting",
  "dappled light"
];

export default function PromptEnhancer({ prompt, onPromptChange, placeholder = "Describe what you want to create..." }: PromptEnhancerProps) {
  const { theme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
  const [selectedComposition, setSelectedComposition] = useState<string[]>([]);
  const [selectedLighting, setSelectedLighting] = useState<string[]>([]);
  const [customEnhancement, setCustomEnhancement] = useState("");

  const panelClass = theme === "dark" ? "border-white/10 bg-[#141414]" : "border-stone-200 bg-white";
  const textMain = theme === "dark" ? "text-stone-100" : "text-stone-900";
  const textDim = theme === "dark" ? "text-stone-400" : "text-stone-600";
  const buttonClass = theme === "dark" ? "bg-[#10a37f] hover:bg-[#0e9070] text-white" : "bg-stone-900 hover:bg-stone-800 text-white";
  const secondaryButtonClass = theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-stone-200 hover:bg-stone-300 text-stone-700";

  const enhancePrompt = () => {
    let enhancedPrompt = prompt;
    
    // Apply preset template if selected
    if (selectedPreset) {
      const preset = ENHANCEMENT_PRESETS.find(p => p.name === selectedPreset);
      if (preset) {
        const subject = prompt || placeholder.replace("Describe what you want to create...", "subject");
        enhancedPrompt = preset.template.replace("{subject}", subject);
      }
    }

    // Add selected enhancements
    const allEnhancements = [
      ...selectedDetails,
      ...selectedComposition, 
      ...selectedLighting
    ];

    if (allEnhancements.length > 0) {
      enhancedPrompt += ", " + allEnhancements.join(", ");
    }

    // Add custom enhancement
    if (customEnhancement.trim()) {
      enhancedPrompt += ", " + customEnhancement.trim();
    }

    onPromptChange(enhancedPrompt);
    setIsOpen(false);
    resetSelections();
  };

  const resetSelections = () => {
    setSelectedPreset("");
    setSelectedDetails([]);
    setSelectedComposition([]);
    setSelectedLighting([]);
    setCustomEnhancement("");
  };

  const toggleSelection = (selection: string, selections: string[], setSelections: (items: string[]) => void) => {
    if (selections.includes(selection)) {
      setSelections(selections.filter(s => s !== selection));
    } else {
      setSelections([...selections, selection]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
          secondaryButtonClass
        }`}
      >
        <Sparkles size={16} />
        Enhance Prompt
      </button>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${theme === "dark" ? "bg-black/70" : "bg-black/50"}`}>
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border ${panelClass} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className={theme === "dark" ? "text-[#10a37f]" : "text-stone-600"} />
            <h2 className={`text-lg font-semibold ${textMain}`}>Prompt Enhancer</h2>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              resetSelections();
            }}
            className={`p-1 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-stone-100"}`}
          >
            <X size={20} className={textDim} />
          </button>
        </div>

        {/* Original Prompt */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${textMain} mb-2`}>Original Prompt</label>
          <div className={`p-3 rounded-lg border ${theme === "dark" ? "border-white/10 bg-white/5" : "border-stone-200 bg-stone-50"}`}>
            <div className={`text-sm ${textDim}`}>
              {prompt || "No prompt yet"}
            </div>
          </div>
        </div>

        {/* Preset Styles */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${textMain} mb-3`}>Style Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ENHANCEMENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setSelectedPreset(selectedPreset === preset.name ? "" : preset.name)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedPreset === preset.name
                    ? theme === "dark" 
                      ? "border-[#10a37f] bg-[#10a37f]/10" 
                      : "border-stone-900 bg-stone-100"
                    : theme === "dark"
                      ? "border-white/10 hover:border-white/20 hover:bg-white/5"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{preset.icon}</span>
                  <div>
                    <div className={`text-sm font-medium ${textMain}`}>{preset.name}</div>
                    {selectedPreset === preset.name && (
                      <Check size={14} className={theme === "dark" ? "text-[#10a37f]" : "text-stone-600"} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enhancement Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Details */}
          <div>
            <label className={`block text-sm font-medium ${textMain} mb-3`}>Details & Quality</label>
            <div className="space-y-2">
              {DETAIL_ENHANCERS.map((enhancer) => (
                <label key={enhancer} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDetails.includes(enhancer)}
                    onChange={() => toggleSelection(enhancer, selectedDetails, setSelectedDetails)}
                    className="rounded"
                  />
                  <span className={`text-sm ${textDim}`}>{enhancer}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Composition */}
          <div>
            <label className={`block text-sm font-medium ${textMain} mb-3`}>Composition</label>
            <div className="space-y-2">
              {COMPOSITION_ENHANCERS.map((enhancer) => (
                <label key={enhancer} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedComposition.includes(enhancer)}
                    onChange={() => toggleSelection(enhancer, selectedComposition, setSelectedComposition)}
                    className="rounded"
                  />
                  <span className={`text-sm ${textDim}`}>{enhancer}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lighting */}
          <div>
            <label className={`block text-sm font-medium ${textMain} mb-3`}>Lighting</label>
            <div className="space-y-2">
              {LIGHTING_ENHANCERS.map((enhancer) => (
                <label key={enhancer} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLighting.includes(enhancer)}
                    onChange={() => toggleSelection(enhancer, selectedLighting, setSelectedLighting)}
                    className="rounded"
                  />
                  <span className={`text-sm ${textDim}`}>{enhancer}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Enhancement */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${textMain} mb-2`}>Custom Enhancement</label>
          <input
            type="text"
            value={customEnhancement}
            onChange={(e) => setCustomEnhancement(e.target.value)}
            placeholder="Add your own enhancement keywords..."
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
              theme === "dark"
                ? "bg-transparent border-white/10 text-white placeholder:text-stone-500"
                : "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400"
            }`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={enhancePrompt}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${buttonClass}`}
          >
            <Sparkles size={16} />
            Enhance Prompt
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              resetSelections();
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${secondaryButtonClass}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
