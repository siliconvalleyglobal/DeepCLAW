/**
 * Universal Skill Management System (Module 7)
 */

import * as fs from 'fs';
import * as path from 'path';

export type SkillCategory = 'frontend' | 'backend' | 'security' | 'database' | 'testing' | 'documentation';

export interface InstalledSkill {
  name: string;
  category: SkillCategory;
  path: string;
  content: string;
}

export class SkillManager {
  private skillsDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.skillsDir = path.join(rootDir, 'skills');
    if (!fs.existsSync(this.skillsDir)) {
      const categories: SkillCategory[] = ['frontend', 'backend', 'security', 'database', 'testing', 'documentation'];
      for (const cat of categories) {
        fs.mkdirSync(path.join(this.skillsDir, cat), { recursive: true });
      }
    }
  }

  public installSkill(skillName: string, category: SkillCategory = 'security', content?: string): InstalledSkill {
    const targetDir = path.join(this.skillsDir, category);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const skillPath = path.join(targetDir, `${skillName}.md`);
    const defaultContent = content || `# Skill: ${skillName}\nCategory: ${category}\n\nEnforce best practices and token-efficient patterns for ${skillName}.`;
    
    fs.writeFileSync(skillPath, defaultContent, 'utf-8');

    return {
      name: skillName,
      category,
      path: skillPath,
      content: defaultContent
    };
  }

  public listSkills(): InstalledSkill[] {
    const installed: InstalledSkill[] = [];
    if (!fs.existsSync(this.skillsDir)) return installed;

    const categories = fs.readdirSync(this.skillsDir);
    for (const cat of categories) {
      const catPath = path.join(this.skillsDir, cat);
      if (fs.statSync(catPath).isDirectory()) {
        const files = fs.readdirSync(catPath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(catPath, file);
            installed.push({
              name: path.basename(file, '.md'),
              category: cat as SkillCategory,
              path: filePath,
              content: fs.readFileSync(filePath, 'utf-8')
            });
          }
        }
      }
    }
    return installed;
  }
}
