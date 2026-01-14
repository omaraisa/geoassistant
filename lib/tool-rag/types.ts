export type ToolCategory =
  | 'geo'
  | 'sales'
  | 'rental'
  | 'supply'
  | 'municipality'
  | 'other';

export type ToolExample = {
  user: string;
  notes?: string;
};

export type ToolGeminiParameterSchema = {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  description?: string;
  enum?: string[];
  properties?: Record<string, ToolGeminiParameterSchema>;
  items?: ToolGeminiParameterSchema;
  required?: string[];
  additionalProperties?: boolean;
};

export type ToolDoc = {
  name: string;
  category: ToolCategory;
  description: string;

  whenToUse?: string[];
  keywords?: string[];
  examples?: ToolExample[];

  gemini: {
    parameters: ToolGeminiParameterSchema;
  };
};

export type ToolSelectionOptions = {
  topK: number;
  fallbackK: number;
  alwaysInclude: string[];
  debug?: boolean;
};

export type ToolSelectionResult = {
  selectedToolNames: string[];
  debug?: {
    reason: 'ranked' | 'fallback_all' | 'fallback_top' | 'error';
    scored?: Array<{ name: string; score: number }>;
  };
};
