export interface KnowledgeCard {
  id: string;
  uid: string;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  created_at: number;
  updated_at: number;
  links: string[];
  summary?: string;
}

export type ViewMode = 'dashboard' | 'library' | 'graph' | 'chat';
