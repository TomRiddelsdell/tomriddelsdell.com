import { Template } from '../entities/Template';
import { TemplateId } from '../../../shared/kernel/value-objects/TemplateId';

export interface ITemplateRepository {
  findById(id: TemplateId): Promise<Template | null>;
  findAll(): Promise<Template[]>;
  findPopular(limit?: number): Promise<Template[]>;
  findActive(): Promise<Template[]>;
  save(template: Template): Promise<void>;
  update(template: Template): Promise<void>;
  delete(id: TemplateId): Promise<void>;
  searchByName(query: string): Promise<Template[]>;
  findByIconType(iconType: string): Promise<Template[]>;
}