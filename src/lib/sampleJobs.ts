export interface SampleJob {
  source: "sample";
  external_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary_min: number;
  salary_max: number;
}

export const SAMPLE_JOBS: SampleJob[] = [
  {
    source: "sample",
    external_id: "sample-frontend",
    title: "Senior Frontend Engineer",
    company: "Acme Cloud",
    location: "Remote (US)",
    description:
      "Own the web experience for a cloud observability platform used by thousands of engineers. You will build fast, accessible React and TypeScript interfaces, own a product area end to end, and work closely with designers to ship polished dashboards. Experience with performance profiling, component libraries, and testing is important. We value engineers who care about details and can turn fuzzy requirements into clean, maintainable UIs.",
    url: "https://example.com/jobs/acme-frontend",
    salary_min: 150000,
    salary_max: 190000,
  },
  {
    source: "sample",
    external_id: "sample-backend",
    title: "Backend Engineer (Node.js)",
    company: "Dataflow Labs",
    location: "New York, NY",
    description:
      "Design and build the APIs that power our real-time data platform. You will work in TypeScript on Node.js services, own database schema and query performance in Postgres, and ship features that process millions of events per day. Solid understanding of REST and event-driven architecture, caching, and distributed systems is a plus. You enjoy debugging hard problems and writing code that is easy to reason about.",
    url: "https://example.com/jobs/dataflow-backend",
    salary_min: 140000,
    salary_max: 175000,
  },
  {
    source: "sample",
    external_id: "sample-ml",
    title: "Machine Learning Engineer",
    company: "Cognal",
    location: "San Francisco, CA",
    description:
      "Build and ship ML features on top of our LLM infrastructure. You will own retrieval pipelines, prompt engineering, evaluation harnesses, and fine-tuning experiments. Strong Python skills and hands-on experience with vector databases or embeddings are required. We are a small team, so you will move fast from prototype to production and have a big say in architecture decisions.",
    url: "https://example.com/jobs/cognal-ml",
    salary_min: 170000,
    salary_max: 220000,
  },
  {
    source: "sample",
    external_id: "sample-fullstack",
    title: "Full-Stack Engineer",
    company: "Brightpath",
    location: "Austin, TX",
    description:
      "Join a mission-driven education startup as a generalist. You will build product features across our Next.js web app and the Node.js backend, work with designers to iterate on UX, and own projects from kickoff to launch. We are looking for engineers comfortable with TypeScript, React, and SQL who love shipping quickly. Previous experience with auth, payments, or real-time features is a plus.",
    url: "https://example.com/jobs/brightpath-fullstack",
    salary_min: 125000,
    salary_max: 160000,
  },
  {
    source: "sample",
    external_id: "sample-devops",
    title: "DevOps / Platform Engineer",
    company: "Relay Systems",
    location: "Remote (US)",
    description:
      "Build the platform our product teams rely on. You will own CI/CD pipelines, Kubernetes clusters, Terraform infrastructure, and observability tooling. We want someone who removes friction for engineers and treats infrastructure as code. Experience with AWS, Docker, and monitoring stacks such as Prometheus or Grafana is required. A calm, methodical approach to incidents is valued here.",
    url: "https://example.com/jobs/relay-devops",
    salary_min: 145000,
    salary_max: 180000,
  },
  {
    source: "sample",
    external_id: "sample-analyst",
    title: "Data Analyst",
    company: "Northstar Analytics",
    location: "Chicago, IL",
    description:
      "Turn raw data into decisions for a fast-growing retail analytics firm. You will write SQL daily, build dashboards in Looker or Tableau, and partner with product and finance teams to answer hard questions. You should be comfortable with statistics, A/B testing, and storytelling with data. Experience with Python or R for analysis is a bonus. Curiosity and clear communication matter more than years of experience.",
    url: "https://example.com/jobs/northstar-analyst",
    salary_min: 90000,
    salary_max: 120000,
  },
  {
    source: "sample",
    external_id: "sample-mobile",
    title: "Mobile Engineer (React Native)",
    company: "Pocketpay",
    location: "Seattle, WA",
    description:
      "Build delightful mobile money experiences used by millions. You will work in React Native and TypeScript, own features across our iOS and Android apps, and collaborate with a tight product and design team. Experience shipping apps to the app stores, handling offline sync, and tuning performance is important. Familiarity with payments, security, or FinTech is a strong plus.",
    url: "https://example.com/jobs/pocketpay-mobile",
    salary_min: 135000,
    salary_max: 170000,
  },
  {
    source: "sample",
    external_id: "sample-sre",
    title: "Site Reliability Engineer",
    company: "Orbital",
    location: "Remote (Global)",
    description:
      "Keep a high-traffic SaaS platform fast, available, and boring in the best way. You will design for reliability, automate toil away, run incident response, and build tooling that gives developers confidence to deploy. Strong Linux, networking, and scripting skills are required, with Kubernetes and cloud experience preferred. We value engineers who write code to solve operational problems.",
    url: "https://example.com/jobs/orbital-sre",
    salary_min: 155000,
    salary_max: 195000,
  },
];
