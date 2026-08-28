const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type ExplanationMethod = "SHAP" | "LIME" | "DiCE";

export interface DatasetSummary {
  dataset_id: string;
  display_name: string;
  xai_case_count: number;
}

export interface DatasetDetail extends DatasetSummary {
  model_type: string | null;
  decision_threshold: number | null;
  test_rows: number | null;
  valid_dice_counterfactual_count: number | null;
}

export interface ParticipantAssignment {
  participant_code: string;
  assigned_method: ExplanationMethod;
}

export interface ParticipantStimulus {
  participant_code: string;
  case_id: "SYNTHETIC_ALEX_001";
  assigned_method: ExplanationMethod;
  scenario: { title: string; paragraphs: string[]; notice: string };
  prediction: { decision: "Application rejected" };
  explanation: {
    method: ExplanationMethod;
    introduction: string;
    factors: Array<{ rank: number; label: string; value: string | number | null; direction: string }>;
    changes: Array<{ label: string; original_value: string | number | null; alternative_value: string | number | null }>;
    notice: string;
  };
}

export interface StudyCase {
  case_id: string;
  predicted_class: number;
  predicted_probability: number;
  case_type: string;
}

export interface TopFactor {
  rank: number;
  feature: string;
  display_feature: string;
  display_value: string | number | null;
  contribution: number;
  direction: string;
  rule: string | null;
}

export interface CaseExplanation {
  dataset_id: string;
  case_id: string;
  prediction: { predicted_class: number; predicted_probability: number };
  shap: { available: boolean; top_factors: TopFactor[] };
  lime: { available: boolean; top_factors: TopFactor[]; local_fidelity_r2: number | null };
  dice: {
    available: boolean;
    final_status: string;
    status_message: string;
    counterfactual_probability: number | null;
    changes: Array<{
      feature: string;
      display_feature: string;
      original_value: string | number | null;
      counterfactual_value: string | number | null;
    }>;
    actionability_terminology: string;
  };
}

export class ApiError extends Error {
  constructor(public status: number | null, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError(null, "The study service is currently unavailable.");
  }

  if (!response.ok) {
    const message = response.status === 404
      ? "The requested study information could not be found."
      : response.status === 503
        ? "The study information is temporarily unavailable."
        : "The study service returned an unexpected response.";
    throw new ApiError(response.status, message);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, "The study service returned an unexpected response.");
  }
}

export const getDatasets = () => request<DatasetSummary[]>("/api/datasets");
export const getDataset = (datasetId: string) => request<DatasetDetail>(`/api/datasets/${encodeURIComponent(datasetId)}`);
export const getParticipantAssignment = (code: string) => request<ParticipantAssignment>(`/api/study/participants/${encodeURIComponent(code)}`);
export const getParticipantStimulus = (code: string) => request<ParticipantStimulus>(`/api/participant-study/stimulus/${encodeURIComponent(code)}`);
export const getStudyCases = (datasetId: string) => request<StudyCase[]>(`/api/study/${encodeURIComponent(datasetId)}/cases`);
export const getCaseExplanations = (datasetId: string, caseId: string) => request<CaseExplanation>(`/api/study/${encodeURIComponent(datasetId)}/cases/${encodeURIComponent(caseId)}/explanations`);
