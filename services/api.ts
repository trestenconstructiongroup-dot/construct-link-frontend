const API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE!;

type AuthScheme = "django" | "supabase";

/**
 * Decide which HTTP Authorization header value to use for a given token.
 * - Django tokens → "Token <key>"
 * - Supabase access tokens (JWT) → "Bearer <jwt>"
 *
 * Instead of relying on external callers to choose, we derive the scheme
 * from a simple hint and the token shape.
 */
function buildAuthHeader(token: string, hint?: AuthScheme): string {
  const trimmed = token.trim();

  if (hint === "django") return `Token ${trimmed}`;
  if (hint === "supabase") return `Bearer ${trimmed}`;

  // Heuristic: Supabase JWTs are 3 dot‑separated segments; DRF tokens are not.
  const parts = trimmed.split(".");
  if (parts.length === 3 && parts.every((p) => p.length > 0)) {
    return `Bearer ${trimmed}`;
  }
  return `Token ${trimmed}`;
}

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  // This header tells ngrok to bypass its browser warning page (ERR_NGROK_6024)
  // so that API requests return your real Django responses instead of HTML.
  "ngrok-skip-browser-warning": "true",
};

type ApiRequestOptions = RequestInit & {
  /**
   * When provided, apiFetch will attach the appropriate Authorization header
   * using buildAuthHeader(), instead of every caller manually constructing it.
   */
  authToken?: string | null;
  authSchemeHint?: AuthScheme;
};

  async function apiFetch(endpoint: string, options: ApiRequestOptions = {}) {
    if (!API_BASE || API_BASE === "undefined") {
      throw new Error(
        "API base URL is not set. Set EXPO_PUBLIC_BACKEND_API_BASE in .env and restart the dev server."
      );
    }

    const { authToken, authSchemeHint, headers: extraHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(extraHeaders as Record<string, string> | undefined),
    };

    if (authToken) {
      headers.Authorization = buildAuthHeader(authToken, authSchemeHint);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...rest,
        headers,
      });
    
      const text = await res.text();
    
      if (!res.ok) {
        // Try to parse as JSON for better error messages
        try {
          const errorData = JSON.parse(text);
          const error = new Error(JSON.stringify(errorData));
          (error as any).status = res.status;
          (error as any).data = errorData;
          throw error;
        } catch (parseError) {
          // If not JSON, throw with the text
          const error = new Error(text || `Request failed with status ${res.status}`);
          (error as any).status = res.status;
          throw error;
        }
      }
    
      // Parse response
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error: any) {
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Network error: Could not connect to the server. Please check if the backend is running.');
      }
      throw error;
    }
  }
  
  // ---- API functions below ----
  
  export function healthCheck() {
    return apiFetch("/api/health/");
  }

  // Authentication functions
  export interface SignupData {
    email: string;
    full_name: string;
    password: string;
    confirm_password: string;
    is_worker?: boolean;
  }

  export interface LoginData {
    email: string;
    password: string;
  }

  export interface AuthResponse {
    message: string;
    user: {
      id: number;
      email: string;
      username: string;
      full_name: string;
      is_worker: boolean;
      is_company: boolean;
      created_at: string;
    };
    token: string;
  }

  export function signup(data: SignupData): Promise<AuthResponse> {
    return apiFetch("/api/signup/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  export function login(data: LoginData): Promise<AuthResponse> {
    return apiFetch("/api/login/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  export function logout(token: string): Promise<{ message: string }> {
    return apiFetch("/api/logout/", {
      method: "POST",
      authToken: token,
      authSchemeHint: "django",
    });
  }

  export function getUserProfile(token: string): Promise<AuthResponse['user']> {
    return apiFetch("/api/profile/", {
      method: "GET",
      authToken: token,
    });
  }

  export type UserRole = 'single' | 'company';

  export function setUserRole(token: string, role: UserRole): Promise<AuthResponse['user']> {
    return apiFetch("/api/role/", {
      method: "POST",
      authToken: token,
      body: JSON.stringify({ role }),
    });
  }  

  // ---- Profile APIs ----

  export interface IndividualProfile {
    id: number;
    user: number;
    name: string;
    headline: string;
    skills: { name: string; standardized?: boolean }[];
    bio: string;
    experience_years?: number;
    location: string;
    photo_url: string;
    hourly_rate?: string | null;
    daily_rate?: string | null;
    availability: string;
    certifications: Array<{ name: string; issuer?: string; year?: number }>;
    work_process: Array<{ step: number; title: string; description: string }>;
    created_at: string;
    updated_at: string;
  }

  export interface CompanyProfile {
    id: number;
    user: number;
    company_name: string;
    company_type: string[];
    description: string;
    website: string;
    team_size?: number;
    location: string;
    logo_url: string;
    founded_year?: number | null;
    certifications: Array<{ name: string; issuer?: string; year?: number }>;
    notable_projects: Array<{ name: string; value?: string; duration?: string; description?: string }>;
    min_project_budget?: string | null;
    created_at: string;
    updated_at: string;
  }

  export interface CompanyHiringFocus {
    id: number;
    profile: number;
    title: string;
    tags: string[];
    is_priority: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface IndividualExperience {
    id: number;
    profile: number;
    role_title: string;
    company_name: string;
    location: string;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    description: string;
    created_at: string;
    updated_at: string;
  }

  export interface IndividualEducation {
    id: number;
    profile: number;
    institution: string;
    qualification: string;
    field_of_study: string;
    start_year: number | null;
    end_year: number | null;
    is_current: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface ProfileResponse {
    user: AuthResponse['user'];
    individual_profile: IndividualProfile | null;
    company_profile: CompanyProfile | null;
    individual_experience?: IndividualExperience[];
    individual_education?: IndividualEducation[];
    company_hiring_focus?: CompanyHiringFocus[];
  }

  export function getFullProfile(token: string): Promise<ProfileResponse> {
    return apiFetch("/api/profile/", {
      method: "GET",
      authToken: token,
    });
  }

  // Ensure profile records exist and return them
  export function ensureIndividualProfile(token: string): Promise<IndividualProfile> {
    return apiFetch("/api/profile/individual/", {
      method: "GET",
      authToken: token,
    });
  }

  export function ensureCompanyProfile(token: string): Promise<CompanyProfile> {
    return apiFetch("/api/profile/company/", {
      method: "GET",
      authToken: token,
    });
  }

  export function updateIndividualProfile(
    token: string,
    payload: Partial<Omit<IndividualProfile, 'id' | 'user' | 'created_at' | 'updated_at'>>
  ): Promise<IndividualProfile> {
    return apiFetch("/api/profile/individual/", {
      method: "PATCH",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function updateCompanyProfile(
    token: string,
    payload: Partial<Omit<CompanyProfile, 'id' | 'user' | 'created_at' | 'updated_at'>>
  ): Promise<CompanyProfile> {
    return apiFetch("/api/profile/company/", {
      method: "PATCH",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  // ---- Experience & Education APIs ----

  export function getIndividualExperience(
    token: string,
  ): Promise<IndividualExperience[]> {
    return apiFetch("/api/profile/experience/", {
      method: "GET",
      authToken: token,
    });
  }

  export function createIndividualExperience(
    token: string,
    payload: Partial<Omit<IndividualExperience, "id" | "profile" | "created_at" | "updated_at">>,
  ): Promise<IndividualExperience> {
    return apiFetch("/api/profile/experience/", {
      method: "POST",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function updateIndividualExperience(
    token: string,
    id: number,
    payload: Partial<Omit<IndividualExperience, "id" | "profile" | "created_at" | "updated_at">>,
  ): Promise<IndividualExperience> {
    return apiFetch(`/api/profile/experience/${id}/`, {
      method: "PATCH",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function deleteIndividualExperience(
    token: string,
    id: number,
  ): Promise<void> {
    return apiFetch(`/api/profile/experience/${id}/`, {
      method: "DELETE",
      authToken: token,
    });
  }

  export function getIndividualEducation(
    token: string,
  ): Promise<IndividualEducation[]> {
    return apiFetch("/api/profile/education/", {
      method: "GET",
      authToken: token,
    });
  }

  export function createIndividualEducation(
    token: string,
    payload: Partial<Omit<IndividualEducation, "id" | "profile" | "created_at" | "updated_at">>,
  ): Promise<IndividualEducation> {
    return apiFetch("/api/profile/education/", {
      method: "POST",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function updateIndividualEducation(
    token: string,
    id: number,
    payload: Partial<Omit<IndividualEducation, "id" | "profile" | "created_at" | "updated_at">>,
  ): Promise<IndividualEducation> {
    return apiFetch(`/api/profile/education/${id}/`, {
      method: "PATCH",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function deleteIndividualEducation(
    token: string,
    id: number,
  ): Promise<void> {
    return apiFetch(`/api/profile/education/${id}/`, {
      method: "DELETE",
      authToken: token,
    });
  }

  // ---- Company hiring focus APIs ----

  export function getCompanyHiringFocus(
    token: string,
  ): Promise<CompanyHiringFocus[]> {
    return apiFetch("/api/profile/company/hiring-focus/", {
      method: "GET",
      authToken: token,
    });
  }

  export function createCompanyHiringFocus(
    token: string,
    payload: Partial<Omit<CompanyHiringFocus, "id" | "profile" | "created_at" | "updated_at">>,
  ): Promise<CompanyHiringFocus> {
    return apiFetch("/api/profile/company/hiring-focus/", {
      method: "POST",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function updateCompanyHiringFocus(
    token: string,
    id: number,
    payload: Partial<Omit<CompanyHiringFocus, "id" | "profile" | "created_at" | "updated_at">>,
  ): Promise<CompanyHiringFocus> {
    return apiFetch(`/api/profile/company/hiring-focus/${id}/`, {
      method: "PATCH",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function deleteCompanyHiringFocus(
    token: string,
    id: number,
  ): Promise<void> {
    return apiFetch(`/api/profile/company/hiring-focus/${id}/`, {
      method: "DELETE",
      authToken: token,
    });
  }

  // ---- Jobs APIs ----

  export type JobStatus = "draft" | "published" | "closed";

  export type PostedByAccountType = "individual" | "company";

  export type JobMode =
    | "individual_request"
    | "company_hiring"
    | "company_project";

  export interface JobRoleRequirement {
    id: number;
    job: number;
    skill_category: string;
    quantity_required: number;
    created_at: string;
    updated_at: string;
  }

  export interface Job {
    id: number;
    posted_by_user: number;
    company: number | null;
    posted_by_account_type: PostedByAccountType;
    job_mode: JobMode;
    job_title: string;
    category: string;
    job_type: "one_time" | "short_project" | "long_term";
    required_skills: string[];
    description: string;
    location: string;
    start_date: string | null;
    deadline: string | null;
    payment_type: "fixed" | "hourly" | "negotiable";
    budget_min: string | null;
    budget_max: string | null;
    allow_direct_messages: boolean;
    allow_phone_contact: boolean;
    status: JobStatus;
    created_at: string;
    updated_at: string;
    role_requirements?: JobRoleRequirement[];
  }

  export function listMyJobs(token: string): Promise<Job[]> {
    return apiFetch("/api/jobs/", {
      method: "GET",
      authToken: token,
    });
  }

  export function getJob(token: string, id: number): Promise<Job> {
    return apiFetch(`/api/jobs/${id}/`, {
      method: "GET",
      authToken: token,
    });
  }

  export function createJob(
    token: string,
    payload: Partial<
      Omit<
        Job,
        | "id"
        | "posted_by_user"
        | "company"
        | "posted_by_account_type"
        | "job_mode"
        | "status"
        | "created_at"
        | "updated_at"
      >
    > & {
      status?: JobStatus;
      job_mode?: JobMode;
      role_requirements?: Array<{
        skill_category: string;
        quantity_required?: number;
      }>;
    },
  ): Promise<Job> {
    return apiFetch("/api/jobs/", {
      method: "POST",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function updateJob(
    token: string,
    id: number,
    payload: Partial<
      Omit<
        Job,
        | "id"
        | "posted_by_user"
        | "company"
        | "posted_by_account_type"
        | "job_mode"
        | "created_at"
        | "updated_at"
      >
    >,
  ): Promise<Job> {
    return apiFetch(`/api/jobs/${id}/`, {
      method: "PATCH",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }

  export function deleteJob(
    token: string,
    id: number,
  ): Promise<void> {
    return apiFetch(`/api/jobs/${id}/`, {
      method: "DELETE",
      authToken: token,
    });
  }

  // ---- Find Jobs (public listing) ----

  export interface JobSummaryRole {
    role_name: string;
    quantity: number;
  }

  export interface JobSummary {
    job_id: number;
    title: string;
    short_description: string;
    posted_by_id: number;
    posted_by_name: string;
    employer_type: "individual" | "company";
    location_text: string;
    latitude?: number | null;
    longitude?: number | null;
    created_at: string;
    updated_at: string;
    status: "open" | "closed" | "paused";
    roles_required: JobSummaryRole[];
    accepts_individual_workers: boolean;
    accepts_companies: boolean;
    max_companies_allowed: number | null;
    max_individuals_allowed: number | null;
    pay_type: string;
    pay_min: string | null;
    pay_max: string | null;
    currency: string;
    skills_required: string[];
    job_type: string;
    application_deadline: string | null;
    applications_count: number;
    has_applied: boolean;
    posted_days_ago: number;
    is_new: boolean;
    is_hot: boolean;
  }

  export interface FindJobsResponse {
    count: number;
    next: number | null;
    previous: number | null;
    results: JobSummary[];
  }

  export interface FindJobsFilters {
    skills_list: string[];
    roles_list: string[];
    job_types: string[];
    pay_range_min: number;
    pay_range_max: number;
    location_suggestions: string[];
  }

  export interface FindJobsParams {
    search?: string;
    skills?: string;
    roles?: string;
    job_type?: string;
    pay_min?: number;
    pay_max?: number;
    location?: string;
    page?: number;
    page_size?: number;
  }

  export function findJobs(
    params: FindJobsParams = {},
    token?: string | null,
  ): Promise<FindJobsResponse> {
    const sp = new URLSearchParams();
    if (params.search) sp.set("search", params.search);
    if (params.skills) sp.set("skills", params.skills);
    if (params.roles) sp.set("roles", params.roles);
    if (params.job_type) sp.set("job_type", params.job_type);
    if (params.pay_min != null) sp.set("pay_min", String(params.pay_min));
    if (params.pay_max != null) sp.set("pay_max", String(params.pay_max));
    if (params.location) sp.set("location", params.location);
    if (params.page != null) sp.set("page", String(params.page));
    if (params.page_size != null) sp.set("page_size", String(params.page_size));
    const qs = sp.toString();
    const url = qs ? `/api/jobs/find/?${qs}` : `/api/jobs/find/`;
    return apiFetch(url, { method: "GET", authToken: token ?? undefined });
  }

  export function getFindJobsFilters(): Promise<FindJobsFilters> {
    return apiFetch("/api/jobs/find/filters/", { method: "GET" });
  }

  export interface JobDetail extends JobSummary {
    description: string;
    start_date: string | null;
    allow_direct_messages: boolean;
    allow_phone_contact: boolean;
  }

  export function getFindJobDetail(
    jobId: number,
    token?: string | null
  ): Promise<JobDetail> {
    return apiFetch(`/api/jobs/find/${jobId}/`, {
      method: "GET",
      authToken: token ?? undefined,
    });
  }

  export interface ApplyJobResponse {
    success: boolean;
    message: string;
    applications_count: number;
    has_applied: boolean;
  }

  export function applyJob(
    token: string,
    jobId: number,
    roleName?: string | null
  ): Promise<ApplyJobResponse> {
    const body: Record<string, string> = {};
    if (roleName) body.role_name = roleName;
    return apiFetch(`/api/jobs/${jobId}/apply/`, {
      method: "POST",
      authToken: token,
      body: JSON.stringify(body),
    });
  }

  // ---- Find Workers (search individuals + companies) ----

  export interface WorkerSearchResultIndividual {
    type: "individual";
    user_id: number;
    name: string;
    primary_category: string;
    top_skills: string[];
    experience_level: string;
    experience_years: number | null;
    profile_image: string;
    rating: number | null;
    reviews_count: number;
    hourly_rate: string | null;
    daily_rate: string | null;
    location: string;
    availability: string;
    tagline: string;
    // Detail-only fields (returned by find_worker_detail)
    bio?: string;
    certifications?: Array<{ name: string; issuer?: string; year?: number }>;
    work_process?: Array<{ step: number; title: string; description: string }>;
  }

  export interface WorkerSearchResultCompany {
    type: "company";
    user_id: number;
    company_name: string;
    company_logo: string;
    company_type: string[];
    services_offered: string[];
    team_size: number | null;
    years_in_business: number | null;
    rating: number | null;
    reviews_count: number;
    location: string;
    notable_projects: string[];
    certifications: string[];
    min_project_budget: string | null;
    tagline: string;
  }

  export type WorkerSearchResult =
    | WorkerSearchResultIndividual
    | WorkerSearchResultCompany;

  export interface FindWorkersResponse {
    count: number;
    next: number | null;
    previous: number | null;
    results: WorkerSearchResult[];
  }

  export interface FindWorkersFilters {
    skills_list: string[];
    categories_list: string[];
    company_types_list: string[];
    location_suggestions: string[];
  }

  export interface FindWorkersParams {
    search?: string;
    type?: "individual" | "company" | "all";
    skills?: string;
    category?: string;
    experience_level?: string;
    years_min?: number;
    years_max?: number;
    location?: string;
    company_type?: string;
    team_size_min?: number;
    sort?: string;
    page?: number;
    page_size?: number;
  }

  export function findWorkers(
    params: FindWorkersParams = {},
    token?: string | null
  ): Promise<FindWorkersResponse> {
    const sp = new URLSearchParams();
    if (params.search) sp.set("search", params.search);
    if (params.type) sp.set("type", params.type);
    if (params.skills) sp.set("skills", params.skills);
    if (params.category) sp.set("category", params.category);
    if (params.experience_level) sp.set("experience_level", params.experience_level);
    if (params.years_min != null) sp.set("years_min", String(params.years_min));
    if (params.years_max != null) sp.set("years_max", String(params.years_max));
    if (params.location) sp.set("location", params.location);
    if (params.company_type) sp.set("company_type", params.company_type);
    if (params.team_size_min != null) sp.set("team_size_min", String(params.team_size_min));
    if (params.sort) sp.set("sort", params.sort);
    if (params.page != null) sp.set("page", String(params.page));
    if (params.page_size != null) sp.set("page_size", String(params.page_size));
    const qs = sp.toString();
    const url = qs ? `/api/workers/find/?${qs}` : `/api/workers/find/`;
    return apiFetch(url, { method: "GET", authToken: token ?? undefined });
  }

  export function getFindWorkersFilters(): Promise<FindWorkersFilters> {
    return apiFetch("/api/workers/find/filters/", { method: "GET" });
  }

  export function getFindWorkerDetail(
    userId: number,
    token?: string | null
  ): Promise<WorkerSearchResultIndividual | WorkerSearchResultCompany> {
    return apiFetch(`/api/workers/find/${userId}/`, {
      method: "GET",
      authToken: token ?? undefined,
    });
  }

  // ---- Reviews ----

  export interface Review {
    id: number;
    reviewer: number;
    target_user: number;
    job: number | null;
    rating: number;
    comment: string;
    reviewer_name: string;
    created_at: string;
    updated_at: string;
  }

  export interface ReviewsResponse {
    count: number;
    next: number | null;
    previous: number | null;
    results: Review[];
  }

  export function getReviewsForUser(
    userId: number,
    token?: string | null
  ): Promise<ReviewsResponse> {
    return apiFetch(`/api/reviews/${userId}/`, {
      method: "GET",
      authToken: token ?? undefined,
    });
  }

  export function createReview(
    token: string,
    payload: { target_user: number; rating: number; comment?: string; job?: number }
  ): Promise<Review> {
    return apiFetch("/api/reviews/", {
      method: "POST",
      authToken: token,
      body: JSON.stringify(payload),
    });
  }