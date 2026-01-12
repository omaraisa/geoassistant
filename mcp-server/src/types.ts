// Type definitions for geographic data

export interface Municipality {
  municipality_id: number;
  acronym: string;
  emirate_id: number;
  name_en: string;
  name_ar: string;
  name_pop_en: string;
  name_pop_ar: string;
}

export interface District {
  district_id: number;
  name_en: string;
  name_ar: string;
  municipality_id: number;
  municipality_name: string;
}

export interface Community {
  community_id: number;
  district_id: number;
  municipality_id: number;
  name_en: string;
  name_ar: string;
  name_pop_en: string;
  name_pop_ar: string;
  district_name: string;
  municipality_name: string;
}

export interface Project {
  project_id: number;
  project_num: string;
  project_name: string;
  district: string;
  municipality: string;
  developer_name: string;
  community: string;
  project_status: string;
  expected_completion_date?: string;
}
