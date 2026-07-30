import { describe, it, expect } from 'vitest';
import { SkillManager } from '../src/index.js';
describe('Skill Manager System', () => {
    it('should install and list skills in skills directory structure', () => {
        const mgr = new SkillManager();
        const installed = mgr.installSkill('token-efficient-security', 'security');
        expect(installed.name).toBe('token-efficient-security');
        const allSkills = mgr.listSkills();
        expect(allSkills.some(s => s.name === 'token-efficient-security')).toBe(true);
    });
});
