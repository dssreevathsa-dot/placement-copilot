
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const companies = [
  "IBM",
  "Wipro",
  "Google",
  "Microsoft",
  "Amazon",
  "Infosys",
  "TCS",
  "Accenture",
];

// These are illustrative demo criteria, NOT verified company policies.
const DEMO_CRITERIA = {
  minCgpa: 6.5,
  maxBacklogs: 0,
  minProjects: 2,
};

function numberOr(value, fallback = null) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSkills(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || "").split(",");

  return items
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
}

function hasSkill(skills, skill) {
  const aliases = {
    programming: [
      "programming",
      "java",
      "python",
      "javascript",
      "typescript",
      "c",
      "c++",
      "c#",
      "programming fundamentals",
    ],
    "problem solving": [
      "problem solving",
      "problem-solving",
      "dsa",
      "data structures",
      "algorithms",
      "aptitude",
      "logical reasoning",
    ],
    communication: [
      "communication",
      "communication skills",
      "verbal communication",
    ],
    sql: [
      "sql",
      "mysql",
      "postgresql",
      "postgres",
      "sqlite",
      "database",
    ],
  };

  const candidates = aliases[skill] || [skill];

  return skills.some((existing) =>
    candidates.some(
      (candidate) =>
        existing === candidate || existing.includes(candidate)
    )
  );
}

function buildEligibilityReport(body = {}) {
  const company = String(
    body.company || body.companyName || ""
  ).trim();

  const role = String(
    body.role || "Software Engineer"
  ).trim();

  const profile = body.profile || {};

  if (!company) {
    const error = new Error("Please select a company.");
    error.status = 400;
    throw error;
  }

  const cgpa = numberOr(profile.cgpa);
  const backlogs = numberOr(profile.backlogs);
  const projects = numberOr(profile.projects);
  const experience = numberOr(profile.experience, 0);

  const studentType = String(
    profile.studentType || "Fresher"
  );

  const skills = normalizeSkills(profile.skills);
  const checks = [];

  function addCheck({
    name,
    category,
    companyRequirement,
    profileValue,
    met,
    explanation,
  }) {
    let status = "verify";

    if (met === true) status = "met";
    if (met === false) status = "not met";

    checks.push({
      name,
      category,
      companyRequirement,
      profileValue,
      status,
      met,
      explanation,
    });
  }

  // 1. CGPA requirement
  addCheck({
    name: "CGPA",
    category: "Academics",
    companyRequirement:
      `Demo criterion: minimum CGPA ${DEMO_CRITERIA.minCgpa}/10`,
    profileValue:
      cgpa === null ? "Not provided" : `${cgpa}/10`,
    met:
      cgpa === null
        ? null
        : cgpa >= DEMO_CRITERIA.minCgpa,
    explanation:
      cgpa === null
        ? "Enter your CGPA to assess this demonstration criterion."
        : cgpa >= DEMO_CRITERIA.minCgpa
          ? "Your CGPA meets this demonstration criterion."
          : "Your CGPA is below this demonstration criterion. Check the official job posting for the actual cutoff.",
  });

  // 2. Active backlogs
  addCheck({
    name: "Active backlogs",
    category: "Academics",
    companyRequirement:
      `Demo criterion: maximum ${DEMO_CRITERIA.maxBacklogs} active backlogs`,
    profileValue:
      backlogs === null ? "Not provided" : String(backlogs),
    met:
      backlogs === null
        ? null
        : backlogs <= DEMO_CRITERIA.maxBacklogs,
    explanation:
      backlogs === null
        ? "Enter your current active backlog count."
        : backlogs <= DEMO_CRITERIA.maxBacklogs
          ? "Your backlog count meets this demonstration criterion."
          : "Your profile lists active backlogs. Check the employer's actual policy and work toward clearing them.",
  });

  // 3. Projects
  addCheck({
    name: "Practical projects",
    category: "Projects",
    companyRequirement:
      `Demo target: at least ${DEMO_CRITERIA.minProjects} projects`,
    profileValue:
      projects === null
        ? "Not provided"
        : `${projects} project${projects === 1 ? "" : "s"}`,
    met:
      projects === null
        ? null
        : projects >= DEMO_CRITERIA.minProjects,
    explanation:
      projects === null
        ? "Enter the number of projects you have completed."
        : projects >= DEMO_CRITERIA.minProjects
          ? "Your project count meets this demonstration target."
          : "Consider building another relevant project and documenting your contribution.",
  });

  // 4. Degree and graduation information is displayed for verification.
  // It is NOT automatically marked as a pass or fail.
  if (studentType === "Fresher") {
    const degree = String(profile.degree || "").trim();
    const branch = String(profile.branch || "").trim();
    const graduationYear = String(
      profile.graduationYear || ""
    ).trim();

    const profileDetails = [
      degree || "Degree not provided",
      branch || "Branch not provided",
      graduationYear
        ? `Graduation year: ${graduationYear}`
        : "Graduation year not provided",
    ];

    addCheck({
      name: "Degree and graduation eligibility",
      category: "Academics",
      companyRequirement:
        "Verify accepted degrees, branches, and graduation years in the official job posting.",
      profileValue: profileDetails.join(" · "),
      met: null,
      explanation:
        "This requirement needs verification against the employer's specific role and hiring notice. It is not automatically counted as met or not met.",
    });
  } else {
    addCheck({
      name: "Relevant professional experience",
      category: "Experience",
      companyRequirement:
        "Verify the required experience range for the selected role.",
      profileValue: `${experience} year${experience === 1 ? "" : "s"}`,
      met: null,
      explanation:
        "Compare your experience with the exact requirements in the official job description.",
    });
  }

  // Skills are recommendations, NOT company eligibility checks.
  const recommendedSkills = [
    {
      name: "Programming",
      key: "programming",
      reason:
        "Practise one programming language, variables, functions, collections, and coding exercises.",
    },
    {
      name: "Problem solving",
      key: "problem solving",
      reason:
        "Practise data structures, algorithms, logical reasoning, and coding problems.",
    },
    {
      name: "Communication",
      key: "communication",
      reason:
        "Practise explaining technical concepts, presenting projects, and answering interview questions.",
    },
    {
      name: "SQL and database basics",
      key: "sql",
      reason:
        "Learn SELECT queries, filtering, joins, grouping, and basic database design.",
    },
  ];

  const missingSkills = recommendedSkills
    .filter((skill) => !hasSkill(skills, skill.key))
    .map((skill) => ({
      name: skill.name,
      reason: skill.reason,
    }));

  // Score only checks that can be assessed from the submitted profile.
  // "Needs verification" checks are excluded from the score denominator.
  const assessedChecks = checks.filter(
    (check) => check.status === "met" || check.status === "not met"
  );

  const metCount = assessedChecks.filter(
    (check) => check.status === "met"
  ).length;

  const notMetCount = assessedChecks.filter(
    (check) => check.status === "not met"
  ).length;

  const needsVerification = checks.filter(
    (check) => check.status === "verify"
  ).length;

  const percentage = assessedChecks.length
    ? Math.round((metCount / assessedChecks.length) * 100)
    : null;

  const suggestions = missingSkills.map(
    (skill) => `Learn ${skill.name}: ${skill.reason}`
  );

  if (
    projects !== null &&
    projects < DEMO_CRITERIA.minProjects
  ) {
    suggestions.push(
      "Build a relevant project and document its features, technologies, and your contribution."
    );
  }

  if (
    cgpa !== null &&
    cgpa < DEMO_CRITERIA.minCgpa
  ) {
    suggestions.push(
      "Review your academic improvement plan and confirm the actual CGPA cutoff for your target role."
    );
  }

  if (backlogs !== null && backlogs > 0) {
    suggestions.push(
      "Plan to clear active backlogs and verify the employer's backlog policy."
    );
  }

  return {
    company,
    role,
    checks,
    metCount,
    notMetCount,
    needsVerification,
    totalRequirements: checks.length,
    assessedRequirements: assessedChecks.length,
    percentage,
    missingSkills,
    suggestions,
    notice:
      "This assessment uses illustrative demonstration criteria, not verified current hiring rules. Confirm actual requirements in the employer's official job posting.",
    sources: [],
    searchedWeb: false,
    mode: "demo",
    checkedAt: new Date().toISOString(),
  };
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Placement Eligibility Copilot API is running.",
    mode: "demo",
  });
});

