/**
 * Universal Skill Management System (Module 7)
 */
import * as fs from 'fs';
import * as path from 'path';
export class SkillManager {
    skillsDir;
    constructor(rootDir = process.cwd()) {
        this.skillsDir = path.join(rootDir, 'skills');
        if (!fs.existsSync(this.skillsDir)) {
            const categories = ['frontend', 'backend', 'security', 'database', 'testing', 'documentation'];
            for (const cat of categories) {
                fs.mkdirSync(path.join(this.skillsDir, cat), { recursive: true });
            }
        }
    }
    installSkill(skillName, category = 'security', content) {
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
    listSkills() {
        const installed = [];
        if (!fs.existsSync(this.skillsDir))
            return installed;
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
                            category: cat,
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
