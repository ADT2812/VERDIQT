import { GoogleGenAI, Type } from "@google/genai";

// Read API key from multiple possible sources for local and cloud compatibility
// AI Studio injects process.env.GEMINI_API_KEY, while local Vite uses VITE_ prefix
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

// Using gemini-1.5-flash for higher free tier limits and reliability
const DEFAULT_MODEL = "gemini-1.5-flash";

/**
 * Utility to wait for a specified time
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch wrapper with exponential backoff for 429 errors
 */
async function generateContentWithRetry(model: string, contents: any, config?: any, retries = 3): Promise<any> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      // Use the modern SDK pattern: ai.models.generateContent
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      return response;
    } catch (error: any) {
      lastError = error;
      
      // If error is 429 (Too Many Requests), wait and retry
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('429') || error?.status === 429) {
        const delay = (i + 1) * 3000; // 3s, 6s, 9s backoff
        console.warn(`VERDIQT Engine: Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await wait(delay);
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

export interface VerdiqtAnalysis {
  verdiqt_score: number;
  bias_severity: "Low" | "Medium" | "High" | "Critical";
  biased_attributes: string[];
  pipeline_origin_stage: "data_collection" | "labeling" | "feature_selection" | "model_training";
  affected_groups: string[];
  demographic_parity_gap: string;
  plain_english_summary: string;
  human_impact_story: string;
  fix_recommendations: {
    title: string;
    description: string;
    confidence_score: number;
    difficulty: "Easy" | "Medium" | "Hard";
    reasoning: string;
  }[];
  estimated_real_world_harm: string;
}

export interface EmpathyResponse {
  personalized_explanation: string;
  rights: string[];
  reassurance_statement: string;
}

export async function generateEmpathyResponse(
  userName: string,
  userGroup: string,
  applicationPurpose: string,
  analysis: VerdiqtAnalysis
): Promise<EmpathyResponse> {
  const prompt = `You are VERDIQT, an AI bias auditor with deep empathy for human impact. 
Execute Prompt 7: Empathy Protocol.

Context: 
A person named ${userName} belonging to the ${userGroup} group applied for ${applicationPurpose}.
Our forensic audit of this model (${analysis.verdiqt_score} score, ${analysis.bias_severity} bias) suggests they may have been unfairly impacted.

Your task:
1. Provide a personalized_explanation: Explain in a warm, empathetic, and human way how the model's bias might have affected their specific application. Focus on clarity and validation of their experience.
2. List 3-5 rights: What rights do they have as a subject of this AI system (e.g. Right to explanation, Right to human review)?
3. Provide a reassurance_statement: A closing statement of support and accountability.

Return valid JSON only.`;

  const response = await generateContentWithRetry(
    DEFAULT_MODEL,
    [{ role: "user", parts: [{ text: prompt }] }],
    {
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personalized_explanation: { type: Type.STRING },
            rights: { type: Type.ARRAY, items: { type: Type.STRING } },
            reassurance_statement: { type: Type.STRING },
          },
          required: ["personalized_explanation", "rights", "reassurance_statement"]
        },
      },
    }
  );

  if (!response.text) {
    throw new Error("No response from VERDIQT empathy intelligence.");
  }

  return JSON.parse(response.text) as EmpathyResponse;
}

export interface AuditReport {
  executive_summary: string;
  bias_findings: {
    attribute: string;
    description: string;
    impact_level: string;
  }[];
  process_trace_summary: string;
  legal_implications: string;
  mitigation_roadmap_full: string[];
  final_verdict_statement: string;
  forensic_seal_id: string;
}

export async function generateAuditReport(
  analysis: VerdiqtAnalysis,
  trace: BiasTrace | null,
  simulation: FixSimulation | null,
  domain: string
): Promise<AuditReport> {
  const prompt = `You are VERDIQT Forensic Intelligence. Execute Prompt 5: Formal Audit Report Protocol.

Generate a comprehensive, professional forensic audit report based on:
Domain: ${domain}
Initial Score: ${analysis.verdiqt_score}
Severity: ${analysis.bias_severity}
Pipeline Origin: ${analysis.pipeline_origin_stage}
Trace Details: ${trace ? JSON.stringify(trace.stages) : "N/A"}
Simulation Data: ${simulation ? `Fix: ${simulation.new_verdiqt_score}, Improvement: ${simulation.score_improvement}` : "N/A"}

The report must include:
- executive_summary: High-level overview for leadership.
- bias_findings: List of specific attributes and their forensic descriptors.
- process_trace_summary: Summary of the leakage through the ML pipeline.
- legal_implications: Brief assessment of risk (avoiding direct legal advice, focusing on bias metrics).
- mitigation_roadmap_full: Comprehensive steps for remediation.
- final_verdict_statement: A formal, unshakeable conclusion.
- forensic_seal_id: A unique-looking hexadecimal alphanumeric ID.

Return valid JSON only.`;

  const response = await generateContentWithRetry(
    DEFAULT_MODEL,
    [{ role: "user", parts: [{ text: prompt }] }],
    {
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executive_summary: { type: Type.STRING },
            bias_findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  attribute: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact_level: { type: Type.STRING },
                },
                required: ["attribute", "description", "impact_level"]
              }
            },
            process_trace_summary: { type: Type.STRING },
            legal_implications: { type: Type.STRING },
            mitigation_roadmap_full: { type: Type.ARRAY, items: { type: Type.STRING } },
            final_verdict_statement: { type: Type.STRING },
            forensic_seal_id: { type: Type.STRING },
          },
          required: ["executive_summary", "bias_findings", "process_trace_summary", "legal_implications", "mitigation_roadmap_full", "final_verdict_statement", "forensic_seal_id"]
        },
      },
    }
  );

  if (!response.text) {
    throw new Error("No response from VERDIQT report intelligence.");
  }

  return JSON.parse(response.text) as AuditReport;
}

export interface FixSimulation {
  old_verdiqt_score: number;
  new_verdiqt_score: number;
  score_improvement: number;
  residual_risk: string;
  technical_feasibility: "High" | "Medium" | "Low";
  is_effective: boolean;
}

export async function simulateFix(
  domain: string,
  proposedFix: string,
  currentAnalysis: VerdiqtAnalysis
): Promise<FixSimulation> {
  const prompt = `You are VERDIQT Forensic Intelligence. Execute Prompt 4: Fix Simulation Protocol.

Current Audit Data:
Domain: ${domain}
Current Score: ${currentAnalysis.verdiqt_score}
Bias Severity: ${currentAnalysis.bias_severity}
Biased Attributes: ${currentAnalysis.biased_attributes.join(", ")}

User Proposed Fix:
"${proposedFix}"

Simulate the effectiveness of this fix on the VERDIQT score (0-100 scale). 
Calculate:
- new_verdiqt_score: The estimated score after implementing the fix.
- score_improvement: The absolute increase in score.
- residual_risk: What bias remains after the fix.
- technical_feasibility: High/Medium/Low based on standard ML practices.
- is_effective: Boolean indicating if this fix significantly improves the audit outcome.

Return valid JSON only.`;

  const response = await generateContentWithRetry(
    DEFAULT_MODEL,
    [{ role: "user", parts: [{ text: prompt }] }],
    {
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            old_verdiqt_score: { type: Type.NUMBER },
            new_verdiqt_score: { type: Type.NUMBER },
            score_improvement: { type: Type.NUMBER },
            residual_risk: { type: Type.STRING },
            technical_feasibility: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            is_effective: { type: Type.BOOLEAN },
          },
          required: ["old_verdiqt_score", "new_verdiqt_score", "score_improvement", "residual_risk", "technical_feasibility", "is_effective"]
        },
      },
    }
  );

  if (!response.text) {
    throw new Error("No response from VERDIQT simulation intelligence.");
  }

  return JSON.parse(response.text) as FixSimulation;
}

export interface BiasTrace {
  stages: {
    id: "data_collection" | "labeling" | "feature_selection" | "model_training";
    label: string;
    contamination_percentage: number;
    what_happened: string;
    real_world_analogy: string;
    indicator: "green" | "yellow" | "red";
  }[];
  primary_origin_stage: "data_collection" | "labeling" | "feature_selection" | "model_training";
  final_verdict: string;
  heatmap_data: {
    attribute: string;
    scores: {
      stage: "data_collection" | "labeling" | "feature_selection" | "model_training";
      intensity: number;
    }[];
  }[];
}

export interface RawMetrics {
  demographicParityGap: number;
  disparateImpactRatio: number;
  failsEightyPercentRule: boolean;
  isStatisticallySignificant: boolean;
  proxyRiskScore: number;
  proxyVariables: string[];
}

export async function analyzeTrace(
  domain: string,
  attributes: string,
  sampleSize: string,
  rates: string,
  rawMetrics?: RawMetrics
): Promise<BiasTrace> {
  const prompt = `You are VERDIQT Forensic Intelligence. Execute Prompt 3: Forensic Bias Trace Protocol.

Analyze the bias contamination through the standard ML pipeline stages for this dataset:
Domain: ${domain}
Protected attributes: ${attributes}
Sample size: ${sampleSize}
Outcome rates: ${rates}
${rawMetrics ? `
Mathematically Calculated Metrics (Context for Analysis):
- Demographic Parity Gap: ${rawMetrics.demographicParityGap}%
- Disparate Impact Ratio: ${rawMetrics.disparateImpactRatio.toFixed(3)}
- Fails 80% Legal Rule: ${rawMetrics.failsEightyPercentRule}
- Statistically Significant Sample: ${rawMetrics.isStatisticallySignificant}
- Proxy Risk Level: ${rawMetrics.proxyRiskScore}/5 (Identified proxies: ${rawMetrics.proxyVariables.join(', ')})
` : ''}

Map exactly how bias leaked into the pipeline. Provide 4 stages: Data Collection, Labeling, Feature Selection, and Model Training.
For each stage:
- contamination_percentage: 0-100
- what_happened: Forensic description of the contamination
- real_world_analogy: A punchy, relatable analogy for what this stage represents in a non-algorithmic context (e.g. "Sorting mail with a broken scale").
- indicator: green (clean), yellow (suspicious), red (contaminated)

Identify the primary_origin_stage where the bias was born.
Provide a bold final_verdict summary.

Additionally, generate a heatmap_data grid.
For each attribute in [${attributes}], provide an intensity score (0-100) for each of the 4 pipeline stages, representing how much that specific attribute contributed to bias at that stage.

Return valid JSON only.`;

  const response = await generateContentWithRetry(
    DEFAULT_MODEL,
    [{ role: "user", parts: [{ text: prompt }] }],
    {
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, enum: ["data_collection", "labeling", "feature_selection", "model_training"] },
                  label: { type: Type.STRING },
                  contamination_percentage: { type: Type.NUMBER },
                   what_happened: { type: Type.STRING },
                  real_world_analogy: { type: Type.STRING },
                  indicator: { type: Type.STRING, enum: ["green", "yellow", "red"] },
                },
                required: ["id", "label", "contamination_percentage", "what_happened", "real_world_analogy", "indicator"]
              }
            },
            primary_origin_stage: { type: Type.STRING, enum: ["data_collection", "labeling", "feature_selection", "model_training"] },
            final_verdict: { type: Type.STRING },
            heatmap_data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  attribute: { type: Type.STRING },
                  scores: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stage: { type: Type.STRING, enum: ["data_collection", "labeling", "feature_selection", "model_training"] },
                        intensity: { type: Type.NUMBER }
                      },
                      required: ["stage", "intensity"]
                    }
                  }
                },
                required: ["attribute", "scores"]
              }
            }
          },
          required: ["stages", "primary_origin_stage", "final_verdict", "heatmap_data"]
        },
      },
    }
  );

  if (!response.text) {
    throw new Error("No response from VERDIQT trace intelligence.");
  }

  return JSON.parse(response.text) as BiasTrace;
}
export async function generateImpactStory(
  domain: string,
  attributes: string,
  rates: string,
  rawMetrics: RawMetrics,
  storyCount: number
): Promise<string> {
  const attributesArray = attributes.split(',').map(a => a.trim());
  let highGapAttr = attributesArray[0];
  let maxGap = 0;

  // Try to find the actual highest gap attribute from the rates string
  attributesArray.forEach(attr => {
    const attrRegex = new RegExp(`${attr}:\\s*([^|]*)`, 'i');
    const match = rates.match(attrRegex);
    if (match) {
      const groupData = match[1];
      const percentages = groupData.match(/(\d+)%/g);
      if (percentages && percentages.length >= 2) {
        const values = percentages.map(p => parseInt(p));
        const gap = Math.max(...values) - Math.min(...values);
        if (gap > maxGap) {
          maxGap = gap;
          highGapAttr = attr;
        }
      }
    }
  });

  // Detect region hint
  const regionHint = attributes.toLowerCase().includes('postcode') || attributes.toLowerCase().includes('region') || attributes.toLowerCase().includes('zip')
    ? "The data contains geographical markers. Use realistic Indian states like Karnataka, Maharashtra, Bihar, or Rajasthan."
    : "Use a realistic Indian setting.";

  const prompt = `You are VERDIQT Forensic Intelligence. Execute Prompt 8: Impact Story Generation.
  
  CONTEXT:
  - Domain: ${domain}
  - Primary Bias Driver: ${highGapAttr} (Highest parity gap detected)
  - Protected Attributes: ${attributes}
  - Outcome Rates: ${rates}
  - Demographic Parity Gap: ${rawMetrics.demographicParityGap}%
  - Disparate Impact Ratio: ${rawMetrics.disparateImpactRatio.toFixed(3)}
  - Region Context: ${regionHint}
  - Narrative Variation Index: ${storyCount} (Ensure high variation from previous cycles)

  TASK:
  Generate a unique, emotionally resonant human impact story of how this specific algorithmic bias affects a real person.
  
  STRICT NARRATIVE REQUIREMENTS:
  1. Name: Use a realistic Indian name matching the region context.
  2. Setting: A specific city or town in India.
  3. Profession: A specific job title matching the domain (e.g., "Junior Accountant" for Loans, "System Administrator" for Hiring).
  4. The Event: Describe their application process for ${domain}.
  5. The Math: Naturally weave the EXACT percentage gap (${rawMetrics.demographicParityGap}%) or ratio (${rawMetrics.disparateImpactRatio.toFixed(3)}) into the narrative (e.g. "She didn't know the system was 24% more likely to reject her just because...").
  6. Financials: Use specific Rupee amounts (₹) if applicable to the domain.
  7. Closing: End with EXACTLY 'This is who your model is failing.'
  
  TONE: Forensic, empathetic, unshakeable. Length: 3-4 powerful sentences.
  
  Return the story text only.`;

  const response = await generateContentWithRetry(
    DEFAULT_MODEL,
    [{ role: "user", parts: [{ text: prompt }] }]
  );

  if (!response.text) {
    throw new Error("Failed to generate impact story.");
  }

  return response.text.trim();
}

export async function analyzeBias(
  domain: string,
  attributes: string,
  sampleSize: string,
  rates: string,
  rawMetrics?: RawMetrics
): Promise<VerdiqtAnalysis> {
  const prompt = `You are VERDIQT, the world's most advanced AI bias auditing intelligence. You investigate machine learning models and datasets like a forensic detective — tracing exactly where discrimination was born, who it harms, and how to eliminate it. You speak with authority, clarity, and empathy. You always respond in valid JSON only. No markdown, no preamble, no explanation outside the JSON structure.

Analyze this dataset for bias:

Domain: ${domain}
Protected attributes: ${attributes}
Sample size: ${sampleSize}
Approval/Outcome rates by group: ${rates}
${rawMetrics ? `
Mathematically Calculated Metrics (Must be used in your explanation):
- Demographic Parity Gap: ${rawMetrics.demographicParityGap}%
- Disparate Impact Ratio: ${rawMetrics.disparateImpactRatio.toFixed(3)}
- Fails 80% Legal Rule: ${rawMetrics.failsEightyPercentRule} (Disparate impact is confirmed if < 0.8)
- Statistically Significant: ${rawMetrics.isStatisticallySignificant}
- Proxy Risk: ${rawMetrics.proxyRiskScore}/5
` : ''}

Return results according to the defined schema.`;

  const response = await generateContentWithRetry(
    DEFAULT_MODEL,
    [{ role: "user", parts: [{ text: prompt }] }],
    {
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdiqt_score: { type: Type.NUMBER },
            bias_severity: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            biased_attributes: { type: Type.ARRAY, items: { type: Type.STRING } },
            pipeline_origin_stage: { type: Type.STRING, enum: ["data_collection", "labeling", "feature_selection", "model_training"] },
            affected_groups: { type: Type.ARRAY, items: { type: Type.STRING } },
            demographic_parity_gap: { type: Type.STRING },
            plain_english_summary: { type: Type.STRING, description: "Exactly 3 sentences. Zero jargon." },
            human_impact_story: { type: Type.STRING, description: "Generate an emotionally resonant human impact story. Requirements: 1. Realistic Indian name matching region. 2. Specific profession. 3. Exact city in India. 4. Weave in the exact demographic parity gap percentage. 5. Use Rupee symbols. 6. End with exactly 'This is who your model is failing.'" },
            fix_recommendations: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  confidence_score: { type: Type.NUMBER, description: "0-100 percentage" },
                  difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                  reasoning: { type: Type.STRING, description: "One-line explanation of why this fix is recommended." }
                },
                required: ["title", "description", "confidence_score", "difficulty", "reasoning"]
              } 
            },
            estimated_real_world_harm: { type: Type.STRING },
          },
          required: [
            "verdiqt_score", "bias_severity", "biased_attributes", "pipeline_origin_stage",
            "affected_groups", "demographic_parity_gap", "plain_english_summary",
            "human_impact_story", "fix_recommendations", "estimated_real_world_harm"
          ]
        },
      },
    }
  );

  if (!response.text) {
    throw new Error("No response from VERDIQT intelligence.");
  }

  return JSON.parse(response.text) as VerdiqtAnalysis;
}
