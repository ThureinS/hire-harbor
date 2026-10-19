import supabaseClient, { assertRowsAffected } from "@/utils/supabase";

export async function applyToJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileExt = jobData.resume?.name ? jobData.resume.name.split(".").pop() : "";
  const fileName = fileExt
    ? `resume-${random}-${jobData.candidate_id}.${fileExt}`
    : `resume-${random}-${jobData.candidate_id}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, jobData.resume);

  if (storageError) throw new Error("Error uploading Resume");

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        ...jobData,
        resume: fileName,
      },
    ])
    .select();

  if (error) {
    await supabase.storage.from("resumes").remove([fileName]).catch(() => {});
    throw error;
  }

  try {
    assertRowsAffected(data, "Application was not submitted. Check your access and try again.");
  } catch (err) {
    await supabase.storage.from("resumes").remove([fileName]).catch(() => {});
    throw err;
  }

  return data;
}

export async function getResumeSignedUrl(token, { resume }) {
  if (!resume) throw new Error("Resume not found");

  let path = resume;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const marker = "/resumes/";
    const markerIndex = path.indexOf(marker);
    if (markerIndex !== -1) {
      path = path.slice(markerIndex + marker.length);
    } else {
      return resume;
    }
  }

  path = path.split("?")[0].replace(/^\/+/, "");

  const supabase = await supabaseClient(token);
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(path, 3600);

  if (error) {
    if (resume.startsWith("http://") || resume.startsWith("https://")) {
      return resume;
    }
    throw error;
  }

  return data?.signedUrl || resume;
}

export async function updateApplicationStatus(token, { application_id }, status) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", application_id)
    .select();

  if (error) throw error;
  assertRowsAffected(data, "Application was not updated. Check your access and try again.");

  return data;
}

export async function getApplications(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(title, company:companies(name))")
    .eq("candidate_id", user_id);

  if (error) {
    throw error;
  }

  return data;
}
