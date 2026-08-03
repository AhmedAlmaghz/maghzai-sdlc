import { databaseProvider, getPostgresPool, getSqliteClient } from "@/db";
import type { ProjectInputs } from "./types";

export interface ProjectTemplate {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  category: string;
  inputs: Partial<ProjectInputs>;
  isBuiltIn: boolean;
}

// Built-in templates seeded on first access
const BUILT_IN_TEMPLATES: Omit<ProjectTemplate, "id">[] = [
  {
    slug: "saas-mvp",
    name: "SaaS MVP",
    nameAr: "منتج SaaS أولي",
    description: "A minimal viable SaaS product with auth, billing, and dashboard",
    descriptionAr: "منتج SaaS بسيط مع مصادقة، فوترة، ولوحة تحكم",
    icon: "🚀",
    category: "saas",
    isBuiltIn: true,
    inputs: {
      appType: "saas",
      spectrumPosition: "structured",
      keyFeatures: [
        "تسجيل وتسجيل دخول المستخدمين",
        "لوحة تحكم المستخدم",
        "إدارة الاشتراكات والفوترة",
        "إعدادات الحساب والملف الشخصي",
      ],
      nonFunctionalRequirements: [
        "الأمان وحماية البيانات",
        "قابلية التوسع (Scalability)",
      ],
      integrations: ["Stripe", "SendGrid"],
    },
  },
  {
    slug: "ecommerce-store",
    name: "E-commerce Store",
    nameAr: "متجر إلكتروني",
    description: "Full-featured online store with products, cart, and checkout",
    descriptionAr: "متجر إلكتروني متكامل مع منتجات، سلة، ودفع",
    icon: "🛒",
    category: "ecommerce",
    isBuiltIn: true,
    inputs: {
      appType: "e-commerce",
      spectrumPosition: "agentic",
      keyFeatures: [
        "كتالوج المنتجات مع التصنيفات",
        "سلة التسوق",
        "عملية الدفع والشحن",
        "تتبع الطلبات",
        "لوحة تحكم الإدارة",
      ],
      nonFunctionalRequirements: [
        "الأداء وسرعة الاستجابة",
        "الأمان وحماية البيانات",
        "إمكانية الوصول (Accessibility)",
      ],
      integrations: ["Stripe", "Shippo"],
    },
  },
  {
    slug: "ai-chatbot",
    name: "AI Chatbot / Agent",
    nameAr: "وكيل ذكاء اصطناعي",
    description: "Conversational AI agent with tools, memory, and deployment",
    descriptionAr: "وكيل محادثة ذكي مع أدوات وذاكرة ونشر",
    icon: "🤖",
    category: "ai",
    isBuiltIn: true,
    inputs: {
      appType: "ai-agent",
      spectrumPosition: "agentic",
      keyFeatures: [
        "واجهة محادثة",
        "ذاكرة المحادثات السابقة",
        "استدعاء أدوات خارجية (Tools/MCP)",
        "RAG للإجابة من المستندات",
        "لوحة مراقبة وتحليلات",
      ],
      nonFunctionalRequirements: [
        "الأداء وسرعة الاستجابة",
        "قابلية التوسع (Scalability)",
        "قابلية الصيانة والتوسعة",
      ],
      techStackPreference: "Python + Google ADK / LangGraph, MCP servers, Vector DB, Cloud Run",
    },
  },
  {
    slug: "internal-tool",
    name: "Internal Dashboard",
    nameAr: "لوحة تحكم داخلية",
    description: "Admin dashboard for internal operations and data management",
    descriptionAr: "لوحة تحكم للعمليات الداخلية وإدارة البيانات",
    icon: "📊",
    category: "internal",
    isBuiltIn: true,
    inputs: {
      appType: "internal-tool",
      spectrumPosition: "structured",
      keyFeatures: [
        "مصادقة الموظفين",
        "عرض وتصفية البيانات",
        "تقارير وإحصائيات",
        "تصدير البيانات (CSV/Excel)",
        "سجل النشاطات",
      ],
      nonFunctionalRequirements: ["الأمان وحماية البيانات"],
    },
  },
  {
    slug: "api-service",
    name: "REST/GraphQL API",
    nameAr: "خدمة API",
    description: "Backend API service with auth, validation, and documentation",
    descriptionAr: "خدمة API خلفية مع مصادقة وتوثيق",
    icon: "⚡",
    category: "backend",
    isBuiltIn: true,
    inputs: {
      appType: "api-backend",
      spectrumPosition: "agentic",
      keyFeatures: [
        "مصادقة JWT/OAuth",
        "نقاط نهاية CRUD",
        "التحقق من صحة المدخلات",
        "توثيق OpenAPI/Swagger",
        "Rate limiting",
      ],
      nonFunctionalRequirements: [
        "الأداء وسرعة الاستجابة",
        "الأمان وحماية البيانات",
        "قابلية التوسع (Scalability)",
      ],
    },
  },
  {
    slug: "mobile-app",
    name: "Mobile App",
    nameAr: "تطبيق جوال",
    description: "Cross-platform mobile app with React Native / Expo",
    descriptionAr: "تطبيق جوال متعدد المنصات مع React Native",
    icon: "📱",
    category: "mobile",
    isBuiltIn: true,
    inputs: {
      appType: "mobile-app",
      spectrumPosition: "structured",
      keyFeatures: [
        "شاشة تسجيل الدخول",
        "الشاشة الرئيسية",
        "الملف الشخصي والإعدادات",
        "إشعارات Push",
      ],
      nonFunctionalRequirements: [
        "الأداء وسرعة الاستجابة",
        "إمكانية الوصول (Accessibility)",
      ],
      techStackPreference: "React Native + Expo (TypeScript), REST API backend",
    },
  },
  {
    slug: "chrome-extension",
    name: "Chrome Extension",
    nameAr: "إضافة كروم",
    description: "Browser extension with popup, background script, and content script",
    descriptionAr: "إضافة متصفح مع واجهة منبثقة وسكربتات",
    icon: "🧩",
    category: "extension",
    isBuiltIn: true,
    inputs: {
      appType: "chrome-extension",
      spectrumPosition: "vibe",
      keyFeatures: [
        "واجهة Popup",
        "سكربت المحتوى (Content Script)",
        "تخزين الإعدادات",
        "اختصارات لوحة المفاتيح",
      ],
      techStackPreference: "Manifest V3 + TypeScript + Vite",
    },
  },
];

