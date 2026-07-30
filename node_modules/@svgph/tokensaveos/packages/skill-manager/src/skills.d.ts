/**
 * Universal Skill Management System (Module 7)
 */
export type SkillCategory = 'frontend' | 'backend' | 'security' | 'database' | 'testing' | 'documentation';
export interface InstalledSkill {
    name: string;
    category: SkillCategory;
    path: string;
    content: string;
}
export declare class SkillManager {
    private skillsDir;
    constructor(rootDir?: string);
    installSkill(skillName: string, category?: SkillCategory, content?: string): InstalledSkill;
    listSkills(): InstalledSkill[];
}
