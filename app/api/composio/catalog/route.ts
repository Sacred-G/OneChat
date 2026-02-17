import { COMPOSIO_CONFIG } from '@/lib/composio/config';

export const dynamic = 'force-dynamic';

const COMPOSIO_API_BASE = process.env.COMPOSIO_BASE_URL || 'https://backend.composio.dev';

// Static catalog of popular Composio toolkits (sourced from composio.dev/toolkits)
// Used as fallback when API key is missing or invalid
const STATIC_TOOLKITS = [
  { name: 'Gmail', slug: 'gmail', description: "Google's email service with powerful spam protection, search, and G Suite integration.", categories: ['Collaboration & Communication'], logo: null },
  { name: 'Outlook', slug: 'outlook', description: "Microsoft's email and calendaring platform for unified communications and scheduling.", categories: ['Collaboration & Communication'], logo: null },
  { name: 'Google Calendar', slug: 'googlecalendar', description: 'A time management service for scheduling meetings, events, and reminders.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Google Drive', slug: 'googledrive', description: 'A cloud storage platform for uploading, sharing, and collaborating on files.', categories: ['Document & File Management'], logo: null },
  { name: 'Twitter', slug: 'twitter', description: 'A social media platform for sharing real-time updates, conversations, and news.', categories: ['Marketing & Social Media'], logo: null },
  { name: 'Google Sheets', slug: 'googlesheets', description: 'A cloud-based spreadsheet tool for real-time collaboration and data analysis.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Supabase', slug: 'supabase', description: 'An open-source backend platform offering scalable Postgres databases, authentication, storage, and real-time subscriptions.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Composio', slug: 'composio', description: 'An integration platform that connects AI agents with hundreds of business tools.', categories: ['AI & Machine Learning'], logo: null },
  { name: 'Notion', slug: 'notion', description: 'A collaborative workspace for notes, docs, wikis, and tasks.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Slack', slug: 'slack', description: 'A channel-based messaging platform for teams and organizations.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Airtable', slug: 'airtable', description: 'Combines the flexibility of spreadsheets with the power of a database for easy project and data management.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Google Docs', slug: 'googledocs', description: 'A cloud-based word processor that enables document creation and real-time collaboration.', categories: ['Document & File Management'], logo: null },
  { name: 'Google Super', slug: 'googlesuper', description: 'An all-in-one suite combining Gmail, Drive, Calendar, Sheets, Analytics, and more.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'HubSpot', slug: 'hubspot', description: 'An all-in-one marketing, sales, and customer service platform.', categories: ['CRM'], logo: null },
  { name: 'Code Interpreter', slug: 'codeinterpreter', description: 'A Python-based coding environment with built-in data analysis and visualization.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Gong', slug: 'gong', description: 'A platform for video meetings, call recording, and team collaboration.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Asana', slug: 'asana', description: 'A collaborative work management platform for teams to organize and track projects.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Ashby', slug: 'ashby', description: 'An applicant tracking system that handles job postings, candidate management, and hiring analytics.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Pipedrive', slug: 'pipedrive', description: 'A sales management platform offering pipeline visualization, lead tracking, and workflow automation.', categories: ['CRM', 'Sales & Customer Support'], logo: null },
  { name: 'Google Tasks', slug: 'googletasks', description: 'A to-do list and task management tool integrated into Gmail and Google Calendar.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Linear', slug: 'linear', description: 'A modern issue tracking and project planning tool for fast-moving teams.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'GitHub', slug: 'github', description: 'A code hosting platform for version control and collaborative software development.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Microsoft Teams', slug: 'microsoft_teams', description: 'A collaboration platform that combines chat, meetings, and file sharing within Microsoft 365.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Firecrawl', slug: 'firecrawl', description: 'Automates large-scale web crawling and data extraction.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Canvas', slug: 'canvas', description: 'A learning management system for online courses, assignments, grading, and collaboration.', categories: ['Education & LMS'], logo: null },
  { name: 'Composio Search', slug: 'composio_search', description: 'A unified web search toolkit spanning travel, e-commerce, news, financial markets, images, and more.', categories: ['AI & Machine Learning'], logo: null },
  { name: 'Salesforce', slug: 'salesforce', description: 'A leading CRM platform that helps businesses manage sales, service, and marketing.', categories: ['CRM'], logo: null },
  { name: 'Tavily', slug: 'tavily', description: 'Powerful search and data retrieval from documents, databases, and the web.', categories: ['AI & Machine Learning'], logo: null },
  { name: 'Jira', slug: 'jira', description: "Atlassian's platform for bug tracking, issue tracking, and agile project management.", categories: ['Developer Tools & DevOps', 'Productivity & Project Management'], logo: null },
  { name: 'Exa', slug: 'exa', description: 'A data extraction and search platform for gathering and analyzing information from websites, APIs, or databases.', categories: ['AI & Machine Learning'], logo: null },
  { name: 'Trello', slug: 'trello', description: 'A visual project management tool using boards, lists, and cards for team collaboration.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Zendesk', slug: 'zendesk', description: 'A customer service platform for support ticketing, live chat, and knowledge base management.', categories: ['Sales & Customer Support'], logo: null },
  { name: 'Shopify', slug: 'shopify', description: 'An e-commerce platform for building online stores, managing products, and processing payments.', categories: ['E-commerce'], logo: null },
  { name: 'Stripe', slug: 'stripe', description: 'A payment processing platform for online businesses with APIs for billing, subscriptions, and financial operations.', categories: ['Finance & Accounting'], logo: null },
  { name: 'Twilio', slug: 'twilio', description: 'A cloud communications platform for SMS, voice, video, and email APIs.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Dropbox', slug: 'dropbox', description: 'A cloud storage and file synchronization service for sharing and collaboration.', categories: ['Document & File Management'], logo: null },
  { name: 'Zoom', slug: 'zoom', description: 'A video conferencing platform for meetings, webinars, and team collaboration.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Discord', slug: 'discord', description: 'A communication platform for communities with text, voice, and video channels.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Figma', slug: 'figma', description: 'A collaborative design tool for UI/UX design, prototyping, and design systems.', categories: ['Design & Creative Tools'], logo: null },
  { name: 'Intercom', slug: 'intercom', description: 'A customer messaging platform for sales, marketing, and support.', categories: ['Sales & Customer Support'], logo: null },
  { name: 'Monday.com', slug: 'monday', description: 'A work operating system for project management, workflows, and team collaboration.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'ClickUp', slug: 'clickup', description: 'An all-in-one productivity platform for tasks, docs, goals, and project management.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Confluence', slug: 'confluence', description: "Atlassian's team workspace for documentation, knowledge sharing, and collaboration.", categories: ['Document & File Management'], logo: null },
  { name: 'Mailchimp', slug: 'mailchimp', description: 'An email marketing platform for campaigns, audience management, and marketing automation.', categories: ['Marketing & Social Media'], logo: null },
  { name: 'SendGrid', slug: 'sendgrid', description: 'A cloud-based email delivery service for transactional and marketing emails.', categories: ['Marketing & Social Media'], logo: null },
  { name: 'Freshdesk', slug: 'freshdesk', description: 'A customer support platform with ticketing, automation, and self-service portals.', categories: ['Sales & Customer Support'], logo: null },
  { name: 'QuickBooks', slug: 'quickbooks', description: 'An accounting software for small businesses to manage invoices, expenses, and payroll.', categories: ['Finance & Accounting'], logo: null },
  { name: 'Xero', slug: 'xero', description: 'A cloud-based accounting platform for invoicing, bank reconciliation, and financial reporting.', categories: ['Finance & Accounting'], logo: null },
  { name: 'Calendly', slug: 'calendly', description: 'A scheduling automation platform for booking meetings without back-and-forth emails.', categories: ['Scheduling & Booking'], logo: null },
  { name: 'Typeform', slug: 'typeform', description: 'A form and survey builder with conversational interfaces for better engagement.', categories: ['Productivity & Project Management'], logo: null },
  { name: 'Webflow', slug: 'webflow', description: 'A visual web design and development platform for building responsive websites.', categories: ['Design & Creative Tools'], logo: null },
  { name: 'YouTube', slug: 'youtube', description: 'A video sharing platform for uploading, managing, and analyzing video content.', categories: ['Entertainment & Media'], logo: null },
  { name: 'Spotify', slug: 'spotify', description: 'A music streaming platform with APIs for playlist management and music data.', categories: ['Entertainment & Media'], logo: null },
  { name: 'LinkedIn', slug: 'linkedin', description: 'A professional networking platform for career development, recruiting, and business connections.', categories: ['Marketing & Social Media'], logo: null },
  { name: 'Instagram', slug: 'instagram', description: 'A photo and video sharing social media platform for content creation and marketing.', categories: ['Marketing & Social Media'], logo: null },
  { name: 'Facebook', slug: 'facebook', description: 'A social media platform for connecting with friends, groups, and business pages.', categories: ['Marketing & Social Media'], logo: null },
  { name: 'WhatsApp', slug: 'whatsapp', description: 'A messaging platform for text, voice, and video communication.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Telegram', slug: 'telegram', description: 'A cloud-based messaging app with bots, channels, and group features.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Snowflake', slug: 'snowflake', description: 'A cloud data platform for data warehousing, data lakes, and data sharing.', categories: ['Analytics & Data'], logo: null },
  { name: 'BigQuery', slug: 'bigquery', description: "Google's serverless data warehouse for large-scale data analytics.", categories: ['Analytics & Data'], logo: null },
  { name: 'PostgreSQL', slug: 'postgresql', description: 'An open-source relational database management system.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'MongoDB', slug: 'mongodb', description: 'A NoSQL document database for modern application development.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'AWS', slug: 'aws', description: 'Amazon Web Services cloud computing platform with a broad set of infrastructure services.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Google Cloud', slug: 'googlecloud', description: 'Google Cloud Platform for computing, storage, and machine learning services.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Vercel', slug: 'vercel', description: 'A platform for frontend frameworks and static sites with serverless functions.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Netlify', slug: 'netlify', description: 'A platform for deploying and hosting modern web applications.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Docker', slug: 'docker', description: 'A platform for building, shipping, and running containerized applications.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Kubernetes', slug: 'kubernetes', description: 'An open-source container orchestration platform for automating deployment and scaling.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Datadog', slug: 'datadog', description: 'A monitoring and analytics platform for cloud-scale applications.', categories: ['Analytics & Data'], logo: null },
  { name: 'PagerDuty', slug: 'pagerduty', description: 'An incident management platform for real-time operations and alerting.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Sentry', slug: 'sentry', description: 'An application monitoring platform for error tracking and performance monitoring.', categories: ['Developer Tools & DevOps'], logo: null },
  { name: 'Segment', slug: 'segment', description: 'A customer data platform for collecting, cleaning, and routing data to analytics tools.', categories: ['Analytics & Data'], logo: null },
  { name: 'Mixpanel', slug: 'mixpanel', description: 'A product analytics platform for tracking user interactions and engagement.', categories: ['Analytics & Data'], logo: null },
  { name: 'Google Analytics', slug: 'googleanalytics', description: 'A web analytics service for tracking and reporting website traffic.', categories: ['Analytics & Data'], logo: null },
  { name: 'Amplitude', slug: 'amplitude', description: 'A digital analytics platform for understanding user behavior and product usage.', categories: ['Analytics & Data'], logo: null },
  { name: 'Loom', slug: 'loom', description: 'A video messaging tool for asynchronous communication and screen recording.', categories: ['Collaboration & Communication'], logo: null },
  { name: 'Miro', slug: 'miro', description: 'A collaborative online whiteboard platform for brainstorming and visual planning.', categories: ['Design & Creative Tools'], logo: null },
  { name: 'Canva', slug: 'canva', description: 'A graphic design platform for creating social media graphics, presentations, and marketing materials.', categories: ['Design & Creative Tools'], logo: null },
  { name: 'Adobe', slug: 'adobe', description: 'A suite of creative and document management tools including Photoshop, Illustrator, and Acrobat.', categories: ['Design & Creative Tools'], logo: null },
  { name: 'Notion AI', slug: 'notion_ai', description: 'AI-powered features within Notion for writing, summarization, and content generation.', categories: ['AI & Machine Learning'], logo: null },
  { name: 'OpenAI', slug: 'openai', description: 'AI models and APIs for text generation, image creation, and embeddings.', categories: ['AI & Machine Learning'], logo: null },
  { name: 'Anthropic', slug: 'anthropic', description: 'AI safety company providing Claude, an AI assistant for various tasks.', categories: ['AI & Machine Learning'], logo: null },
  { name: 'Perplexity', slug: 'perplexity', description: 'An AI-powered search engine that provides direct answers with citations.', categories: ['AI & Machine Learning'], logo: null },
];

// Extract unique categories from static list
const ALL_CATEGORIES = [...new Set(STATIC_TOOLKITS.flatMap(t => t.categories))].sort();

// GET /api/composio/catalog?cursor=xxx&limit=50&category=xxx&search=xxx
// Returns paginated list of Composio toolkits
// Uses live API when valid key is available, falls back to static catalog
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
    const cursor = url.searchParams.get('cursor') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'usage';

    const apiKey = COMPOSIO_CONFIG.API_KEY;

    // Try live API first if key is configured
    if (apiKey) {
      try {
        const liveResult = await fetchFromLiveAPI(apiKey, { cursor, limit, category, search, sortBy });
        if (liveResult) return Response.json(liveResult);
      } catch (err: any) {
        console.warn('[composio/catalog] Live API failed, falling back to static catalog:', err?.message);
      }
    }

    // Fallback: use static catalog
    return Response.json(filterStaticCatalog({ search, category, limit, offset }));
  } catch (error: any) {
    console.error('[composio/catalog] Error:', error);
    return Response.json(
      { ok: false, error: error.message || 'Failed to fetch Composio toolkits' },
      { status: 500 }
    );
  }
}

async function fetchFromLiveAPI(
  apiKey: string,
  opts: { cursor?: string; limit: number; category?: string; search?: string; sortBy: string }
) {
  const params = new URLSearchParams();
  params.set('limit', String(opts.limit));
  params.set('sort_by', opts.sortBy);
  params.set('managed_by', 'composio');
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.category) params.set('category', opts.category);
  if (opts.search) params.set('search', opts.search);

  const apiUrl = `${COMPOSIO_API_BASE}/api/v3/toolkits?${params.toString()}`;
  const res = await fetch(apiUrl, {
    headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body.slice(0, 100)}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Non-JSON response from Composio API');
  }

  const data = await res.json();
  let items = data?.items || data?.data || [];
  if (Array.isArray(data)) items = data;

  const toolkits = items.map((item: any) => ({
    name: item.name || item.slug || 'Unknown',
    slug: item.slug || '',
    description: item.meta?.description || item.description || '',
    logo: item.meta?.logo || item.logo || null,
    categories: item.meta?.categories || item.categories || [],
    toolsCount: item.meta?.tools_count ?? item.meta?.toolsCount ?? item.tools_count ?? 0,
    triggersCount: item.meta?.triggers_count ?? item.meta?.triggersCount ?? item.triggers_count ?? 0,
  }));

  return {
    ok: true,
    source: 'live',
    toolkits,
    nextCursor: data?.next_cursor || data?.nextCursor || null,
    total: toolkits.length,
    categories: ALL_CATEGORIES,
  };
}

function filterStaticCatalog(opts: { search?: string; category?: string; limit: number; offset: number }) {
  let items = [...STATIC_TOOLKITS];

  if (opts.category) {
    const cat = opts.category.toLowerCase();
    items = items.filter(t => t.categories.some(c => c.toLowerCase() === cat));
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    items = items.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }

  const totalFiltered = items.length;
  const paged = items.slice(opts.offset, opts.offset + opts.limit);

  return {
    ok: true,
    source: 'static',
    toolkits: paged.map(t => ({ ...t, toolsCount: 0, triggersCount: 0 })),
    nextCursor: opts.offset + opts.limit < totalFiltered
      ? String(opts.offset + opts.limit)
      : null,
    total: totalFiltered,
    categories: ALL_CATEGORIES,
  };
}