interface TemplateRow {
  id: number;
  slug: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  category: string;
  inputs: string | Record<string, unknown>;
  is_built_in: boolean | number;
}

export async function listTemplates(): Promise<ProjectTemplate[]> {
  const existing = databaseProvider === "sqlite"
    ? getSqliteClient().prepare("SELECT * FROM templates").all() as TemplateRow[]
    : (await getPostgresPool().query<TemplateRow>("SELECT * FROM templates")).rows;

  if (existing.length === 0) {
    await seedBuiltInTemplates();
    return databaseProvider === "sqlite"
      ? (getSqliteClient().prepare("SELECT * FROM templates").all() as TemplateRow[]).map(toTemplate)
      : (await getPostgresPool().query<TemplateRow>("SELECT * FROM templates")).rows.map(toTemplate);
  }

  return existing.map(toTemplate);
}

export async function getTemplate(slug: string): Promise<ProjectTemplate | null> {
  const rows = databaseProvider === "sqlite"
    ? getSqliteClient().prepare("SELECT * FROM templates WHERE slug = ? LIMIT 1").all(slug) as TemplateRow[]
    : (await getPostgresPool().query<TemplateRow>("SELECT * FROM templates WHERE slug = $1 LIMIT 1", [slug])).rows;
  return rows[0] ? toTemplate(rows[0]) : null;
}

async function seedBuiltInTemplates() {
  if (databaseProvider === "sqlite") {
    const insert = getSqliteClient().prepare(`
      INSERT OR IGNORE INTO templates (slug, name, name_ar, description, description_ar, icon, category, inputs, is_built_in)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = getSqliteClient().transaction(() => {
      for (const template of BUILT_IN_TEMPLATES) {
        insert.run(
          template.slug,
          template.name,
          template.nameAr,
          template.description,
          template.descriptionAr,
          template.icon,
          template.category,
          JSON.stringify(template.inputs),
          template.isBuiltIn ? 1 : 0
        );
      }
    });
    transaction();
    return;
  }

  const pool = getPostgresPool();
  for (const template of BUILT_IN_TEMPLATES) {
    await pool.query(
      `
        INSERT INTO templates (slug, name, name_ar, description, description_ar, icon, category, inputs, is_built_in)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        ON CONFLICT (slug) DO NOTHING
      `,
      [
        template.slug,
        template.name,
        template.nameAr,
        template.description,
        template.descriptionAr,
        template.icon,
        template.category,
        JSON.stringify(template.inputs),
        template.isBuiltIn,
      ]
    );
  }
}

function toTemplate(row: TemplateRow): ProjectTemplate {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.name_ar,
    description: row.description,
    descriptionAr: row.description_ar,
    icon: row.icon,
    category: row.category,
    inputs: typeof row.inputs === "string"
      ? JSON.parse(row.inputs) as Partial<ProjectInputs>
      : row.inputs as Partial<ProjectInputs>,
    isBuiltIn: Boolean(row.is_built_in),
  };
}
