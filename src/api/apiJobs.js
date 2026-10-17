import supabaseClient, { assertRowsAffected } from "@/utils/supabase";

// Escape Postgres LIKE wildcards so a literal `%`/`_` in a search term
// doesn't match more broadly than the user typed.
function escapeLikePattern(value) {
  return value.replace(/[%_\\]/g, "\\$&");
}

// Fetch Jobs
export async function getJobs(token, { location, company_id, searchQuery }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select("*, saved: saved_jobs(id), company: companies(name,logo_url)");

  if (location) {
    query = query.eq("location", location);
  }

  if (company_id) {
    query = query.eq("company_id", company_id);
  }

  if (searchQuery) {
    query = query.ilike("title", `%${escapeLikePattern(searchQuery)}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

// Read Saved Jobs
export async function getSavedJobs(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job: jobs(*, company: companies(name,logo_url))")
    .eq("user_id", user_id);

  if (error) {
    throw error;
  }

  return data;
}

// Read single job
export async function getSingleJob(token, { job_id }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select(
      "*, company: companies(name,logo_url), applications: applications(*)"
    )
    .eq("id", job_id)
    .maybeSingle();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

// - Add / Remove Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = await supabaseClient(token);

  if (alreadySaved) {
    // If the job is already saved, remove it
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id)
      .eq("user_id", saveData.user_id)
      .select();

    if (deleteError) {
      throw deleteError;
    }

    assertRowsAffected(data, "Job was not unsaved. Check your access and try again.");
    return data;
  } else {
    // If the job is not saved, add it to saved jobs
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([saveData])
      .select();

    if (insertError) {
      throw insertError;
    }

    assertRowsAffected(data, "Job was not saved. Check your access and try again.");
    return data;
  }
}

// Toggle hiring status; database policies must enforce recruiter ownership.
export async function updateHiringStatus(token, { job_id }, isOpen) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("jobs")
    .update({ isOpen })
    .eq("id", job_id)
    .select();

  if (error) {
    throw error;
  }

  assertRowsAffected(data, "Hiring status was not updated. Check your access and try again.");
  return data;
}

// get my created jobs
export async function getMyJobs(token, { recruiter_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url)")
    .eq("recruiter_id", recruiter_id);

  if (error) {
    throw error;
  }

  return data;
}

// Delete job
export async function deleteJob(token, { job_id }) {
  const supabase = await supabaseClient(token);

  const { data, error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    throw deleteError;
  }

  assertRowsAffected(data, "Job was not deleted. Check your access and try again.");
  return data;
}

// - post job
export async function addNewJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .insert([jobData])
    .select();

  if (error) {
    throw error;
  }

  assertRowsAffected(data, "Job was not created. Check your access and try again.");
  return data;
}