// Company list
app.get("/api/companies", (req, res) => {
  res.json(companies);
});

// Eligibility report
app.post("/api/copilot/eligibility", (req, res) => {
  try {
    const report = buildEligibilityReport(req.body);
    res.json(report);
  } catch (error) {
    res.status(error.status || 500).json({
      error:
        error.message || "Unable to create eligibility report.",
    });
  }
});

// Built-in rule-based placement assistant
app.post("/api/copilot/chat", (req, res) => {
  const message = String(
    req.body.message || req.body.question || ""
  ).trim().toLowerCase();

  let answer;

  if (
    message.includes("skill") ||
    message.includes("learn") ||
    message.includes("gap")
  ) {
    answer =
      "Start with programming fundamentals, problem solving, SQL, and communication practice. Build a project related to your target role. These are preparation recommendations, not necessarily separate company eligibility requirements.";
  } else if (message.includes("project")) {
    answer =
      "Choose a project related to your target role. Examples include a placement portal, task tracker, or expense manager. Include a README, clear features, screenshots, and an explanation of your contribution.";
  } else if (
    message.includes("interview") ||
    message.includes("placement")
  ) {
    answer =
      "Prepare programming fundamentals, data structures, SQL, aptitude, communication, and explanations of your projects. Always review the specific job description because requirements vary by role.";
  } else if (
    message.includes("cgpa") ||
    message.includes("backlog") ||
    message.includes("eligible")
  ) {
    answer =
      "Open Verify & Compare to review your CGPA, active backlogs, and project checks. These are demonstration criteria only. Verify actual eligibility in the employer's official job posting.";
  } else {
    answer =
      "I can help with placement preparation, skills, projects, interviews, CGPA, and profile improvement. Ask a specific question about your target role. This built-in assistant provides prepared guidance and does not use a live AI service.";
  }

  res.json({
    answer,
    mode: "demo",
    searchedWeb: false,
    sources: [],
  });
});

// Company recommendations
app.post("/api/copilot/recommend", (req, res) => {
  res.json({
    recommendedCompanies: companies,
    notice:
      "This is a demonstration company list. Check official career pages for current openings and eligibility.",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Placement Copilot API: http://localhost:${PORT}`);
  console.log("Eligibility checks and learning recommendations are ready.");
});
