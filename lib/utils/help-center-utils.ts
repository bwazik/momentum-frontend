import DOMPurify from 'dompurify';
import { marked } from 'marked';
import {
  Activity,
  BookOpen,
  Building2,
  Compass,
  Layers,
  MessagesSquare,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Timer,
  Users,
  Workflow,
  BarChart3,
  ListTodo,
  type LucideIcon,
} from 'lucide-react';

export function estimateReadTime(
  text: string | null | undefined,
  serverEstimatedMinutes?: number | null
): number {
  if (typeof serverEstimatedMinutes === 'number' && serverEstimatedMinutes > 0) {
    return serverEstimatedMinutes;
  }
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function sanitizeArticleHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml) return '';
  if (typeof window === 'undefined') return rawHtml;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'a', 'img', 'hr', 'br',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'dir'],
  });
}

export function renderArticleMarkdown(rawMarkdown: string | null | undefined): string {
  if (!rawMarkdown) return '';
  const parsed = marked.parse(rawMarkdown, { gfm: true, breaks: false }) as string;
  return sanitizeArticleHtml(parsed);
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'workspace-navigation': Compass,
  'task-lifecycle': ListTodo,
  'stage-workflow': Workflow,
  'blueprint-engine': Layers,
  'sla-escalations': Timer,
  'follow-up-center': Activity,
  'collaboration-documents': MessagesSquare,
  'confidentiality-governance': ShieldCheck,
  'delegation-management': Users,
  'organization-structure': Building2,
  'system-administration': Settings,
  'analytics-reporting': BarChart3,
  'platform-operations': Server,
  'help-center-cms': BookOpen,
};

export function getCategoryIcon(slugOrName: string | null | undefined): LucideIcon {
  const key = (slugOrName ?? '').toLowerCase().trim();
  if (key && CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  // Keyword fallback for custom categories (matched against slug or name)
  if (key.includes('start') || key.includes('بدء')) return Compass;
  if (key.includes('task') || key.includes('مهم')) return ListTodo;
  if (key.includes('blueprint') || key.includes('مخطط')) return Workflow;
  if (key.includes('report') || key.includes('تقرير') || key.includes('تحليل')) return BarChart3;
  if (key.includes('admin') || key.includes('إدار') || key.includes('نظام')) return Settings;
  if (key.includes('security') || key.includes('أمان') || key.includes('صلاح')) return Shield;
  return BookOpen;
}
